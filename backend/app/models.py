from datetime import datetime
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Person(Base):
    __tablename__ = "vpi_people"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    display_name: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class PhotoAsset(Base):
    __tablename__ = "vpi_photo_assets"
    __table_args__ = (UniqueConstraint("tenant_id", "library_asset_id", name="uq_vpi_asset_library_id"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    library_asset_id: Mapped[str] = mapped_column(String(512), nullable=False)
    original_object_key: Mapped[str] = mapped_column(String(2048), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    content_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    perceptual_hash: Mapped[str | None] = mapped_column(String(128))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    source_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    pipeline_status: Mapped[str] = mapped_column(String(32), default="queued", nullable=False, index=True)
    pipeline_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class IdentityCluster(Base):
    __tablename__ = "vpi_identity_clusters"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    assigned_person_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), index=True)
    status: Mapped[str] = mapped_column(String(32), default="anonymous", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    representative_asset_id: Mapped[UUID | None] = mapped_column(ForeignKey("vpi_photo_assets.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AssetEmbedding(Base):
    __tablename__ = "vpi_asset_embeddings"

    asset_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_photo_assets.id", ondelete="CASCADE"), primary_key=True)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(768), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class IdentityClusterMember(Base):
    __tablename__ = "vpi_identity_cluster_members"

    cluster_id: Mapped[UUID] = mapped_column(
        ForeignKey("vpi_identity_clusters.id", ondelete="CASCADE"), primary_key=True
    )
    face_detection_id: Mapped[UUID] = mapped_column(
        ForeignKey("vpi_face_detections.id", ondelete="CASCADE"), primary_key=True
    )
    membership_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class FaceDetection(Base):
    __tablename__ = "vpi_face_detections"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    asset_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_photo_assets.id", ondelete="CASCADE"), index=True)
    bounding_box: Mapped[list] = mapped_column(JSONB, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(512), nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AtomicObservation(Base):
    __tablename__ = "vpi_atomic_observations"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    asset_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_photo_assets.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    label: Mapped[str] = mapped_column(String(128), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bounding_box: Mapped[list | None] = mapped_column(JSONB)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    taxonomy_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Event(Base):
    __tablename__ = "vpi_events"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    status: Mapped[str] = mapped_column(String(32), default="proposed", nullable=False, index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    title: Mapped[str | None] = mapped_column(String(280))
    activity_labels: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    place_precision: Mapped[str] = mapped_column(String(32), default="none", nullable=False)
    location_key: Mapped[str | None] = mapped_column(String(128))
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    pipeline_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class EventAsset(Base):
    __tablename__ = "vpi_event_assets"
    __table_args__ = (UniqueConstraint("event_id", "asset_id", name="uq_vpi_event_asset"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_events.id", ondelete="CASCADE"), index=True)
    asset_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_photo_assets.id", ondelete="CASCADE"), index=True)
    evidence_weight: Mapped[float] = mapped_column(Float, nullable=False)


class EventParticipant(Base):
    __tablename__ = "vpi_event_participants"

    event_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_events.id", ondelete="CASCADE"), primary_key=True)
    identity_cluster_id: Mapped[UUID] = mapped_column(
        ForeignKey("vpi_identity_clusters.id", ondelete="CASCADE"), primary_key=True
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)


class InferredClaim(Base):
    __tablename__ = "vpi_inferred_claims"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    subject_person_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True), index=True)
    subject_cluster_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_identity_clusters.id", ondelete="CASCADE"), index=True)
    claim_type: Mapped[str] = mapped_column(String(64), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    alternative: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="proposed", nullable=False, index=True)
    calibration_version: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ClaimEvidence(Base):
    __tablename__ = "vpi_claim_evidence"
    __table_args__ = (UniqueConstraint("claim_id", "event_id", name="uq_vpi_claim_event"),)

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    claim_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_inferred_claims.id", ondelete="CASCADE"), index=True)
    event_id: Mapped[UUID] = mapped_column(ForeignKey("vpi_events.id", ondelete="CASCADE"), index=True)
    asset_ids: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)


class ConsentReceipt(Base):
    __tablename__ = "vpi_consent_receipts"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    purpose: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    scope: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    policy_version: Mapped[str] = mapped_column(String(64), nullable=False)


class AuditEvent(Base):
    __tablename__ = "vpi_audit_events"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), index=True)
    action: Mapped[str] = mapped_column(String(96), nullable=False, index=True)
    subject_type: Mapped[str] = mapped_column(String(64), nullable=False)
    subject_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    details: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
