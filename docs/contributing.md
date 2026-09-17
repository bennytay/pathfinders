# Contributor setup

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Run the synthetic fixture

```bash
cp .env.example .env.local
npm ci
npm run dev
```

No environment variable is needed for fixture mode. Do not add a key just to make a core flow work.

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run `npx playwright install chromium && npm run test:e2e` for changes that affect the rendered product boundary. The CI workflow runs all of these checks.

## Data and AI rules

Never commit real names, notes, contacts, recordings, screenshots with personal data, API keys, or production exports. Fixtures must be clearly synthetic, contain no audio reference, stay within the beta friend limit, and pass `validateFixtureWorkspace`.

Before proposing storage, AI, event, or sharing work, update the relevant architecture decision record and the privacy/threat-model documentation. A model may propose context but may not persist it without explicit user review.
