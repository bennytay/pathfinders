# Voice and transcription feasibility, Phase 3

## Decision

InnerCircle ships text-first in this phase. The browser recorder supports an explicit record, stop, playback, interruption recovery, and a manual editable transcript. Audio is either discarded after a transcript is saved or retained in browser IndexedDB until the user deletes it, according to the privacy setting.

No audio is uploaded. Remote transcription has no active adapter. The product shows that it is off and states the consent contract required before one can be introduced.

## On-device spike

Two browser-accessible approaches were assessed against short social reflections. Neither clears the product bar for a truthful on-device release.

| Approach | Short/noisy-note accuracy | Latency | Model size / battery | Offline | Platform support | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Web Speech API | Variable and browser/provider-dependent | Fast when available | Browser-managed | Not reliably offline | Inconsistent, absent in several browsers | Rejected: cannot make a truthful on-device claim. |
| In-browser WASM speech model | Potentially offline | Unproven on target mobile hardware | Large model and meaningful CPU/battery cost | Possible | Requires a model/runtime delivery path | Rejected for now: no representative-mobile benchmark has met the documented threshold. |

This is a feasibility decision, not a claim that either approach is universally unusable. Before selecting an adapter, test it on representative supported mobile devices against clean and noisy 10–60 second notes, recording word-error rate, p50/p95 latency, downloaded model size, battery impact, interruption recovery, and offline success.

## Processing contract

If a remote fallback is proposed later, the note-level screen must name the processor and destination, list the audio/transcript fields sent, explain why local processing was unavailable, require an explicit choice for that note, record consent time and destination, and provide a text-only decline path. It may not use a global default or silently retry remotely.

## Implemented behavior and automated coverage

- Browser denial/unavailability keeps text capture available (covered in the Playwright browser flow).
- Visibility changes stop an active recording and ask the user to review playback.
- Malformed or unavailable microphone input shows a text fallback message.
- IndexedDB write failures preserve the editable transcript path and report that retained audio could not be saved.
- The browser storage setting controls transcript-only versus retained-audio behavior.
