# Architecture boundary

```text
Selected moment -> photo-analysis adapter -> moment candidate -> user confirmation -> confirmed hangout
                                    |                                  |
                                    v                                  v
                              capability disclosure              separate from interaction

Quick note -> Note repository -> Transcription adapter -> Extraction adapter -> fact proposals
                                                                          |
                                                                   review / edit / reject
                                                                          |
Friend + interaction repositories <- relationship rules -> explainable next action -> plan draft -> user copy/share
```

The versioned local repository owns the circle, friends, text notes, interactions, moment candidates, confirmed hangouts, proposed facts, confirmed facts, activities, prompts, plan drafts, privacy settings, fixture reset, JSON export, and deletion cascades. `MomentCandidate`, `ConfirmedHangout`, photo metadata, notes, interactions, and memories are separate records. A confirmed moment does not silently become an interaction or memory.

The current schema version is `6`. A repository load migrates the persisted record through the schema boundary before use. Local storage is a deliberately constrained MVP store, not a claim of encryption or multi-device sync. Settings exposes inspectable export, reset, and whole-workspace deletion.

Notes declare `manual-text` or future `remote-opt-in` processing and may hold an audio ID. Explicit recordings are stored separately in browser IndexedDB only when the user chooses retained audio; transcript-only mode discards the recording after the editable transcript is saved. See [voice feasibility](voice-transcription-feasibility.md).

| Capability | Interface | Boundary |
| --- | --- | --- |
| Photo analysis | `analyze() -> MomentCandidate` | The active adapter and data path are visible. The current demo adapter is synthetic, and no photo library or face recognition is active. |
| Moment confirmation | `confirmMomentCandidate(id)` | Creates a separate confirmed hangout only after user confirmation. |
| Capture | `createNote({ audio?, text?, capturedAt })` | Text remains available when voice is unavailable. |
| Transcription | `transcribe(audio) -> transcript` | On-device only unless an explicit remote per-note opt-in is recorded. |
| Extraction | `extract(transcript, friendCandidates) -> FactProposal[]` | Never writes durable memory directly. |
| Relationship rules | `getNextAction(friend, context) -> Prompt?` | Deterministic and plain-language explainable. |
| Events | `findActivities(context, location, timeWindow)` | Manual ideas work without a provider. |
| Planning | `createPlanDraft(friend, activity, message)` | Never sends or schedules automatically. |
