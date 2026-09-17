"""Pure domain logic. It is deliberately independent of model-serving and database libraries."""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime
from math import exp, sqrt

SENSITIVE_LABELS = frozenset(
    {
        "race",
        "religion",
        "health",
        "sexuality",
        "politics",
        "emotion",
        "relationship_status",
        "moral_character",
    }
)


@dataclass(frozen=True)
class AssetSignal:
    asset_id: str
    captured_at: datetime
    identity_cluster_ids: frozenset[str]
    activity_labels: frozenset[str]
    embedding: tuple[float, ...] = ()
    latitude: float | None = None
    longitude: float | None = None
    burst_id: str | None = None


@dataclass(frozen=True)
class ReconstructedEvent:
    event_id: str
    occurred_at: datetime
    asset_ids: tuple[str, ...]
    participant_cluster_ids: frozenset[str]
    activity_labels: frozenset[str]
    location_key: str | None


@dataclass(frozen=True)
class ClaimEvidence:
    event_id: str
    asset_ids: tuple[str, ...]
    occurred_at: datetime


@dataclass(frozen=True)
class ClaimCandidate:
    subject_id: str
    claim_type: str
    value: str
    confidence: float
    alternative: str
    evidence: tuple[ClaimEvidence, ...]
    evidence_summary: dict[str, int]


@dataclass(frozen=True)
class RecommendationCandidate:
    event_id: str
    shared_interest_fit: float
    member_fits: tuple[float, ...]
    novelty: float
    logistics: float
    recency_intent: float
    availability_quality: float
    diversity: float


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def cosine_similarity(left: tuple[float, ...], right: tuple[float, ...]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    left_norm = sqrt(sum(value * value for value in left))
    right_norm = sqrt(sum(value * value for value in right))
    if not left_norm or not right_norm:
        return 0.0
    return sum(a * b for a, b in zip(left, right, strict=True)) / (left_norm * right_norm)


def _location_affinity(left: AssetSignal, right: AssetSignal) -> float:
    if None in (left.latitude, left.longitude, right.latitude, right.longitude):
        return 0.0
    # This is a deliberately coarse local approximation; precise GPS never leaves the ingest boundary.
    distance = sqrt((left.latitude - right.latitude) ** 2 + (left.longitude - right.longitude) ** 2)
    return clamp(1 - distance / 0.02)


def asset_affinity(left: AssetSignal, right: AssetSignal) -> float:
    """Score two assets for event grouping, without converting a score into a claim."""

    seconds_apart = abs((left.captured_at - right.captured_at).total_seconds())
    time_score = exp(-seconds_apart / (6 * 60 * 60))
    shared_clusters = len(left.identity_cluster_ids & right.identity_cluster_ids)
    participant_score = 1.0 if shared_clusters else 0.0
    burst_score = 1.0 if left.burst_id and left.burst_id == right.burst_id else 0.0
    return clamp(
        0.35 * time_score
        + 0.25 * _location_affinity(left, right)
        + 0.25 * max(0.0, cosine_similarity(left.embedding, right.embedding))
        + 0.10 * participant_score
        + 0.05 * burst_score
    )


def reconstruct_events(
    assets: Iterable[AssetSignal], affinity_threshold: float = 0.55, max_gap_hours: int = 18
) -> list[ReconstructedEvent]:
    """Create conservative candidate events from a chronological asset stream.

    A strict time gap avoids accidentally merging recurring weekly activities into one event.
    """

    ordered = sorted(assets, key=lambda asset: asset.captured_at)
    groups: list[list[AssetSignal]] = []
    for asset in ordered:
        if not groups:
            groups.append([asset])
            continue
        current = groups[-1]
        newest = current[-1]
        gap_hours = (asset.captured_at - newest.captured_at).total_seconds() / 3600
        if gap_hours <= max_gap_hours and max(asset_affinity(asset, member) for member in current) >= affinity_threshold:
            current.append(asset)
        else:
            groups.append([asset])

    events: list[ReconstructedEvent] = []
    for index, group in enumerate(groups, start=1):
        participants = frozenset().union(*(asset.identity_cluster_ids for asset in group))
        labels = frozenset().union(*(asset.activity_labels for asset in group))
        locations = [
            f"{round(asset.latitude, 2)}:{round(asset.longitude, 2)}"
            for asset in group
            if asset.latitude is not None and asset.longitude is not None
        ]
        location_key = max(set(locations), key=locations.count) if locations else None
        events.append(
            ReconstructedEvent(
                event_id=f"candidate-{index}",
                occurred_at=group[0].captured_at,
                asset_ids=tuple(asset.asset_id for asset in group),
                participant_cluster_ids=participants,
                activity_labels=labels,
                location_key=location_key,
            )
        )
    return events


def infer_repeated_activity_claims(
    subject_cluster_id: str,
    events: Iterable[ReconstructedEvent],
    *,
    min_events: int = 3,
    min_months: int = 2,
    now: datetime | None = None,
) -> list[ClaimCandidate]:
    """Return proposed repeated-activity claims from independent event evidence only."""

    reference_time = now or datetime.now(UTC)
    grouped: dict[str, list[ReconstructedEvent]] = defaultdict(list)
    for event in events:
        if subject_cluster_id not in event.participant_cluster_ids:
            continue
        for label in event.activity_labels:
            if label not in SENSITIVE_LABELS:
                grouped[label].append(event)

    claims: list[ClaimCandidate] = []
    for activity, activity_events in grouped.items():
        unique_events = {event.event_id: event for event in activity_events}
        distinct = list(unique_events.values())
        months = {(event.occurred_at.year, event.occurred_at.month) for event in distinct}
        if len(distinct) < min_events or len(months) < min_months:
            continue
        locations = {event.location_key for event in distinct if event.location_key}
        contexts = {frozenset(event.activity_labels) for event in distinct}
        most_recent = max(event.occurred_at for event in distinct)
        recency_days = max(0, (reference_time - most_recent).days)
        recency = exp(-recency_days / 120)
        evidence_strength = (
            0.35 * clamp(len(distinct) / 8)
            + 0.25 * clamp(len(months) / 5)
            + 0.20 * clamp(len(locations) / 3)
            + 0.15 * clamp(len(contexts) / 3)
            + 0.05 * recency
        )
        confidence = round(clamp(0.45 + 0.45 * evidence_strength), 2)
        claims.append(
            ClaimCandidate(
                subject_id=subject_cluster_id,
                claim_type="repeated_activity",
                value=f"Likely a regular {activity} participant",
                confidence=confidence,
                alternative=f"May accompany someone to {activity} venues or participate for another recurring reason.",
                evidence=tuple(
                    ClaimEvidence(event.event_id, event.asset_ids, event.occurred_at)
                    for event in sorted(distinct, key=lambda event: event.occurred_at)
                ),
                evidence_summary={
                    "distinct_events": len(distinct),
                    "months_observed": len(months),
                    "locations": len(locations),
                },
            )
        )
    return sorted(claims, key=lambda claim: claim.confidence, reverse=True)


def rank_group_recommendations(candidates: Iterable[RecommendationCandidate]) -> list[tuple[str, float]]:
    """Rank an event while protecting the least-served group member."""

    scored = []
    for candidate in candidates:
        minimum_member_fit = min(candidate.member_fits, default=0.0)
        score = (
            0.30 * clamp(candidate.shared_interest_fit)
            + 0.20 * clamp(minimum_member_fit)
            + 0.15 * clamp(candidate.novelty)
            + 0.10 * clamp(candidate.logistics)
            + 0.10 * clamp(candidate.recency_intent)
            + 0.10 * clamp(candidate.availability_quality)
            + 0.05 * clamp(candidate.diversity)
        )
        scored.append((candidate.event_id, round(score, 4)))
    return sorted(scored, key=lambda item: item[1], reverse=True)
