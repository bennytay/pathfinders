# Architecture boundary

```text
Capture UI -> Note repository -> Transcription adapter -> Extraction adapter
                 |                     |                     |
                 v                     v                     v
              raw note            transcript           fact proposals
                                                               |
                                                        review / edit / reject
                                                               |
Friend + interaction repositories <- relationship rules -> explainable next action
                                                               |
                                  event-provider adapters -> plan draft -> user copy/share
```

Phase 2 implements a versioned local repository backed by browser local storage. It owns the circle, friends, text notes, interactions, proposed facts, confirmed facts, activities, prompts, plan drafts, privacy settings, fixture reset, JSON export, and deletion cascades. It intentionally does not implement microphone capture, an AI adapter, an external events adapter, sync, or sharing integration.

The current schema version is `2`. A repository load migrates the persisted record through the schema boundary before use. Local storage is a deliberately constrained MVP store, not a claim of encryption or multi-device sync. The Data manager exposes the full record count, raw inspectable export, reset, and whole-workspace deletion.

Phase 3 raises the workspace schema to `2`: notes declare `manual-text` or future `remote-opt-in` processing and may hold an audio ID. Explicit recordings are stored separately in browser IndexedDB only when the user chooses retained audio; transcript-only mode discards the recording after the editable transcript is saved. See [voice feasibility](voice-transcription-feasibility.md).

| Capability | Interface | Boundary |
| --- | --- | --- |
| Capture | `createNote({ audio?, text?, capturedAt })` | Text remains available when voice is unavailable. |
| Transcription | `transcribe(audio) -> transcript` | On-device only unless an explicit remote per-note opt-in is recorded. |
| Extraction | `extract(transcript, friendCandidates) -> FactProposal[]` | Never writes durable memory directly. |
| Relationship rules | `getNextAction(friend, context) -> Prompt?` | Deterministic and plain-language explainable. |
| Events | `findActivities(context, location, timeWindow)` | Manual ideas work without a provider. |
| Planning | `createPlanDraft(friend, activity, message)` | Never sends or schedules automatically. |
