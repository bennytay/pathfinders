# InnerCircle

InnerCircle is a local-first, privacy-first context layer for a deliberately small circle of close friends. It helps a person capture a reflection, review any proposed relationship context, and create an explainable opportunity to meet in person.

This repository is at the Phase 1 foundation milestone. Fixture mode is the supported way to run it today: no account, paid service, API key, microphone permission, or network connection is required.

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The homepage is labelled fixture mode and uses only synthetic data. It never writes a database or makes a network request.

## Verify the foundation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The end-to-end test base uses Playwright. Install its local Chromium binary once, then run it:

```bash
npx playwright install chromium
npm run test:e2e
```

## Product and data boundaries

- A close circle is user-created; Phase 1 beta fixtures permit up to five active friends.
- There is no contact import, social scraping, passive capture, autonomous outreach, calendar write, or relationship score.
- Raw audio, transcripts, proposals, and confirmed memories are different records. A model may never silently create durable memory.
- Any future remote processing must be an explicit, per-note opt-in that names its destination. No remote adapter is enabled now.
- A plan is always an editable draft until a user personally copies or shares it.

Read the [product contract](docs/product-contract.md), [privacy model](docs/privacy-model.md), [threat model](docs/threat-model.md), [architecture](docs/architecture.md), and [contribution guide](docs/contributing.md) before building a feature.

## Status

The next milestone is the local-first domain core. See the [master execution plan](docs/plans/master-execution-plan.md) for the full sequence and deliberately excluded scope.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), our [Code of Conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md). Never add real notes, contacts, recordings, access tokens, or personally identifying fixture data to this repository.
