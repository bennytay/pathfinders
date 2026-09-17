from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain import SENSITIVE_LABELS


class AssetIngestRequest(BaseModel):
    tenant_id: UUID
    library_asset_id: str = Field(min_length=1, max_length=512)
    original_object_key: str = Field(min_length=1, max_length=2048)
    captured_at: datetime
    content_hash: str = Field(min_length=16, max_length=128)
    perceptual_hash: str | None = Field(default=None, max_length=128)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    width: int | None = Field(default=None, ge=1)
    height: int | None = Field(default=None, ge=1)
    metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


class IngestResponse(BaseModel):
    asset_id: UUID
    status: Literal["queued", "already_queued"]


class ConsentGrantRequest(BaseModel):
    tenant_id: UUID
    purpose: Literal["library_import", "face_processing", "gps_processing", "remote_inference", "event_search"]
    scope: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    policy_version: str = Field(min_length=1, max_length=64)


class ConsentResponse(BaseModel):
    consent_id: UUID
    purpose: Literal["library_import", "face_processing", "gps_processing", "remote_inference", "event_search"]
    active: bool


class AtomicObservationInput(BaseModel):
    kind: Literal["activity", "setting", "object", "interaction"]
    label: str = Field(min_length=1, max_length=128)
    confidence: float = Field(ge=0, le=1)
    bounding_box: tuple[float, float, float, float] | None = None

    @field_validator("label")
    @classmethod
    def reject_sensitive_labels(cls, value: str) -> str:
        normalized = value.strip().lower().replace(" ", "_")
        if normalized in SENSITIVE_LABELS:
            raise ValueError("Sensitive labels are not permitted in the visual observation taxonomy.")
        return normalized


class FaceDetectionInput(BaseModel):
    bounding_box: tuple[float, float, float, float]
    quality_score: float = Field(ge=0, le=1)
    embedding: list[float] = Field(min_length=512, max_length=512)


class PerceptionResultInput(BaseModel):
    image_embedding: list[float] = Field(min_length=768, max_length=768)
    faces: list[FaceDetectionInput] = Field(default_factory=list, max_length=64)
    observations: list[AtomicObservationInput] = Field(default_factory=list, max_length=64)
    visual_encoder_version: str = Field(min_length=1, max_length=64)
    face_model_version: str | None = Field(default=None, max_length=64)
    vision_language_version: str = Field(min_length=1, max_length=64)
    taxonomy_version: str = Field(min_length=1, max_length=64)


class PerceptionStoredResponse(BaseModel):
    asset_id: UUID
    status: Literal["observed"]
    observation_count: int
    face_count: int


class AssignIdentityRequest(BaseModel):
    tenant_id: UUID
    person_id: UUID | None = None
    display_name: str | None = Field(default=None, min_length=1, max_length=160)


class IdentityClusterResponse(BaseModel):
    cluster_id: UUID
    person_id: UUID | None
    status: Literal["anonymous", "assigned"]
    confidence: float


class EventReviewRequest(BaseModel):
    decision: Literal["confirmed", "rejected"]
    corrected_title: str | None = Field(default=None, max_length=280)
    corrected_activity_labels: list[str] = Field(default_factory=list, max_length=12)


class EventReviewResponse(BaseModel):
    event_id: UUID
    status: Literal["confirmed", "rejected"]


class ClaimEvidenceResponse(BaseModel):
    event_id: UUID
    asset_ids: list[UUID]


class ClaimResponse(BaseModel):
    claim_id: UUID
    subject_person_id: UUID | None
    subject_cluster_id: UUID
    claim_type: str
    value: str
    confidence: float
    alternative: str
    status: Literal["proposed", "confirmed", "rejected", "expired"]
    evidence: list[ClaimEvidenceResponse]


class ClaimReviewRequest(BaseModel):
    decision: Literal["confirmed", "rejected"]
    corrected_value: str | None = Field(default=None, max_length=280)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: Literal["circle-visual-intelligence"]
    pipeline_version: str
