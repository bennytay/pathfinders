"""Celery job graph. The worker never turns raw model prose directly into a claim."""

from uuid import UUID

from celery import Celery
from sqlalchemy import delete, select

from app.clustering import cluster_unassigned_faces
from app.db import SessionLocal
from app.models import (
    AssetEmbedding,
    AtomicObservation,
    AuditEvent,
    ClaimEvidence,
    Event,
    EventAsset,
    FaceDetection,
    InferredClaim,
    PhotoAsset,
)
from app.projections import project_claim_candidates, project_event_candidates
from app.service import has_active_consent
from app.settings import get_settings

celery_app = Celery("circle_vpi", broker=get_settings().redis_url, backend=get_settings().redis_url)
celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)


@celery_app.task(bind=True, autoretry_for=(ConnectionError,), retry_backoff=True, max_retries=5)
def analyze_asset(self, asset_id: str) -> dict[str, str]:
    """Advance a queued asset to analysis.

    GPU perception is intentionally deployed as an adapter service. Its only accepted output is
    taxonomy-validated atomic observations; event and claim creation stay deterministic services.
    """

    with SessionLocal.begin() as session:
        asset = session.scalar(select(PhotoAsset).where(PhotoAsset.id == asset_id))
        if asset is None or asset.deleted_at is not None:
            return {"status": "skipped", "asset_id": asset_id}
        if not has_active_consent(session, asset.tenant_id, "library_import"):
            asset.pipeline_status = "blocked_by_revoked_consent"
            session.add(
                AuditEvent(
                    tenant_id=asset.tenant_id,
                    action="asset.analysis_blocked",
                    subject_type="photo_asset",
                    subject_id=asset.id,
                    details={"reason": "library_import_consent_revoked"},
                )
            )
            return {"status": "blocked_by_revoked_consent", "asset_id": asset_id}
        if asset.pipeline_status not in {"queued", "retryable"}:
            return {"status": asset.pipeline_status, "asset_id": asset_id}
        asset.pipeline_status = "awaiting_perception_adapter"
        session.add(
            AuditEvent(
                tenant_id=asset.tenant_id,
                action="asset.analysis_requested",
                subject_type="photo_asset",
                subject_id=asset.id,
                details={"pipeline_version": asset.pipeline_version},
            )
        )
    return {"status": "awaiting_perception_adapter", "asset_id": asset_id}


@celery_app.task
def invalidate_asset_derivatives(asset_id: str) -> dict[str, str]:
    """Purge derived evidence and invalidate any event/claim which no longer has a source asset."""

    with SessionLocal.begin() as session:
        asset = session.scalar(select(PhotoAsset).where(PhotoAsset.id == asset_id))
        if asset is None:
            return {"status": "skipped", "asset_id": asset_id}
        tenant_id = asset.tenant_id
        linked_event_ids = list(
            session.scalars(select(EventAsset.event_id).where(EventAsset.asset_id == asset.id))
        )
        session.execute(delete(AssetEmbedding).where(AssetEmbedding.asset_id == asset.id))
        session.execute(delete(AtomicObservation).where(AtomicObservation.asset_id == asset.id))
        session.execute(delete(FaceDetection).where(FaceDetection.asset_id == asset.id))
        session.execute(delete(EventAsset).where(EventAsset.asset_id == asset.id))
        if linked_event_ids:
            # Events missing even one source asset must be reconstructed or re-confirmed; do not retain stale claims.
            claim_ids = session.scalars(
                select(ClaimEvidence.claim_id).where(ClaimEvidence.event_id.in_(linked_event_ids))
            ).all()
            if claim_ids:
                session.execute(delete(InferredClaim).where(InferredClaim.id.in_(claim_ids)))
            session.execute(delete(Event).where(Event.id.in_(linked_event_ids)))
        session.add(
            AuditEvent(
                tenant_id=tenant_id,
                action="asset.derivatives_purged",
                subject_type="photo_asset",
                subject_id=asset.id,
                details={"invalidated_event_count": len(linked_event_ids)},
            )
        )
    rebuild_event_candidates.delay(str(tenant_id))
    rebuild_claim_candidates.delay(str(tenant_id))
    return {"status": "invalidated", "asset_id": asset_id}


@celery_app.task
def rebuild_event_candidates(tenant_id: str) -> dict[str, int | str]:
    with SessionLocal.begin() as session:
        events = project_event_candidates(session, UUID(tenant_id))
    return {"status": "projected", "event_count": len(events)}


@celery_app.task
def rebuild_claim_candidates(tenant_id: str) -> dict[str, int | str]:
    with SessionLocal.begin() as session:
        claims = project_claim_candidates(session, UUID(tenant_id))
    return {"status": "projected", "claim_count": len(claims)}


@celery_app.task
def recluster_identities(tenant_id: str) -> dict[str, int | str]:
    with SessionLocal.begin() as session:
        parsed_tenant_id = UUID(tenant_id)
        if not has_active_consent(session, parsed_tenant_id, "face_processing"):
            return {"status": "blocked_by_revoked_consent", "cluster_count": 0}
        clusters = cluster_unassigned_faces(session, parsed_tenant_id)
    rebuild_event_candidates.delay(tenant_id)
    return {"status": "clustered", "cluster_count": clusters}
