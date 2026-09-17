# Circle: Demo-to-MVP Execution Plan

## The decision

Circle is **not** an app for managing friendships. It is an AI that gets a person back in the room with people they care about.

The product earns its place by doing small pieces of digital remembering and coordination, then getting out of the way. Time spent in Circle is not a success metric. A useful real-life plan, and eventually a self-reported meetup, is.

This supersedes the previous functional-MVP-first sequence. The new order is:

```text
Current working foundation -> convincing, real vertical-slice demo -> harden and widen that slice into the MVP
```

The demo must still use the product's actual storage, capture, context, prompt, and planning interfaces. It may use resettable synthetic data and deterministic on-device fixtures. It must never masquerade a fixture, an inferred identity, or a plan draft as a live result, a confirmed person, or a sent invitation.

## Product thesis and success boundary

**Promise:** Circle quietly remembers the context a person chooses to give it, then offers a specific, timely reason to see someone in real life.

**Outcome:** a user moves from a recently shared moment to a concrete, editable plan with almost no admin work.

**Not the outcome:** a record of every interaction, a relationship health score, contact frequency, screen time, messages sent, streaks, or a ranked list of friends.

The user controls all durable context. AI can suggest, infer, and assemble; it cannot silently make memory, contact a friend, write to a calendar, or claim a meetup occurred.

## What changes from the current foundation

The existing local-first manual flow is valuable infrastructure: local data, voice/text capture, reviewed fact proposals, explainable prompts, activity matching, editable plan drafts, fixture mode, export, and deletion already exist. It is currently presented as a workspace with separate Capture, Circle, Review, Plan, Records, and Data Manager views. That presentation makes the user carry too much of the workflow.

The next build should retain those safeguards while changing the product center of gravity.

| Current emphasis | Circle emphasis |
| --- | --- |
| "Capture a reflection" and manually select people, date, and channel | A consented photo-library scan proposes a possible hangout, then asks for one confirmation. |
| Manual meetup log | A confirmed photo-detected hangout creates the interaction. There is no manual circle-management surface. |
| Cadence, status, and a list of people | A small number of useful opportunities, each with a human reason to meet. |
| Voice/text as the main logging task | Voice is optional colour after a moment is detected: what mattered, what they mentioned, what could be next. The user never types on this surface. |
| Review as a destination | Review appears inline only when Circle needs the user to approve what it wants to remember. |
| Records and data management in primary navigation | Controls remain accessible in settings, but never compete with the connection loop. |

### Language rules

Use: **last saw**, **you both mentioned**, **could be a nice time**, **make a plan**, **not now**, **remind me later**.

Never use: **overdue**, **at risk**, **relationship score**, **health**, **engagement**, **pipeline**, **lead**, **stale**, **days since contact**, or guilt-inducing red/bad states.

Time can explain a suggestion only in combination with real, confirmed context. For example: "You last saw Maya a few weeks ago, and you both mentioned trying bouldering." It should never be shown as a friendship deficit.

## The product loop

```text
Live normally
  -> Circle passively proposes a possible hangout from the consented photo library
  -> Circle suggests who / when / place, user confirms or corrects
  -> optionally say what mattered in a 10-second voice note
  -> approve any memory worth keeping
  -> Circle offers one contextual chance to reconnect
  -> choose or create an activity and edit an invite
  -> take the plan out of Circle
```

Photos answer **who, when, and potentially where**. Voice answers **what mattered**. The user should never need to type or complete a form merely because the system could not infer a field.

## Non-negotiable privacy and trust boundaries

1. **Photo-library access is explicit and native-only.** After a user grants the platform’s photo-library permission, the native scanner may inspect local photo metadata and run approved on-device analysis across the library. The browser build must not claim this capability and must show the limitation plainly.
2. **Confirm, do not assume.** A person, time, place, and hangout are proposals until the user confirms them. A photo containing Maya is not proof that the user met Maya.
3. **Keep recognition narrow and local.** Any face profile is limited to people the user deliberately adds to Circle, processed on-device where technically possible, inspectable, and deletable. Do not upload a camera roll or biometric template to a model provider.
4. **Treat face data as sensitive.** Before enabling recognition beyond a closed test, document retention/deletion, get the necessary consent from people whose profiles are enrolled, and complete jurisdiction-specific privacy review. Ship a no-recognition fallback.
5. **No background location or recording.** Photo metadata is processed locally and must be confirmed before saving. Voice remains user-initiated; speech becomes a transcript without a typing fallback on the hangout surface.
6. **AI proposes, the user keeps.** Context extracted from a voice note stays a proposal until approved. Only confirmed memories can create future suggestions.
7. **A plan is a draft.** Copy/share is deliberate; no messages, calendar writes, RSVPs, or attendance claims are automatic.

## Milestone 0: Reframe the existing foundation

**Goal:** make the current product support the new loop before visual polish.

### Build

- Rename the product surface to **Circle** and update its promise and empty states.
- Replace the workspace-first primary navigation with three task surfaces: **Today**, **Add a moment**, and **People**. Move review, local data, and privacy controls into contextual views or settings.
- Add explicit domain records for a `MomentCandidate` and `ConfirmedHangout`, keeping them separate from a note, interaction, photo metadata, and memory fact.
- Remove the manual “manage your circle” and text-entry paths from the primary product. Keep deletion and data controls only in Settings.
- Change fixture data to the Maya/Ari bouldering scenario and add a one-click reset for it.
- Add a deterministic capability boundary for photo analysis. The UI must accurately say whether a result is fixture data, metadata, on-device recognition, or a user selection.

### Exit criteria

- A fresh user can understand the product without seeing a relationship dashboard or an overdue-style label.
- Existing export, deletion cascade, source-linking, prompt, and plan-draft tests still pass.
- The app has a stable, resettable scenario for the demo.

## Milestone 1: Build the demo vertical slice

**Goal:** demonstrate the whole Circle promise in 60–75 seconds with one natural scenario.

### Demo frame: mobile first

The demo is designed and recorded as a phone experience, not as a desktop app squeezed into a narrow viewport. The canonical recording target is a 390 × 844 CSS-pixel portrait viewport, with the 360-pixel-wide layout treated as the minimum supported demo width.

The physical scene is someone leaving a Saturday hangout, looking at their phone while walking home or on the train, then acting on a gentle idea to see someone again later. They have one hand and a few seconds. The UI should therefore feel like a calm sequence of short, obvious decisions, never a dashboard that demands administration.

- **One task per screen.** Today shows one primary opportunity. Add a moment focuses on the selected photo and confirmation. Context, review, activity choice, and invitation drafting each get their own focused mobile screen.
- **Thumb-first actions.** Put the one primary action in the lower reach zone, use full-width controls, and provide at least 44 × 44 px touch targets. Do not make hover, right-click, dense tables, or side navigation necessary.
- **Phone-native capture.** The Hangout Radar is a single no-scroll screen. It surfaces one local-library proposal, requests a simple keep/not-this-one confirmation, and offers one prominent microphone action for optional context. No keyboard, text field, or manual people/date form appears here.
- **Progress without process anxiety.** Move forward after each confirmation and allow back/edit at every step. Do not show a multi-step form, completion percentage, or logging checklist.
- **No dashboard compression.** Records, settings, and privacy controls live behind a lightweight profile/settings entry. People is a short, searchable list or a focused person view, not a desktop-style grid.
- **Safe mobile states.** Account for photo-library permission, no eligible photos, offline state, missing metadata, unavailable speech recognition, and interrupted recording. Every state must retain its candidate without claiming a detection occurred.

The desktop view may remain responsive for development and accessibility, but it is not the demo's source of truth. Build and visually review the demo at phone widths first.

### The demo scope

Use a synthetic, clearly labelled workspace with Maya and Ari already in the user's Circle. The demo starts with a user-selected photo from a Saturday hangout in Newtown. Detection is deterministic fixture data for the recording unless an equivalent local implementation is reliable. It must be labelled in development, but need not expose developer language in the recording when the result is genuinely produced by the selected-photo fixture adapter.

1. **Today:** show one opportunity: "See Maya? You last caught up a few weeks ago. You both mentioned trying bouldering." The primary action is **Find something**, not "fix" or "catch up now."
2. **Add a moment:** select the Saturday photo. Circle presents, "Looks like Maya and Ari, Saturday in Newtown. Add this to Circle?" with **Add**, **Not quite**, and an obvious edit path.
3. **Add context, optionally:** after confirmation, prompt, "Anything worth remembering?" The user records or types: "Maya wants to try bouldering next week and she just started her internship." The moment is useful even if this step is skipped.
4. **Review inline:** show concise, editable proposals for Maya's internship and bouldering intent. The user approves only what should be remembered.
5. **Create the next interaction:** return to Maya's contextual prompt, choose a beginner bouldering option near campus on Thursday, and edit a share-ready invitation. The UI clearly says **Draft, not sent**.
6. **Close:** return to a calm confirmation: "Thursday plan ready to share." Do not add an engagement feed, streak, or tally.

### Mobile storyboard

| Time | Phone screen | User action | What it proves |
| --- | --- | --- | --- |
| 0–8s | Today | Tap Maya's single contextual opportunity. | Circle offers a reason to meet, not a queue of friendships. |
| 8–19s | Add a moment | Choose the Saturday hangout photo. Confirm Maya, Ari, Saturday, and Newtown. | The phone does the administrative remembering, while the user stays in control. |
| 19–30s | What mattered | Hold to record or type a 10-second note about bouldering and Maya's internship. | Voice adds meaning only when there is something worth keeping. |
| 30–39s | Review | Approve the concise bouldering and internship proposals. | AI suggestions remain visible, editable, and optional. |
| 39–57s | Find something | Choose a beginner bouldering option near campus for Thursday. | Confirmed context becomes a relevant offline opportunity. |
| 57–68s | Draft invite | Edit and tap Copy or Share. | Circle hands the plan back to the user; it never messages on their behalf. |

### Demo engineering work

- Implement a native, permission-gated photo-library adapter that can enumerate local assets without upload, process them on device, and yield reviewable hangout proposals. Retain references/thumbnails only as configured by the user; never persist face templates.
- Build every demo screen from the 390 × 844 portrait viewport outward. Verify the 360-pixel-wide layout, safe-area spacing, keyboard avoidance, touch targets, image-picker cancellation, and permission-return state before desktop refinement.
- Implement a `PhotoAnalysisAdapter` with a deterministic fixture implementation. Do not couple the UI to a provider or imply production face recognition.
- Implement inline moment confirmation and optional voice-only context capture. Speech recognition must disclose its data path and fail gracefully when unavailable.
- Make confirmed moment data create in-person interaction records only after the user confirms it.
- Reuse the current guarded extraction, memory review, explainable prompt, activity, and editable plan-draft components behind the new task flow.
- Add robust empty, cancelled import, unknown person, no-metadata, denied microphone, offline, no-activity, and extraction-failed paths.
- Add a reset action that clears selected photo assets and restores only synthetic fixture data.

### Demo release gate

- [ ] The entire path runs in a fresh browser from one reset action.
- [ ] The complete recording works at 390 × 844 and remains usable at 360 px wide, with no clipped controls, horizontal scrolling, hover-only actions, or inaccessible bottom actions behind the keyboard/safe area.
- [ ] The recording uses a real vertical slice, not static screens or a fabricated data jump.
- [ ] A moment is only recorded after clear confirmation.
- [ ] A memory is only durable after review/approval.
- [ ] Photo and recognition language truthfully reflects the active adapter.
- [ ] The final plan is visibly a user-owned, unsent draft.
- [ ] Three dry runs complete in 75 seconds or less, including a recovery path for a missing photo metadata or microphone result.

## Milestone 2: Turn the demo slice into a private, useful MVP

**Goal:** extend the demonstrated loop to real, repeatable daily use without rebuilding a CRM.

### 2A. Capture and moment detection

- Support a native, opt-in full-library scan with local thumbnail/reference handling and a user-controlled retention choice. The web build remains a clearly labelled fixture-only preview until a native adapter exists.
- Extract available capture time and coarse place locally where feasible. Require keep/not-this-one confirmation before it becomes a moment.
- Add multi-person moment confirmation and duplicate detection. Never add a person through a manual circle-management surface.
- Keep voice as the only way to add meaning after a moment. Use a reviewable transcript internally, but never require typing on the Hangout Radar.
- Run a technical spike for on-device recognition of a very small, user-enrolled Circle. Measure accuracy for the actual phone targets, latency, battery, storage, offline behaviour, false matches, and deletion reliability.
- Only enable recognition if the spike meets documented thresholds and privacy controls. Otherwise ship the selected-photo, manual-tag flow as the MVP.

### 2B. Context and memory

- Evolve extraction around useful planning context: shared interests, explicit invitations, life updates the user chooses to keep, constraints, and temporal qualifiers.
- Keep source evidence and review inline. High-sensitivity or ambiguous content must request clarification, not be saved.
- Let a user view, edit, forget, export, and delete a moment, its photo, extracted proposals, and confirmed memories independently.
- Never use unreviewed context, inferred emotions, or a photo alone to trigger a reconnection opportunity.

### 2C. Today and People

- Make **Today** the default and show at most one to three high-confidence, actionable opportunities. It is not a feed.
- Each opportunity must answer: why this person, why now, and what could happen next. It includes snooze and not-now controls without guilt copy.
- Make **People** a calm context view: recent shared moment, confirmed ideas/intentions, and a single "make a plan" path. Do not display scores, rings, ranks, or an overdue queue.
- Use a transparent eligibility rule: user-enabled reconnect prompts, no pending plan, a sufficient user-chosen time window, and at least one confirmed contextual reason. The context reason is required in UI; time alone is not enough.
- Allow notification only after the in-app loop proves useful, with per-person opt-in, a plain-language reason, quiet hours, and one-tap disable. Notifications are not required for MVP release.

### 2D. Planning and handoff

- Make activity discovery optional and resilient: manual idea first, then one user-initiated event/search provider with source, freshness, location, and no-results treatment.
- Recommend only from confirmed mutual/shared context or an explicit intention, never generic profile assumptions.
- Keep activity time/place editable. Create a draft message that the user can copy or share through their own channel.
- Record only user-confirmed outcomes: planned, met, or not now. Do not infer attendance from photos, calendar data, or silence.

## MVP release gate

### Trust and product fit

- [ ] Five target users can go from selected moment to plan without a walkthrough and describe Circle as helping them make plans, not manage friends.
- [ ] No screen contains scores, streaks, ranks, overdue labels, contact quotas, or automated outreach.
- [ ] Every opportunity has a respectful, human-readable reason and can be snoozed, dismissed, or disabled.
- [ ] A photo alone never creates a durable interaction, memory, or prompt.

### Privacy and safety

- [ ] Photo selection, metadata use, location disclosure, voice recording, and any remote processing each have clear, granular consent and a no-permission fallback.
- [ ] Any production face-recognition path is on-device, limited to user-enrolled Circle members, deletable, tested, and cleared by the required consent/privacy review. If this bar is not met, recognition remains off.
- [ ] Notes, photo assets, transcripts, proposals, memories, moments, interactions, prompts, and plans are separately inspectable, exportable, and deletable.
- [ ] No raw photo, face template, note content, transcript, name, or event query enters analytics by default.

### Reliability and release quality

- [ ] The selected-photo-to-plan flow works with no metadata, unknown faces, a cancelled import, voice denial, offline mode, no activity results, and no recognition capability.
- [ ] Fixture mode works without a network connection and never contains real people or photos.
- [ ] Unit, integration, and end-to-end tests cover moment confirmation, duplication, memory approval, prompt eligibility, activity matching, deletion cascades, and plan handoff.
- [ ] Accessibility meets WCAG AA basics: keyboard and screen-reader paths, visible focus, contrast, touch targets, reduced motion, and clear non-colour status.
- [ ] Documentation truthfully describes every adapter and its data path, including the difference between selected-photo metadata, fixture detection, on-device recognition, and any optional remote processing.

## Priority order from today

1. Preserve the current local-first/reviewed-memory foundation.
2. Rework the IA and copy around **Today → Add a moment → Make a plan**.
3. Build the selected-photo confirmation slice and deterministic Maya/Ari fixture.
4. Join optional voice context to that slice, then reuse the existing review and planning engine.
5. Record and test the 60–75 second demo only once the vertical slice is complete.
6. Harden capture, context, Today, planning, privacy controls, and deletion into the MVP.
7. Treat background-library scanning, remote vision, autonomous messaging, calendar writes, social imports, and relationship scoring as out of scope.

## How we will know it is working

The leading qualitative signal is: users can describe a concrete plan Circle helped them make, without describing the app as a tracker.

Track only privacy-respecting, opt-in, aggregate product-learning signals needed to improve the loop: selected moments confirmed or corrected, optional context added, proposals approved/rejected, opportunities opened/snoozed/dismissed, plan drafts created/shared, and self-reported plans/meetups. Do not collect photo contents, face templates, friend names, notes, transcripts, or event queries by default.
