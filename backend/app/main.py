from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_session
from app.models import ClaimEvidence, ConsentReceipt, Event, IdentityCluster, InferredClaim
from app.schemas import (
    AssetIngestRequest,
    AssignIdentityRequest,
    ClaimEvidenceResponse,
    ClaimResponse,
    ClaimReviewRequest,
    ConsentGrantRequest,
    ConsentResponse,
    EventReviewRequest,
    EventReviewResponse,
    HealthResponse,
    IdentityClusterResponse,
    IngestResponse,
    PerceptionResultInput,
    PerceptionStoredResponse,
)
from app.service import (
    PIPELINE_VERSION,
    assign_identity_cluster,
    get_tenant_asset,
    grant_consent,
    ingest_asset,
    persist_perception_result,
    review_claim,
    review_event,
    revoke_consent,
    tombstone_asset,
)
from app.settings import get_settings
from app.tasks import (
    analyze_asset,
    invalidate_asset_derivatives,
    rebuild_claim_candidates,
    rebuild_event_candidates,
    recluster_identities,
)

app = FastAPI(
    title="Circle Visual Person Intelligence",
    version=PIPELINE_VERSION,
    description="Evidence-first camera-roll intelligence. Model results are proposals, not truth.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


def claim_response(session: Session, claim: InferredClaim) -> ClaimResponse:
    evidence = session.scalars(select(ClaimEvidence).where(ClaimEvidence.claim_id == claim.id)).all()
    return ClaimResponse(
        claim_id=claim.id,
        subject_person_id=claim.subject_person_id,
        subject_cluster_id=claim.subject_cluster_id,
        claim_type=claim.claim_type,
        value=claim.value,
        confidence=claim.confidence,
        alternative=claim.alternative,
        status=claim.status,
        evidence=[
            ClaimEvidenceResponse(event_id=item.event_id, asset_ids=[UUID(str(asset_id)) for asset_id in item.asset_ids])
            for item in evidence
        ],
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="circle-visual-intelligence", pipeline_version=PIPELINE_VERSION)


@app.post("/v1/consents", response_model=ConsentResponse, status_code=status.HTTP_201_CREATED)
def create_consent(request: ConsentGrantRequest, session: Session = Depends(get_session)) -> ConsentResponse:
    receipt = grant_consent(session, request)
    session.commit()
    return ConsentResponse(consent_id=receipt.id, purpose=receipt.purpose, active=True)


@app.delete("/v1/consents/{consent_id}", response_model=ConsentResponse)
def delete_consent(consent_id: UUID, tenant_id: UUID, session: Session = Depends(get_session)) -> ConsentResponse:
    receipt = session.scalar(
        select(ConsentReceipt).where(ConsentReceipt.id == consent_id, ConsentReceipt.tenant_id == tenant_id)
    )
    if receipt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent receipt not found.")
    revoke_consent(session, receipt)
    session.commit()
    return ConsentResponse(consent_id=receipt.id, purpose=receipt.purpose, active=False)


@app.post("/v1/assets", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
def create_asset(request: AssetIngestRequest, session: Session = Depends(get_session)) -> IngestResponse:
    try:
        asset, created = ingest_asset(session, request)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    session.commit()
    if created:
        analyze_asset.delay(str(asset.id))
    return IngestResponse(asset_id=asset.id, status="queued" if created else "already_queued")


@app.post("/v1/assets/{asset_id}/perception", response_model=PerceptionStoredResponse)
def store_perception(
    asset_id: UUID,
    tenant_id: UUID,
    request: PerceptionResultInput,
    session: Session = Depends(get_session),
) -> PerceptionStoredResponse:
    asset = get_tenant_asset(session, tenant_id, asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    try:
        observation_count, face_count = persist_perception_result(session, asset, request)
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error)) from error
    session.commit()
    if face_count:
        recluster_identities.delay(str(tenant_id))
    else:
        rebuild_event_candidates.delay(str(tenant_id))
    return PerceptionStoredResponse(
        asset_id=asset.id,
        status="observed",
        observation_count=observation_count,
        face_count=face_count,
    )


@app.get("/v1/identity-clusters", response_model=list[IdentityClusterResponse])
def list_identity_clusters(tenant_id: UUID, session: Session = Depends(get_session)) -> list[IdentityClusterResponse]:
    clusters = session.scalars(
        select(IdentityCluster).where(
            IdentityCluster.tenant_id == tenant_id,
            IdentityCluster.deleted_at.is_(None),
        )
    ).all()
    return [
        IdentityClusterResponse(
            cluster_id=cluster.id,
            person_id=cluster.assigned_person_id,
            status=cluster.status,
            confidence=cluster.confidence,
        )
        for cluster in clusters
        if cluster.status in {"anonymous", "assigned"}
    ]


@app.post("/v1/identity-clusters/{cluster_id}/assign", response_model=IdentityClusterResponse)
def assign_identity_cluster_endpoint(
    cluster_id: UUID,
    request: AssignIdentityRequest,
    session: Session = Depends(get_session),
) -> IdentityClusterResponse:
    cluster = session.scalar(
        select(IdentityCluster).where(
            IdentityCluster.id == cluster_id,
            IdentityCluster.tenant_id == request.tenant_id,
            IdentityCluster.deleted_at.is_(None),
        )
    )
    if cluster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Identity cluster not found.")
    try:
        assign_identity_cluster(session, cluster, request)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    session.commit()
    rebuild_event_candidates.delay(str(request.tenant_id))
    return IdentityClusterResponse(
        cluster_id=cluster.id,
        person_id=cluster.assigned_person_id,
        status=cluster.status,
        confidence=cluster.confidence,
    )


@app.post("/v1/events/{event_id}/review", response_model=EventReviewResponse)
def review_event_endpoint(
    event_id: UUID,
    tenant_id: UUID,
    request: EventReviewRequest,
    session: Session = Depends(get_session),
) -> EventReviewResponse:
    event = session.scalar(select(Event).where(Event.id == event_id, Event.tenant_id == tenant_id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    try:
        review_event(session, event, request)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    session.commit()
    if event.status == "confirmed":
        rebuild_claim_candidates.delay(str(tenant_id))
    return EventReviewResponse(event_id=event.id, status=event.status)


@app.delete("/v1/assets/{asset_id}", status_code=status.HTTP_202_ACCEPTED)
def delete_asset(asset_id: UUID, tenant_id: UUID, session: Session = Depends(get_session)) -> Response:
    asset = get_tenant_asset(session, tenant_id, asset_id)
    if asset is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    tombstone_asset(session, asset)
    session.commit()
    invalidate_asset_derivatives.delay(str(asset.id))
    return Response(status_code=status.HTTP_202_ACCEPTED)


@app.get("/v1/claims", response_model=list[ClaimResponse])
def list_claims(tenant_id: UUID, session: Session = Depends(get_session)) -> list[ClaimResponse]:
    claims = session.scalars(
        select(InferredClaim).where(InferredClaim.tenant_id == tenant_id).order_by(InferredClaim.created_at.desc())
    ).all()
    return [claim_response(session, claim) for claim in claims]


@app.post("/v1/claims/{claim_id}/review", response_model=ClaimResponse)
def review_claim_endpoint(
    claim_id: UUID,
    tenant_id: UUID,
    request: ClaimReviewRequest,
    session: Session = Depends(get_session),
) -> ClaimResponse:
    claim = session.scalar(
        select(InferredClaim).where(InferredClaim.id == claim_id, InferredClaim.tenant_id == tenant_id)
    )
    if claim is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")
    try:
        review_claim(session, claim, request)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    session.commit()
    return claim_response(session, claim)
