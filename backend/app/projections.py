"""Deterministic projections from validated observations into events and claim proposals."""

from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.domain import AssetSignal, ReconstructedEvent, infer_repeated_activity_claims, reconstruct_events
from app.models import (
    AssetEmbedding,
    AtomicObservation,
    ClaimEvidence,
    Event,
    EventAsset,
    EventParticipant,
    IdentityCluster,
    IdentityClusterMember,
    InferredClaim,
    PhotoAsset,
)
from app.service import CALIBRATION_VERSION, PIPELINE_VERSION


def project_event_candidates(session: Session, tenant_id: UUID) -> list[Event]:
    """Rebuild only unreviewed event candidates; confirmed/rejected history is never overwritten."""

    assets = session.scalars(
        select(PhotoAsset).where(
            PhotoAsset.tenant_id == tenant_id,
            PhotoAsset.pipeline_status == "observed",
            PhotoAsset.deleted_at.is_(None),
        )
    ).all()
    embeddings = {
        item.asset_id: tuple(item.embedding)
        for item in session.scalars(select(AssetEmbedding).where(AssetEmbedding.tenant_id == tenant_id))
    }
    labels: dict[UUID, set[str]] = defaultdict(set)
    for observation in session.scalars(
        select(AtomicObservation).where(AtomicObservation.tenant_id == tenant_id, AtomicObservation.kind == "activity")
    ):
        labels[observation.asset_id].add(observation.label)
    # Face detections attach cluster membership to assets; a face may contribute to one anonymous cluster.
    from app.models import FaceDetection  # Kept here to avoid importing the visual path in pure-domain tests.

    asset_clusters: dict[UUID, set[str]] = defaultdict(set)
    for face, member in session.execute(
        select(FaceDetection, IdentityClusterMember).join(
            IdentityClusterMember, IdentityClusterMember.face_detection_id == FaceDetection.id
        ).where(FaceDetection.tenant_id == tenant_id)
    ):
        asset_clusters[face.asset_id].add(str(member.cluster_id))

    signals = [
        AssetSignal(
            asset_id=str(asset.id),
            captured_at=asset.captured_at,
            identity_cluster_ids=frozenset(asset_clusters[asset.id]),
            activity_labels=frozenset(labels[asset.id]),
            embedding=embeddings.get(asset.id, ()),
            latitude=asset.latitude,
            longitude=asset.longitude,
        )
        for asset in assets
    ]
    candidates = [candidate for candidate in reconstruct_events(signals) if len(candidate.asset_ids) >= 2]
    existing = session.scalars(
        select(Event).where(Event.tenant_id == tenant_id, Event.status == "proposed", Event.deleted_at.is_(None))
    ).all()
    for event in existing:
        session.delete(event)
    session.flush()

    persisted: list[Event] = []
    for candidate in candidates:
        event = Event(
            tenant_id=tenant_id,
            status="proposed",
            occurred_at=candidate.occurred_at,
            title=None,
            activity_labels=sorted(candidate.activity_labels),
            place_precision="coarse" if candidate.location_key else "none",
            location_key=candidate.location_key,
            confidence=0.7,
            pipeline_version=PIPELINE_VERSION,
        )
        session.add(event)
        session.flush()
        for asset_id in candidate.asset_ids:
            session.add(EventAsset(event_id=event.id, asset_id=UUID(asset_id), evidence_weight=1.0))
        for cluster_id in candidate.participant_cluster_ids:
            session.add(EventParticipant(event_id=event.id, identity_cluster_id=UUID(cluster_id), confidence=0.7))
        persisted.append(event)
    return persisted


def project_claim_candidates(session: Session, tenant_id: UUID) -> list[InferredClaim]:
    """Project claims only from confirmed events with clustered participants."""

    events = session.scalars(
        select(Event).where(Event.tenant_id == tenant_id, Event.status == "confirmed", Event.deleted_at.is_(None))
    ).all()
    event_assets: dict[UUID, list[str]] = defaultdict(list)
    for item in session.scalars(select(EventAsset).join(Event).where(Event.tenant_id == tenant_id)):
        event_assets[item.event_id].append(str(item.asset_id))
    event_participants: dict[UUID, set[str]] = defaultdict(set)
    for item in session.scalars(select(EventParticipant).join(Event).where(Event.tenant_id == tenant_id)):
        event_participants[item.event_id].add(str(item.identity_cluster_id))
    clusters = {
        str(cluster.id): cluster
        for cluster in session.scalars(
            select(IdentityCluster).where(IdentityCluster.tenant_id == tenant_id, IdentityCluster.deleted_at.is_(None))
        )
    }
    reconstructed = [
        ReconstructedEvent(
            event_id=str(event.id),
            occurred_at=event.occurred_at,
            asset_ids=tuple(event_assets[event.id]),
            participant_cluster_ids=frozenset(event_participants[event.id]),
            activity_labels=frozenset(event.activity_labels),
            location_key=event.location_key,
        )
        for event in events
    ]
    persisted: list[InferredClaim] = []
    for cluster_id, cluster in clusters.items():
        session.execute(
            delete(InferredClaim).where(
                InferredClaim.tenant_id == tenant_id,
                InferredClaim.subject_cluster_id == cluster.id,
                InferredClaim.status == "proposed",
            )
        )
        for candidate in infer_repeated_activity_claims(cluster_id, reconstructed):
            claim = InferredClaim(
                tenant_id=tenant_id,
                subject_person_id=cluster.assigned_person_id,
                subject_cluster_id=cluster.id,
                claim_type=candidate.claim_type,
                value=candidate.value,
                confidence=candidate.confidence,
                alternative=candidate.alternative,
                status="proposed",
                calibration_version=CALIBRATION_VERSION,
            )
            session.add(claim)
            session.flush()
            for evidence in candidate.evidence:
                session.add(
                    ClaimEvidence(
                        claim_id=claim.id,
                        event_id=UUID(evidence.event_id),
                        asset_ids=[UUID(asset_id) for asset_id in evidence.asset_ids],
                    )
                )
            persisted.append(claim)
    return persisted
