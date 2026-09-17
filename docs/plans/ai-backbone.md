# AI Backbone: Visual Person Intelligence

## Thesis

A sufficiently large, longitudinal camera roll can reveal a person's **observable** interests, routines, social context, and repeated behaviours without questionnaires or text-history import. Circle turns this into probabilistic, evidence-backed hypotheses.

The system does not read minds, determine character, diagnose health, or infer sensitive attributes. It says what it observed, how often, when, and what else could explain it. Generated prose is only presentation; evidence is the source of truth.

Images → atomic observations → reconstructed events → person timelines → pattern aggregation → calibrated claims → evidence-first UI.

## Product loop

Camera roll / Immich library → metadata + visual ingestion → anonymous identity clusters and image embeddings → event reconstruction → named person timelines only after user assignment → evidence-backed person models → highlights and group-event recommendations → user confirms, corrects, rejects, or deletes.

This gives Circle two powerful interactions:

1. **Play our story.** Select people and receive a concise, source-linked highlight sequence of shared events that best represent the relationship over time.
2. **Find something we'd enjoy.** Retrieve local events and rank them for the group using persistent, repeated visual evidence—not a shallow single-photo guess—then state the reason and uncertainty.

## System architecture

    Immich client/API
        │ original assets + metadata
        ▼
    S3 / MinIO  ◀──▶  Redis + Celery job graph  ◀──▶  GPU workers
    encrypted media    idempotent, observable          PyTorch / vLLM
                                                          │
                 ┌────────────────────────────────────────┤
                 │ face pipeline: InsightFace + HDBSCAN   │
                 │ visual encoder: SigLIP 2               │
                 │ structured vision: Qwen2.5-VL          │
                 └────────────────────────────────────────┘
                                                          │
                                                          ▼
                     PostgreSQL + pgvector ◀──▶ FastAPI inference / graph engine
                       evidence, events, claims      Polars + DuckDB aggregation
                                      │
                                      ▼
                        Next.js evidence-first UI and native Circle client

| Concern | Choice | Why |
| --- | --- | --- |
| Photo platform | Immich client/API | Local-library synchronisation and photo metadata surface; Circle consumes a scoped library rather than reinventing backup. |
| Media | S3 or MinIO | Original assets and thumbnails stay in object storage, separate from intelligence records. |
| API and orchestration | Python, FastAPI, Redis, Celery | Typed service boundary, durable asynchronous tasks, retries, back-pressure, and observable processing. |
| Model compute | PyTorch GPU workers; vLLM | Isolated batched GPU inference and independently scalable vision-language service. |
| Face identity | InsightFace + HDBSCAN | Detect/align/embed faces; density clustering yields recurring anonymous identities without pre-naming people. |
| Image retrieval | SigLIP 2 + pgvector | Multimodal embeddings for duplicate detection, event affinity, semantic retrieval, and diverse highlights. |
| Structured extraction | Qwen2.5-VL | Schema-validated, limited atomic observations—not an unconstrained personality summary. |
| Structured memory | PostgreSQL + pgvector | Transactional provenance, relational graph queries, vector search, tenant isolation, and deletion cascades. |
| Analytical aggregation | Polars and DuckDB | Fast backfills over event and timeline facts without putting heavy work on request paths. |
| Application UI | React/Next.js | Evidence-led review, highlights, and recommendations. |
| Deployment | Docker Compose first | One self-hostable unit; split workers, database, and object storage when scale requires it. |

## Processing pipeline

### 1. Ingest and index

The ingest coordinator reads the authorised Immich library incrementally. It creates immutable asset records from timestamps, optional GPS, EXIF, image hash, dimensions, and orientation. A content hash plus perceptual hash prevents duplicate processing and allows near-duplicate grouping while retaining links to every source asset.

Jobs are idempotent and versioned by asset, asset version, pipeline version, and stage. New uploads enter a low-latency path; historic-library backfill is throttled, resumable, and checkpointed. No claim is made until downstream stages complete.

### 2. Per-image atomic observations

Each image produces narrow observations with confidence, model version, and a source bounding box when relevant:

- detected and quality-filtered faces plus face embeddings;
- visual embedding for semantic similarity;
- bounded activity, setting, object, and interaction labels;
- capture time and optional location precision tier; and
- duplicate/burst membership.

The vision-language model returns strict JSON defined by a taxonomy. It may answer “unknown” and must not infer race, religion, health, sexuality, political affiliation, emotion, relationship status, or moral character. Raw model prose is not durable memory.

### 3. Anonymous identity clustering

Face detection produces an embedding per quality-cleared face. HDBSCAN groups recurring faces into Identity Clusters, handling density variation and allowing an unclustered/unknown state. A cluster is anonymous until the user explicitly assigns it a person label or confirms a suggested merge.

Clusters preserve confidence, representative faces, time range, and merge/split history. Appearance drift is handled with multiple cluster prototypes and high-confidence bridge appearances. The system never names a face outside the user's library or performs public identity search.

### 4. Event reconstruction

An event is an evidence-backed group of photos, not a single caption. Build a rolling multimodal affinity graph:

    affinity(photo A, photo B) =
      time proximity
    + location proximity, only when enabled
    + visual similarity
    + shared identity clusters
    + burst / album continuity

Partition the graph with hard time-gap boundaries and cluster-quality constraints. Aggregate observations into an Event Candidate: time range, place precision, participants, activity candidates, objects/settings, and source assets. Example: “likely indoor climbing with three recurring companions on a Saturday afternoon.”

Every event field has its own confidence. A user can split, merge, rename, correct participants, redact a photo, or reject the event. Corrections create labels for reprocessing rather than mutating historical evidence.

### 5. Person timelines and pattern aggregation

Once a user names an identity cluster, the timeline links the person to appearance and event records. The aggregate engine measures repeated evidence across **distinct events, dates, contexts, locations, and seasons**. It intentionally downweights burst shots and one unusual holiday.

A claim requires a configurable evidence floor: initially at least three distinct events across two calendar months. High-stakes and sensitive categories are permanently disabled regardless of frequency. Each claim has:

- posterior confidence with a calibrated reliability curve;
- support count, recency, distinct-context score, and contradiction count;
- alternative explanations and the evidence that could distinguish them; and
- supporting event IDs and a small privacy-respecting photo set.

Example:

    claim: Likely a regular recreational climber
    confidence: 0.86
    evidence: 14 distinct events across 9 months and 4 locations
    signals: climbing walls, harness, outdoor crags
    alternative: May work at or accompany someone to climbing venues
    supporting photos: p13, p88, p412
    status: proposed

“Likely” is a product policy, not optional model copy. Claims decay when recent evidence no longer supports them. User confirmation is a separately stored signal, never a rewrite of scan evidence.

## Core data model

    Person
      ├─ IdentityCluster — anonymous until assigned
      ├─ Appearance ──> PhotoAsset
      ├─ TimelineEntry ──> Event
      │                    ├─ time range and place precision
      │                    ├─ activity / setting / object observations
      │                    └─ companion clusters or named people
      ├─ AtomicObservation ──> PhotoAsset / model / confidence
      └─ InferredClaim
           ├─ confidence + calibration version
           ├─ alternative explanations
           ├─ support and contradiction event IDs
           └─ supporting photo IDs

Minimum entities:

- photo assets, derivatives, duplicate sets, ingestion runs;
- face detections, embeddings, identity clusters, cluster members, people;
- atomic observations, taxonomy versions, event candidates, events, event assets, event participants;
- timeline entries, inferred claims, claim evidence, alternatives, and feedback; and
- consent receipts, model runs, audit events, and retention tombstones.

Every derived record carries tenant ID, source IDs, pipeline and model/taxonomy version, confidence, creation time, and deletion state. Event candidates and inferred claims are proposals; durable confirmed memory remains separate, consistent with Circle’s existing review boundary.

## Inference contract

The engine may not freely summarise a person from thousands of images. Its input is typed, bounded event evidence; its output must validate against a Claim Candidate schema.

    claim = aggregate(independent event observations)
    not claim = language model over all photos

1. A claim needs repeated, independent evidence and links every evidence item.
2. Confidence is calculated and calibrated by the aggregation service, never copied from LLM token probability.
3. A language model may create a short explanation only from claim JSON and must preserve uncertainty and alternatives.
4. Contradictory evidence lowers confidence and is shown; missing evidence is not negative evidence.
5. A rejected claim stays suppressed until qualifying new evidence exists or the user asks to revisit it.

## Highlights and group-event recommendations

### Shared highlights

Retrieve confirmed events containing the selected people, then select a visually diverse, chronologically coherent set using quality, joint-presence certainty, activity novelty, and representative coverage. Produce a storyboard with chapters, asset IDs, factual captions, and event citations. Captions may say “A few climbing afternoons together”; they may not fabricate feelings, dates, or relationships.

### Group recommendations

Use only user-approved claims and confirmed events to create a group activity profile. Retrieve current nearby events through a provider adapter, keeping friends’ names, faces, and raw histories out of the provider request. Rank candidates by:

    0.30 shared recurring-interest fit
    0.20 least-served member fit — prevents one person’s tastes dominating
    0.15 safe novelty
    0.10 timing/location/budget fit — only if voluntarily supplied
    0.10 recency and stated intent
    0.10 event availability / quality
    0.05 recommendation-set diversity

Every recommendation states its evidence category and uncertainty. It never contacts friends, writes calendars, buys tickets, or pretends consent exists.

## Privacy, safety, and controls

- Library import, facial processing, GPS use, remote inference, and external event search are separate opt-ins.
- Keep original photos in Immich/object storage; retain only derived data needed for the feature. Encrypt media, embeddings, and relational data separately at rest.
- Support asset-level, identity-cluster, person, and account deletion. Deletion invalidates downstream events, claims, caches, vectors, and highlight projects.
- Face clusters are private anonymous labels until named. No web face search, contact scraping, cross-account matching, or training on private libraries.
- The evidence UI exposes source photos/events, confidence factors, alternative explanation, model version, and correction actions for every claim.
- No background audio, passive location, sensitive-attribute inference, automatic outreach, calendar mutation, or relationship score.

## Validation plan

Use consented volunteer and synthetic datasets with event/person ground truth. Production private photo libraries are not training data and are never silently used for evaluation.

For each person timeline, fit on the first 80% of observed time and evaluate on the final 20%. Test prediction of future activity categories, recurring permitted-precision locations, likely companions, timing/frequency of habits, and persistent interests.

Compare against simple frequency, population-average, and nearest-neighbour baselines. Report calibration error as well as accuracy: a 0.86 claim should be correct about 86% of the time in its evaluation bucket. Measure event-cluster precision/recall, false identity merges/splits, unsupported-claim rate, 100% evidence-link coverage, correction rate, group-ranking relevance, and per-member recommendation fairness.

## Delivery phases

| Phase | Build | Proof before advancing |
| --- | --- | --- |
| 1. Evidence foundation | Immich ingestion, object storage, metadata/duplicate processing, audit records | Idempotent resume, asset provenance, and deletion cascade work end-to-end. |
| 2. Visual understanding | SigLIP embeddings, taxonomy-bound Qwen extraction, schema validation | Atomic observations are traceable and abstain safely. |
| 3. Identity and events | Face clustering, anonymous review, multimodal event reconstruction | Measured merge/split quality and useful correction tooling. |
| 4. Timelines and claims | Aggregation engine, alternatives, calibration, evidence UI | Claims pass temporal holdout tests and never lack evidence. |
| 5. Circle experiences | Source-linked highlights and group event ranker | A user can understand and correct every recommendation. |
| 6. Hardening | Tenant isolation, encrypted backup/sync, load tests, privacy/security review | Threat model and deletion/revocation tests pass. |

## Non-negotiables

1. The product reports observable repeated behaviour, never hidden intent or character.
2. Evidence precedes narrative. One photo is an observation, not an identity, event, interest, or habit.
3. Anonymous clustering comes before naming, and user correction outranks model output.
4. Every claim has confidence, alternatives, and inspectable evidence; no evidence means no claim.
5. The camera roll is sensitive personal data. Its use must be explicit, scoped, reversible, and transparent.
