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

## Status

The AI backbone is documented in the [Visual Person Intelligence backbone plan](docs/plans/ai-backbone.md): an evidence-first pipeline from camera-roll observations to anonymous identity clusters, events, person timelines, calibrated claims, private highlights, and explainable group-event recommendations.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), our [Code of Conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md). Never add real notes, contacts, recordings, access tokens, or personally identifying fixture data to this repository.
