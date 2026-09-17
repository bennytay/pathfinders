"""Strict boundary between GPU model serving and Circle's durable evidence store.

This module deliberately accepts atomic model output only. The models do not create people,
events, or claims; those are produced by the deterministic aggregation pipeline.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from app.schemas import AtomicObservationInput


@dataclass(frozen=True)
class FaceDetection:
    bounding_box: tuple[float, float, float, float]
    quality_score: float
    embedding: tuple[float, ...]


@dataclass(frozen=True)
class PerceptionResult:
    image_embedding: tuple[float, ...]
    faces: tuple[FaceDetection, ...]
    observations: tuple[AtomicObservationInput, ...]
    visual_encoder_version: str
    face_model_version: str
    vision_language_version: str
    taxonomy_version: str


class PerceptionAdapter(Protocol):
    """Implement with SigLIP 2, InsightFace, and a Qwen2.5-VL vLLM endpoint."""

    def analyze(self, image_bytes: bytes) -> PerceptionResult: ...


def validate_perception_result(result: PerceptionResult) -> PerceptionResult:
    if len(result.image_embedding) != 768:
        raise ValueError("SigLIP 2 image embeddings must be 768-dimensional.")
    for face in result.faces:
        if len(face.embedding) != 512:
            raise ValueError("InsightFace embeddings must be 512-dimensional.")
        if not 0 <= face.quality_score <= 1:
            raise ValueError("Face quality scores must be in [0, 1].")
    # AtomicObservationInput has already rejected labels outside the permitted taxonomy boundary.
    return result
