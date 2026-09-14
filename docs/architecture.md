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

Phase 1 implements only the fixture-mode boundary and guard functions that express the beta friend cap, user review requirement, and remote-consent requirement. It intentionally does not implement a database, microphone, AI adapter, external events adapter, or sharing integration.

| Capability | Interface | Boundary |
| --- | --- | --- |
| Capture | `createNote({ audio?, text?, capturedAt })` | Text remains available when voice is unavailable. |
| Transcription | `transcribe(audio) -> transcript` | On-device only unless an explicit remote per-note opt-in is recorded. |
| Extraction | `extract(transcript, friendCandidates) -> FactProposal[]` | Never writes durable memory directly. |
| Relationship rules | `getNextAction(friend, context) -> Prompt?` | Deterministic and plain-language explainable. |
| Events | `findActivities(context, location, timeWindow)` | Manual ideas work without a provider. |
| Planning | `createPlanDraft(friend, activity, message)` | Never sends or schedules automatically. |
