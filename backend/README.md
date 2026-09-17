# Circle Visual Person Intelligence service

This is the executable AI backbone described in the repository's Visual Person Intelligence plan. It is deliberately an evidence service, not a free-form “summarise my life” agent.

## Start locally

1. Copy deployment secrets into your own environment; do not use the illustrative Compose passwords outside local development.
2. Run: docker compose up --build
3. The API health endpoint is available at http://localhost:8000/health.

The Compose database initialises the pgvector schema on its first start. For a reset during local development, remove only the named Circle volumes after confirming that they contain no real data.

## API contract

- POST /v1/consents grants one explicitly scoped processing purpose. Library import is required before asset ingest; GPS is additionally required when an asset carries location metadata.
- POST /v1/assets accepts an authorised library asset reference and enqueues a versioned, idempotent perception request.
- POST /v1/assets/{id}/perception accepts only schema-validated GPU-worker output. It persists visual embeddings, face detections only with separate face consent, and bounded atomic observations.
- DELETE /v1/assets/{id}?tenant_id=... tombstones it and fans out deletion to derivatives, vectors, projections, and storyboards.
- GET /v1/claims?tenant_id=... returns claims with their event and photo evidence IDs.
- POST /v1/claims/{id}/review?tenant_id=... is the only route that confirms or rejects a claim.

The API must be deployed behind an authenticated backend-for-frontend that resolves the tenant from a verified session. The temporary direct tenant parameter exists for isolated local development only; do not expose this service to the public internet as-is.

## Model boundary

GPU model integrations implement PerceptionAdapter. They may return only:

- a 768-dimensional SigLIP 2 embedding;
- quality-screened 512-dimensional InsightFace face embeddings; and
- schema-validated Qwen2.5-VL activity, setting, object, or interaction observations.

The worker validates this data, then deterministic event and claim services decide whether enough independent evidence exists. Models cannot write person names, events, claims, or recommendations directly.

HDBSCAN runs after face perception and creates only anonymous clusters from previously unclustered detections. The process never overwrites an existing cluster assignment; split/merge and person-naming are intentional review actions.

## Verification

Run the deterministic policy suite without downloading models:

    PYTHONPATH=backend python3 -m unittest discover -s backend/tests -v

Install the project with the gpu optional dependency only on an appropriately provisioned GPU worker. Run model calibration and privacy evaluation before enabling any visual model for real user media.
