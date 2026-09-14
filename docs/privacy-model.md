# Privacy model

## Current Phase 1 behavior

Fixture mode is local, contains only synthetic examples, and has no remote AI, transcription, analytics, event, auth, or database dependency. Phase 2 stores a user-created local workspace in browser local storage. It is safe to run without an account or environment variables, but browser local storage is not a substitute for device security or encrypted sync.

## Data separation required for future phases

Raw audio, transcript, fact proposal, confirmed memory, interaction, prompt, activity, plan draft, and privacy event must be separate records. A proposal is non-durable by default. A confirmed memory must retain its note source and support edit, export, forget, and deletion.

## Processing choices

On-device processing is preferred only when it is technically proven. If any remote fallback is introduced, each note must show what is sent, to which named destination, why it is sent, and the consequence of declining. Processing must not occur until the user gives explicit per-note consent; the consent time and destination must be recorded in a user-visible audit trail.

Phase 3 does not enable any remote transcription. It uses explicit microphone permission and browser-local recording. A user can choose transcript-only behavior or retain audio locally until deletion; no audio is uploaded in either setting.

## Product limits

No background recording, passive listening, background location collection, contact/DM/social-feed import, automatic outreach, automatic calendar write, or default content telemetry is permitted. Telemetry, if introduced, must be opt-in and exclude note content, transcripts, friend names, and event queries by default.

## User controls

The user can inspect raw local records, export the full workspace as JSON, reset it, and delete the whole workspace. Deleting a friend cascades to linked notes, interactions, proposals, confirmed memories, prompts, and plan drafts. The app remains useful with remote processing disabled.
