"""Application services: persistence, provenance, and review state transitions."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import (
    AssetEmbedding,
    AtomicObservation,
    AuditEvent,
    ConsentReceipt,
    Event,
    FaceDetection,
    IdentityCluster,
    InferredClaim,
    Person,
    PhotoAsset,
)
from app.schemas import (
    AssetIngestRequest,
    AssignIdentityRequest,
    ClaimReviewRequest,
    ConsentGrantRequest,
    EventReviewRequest,
    PerceptionResultInput,
)

PIPELINE_VERSION = "vpi-1.0.0"
CALIBRATION_VERSION = "repeated-activity-v1"


def ingest_asset(session: Session, request: AssetIngestRequest) -> tuple[PhotoAsset, bool]:
    if not has_active_consent(session, request.tenant_id, "library_import"):
        raise PermissionError("Active library-import consent is required before ingesting an asset.")
    if (request.latitude is not None or request.longitude is not None) and not has_active_consent(
        session, request.tenant_id, "gps_processing"
    ):
        raise PermissionError("Active GPS-processing consent is required before ingesting location metadata.")
    existing = session.scalar(
        select(PhotoAsset).where(
            PhotoAsset.tenant_id == request.tenant_id,
            PhotoAsset.library_asset_id == request.library_asset_id,
        )
    )
    if existing and existing.deleted_at is None:
        return existing, False

    asset = PhotoAsset(
        tenant_id=request.tenant_id,
        library_asset_id=request.library_asset_id,
        original_object_key=request.original_object_key,
        captured_at=request.captured_at,
        content_hash=request.content_hash,
        perceptual_hash=request.perceptual_hash,
        latitude=request.latitude,
        longitude=request.longitude,
        width=request.width,
        height=request.height,
        source_metadata=request.metadata,
        pipeline_status="queued",
        pipeline_version=PIPELINE_VERSION,
    )
    session.add(asset)
    session.flush()
    session.add(
        AuditEvent(
            tenant_id=request.tenant_id,
            action="asset.ingested",
            subject_type="photo_asset",
            subject_id=asset.id,
            details={"library_asset_id": request.library_asset_id, "pipeline_version": PIPELINE_VERSION},
        )
    )
    return asset, True


def grant_consent(session: Session, request: ConsentGrantRequest) -> ConsentReceipt:
    receipt = ConsentReceipt(
        tenant_id=request.tenant_id,
        purpose=request.purpose,
        scope=request.scope,
        policy_version=request.policy_version,
    )
    session.add(receipt)
    session.flush()
    session.add(
        AuditEvent(
            tenant_id=request.tenant_id,
            action="consent.granted",
            subject_type="consent_receipt",
            subject_id=receipt.id,
            details={"purpose": receipt.purpose, "scope": receipt.scope, "policy_version": receipt.policy_version},
        )
    )
    return receipt


def has_active_consent(session: Session, tenant_id: UUID, purpose: str) -> bool:
    return (
        session.scalar(
            select(ConsentReceipt.id).where(
                ConsentReceipt.tenant_id == tenant_id,
                ConsentReceipt.purpose == purpose,
                ConsentReceipt.revoked_at.is_(None),
            )
        )
        is not None
    )


def revoke_consent(session: Session, receipt: ConsentReceipt) -> None:
    if receipt.revoked_at is not None:
        return
    receipt.revoked_at = datetime.now(UTC)
    session.add(
        AuditEvent(
            tenant_id=receipt.tenant_id,
            action="consent.revoked",
            subject_type="consent_receipt",
            subject_id=receipt.id,
            details={"purpose": receipt.purpose},
        )
    )


def persist_perception_result(
    session: Session, asset: PhotoAsset, result: PerceptionResultInput
) -> tuple[int, int]:
    """Replace an asset's derived observations atomically after schema validation."""

    if result.faces and not has_active_consent(session, asset.tenant_id, "face_processing"):
        raise PermissionError("Active face-processing consent is required before storing face detections.")
    session.execute(delete(AtomicObservation).where(AtomicObservation.asset_id == asset.id))
    session.execute(delete(FaceDetection).where(FaceDetection.asset_id == asset.id))
    session.execute(delete(AssetEmbedding).where(AssetEmbedding.asset_id == asset.id))
    session.add(
        AssetEmbedding(
            asset_id=asset.id,
            tenant_id=asset.tenant_id,
            model_version=result.visual_encoder_version,
            embedding=result.image_embedding,
        )
    )
    for face in result.faces:
        session.add(
            FaceDetection(
                tenant_id=asset.tenant_id,
                asset_id=asset.id,
                bounding_box=list(face.bounding_box),
                quality_score=face.quality_score,
                embedding=face.embedding,
                model_version=result.face_model_version or "not-provided",
            )
        )
    for observation in result.observations:
        session.add(
            AtomicObservation(
                tenant_id=asset.tenant_id,
                asset_id=asset.id,
                kind=observation.kind,
                label=observation.label,
                confidence=observation.confidence,
                bounding_box=list(observation.bounding_box) if observation.bounding_box else None,
                model_version=result.vision_language_version,
                taxonomy_version=result.taxonomy_version,
            )
        )
    asset.pipeline_status = "observed"
    session.add(
        AuditEvent(
            tenant_id=asset.tenant_id,
            action="asset.perception_stored",
            subject_type="photo_asset",
            subject_id=asset.id,
            details={
                "observation_count": len(result.observations),
                "face_count": len(result.faces),
                "visual_encoder_version": result.visual_encoder_version,
                "vision_language_version": result.vision_language_version,
            },
        )
    )
    return len(result.observations), len(result.faces)


def assign_identity_cluster(
    session: Session, cluster: IdentityCluster, request: AssignIdentityRequest
) -> IdentityCluster:
    person: Person | None = None
    if request.person_id:
        person = session.scalar(
            select(Person).where(
                Person.id == request.person_id,
                Person.tenant_id == request.tenant_id,
                Person.deleted_at.is_(None),
            )
        )
        if person is None:
            raise ValueError("Person not found.")
    elif request.display_name:
        person = Person(tenant_id=request.tenant_id, display_name=request.display_name.strip())
        session.add(person)
        session.flush()
    else:
        raise ValueError("Choose an existing person or provide a display name.")
    cluster.assigned_person_id = person.id
    cluster.status = "assigned"
    session.add(
        AuditEvent(
            tenant_id=cluster.tenant_id,
            action="identity_cluster.assigned",
            subject_type="identity_cluster",
            subject_id=cluster.id,
            details={"person_id": str(person.id)},
        )
    )
    return cluster


def review_event(session: Session, event: Event, review: EventReviewRequest) -> Event:
    if event.status != "proposed":
        raise ValueError("Only proposed events can be reviewed.")
    event.status = review.decision
    if review.corrected_title:
        event.title = review.corrected_title
    if review.corrected_activity_labels:
        event.activity_labels = [label.strip().lower() for label in review.corrected_activity_labels if label.strip()]
    session.add(
        AuditEvent(
            tenant_id=event.tenant_id,
            action=f"event.{review.decision}",
            subject_type="event",
            subject_id=event.id,
            details={"corrected_title": review.corrected_title, "activity_labels": event.activity_labels},
        )
    )
    return event


def review_claim(session: Session, claim: InferredClaim, review: ClaimReviewRequest) -> InferredClaim:
    if claim.status != "proposed":
        raise ValueError("Only proposed claims can be reviewed.")
    claim.status = review.decision
    if review.corrected_value:
        claim.value = review.corrected_value
    claim.reviewed_at = datetime.now(UTC)
    session.add(
        AuditEvent(
            tenant_id=claim.tenant_id,
            action=f"claim.{review.decision}",
            subject_type="inferred_claim",
            subject_id=claim.id,
            details={"corrected_value": review.corrected_value},
        )
    )
    return claim


def tombstone_asset(session: Session, asset: PhotoAsset) -> None:
    """Start a cascaded deletion. The worker clears vector/object derivatives separately."""

    asset.deleted_at = datetime.now(UTC)
    asset.pipeline_status = "deleted"
    session.add(
        AuditEvent(
            tenant_id=asset.tenant_id,
            action="asset.tombstoned",
            subject_type="photo_asset",
            subject_id=asset.id,
            details={"reason": "user_requested_deletion"},
        )
    )


def get_tenant_asset(session: Session, tenant_id: UUID, asset_id: UUID) -> PhotoAsset | None:
    return session.scalar(
        select(PhotoAsset).where(
            PhotoAsset.id == asset_id,
            PhotoAsset.tenant_id == tenant_id,
            PhotoAsset.deleted_at.is_(None),
        )
    )
