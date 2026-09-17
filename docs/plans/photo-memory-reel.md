# Photo Memory Reel: Product and Implementation Plan

## Status

Proposed implementation plan. This document defines the photo browsing and ranking experience; it does not enable camera-roll access, background processing, remote AI, face recognition, or uploads.

It intentionally supersedes the use of upvote/downvote controls for this experience. A **star** is the only explicit preference signal. The ranker is deterministic and rules-based, not an AI or machine-learning model.

## Product intent

Circle should be the quiet place where someone revisits their own past photos. The experience is a personal memory reel, not a social feed, engagement loop, or personality profiler.

People scroll through photos one at a time. Each photo has a small, casual event caption and a readable place/time overlay. When a person stars a photo, Circle gradually learns what *kind of camera-roll feed* they prefer to revisit, then shows more resonant photos while retaining enough variety to keep the reel surprising.

Examples of preferences the system may learn from stars:

- photos with a particular confirmed friend;
- photos from a recurring activity, such as pickup basketball or cooking;
- moments in a certain setting, such as cafes, outdoors, or late at night;
- small-group rather than large-group photos;
- spontaneous snapshots rather than posed portraits; and
- particular periods of the year or nostalgic time distance.

The system must not infer sensitive attributes, emotional state, relationship status, personality, or intent. It learns only from explicit tags, user corrections, and permitted non-sensitive photo metadata.

## Privacy and product boundaries

The existing product contract remains authoritative:

- Access to the iPhone photo library is a separate, explicit opt-in. The user chooses whether Circle can access selected photos or the full library.
- Phase one should use the iOS photo picker or a user-selected album, not a silent full-library scan. Broader access, if later offered, must be deliberate and reversible.
- Processing and ranking stay on device. No original photo, EXIF, location, preference, or caption is uploaded for this feature.
- There is no background location collection. Location comes only from an already-authorised photo asset's metadata and is optional.
- Exact locations are hidden by default. The overlay uses a coarse, user-editable label such as `Newtown`, `Bondi Beach`, or `Home`; it must never expose a home address or precise coordinates.
- A proposed caption is ephemeral UI metadata. It becomes a durable moment, hangout, or memory only after explicit user review and confirmation.
- Every imported asset and every derived record can be hidden or deleted. Deleting an asset must delete its captions, tags, feedback links, and ranking-cache entries.
- The reel must not trigger outreach, calendar writes, friend scoring, or notifications.

## User experience

### Core reel

The primary surface is a touch-first vertical reel with one edge-to-edge photo per viewport. The person swipes up for the next memory and down to return. It should feel like opening an old camera roll in a quiet moment, rather than using a short-form video feed.

At the lower edge, a restrained contrast layer contains:

1. A one-line casual caption, for example, `Post-game fries with everyone.`
2. A metadata row, for example, `Newtown · Fri, 9:42 pm`.
3. A star button labelled `Save this feeling`, or simply `Star photo` when space is constrained.

The caption is never allowed to cover the central subject of a portrait. It may collapse while the person is actively swiping and reappear after the reel settles. Text contrast must meet WCAG AA regardless of the photo behind it.

### Interaction model

| Action | Result | Ranking meaning |
| --- | --- | --- |
| Swipe up/down | Move through the reel | No immediate preference meaning. Navigation is not a downvote. |
| Tap star | Save the photo and show a brief confirmation | Strong positive signal for this photo and its eligible features. |
| Tap star again | Remove the star | Removes the explicit signal and recomputes local preferences. |
| Long-press / overflow | Hide photo, edit caption/place/time, inspect why it appeared, delete derived data | Hide is an exclusion, not a negative preference across unrelated photos. |
| Tap overlay | Expand source details and corrections | None unless a correction is saved. |

There is deliberately no dislike button. A person may simply move on. This keeps the reel relaxed and prevents ambiguous or accidental negative feedback from over-shaping it.

### Captions and metadata

Captions should be short, specific, and unembellished. They may be generated from already-approved structured tags, but the first version should use template rules rather than generative AI.

| Inputs available | Example caption |
| --- | --- |
| Activity = basketball; companions confirmed | `A very competitive game of basketball.` |
| Food setting; group moment | `Late-night dumplings after the gig.` |
| Place only | `An afternoon at Bondi.` |
| No reliable tags | `A good one from last summer.` |

Never fabricate attendees, a venue, an occasion, a mood, or a relationship. If metadata is absent or private, omit it rather than guessing. Users can edit any displayed caption or location label.

### Explainability and controls

The overflow menu contains `Why this photo?`. Its explanation uses only actual score contributors, for example: `You starred several outdoor photos with Priya. This one is from a different weekend.` It must never claim certainty or hidden understanding.

Settings include:

- photo-library permission and selected-source management;
- location precision: off, coarse place name, or city only;
- a list of starred photos;
- clear all reel preferences;
- export of locally retained reel metadata; and
- delete all imported-reel records without deleting the original Photos-library asset.

## Data model

Keep source assets, proposed display data, explicit feedback, and confirmed product memories separate. Suggested local entities:

```text
PhotoAsset
  id, platformAssetId, capturedAt, localThumbnailRef, importSource,
  locationPrecision, coarsePlaceLabel, deletedAt

PhotoFeatures
  photoId, activityTags[], settingTags[], companionIds[], compositionTags[],
  eventId?, provenance, confidence, version

ReelPresentation
  photoId, proposedCaption, captionSource, userCaption?, hiddenAt?,
  updatedAt

PhotoStar
  photoId, starredAt

ReelPreferenceProfile
  featureWeights, lastRecomputedAt, algorithmVersion

ReelImpression
  photoId, shownAt, rankReason[], rankScore, sessionId
```

`PhotoStar` is the sole explicit feedback record. `ReelImpression` supports variety and the user-facing explanation; it must have a retention limit and is never analytics telemetry. All feature records must identify their input/provenance and must cascade-delete with their source photo.

## Deterministic ranking algorithm

### Principles

1. Start useful without pretending to know the user. Before any stars, show a recent-and-varied chronological sample.
2. A star has a strong effect. Mere scrolling has no preference effect.
3. Weights are derived directly from starred photos, so un-starring or resetting fully reverses the learned profile.
4. Favour diversity and avoid repeat exposure. The same friend, event, burst, or visual near-duplicate should not occupy consecutive positions.
5. Include a small, deterministic exploration set so the profile can broaden naturally.
6. The ranker must be testable, inspectable, versioned, and produce the reason labels displayed in the UI.

### Eligible features

Only use non-sensitive, local, user-correctable features:

- confirmed companion IDs, if the user has chosen to tag them;
- approved activity and setting tags;
- coarse location category, never precise coordinates;
- capture time bucket (morning, afternoon, evening, night), weekday/weekend, and season;
- photo age bucket (recent, one year ago, older); and
- burst/event membership for deduplication and variety.

Do not use face embeddings, biometric identifiers, unconfirmed names, hidden metadata, image embeddings, inferred emotions, or inferred sensitive categories in phase one.

### Profile construction

For each feature value `f`, calculate a star-derived weight from the person's starred photos:

```text
weight(f) = log(1 + starredPhotosContaining(f))
            / log(1 + totalStarredPhotos)
```

The profile contains only features meeting a small evidence floor: at least two starred photos, unless the user explicitly stars a feature through a future filter. One-off stars still save the photo but do not create a broad feed preference.

When the total star count is low, scale profile influence down:

```text
confidence = min(1, totalStarredPhotos / 8)
```

This avoids overfitting the entire reel to a single newly starred photo.

### Candidate score

For each non-hidden, available photo, calculate:

```text
preferenceMatch(photo) = average(weight(f) for eligible features on photo)

score(photo) =
  0.55 * confidence * preferenceMatch(photo)
+ 0.20 * nostalgiaFit(photo)
+ 0.15 * photoQuality(photo)
+ 0.10 * deterministicExploration(photo)
- 0.45 * recentlyShownPenalty(photo)
- 0.60 * sameEventOrBurstPenalty(photo)
- 0.35 * nearDuplicatePenalty(photo)
```

`photoQuality` is a simple technical check (non-corrupt asset, suitable dimensions, not a known duplicate), not an aesthetic judgement. `nostalgiaFit` gently surfaces meaningful date distances, for example a photo from around this week in a previous year. It must not overwhelm starred preferences.

`deterministicExploration` is a stable, seeded rotation rather than random gambling. Reserve roughly one in every eight feed positions for a high-quality photo that is diverse from recent results and not strongly predicted by the current profile.

After score calculation, apply a diversity pass before rendering the next batch:

- no second asset from the same burst/event in the next 12 items;
- no exact/near duplicate in the next 30 items;
- cap any single companion, activity, setting, or location category at 3 of the next 10 items when alternatives exist; and
- preserve broad date range across a session.

If there are insufficient candidates to meet a rule, relax that rule in documented order: location cap, then activity cap, then companion cap. Never relax hidden, deletion, or duplicate exclusion rules.

### Initial feed and cold start

With zero stars, feed order is a varied chronological mix weighted toward representative, technically usable photos. The first session should contain recent memories, seasonal throwbacks, and a spread of confirmed events, with no claim that Circle knows the person's taste.

With 1–7 stars, give starred-related content increasing but bounded influence. At 8+ stars, the profile can drive the majority of positions, with fixed diversity and exploration safeguards.

### Star and undo behavior

Star actions update the local `PhotoStar` record immediately and recompute the profile from all current stars. There is no irreversible online-learning state. Removing a star, clearing preferences, hiding an asset, or deleting a source photo produces the same result as if its feedback had never existed.

## Platform implementation

### iPhone app

Use PhotoKit only after the user has authorised the selected scope. Store the `PHAsset` local identifier and derived local metadata, not a copied original. Request appropriately sized image derivatives on demand and cache only encrypted/OS-managed thumbnails where the platform rules permit.

The app must gracefully handle an asset that is later deleted, edited, moved to iCloud, or no longer authorised. Show a quiet unavailable state and remove it from rank candidates without treating the disappearance as feedback.

### Web/demo app

Keep fixture images and local browser storage for the present demo. Implement the same pure ranking function and fixtures so it can be unit-tested independently of PhotoKit. The web surface must state that it uses demo content and does not claim access to an iPhone library.

## Delivery phases

| Phase | Deliverable | Exit criteria |
| --- | --- | --- |
| 1. Reel prototype | Full-bleed, accessible fixture reel with date/place/caption overlay and star toggle | Keyboard, screen-reader, reduced-motion, empty/loading/unavailable states work. |
| 2. Local data boundary | Separate records for source photo, display proposal, star, preferences, and impressions | Delete/hide/export/reset cascades pass tests; no source image upload occurs. |
| 3. Rules ranker | Versioned, pure deterministic ranking module and explainability output | Same inputs always create the same ordering and reason labels. |
| 4. Preference feedback | Star, unstar, reset, and saved-photos controls | Every change recomputes correctly, and a single star cannot dominate the feed. |
| 5. iPhone photo source | Explicit PhotoKit/photo-picker integration and asset availability handling | Permission, limited-library mode, iCloud/unavailable, and deletion behaviors are tested. |
| 6. Enrichment and caption rules | User-editable coarse labels, approved tags, and template captions | No caption invents facts; all metadata can be corrected or removed. |
| 7. Product hardening | Performance, privacy review, and instrument-free usability testing | The reel remains usable with all remote services disabled. |

## Acceptance criteria

- A user can scroll a visually calm photo reel with a readable caption, place, and time.
- A star is the only preference action. There is no downvote, dislike, swipe-as-negative, or engagement metric.
- After several stars, the next results visibly favour matching non-sensitive characteristics while still varying people, events, and dates.
- The `Why this photo?` explanation maps directly to score contributors and contains no AI-style inference.
- Unstarring, hiding, deleting, and resetting remove their ranking effects immediately.
- No original asset or private metadata leaves the device for this feature.
- No automatic durable memory, outreach, notification, event booking, or calendar action results from reel use.
- The app works with no photos, a small library, denied permission, missing location/time, and removed photo assets.

## Explicit non-goals

- No upvote/downvote or dislike mechanic.
- No generative AI, machine-learning training, remote recommendation service, or opaque embedding ranker.
- No face recognition or inferred friend identity in the first implementation.
- No full-library background scan in the first implementation.
- No exact home/work location display.
- No social feed, sharing count, streak, engagement target, or social comparison.

