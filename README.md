# InnerCircle

InnerCircle is a local-first, privacy-first context layer for a deliberately small circle of close friends. It helps a person capture a reflection, review any proposed relationship context, and create an explainable opportunity to meet in person.

This repository has completed the Phase 5 in-person planning engine. Fixture mode and the full manual planning loop work without an account, paid service, API key, microphone permission, or network connection.

## Quick start

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Create an empty circle or load a clearly labelled synthetic fixture. Product data is stored only in the browser’s local storage; it never makes a network request.

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
- A plan is always an editable draft until a user personally copies or shares it. The app only records outcomes a user explicitly selects.
- Prompts are deterministic, explainable, snoozable, dismissible, and can be disabled per friend. They use only chosen cadence, logged in-person time, confirmed context, and explicit plan outcomes.

Read the [product contract](docs/product-contract.md), [privacy model](docs/privacy-model.md), [threat model](docs/threat-model.md), [architecture](docs/architecture.md), and [contribution guide](docs/contributing.md) before building a feature.

## Status

Phase 3 adds optional local voice recording with playback and manual editable transcription. Phase 4 adds strict offline proposal schema and source-span validation. Read the [voice feasibility decision](docs/voice-transcription-feasibility.md) and [grounded extraction contract](docs/grounded-extraction.md).

Phase 5 adds transparent reminder reasons, confirmed-context activity matching, editable plan drafts, and an optional user-initiated public-events adapter. Read the [in-person planning contract](docs/in-person-planning.md) and the [master execution plan](docs/plans/master-execution-plan.md).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), our [Code of Conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md). Never add real notes, contacts, recordings, access tokens, or personally identifying fixture data to this repository.
