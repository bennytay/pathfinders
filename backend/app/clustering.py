"""Conservative anonymous identity clustering over locally stored face embeddings."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FaceDetection, IdentityCluster, IdentityClusterMember


def cluster_unassigned_faces(session: Session, tenant_id: UUID, min_cluster_size: int = 3) -> int:
    """Create anonymous clusters for previously unclustered face detections.

    Existing cluster membership is never overwritten here. Split/merge actions need a separate,
    user-visible review flow; the safe default is to leave uncertain faces unclustered.
    """

    existing_face_ids = select(IdentityClusterMember.face_detection_id)
    faces = session.scalars(
        select(FaceDetection).where(
            FaceDetection.tenant_id == tenant_id,
            FaceDetection.id.not_in(existing_face_ids),
        )
    ).all()
    if len(faces) < min_cluster_size:
        return 0

    try:
        import hdbscan
    except ImportError as error:
        raise RuntimeError("HDBSCAN is required on the identity-clustering worker.") from error

    labels = hdbscan.HDBSCAN(
        min_cluster_size=min_cluster_size,
        min_samples=2,
        metric="euclidean",
        cluster_selection_method="eom",
        prediction_data=False,
    ).fit_predict([list(face.embedding) for face in faces])

    clusters_created = 0
    for label in sorted({int(label) for label in labels if int(label) >= 0}):
        members = [face for face, assigned_label in zip(faces, labels, strict=True) if int(assigned_label) == label]
        if len(members) < min_cluster_size:
            continue
        cluster = IdentityCluster(
            tenant_id=tenant_id,
            status="anonymous",
            confidence=round(min(0.95, 0.55 + 0.08 * len(members)), 2),
            representative_asset_id=members[0].asset_id,
        )
        session.add(cluster)
        session.flush()
        for member in members:
            session.add(
                IdentityClusterMember(
                    cluster_id=cluster.id,
                    face_detection_id=member.id,
                    membership_confidence=cluster.confidence,
                )
            )
        clusters_created += 1
    return clusters_created
