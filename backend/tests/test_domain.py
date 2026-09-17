from datetime import UTC, datetime
from unittest import TestCase

from app.domain import (
    AssetSignal,
    RecommendationCandidate,
    ReconstructedEvent,
    infer_repeated_activity_claims,
    rank_group_recommendations,
    reconstruct_events,
)


class VisualPersonIntelligenceTests(TestCase):
    def test_event_reconstruction_respects_large_time_gaps(self) -> None:
        base = datetime(2026, 1, 3, 10, tzinfo=UTC)
        events = reconstruct_events(
            [
                AssetSignal("a", base, frozenset({"maya"}), frozenset({"climbing"}), (1.0, 0.0)),
                AssetSignal("b", base.replace(hour=11), frozenset({"maya"}), frozenset({"climbing"}), (0.99, 0.01)),
                AssetSignal("c", base.replace(day=4), frozenset({"maya"}), frozenset({"climbing"}), (1.0, 0.0)),
            ]
        )
        self.assertEqual([event.asset_ids for event in events], [("a", "b"), ("c",)])

    def test_claim_needs_repeated_distinct_events_and_never_emits_sensitive_labels(self) -> None:
        events = [
            ReconstructedEvent(
                event_id=f"e{month}",
                occurred_at=datetime(2026, month, 3, tzinfo=UTC),
                asset_ids=(f"p{month}",),
                participant_cluster_ids=frozenset({"maya"}),
                activity_labels=frozenset({"climbing", "health"}),
                location_key=f"location-{month}",
            )
            for month in (1, 2, 3)
        ]
        claims = infer_repeated_activity_claims(
            "maya", events, now=datetime(2026, 3, 30, tzinfo=UTC)
        )
        self.assertEqual(len(claims), 1)
        self.assertIn("climbing", claims[0].value)
        self.assertEqual(claims[0].evidence_summary["distinct_events"], 3)

    def test_group_ranking_does_not_choose_a_one_person_match_over_a_balanced_match(self) -> None:
        ranked = rank_group_recommendations(
            [
                RecommendationCandidate("dominant", 1, (1, 0), 0.7, 1, 1, 1, 0.5),
                RecommendationCandidate("balanced", 0.8, (0.8, 0.8), 0.7, 1, 1, 1, 0.5),
            ]
        )
        self.assertEqual(ranked[0][0], "balanced")
