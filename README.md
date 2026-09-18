# Circle

Circle is a local-first, privacy-first assistant for a deliberately small circle of close friends. It helps a person keep the context they choose, then creates an explainable opportunity to meet in person. It is not a friendship tracker or personal CRM.

This repository has two independent parts:

- **`backend/`** — the executable AI backbone: an evidence-first visual person intelligence service (FastAPI, Postgres/pgvector, Redis, Celery). It turns camera-roll observations into anonymous identity clusters, reconstructed events, and calibrated, evidence-backed claims — never free-form inference. See [`backend/README.md`](backend/README.md) for setup, the API contract, and the model boundary.
- **`ios/`** — a native SwiftUI demo tuned for screen recording, using bundled fixture data. It does not call the backend, request photo-library access, or make network requests. See [`ios/README.md`](ios/README.md).

## Verify the backbone

```bash
PYTHONPATH=backend python3 -m unittest discover -s backend/tests -v
```

This deterministic policy suite runs without downloading any model.

## Product and data boundaries

- There is no contact import, social scraping, passive capture, autonomous outreach, calendar write, or relationship score.
- Models cannot write person names, events, claims, or recommendations directly — only deterministic services do, from evidence.
- Any processing purpose is an explicit, scoped consent. See [`backend/README.md`](backend/README.md#api-contract).

Read the [product contract](docs/product-contract.md), [privacy model](docs/privacy-model.md), [threat model](docs/threat-model.md), [architecture](docs/architecture.md), and [contribution guide](docs/contributing.md) before building a feature.

## Hypothetical real-product architecture, not the demo

This is the intended production direction, not a description of the iOS or web demos in this repository. The demos use synthetic fixtures only. They do not request Photos permission, call a model, upload media, or connect to this stack.

```text
Native Circle client                         Private processing plane
─────────────────────                        ────────────────────────
User grants a scoped Photos / Immich consent
            │
            ▼
Photo capability adapter ──► encrypted object storage ──► Redis + Celery job graph
  metadata + authorised                               idempotent, resumable work
  image assets only                                              │
                                                                  ▼
                                                        isolated GPU workers
                                                   face / image / structured vision
                                                                  │
                                                                  ▼
                                                         Postgres + pgvector
                                                     evidence, events, claims
                                                                  │
                         ◄──── FastAPI evidence and planning API ─┘
            │
            ▼
Evidence-first review UI ──► user confirms, corrects, redacts, or deletes
            │
            └──────────────► explainable highlights and group plan proposals
                               (never an automatic message, booking, or calendar write)
```

### Proposed stack

| Layer | Hypothetical choice | Responsibility |
| --- | --- | --- |
| Client and consent | Native iOS client with a scoped photo-library capability; Immich adapter for a self-hosted library | Shows the purpose, obtains separate consent for library, face, location, remote inference, and event search, and lets the user revoke it. A browser opened by QR cannot receive full iOS photo-library access. |
| Media | Encrypted S3 or MinIO | Keeps authorised originals and derivatives apart from intelligence records. |
| API and jobs | Python, FastAPI, Redis, Celery | Provides a typed API plus durable, retryable, rate-limited ingestion and processing jobs. |
| Vision compute | Isolated PyTorch GPU workers and vLLM | Runs batched inference away from request paths. |
| Visual models | InsightFace + HDBSCAN, SigLIP 2, Qwen2.5-VL | Respectively: anonymous recurring-face clusters, visual similarity/retrieval, and taxonomy-bound atomic observations. |
| Evidence store | PostgreSQL + pgvector | Stores tenant-scoped provenance, event graph records, embeddings, confidence, feedback, and deletion state. |
| Aggregation | Polars and DuckDB | Computes repeated-evidence patterns and backfills without placing analytics on the request path. |
| Product surfaces | Native Circle client and an evidence-first web review surface | Lets a user inspect source evidence and make all durable decisions. |

### How the AI would work

The system is deliberately not “send a camera roll to a chatbot and ask what it knows.” It follows a bounded evidence pipeline:

1. **Ingest authorised assets.** An adapter incrementally indexes selected photos with content/perceptual hashes, capture time, optional location tier, and pipeline version. Duplicate and burst photos are grouped so they do not over-count evidence.
2. **Create atomic observations.** Vision workers produce narrow, schema-validated records, such as quality-filtered face embeddings, a visual embedding, activity/setting/object labels, and source bounding boxes. The model may return `unknown`; model prose is never stored as memory.
3. **Cluster before naming.** Face embeddings form private, anonymous identity clusters. A person is named only after the user assigns or confirms that cluster. There is no public face search, contact import, or cross-account matching.
4. **Reconstruct events.** A deterministic graph groups photos using time, enabled location precision, visual similarity, shared anonymous clusters, and album continuity. An event remains a candidate until the user can correct, split, merge, redact, or reject it.
5. **Aggregate independent evidence.** The rules engine looks for repeated signals across distinct events, dates, contexts, and months. It downweights bursts and one-off occasions. A proposed claim includes calibrated confidence, supporting event IDs, contradictions, and alternative explanations.
6. **Generate only bounded explanations.** A language model may turn approved claim JSON into short, uncertainty-preserving copy. It cannot write people, events, claims, or recommendations directly.
7. **Propose, never act.** Confirmed evidence can power diverse shared highlights and group-event ranking. Every result has a plain-language reason; Circle never messages friends, buys tickets, schedules, or writes to a calendar automatically.

### Non-negotiable controls

- Photo-library access, face processing, GPS use, remote inference, and external event search are separate, explicit opt-ins.
- The preferred path is local/private processing; any remote path names what is sent, where it goes, why, and how to decline.
- Raw media, embeddings, relational records, and derived claims are separately protected. Asset-, cluster-, person-, and account-level deletion cascade through events, vectors, caches, and highlights.
- Sensitive attributes, character judgments, relationship scores, and unsupported inferences are prohibited. No evidence means no claim.
- User correction outranks model output. Evidence, confidence, alternatives, model version, and deletion controls remain inspectable.

The detailed design and validation plan live in [the AI backbone plan](docs/plans/ai-backbone.md). The executable backend intentionally implements policy boundaries and deterministic services first; it is not yet the full production stack above.

## Status

The AI backbone is documented in the [Visual Person Intelligence backbone plan](docs/plans/ai-backbone.md): an evidence-first pipeline from camera-roll observations to anonymous identity clusters, events, person timelines, calibrated claims, private highlights, and explainable group-event recommendations.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), our [Code of Conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md). Never add real notes, contacts, recordings, access tokens, or personally identifying fixture data to this repository.
