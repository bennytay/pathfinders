# InnerCircle — Master Execution Plan

## Strategic order

Build the **open-source MVP** completely first. Then redesign the UX/UI around the working product. Only after the redesigned product is stable should the team optimize a narrow, reliable 60-second demo.

```text
Functional open-source MVP -> UX/UI redesign -> demo optimization and recording
```

This order matters: the demo should showcase the real product rather than a throwaway prototype, and its visual language should come from the post-MVP design pass.

## Product definition

**Working name:** InnerCircle

**Promise:** a privacy-first, voice-first context layer for a deliberately small group of close friends. A user captures a thought after an interaction; InnerCircle helps them retain only the context they choose, then creates a transparent, specific opportunity to meet in person.

**Target user:** socially busy 18–30-year-olds whose close friendships are spread across fragmented digital channels and who want more intentional real-life time together.

**Core loop:**

1. Capture a voice or text reflection after seeing, thinking about, or planning with a close friend.
2. Turn it into user-reviewed, source-linked relationship context.
3. Track the user’s chosen in-person rhythm for that friend.
4. Surface one explainable prompt when a catch-up may be meaningful.
5. Suggest an activity grounded in shared context and create an editable plan draft.

**North-star outcome:** self-reported intentional in-person plans and meetups—not messages sent, reply speed, streaks, or social-graph size.

## Non-negotiable principles

1. **In-person over inbox zero.** The primary output is an opportunity to meet, never a push to clear DMs.
2. **Small by design.** Start with a user-selected circle of up to 15 people; no discovery network or contact hoovering.
3. **User ownership.** Every fact is attributable to a source note, reviewable, editable, exportable, and deletable.
4. **Privacy is behavior, not marketing.** Audio/transcripts remain on device whenever the chosen technical path genuinely supports it. Any remote processing is explicit opt-in per note, with a clear destination disclosure.
5. **No hidden relationship grades.** Use transparent reminder eligibility and plain-language reasons; never rank friends’ worth.
6. **No autonomous social agent.** No background recording, automatic outreach, calendar writes, social-media scraping, or claim that a plan has been accepted when it is only a draft.
7. **Functional first.** The MVP ships with intentionally utilitarian UI; visual redesign begins only after the functional hardening gate.

## Scope boundaries

### MVP includes

- Explicit voice and text capture.
- Local/on-device transcription if proven viable; a clearly disclosed opt-in remote fallback only if necessary.
- A user-created close circle, relationship preferences, and manual in-person interaction logging.
- AI-proposed memory extraction with review, correction, provenance, and deletion.
- Explainable nudge eligibility based on chosen cadence and real context.
- Manual activity ideas and a pluggable public-events source.
- Editable plan drafts that a user copies or shares through their own channel.
- Local-first data, export/deletion, offline fixture mode, tests, documentation, and public repository hygiene.

### Deliberately excluded from MVP

- DM, contacts, social-feed, or message import.
- Automatic response suggestions or relationship “lead management.”
- Passive listening, background location collection, automatic texting, or automatic calendar changes.
- Venue sponsorship workflows, payments, subscriptions, group coordination, and social discovery.
- Mental-health/relationship diagnosis or instructing a person to cut someone off.

## System architecture

```text
Capture UI -> Note repository -> Transcription adapter -> Extraction adapter
                                  |                         |
                                  v                         v
                            raw transcript             fact proposals
                                                            |
                                                     review / edit / reject
                                                            |
Friend + interaction repositories <- relationship rules -> explainable next action
                                                            |
                               event-provider adapters -> plan draft -> share/copy
```

Keep components interchangeable from the start:

| Capability | Required interface | MVP implementation principle |
| --- | --- | --- |
| Capture | `createNote({audio?, text?, capturedAt})` | Always support text when voice is unavailable. |
| Transcription | `transcribe(audio) -> transcript` | Select engine only after an on-device feasibility spike. |
| Extraction | `extract(transcript, friendCandidates) -> FactProposal[]` | Strict schema; no direct persistence to memory. |
| Relationship rules | `getNextAction(friend, context) -> Prompt?` | Deterministic and explainable. |
| Events | `findActivities(context, location, timeWindow)` | Manual ideas work even with no network/provider. |
| Planning | `createPlanDraft(friend, activity, message)` | Sharing is user-initiated, never automatic. |

Raw audio, transcripts, proposed facts, and confirmed memories must be separate records. A model cannot silently write durable relationship context.

## Data model

| Entity | Essential fields | Guardrail |
| --- | --- | --- |
| `Circle` | id, name, max_members | Default maximum: 15. |
| `Friend` | id, display name, preferred cadence, archived | User-created only. |
| `Note` | id, raw text, optional audio reference, captured time, state | Audio retention is explicitly configurable. |
| `FactProposal` | friend, type, value, source note, confidence | Never drives prompts before review/approval. |
| `MemoryFact` | source, edit history, forgotten/deleted time | Editable and deletable at all times. |
| `Interaction` | friend, in-person/remote, occurred time | In-person is first-class. |
| `Prompt` | reason inputs, generated time, snooze/dismiss state | Reason is visible to user. |
| `Activity` | title, place, time, tags, source, retrieved time | Show source/freshness. |
| `PlanDraft` | friend, activity/idea, message, status | A draft is not an outreach action. |
| `PrivacyEvent` | processing choice, destination, consent time | User-facing audit trail for external processing. |

## Reminder policy

There is no universal “friendship health” score. The product calculates a private `prompt_eligibility` state only where the user has configured an in-person rhythm.

```text
eligible when:
  in_person_gap > user_chosen_cadence
  AND no recent pending plan
  AND user has not snoozed the reminder

priority = gap_over_cadence + explicit_intention + relevant_confirmed_activity
```

Example explanation: “You set a two-week cadence, it has been 19 days since you met Sam, and both of you mentioned bouldering.” The user can adjust cadence, snooze, dismiss, or disable prompts per friend.

# Phase 1 — Foundation and product contract

**Goal:** establish a fresh, open-source-ready application foundation and make the privacy/product boundaries concrete before feature work.

## Work

- Create a fresh application boundary in this repository; retain only tooling that supports the new product.
- Write the product contract, glossary, non-goals, privacy model, initial threat model, and architecture decision records.
- Establish the initial beta scope: one user, up to five active friends during testing, one city, and an opt-in event source.
- Create synthetic fixtures and demo mode. Do not commit real people’s notes, contacts, or recordings.
- Create contribution standards: license, code of conduct, security policy, issue/PR templates, environment-variable example, and contributor setup.
- Set up linting, type checks, unit tests, end-to-end test base, and CI.

## Exit criteria

- A contributor can clone, run fixture mode, and understand data/AI boundaries.
- The repository contains no private sample data or required paid service to run core flows.
- Architecture decisions have explicit alternatives and tradeoffs documented.

# Phase 2 — Local-first domain core

**Goal:** build durable, private product state before microphones, models, or integrations.

## Work

- Implement local repositories, versioned migrations, seed/reset, export, and deletion cascades.
- Build the close-circle setup, friends, notes, interactions, confirmed facts, proposed facts, activities, prompts, and plans models.
- Add circle capacity and per-friend cadence settings.
- Implement text-note capture and manual in-person interaction logging.
- Add a privacy settings model and user-visible data manager.
- Build fixtures for happy paths and failure conditions.

## Exit criteria

- A user can create a circle, add people, save text reflections, log a meetup, inspect all records, export data, and fully delete a friend plus linked records.
- The product works offline in fixture mode.
- Data lifecycle and deletion tests pass.

# Phase 3 — Voice capture and transcription feasibility

**Goal:** make voice the natural intake path without making false privacy or reliability claims.

## Work

- Implement microphone permission, record/stop, playback, interruption recovery, and a first-class text fallback.
- Run an on-device transcription spike against at least two viable approaches on representative mobile hardware.
- Score each approach for short/noisy-note accuracy, latency, model size, battery use, offline behavior, and platform support.
- Select the on-device adapter only if it meets documented thresholds.
- If it does not, ship text-first and place any remote transcription behind an explicit per-note consent screen that says exactly what is sent and where.
- Make audio retention configurable: transcript-only versus retained audio until deletion.
- Test denial of permissions, offline capture, background interruption, malformed audio, and storage pressure.

## Exit criteria

- Voice recordings reliably become editable transcripts under the documented processing mode.
- Network/storage inspection and automated tests verify the privacy behavior described to users.
- No core experience is blocked when voice transcription is unavailable.

# Phase 4 — Grounded AI memory extraction

**Goal:** transform messy reflections into controlled, attributable context without allowing AI to quietly rewrite a relationship.

## Work

- Define a schema for a proposal: referenced friend, fact type, value, temporal qualifier, source span, confidence, and suggested intent.
- Resolve friend references locally before calling a model; request clarification for ambiguous identity.
- Implement an offline fixture extractor and a swappable schema-constrained model adapter.
- Render proposals for review; default to “not saved” until the user approves or explicitly enables an understood auto-approval policy for low-risk categories.
- Support edit, reject, merge, forget, and delete. Preserve provenance and model metadata without retaining unnecessary provider logs.
- Test invented facts, ambiguous names, sensitive information, and prompt injection embedded in notes.

## Exit criteria

- Every durable memory shows its source and can be corrected or removed.
- No unreviewed AI inference can alter prompt eligibility.
- Adversarial validation tests pass.

# Phase 5 — In-person planning engine

**Goal:** turn confirmed context into gentle, explainable reasons to meet.

## Work

- Implement the transparent prompt-eligibility policy, snooze/dismiss controls, and reason cards.
- Add manual activity ideas first; users can create a suggestion with no external data source.
- Implement a provider interface and one documented public-events adapter.
- Match activities against confirmed shared interests and explicit intentions only. Add location, time, freshness, no-result, and error handling.
- Build editable plan drafts and user-initiated copy/share behavior.
- Record only explicit outcomes: planned, met, not now. Never infer attendance.

## Exit criteria

- A user can go from confirmed memory to an explainable prompt, relevant activity, and shareable plan draft.
- The complete core loop works offline with manual ideas; the external event provider enhances it but is not a dependency.

# Phase 6 — Functional hardening and MVP release

**Goal:** complete the open-source MVP as a trustworthy, reproducible product before visual redesign begins.

## Work

- Add unit tests for reminder rules, matching, persistence, migration, export/deletion, and extraction validation.
- Add integration tests for note → transcript → review → memory → prompt → activity → plan.
- Add end-to-end tests for first run, offline flow, permission denial, failed transcription, no activity results, remote-processing refusal, and full data deletion.
- Complete the threat model: device loss, shared devices, sync compromise, model-provider disclosure, event-provider tracking, and sensitive-note exposure.
- Ensure telemetry is opt-in, contains no note content/transcripts/friend names/event queries by default, and is documented.
- Profile startup, storage growth, low-connectivity behavior, audio/battery impact, and low-end-device performance.
- Publish README, setup, privacy model, screenshots/GIF, architecture, demo fixture guide, adapter documentation, roadmap, changelog, and contributor docs.
- Add CI verification, release checklist, example configuration with no secrets, and first-good-issue labels.

## MVP release gate

- [ ] Every core user flow works in fixture mode without a network connection.
- [ ] Data is inspectable, exportable, and deletable at note, fact, friend, and whole-workspace levels.
- [ ] All AI processing behavior is truthful, testable, and visible to the user.
- [ ] No product surface ranks friends, creates pressure to reply, sends outreach automatically, or gamifies relationships.
- [ ] A stranger can clone the repository, run the app, understand the privacy contract, and contribute safely.
- [ ] CI passes lint, type checks, tests, and a production build.

**Milestone:** Open-source MVP is complete. Freeze functional scope except for defects discovered during the following design work.

# Phase 7 — UX/UI redesign on top of the finished MVP

**Goal:** turn the hardened functional product into a calm, clearly human consumer experience.

## Work

- Audit every functional screen and identify friction, unclear consent decisions, and CRM-like language.
- Create an information architecture centered on: capture, review, circle, one next action, activity, and plan—not feeds or dashboards full of scores.
- Define visual tokens, typography, color, spacing, motion, component states, responsive rules, and empty/error/loading states.
- Redesign the onboarding, voice/text capture, fact review, friend context, prompt reason, activity choice, and plan draft surfaces.
- Make the distinction between private memory, AI proposal, plan draft, and sent action unmistakable.
- Run task-based usability sessions with 5–7 target users. Test whether they understand what data stays local, why a reminder appeared, and whether a plan has actually been sent.
- Complete keyboard, screen-reader, contrast, reduced-motion, touch-target, responsive, and localization-readiness work.
- Implement the approved design system and regression-test the functional core after each meaningful UI change.

## Exit criteria

- Users complete capture-to-plan without a walkthrough.
- Participants describe prompts as respectful and useful rather than transactional or surveillant.
- Privacy and AI-review choices are understood correctly in usability testing.
- Accessibility checks pass and all Phase 6 functional tests remain green.

# Phase 8 — Optimize the real product for a 60-second demo

**Goal:** package the now-functional, redesigned MVP into a concise, resilient investor/user demo without creating a separate fake product.

## Demo scenario

Use a resettable, clearly labeled fixture workspace with three close friends:

| Friend | Existing context | Last in-person time | Activity match |
| --- | --- | --- | --- |
| Maya Chen | New job is stressful; loves ceramic classes | 24 days ago | Pottery night |
| Jordan Lee | Training for a half marathon; likes early coffee | 11 days ago | Sunday run + coffee |
| Eli Park | Loves small live music venues; recently moved | 5 days ago | Local gig |

Hero note:

> “I ran into Maya after work. Her new job has been a lot, and she said she really misses making things. We should finally do that pottery class together soon.”

Expected product behavior: source-linked proposals for Maya, job stress, pottery, and meeting soon; a transparent “24 days since you met” prompt; a pottery-class suggestion; and an editable Thursday plan draft.

## Work

- Create a one-click development/demo reset that seeds only synthetic data.
- Ensure fixture mode exercises the genuine product interfaces: transcription, extraction, storage, reminder rules, event search, and planning—not a disconnected slideshow.
- Use a deterministic fixture transcription/extraction response for the final recording only if live processing cannot complete reliably on the recording device. Clearly avoid claims that it is live when it is not.
- Add robust loading, microphone-denied, no-event, extraction-failed, and offline fallbacks.
- Strip nonessential paths from the recording route while preserving the authentic feature flow.
- Test the full script with a fresh browser/device state three times; record a backup take.

## 60-second recording storyboard

| Time | Action | Message |
| --- | --- | --- |
| 0–6s | Open the redesigned home: one gentle Maya prompt | This is an intentional inner-circle tool, not another social feed. |
| 6–17s | Capture the Maya voice note (or clearly labeled reliable demo capture) | Natural, low-effort context enters by voice. |
| 17–27s | Show transcript and editable, sourced proposals | AI assists; the user remains in control. |
| 27–37s | Return to Maya’s reason card | “24 days since you met; you both mentioned pottery.” |
| 37–49s | Open relevant pottery event and edit a plan draft | Context becomes a real-world opportunity. |
| 49–56s | Save/share-ready Thursday plan and dashboard update | The app creates momentum to meet, not more screen time. |
| 56–60s | Close with product thesis | “AI to stay human.” |

Suggested narration:

> “After I see someone, I just say what happened. InnerCircle keeps only the context I choose, notices when a friendship could use time together, and gives me a real reason to make a plan. It’s AI to stay human.”

## Demo release gate

- [ ] The demo uses the real MVP code path with synthetic/resettable data.
- [ ] Every AI output is reviewed or visibly presented as a proposal.
- [ ] The reminder is explainable and does not rank a friendship.
- [ ] The event is relevant to confirmed context and clearly sourced.
- [ ] The plan is visibly a draft until the user shares it.
- [ ] The sequence completes naturally in 60 seconds on three fresh dry runs.
- [ ] No copy overstates integrations, automation, privacy, or live AI behavior.

# Phase 9 — Learn, then monetize responsibly

**Goal:** validate human benefit before expanding integrations or commercial surfaces.

## Work

- Run a closed beta with 15–30 opt-in users, each beginning with their own small circle.
- With consent, collect only product-learning signals: notes captured, proposals approved/rejected, prompts snoozed, plan drafts made, and self-reported meetups. Prefer aggregate reporting.
- Interview users weekly about whether prompts feel useful, intrusive, or transactional.
- Fix privacy/control misunderstandings before adding more notifications or data sources.
- Consider monetization only after benefit is demonstrated: paid encrypted sync/richer optional discovery, followed much later by clearly labeled opt-in venue sponsorship. Sponsors must never access private memories or relationship context.

## Success measures

- Users report that the product helped create more intentional in-person plans.
- Reminders are more often acted on or positively dismissed than snoozed as anxiety-inducing.
- Users understand and exercise data controls.
- The product remains useful without DM imports, aggressive notifications, or a giant social graph.

## Verification matrix

| Risk | Evidence required before release |
| --- | --- |
| Audio privacy promise | Network and storage inspection plus automated tests for each processing setting. |
| Invented AI memory | Schema validation, source display, review/rejection, and adversarial test coverage. |
| Friend-CRM dynamic | Product/UX review confirms no ranking, quotas, streaks, auto-send, or reply-time pressure. |
| Irrelevant/stale events | Provider tests for tags, location/time, freshness, no-result, and offline/manual fallback. |
| Loss of user control | Export and full-deletion integration tests, with clear processing controls. |
| Offline failure | End-to-end blocked-network test for capture, review, manual activity, and plan drafting. |
| Design regression | Functional integration/E2E suite remains green after redesign changes. |

