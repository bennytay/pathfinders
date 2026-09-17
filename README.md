# Circle

Circle is a local-first, privacy-first assistant for a deliberately small circle of close friends. It helps a person keep the context they choose, then creates an explainable opportunity to meet in person. It is not a friendship tracker or personal CRM.

The working foundation includes local capture, reviewed memory, explainable planning, and a mobile-first Circle shell. Fixture mode and the manual recovery paths work without an account, paid service, API key, microphone permission, or network connection.

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
- Moment candidates and confirmed hangouts are also separate records. The current photo result is a clearly labelled synthetic fixture, not photo-library access or face recognition.
- Any future remote processing must be an explicit, per-note opt-in that names its destination. No remote adapter is enabled now.
- A plan is always an editable draft until a user personally copies or shares it. The app only records outcomes a user explicitly selects.
- Prompts are deterministic, explainable, snoozable, dismissible, and can be disabled per friend. They use only chosen cadence, logged in-person time, confirmed context, and explicit plan outcomes.

Read the [product contract](docs/product-contract.md), [privacy model](docs/privacy-model.md), [threat model](docs/threat-model.md), [architecture](docs/architecture.md), and [contribution guide](docs/contributing.md) before building a feature.

## Status

Milestone 0 reframes the app around mobile Today, Add a moment, and People surfaces. It adds separately stored moment candidates and confirmed hangouts, plus a resettable Maya/Ari bouldering fixture. Read the [master execution plan](docs/plans/master-execution-plan.md).

The previous foundation adds optional local voice recording with playback and manual editable transcription, strict offline proposal schema and source-span validation, and transparent activity planning. Read the [voice feasibility decision](docs/voice-transcription-feasibility.md), [grounded extraction contract](docs/grounded-extraction.md), and [in-person planning contract](docs/in-person-planning.md).

The proposed AI core is documented in the [Visual Person Intelligence backbone plan](docs/plans/ai-backbone.md). It specifies an evidence-first pipeline from camera-roll observations to anonymous identity clusters, events, person timelines, calibrated claims, private highlights, and explainable group-event recommendations.


## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md), our [Code of Conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md). Never add real notes, contacts, recordings, access tokens, or personally identifying fixture data to this repository.
