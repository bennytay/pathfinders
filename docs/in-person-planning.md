# In-person planning, Phase 5

The planning engine is a local, deterministic aid to an in-person plan. It never assigns a relationship score, sends outreach, writes a calendar, or infers that anyone met.

## Prompt eligibility

A gentle reminder is eligible only when all of these are true:

1. The user has enabled reminders for that friend.
2. The user has logged an in-person interaction.
3. The elapsed gap is greater than the cadence the user chose for that friend.
4. There is no draft or explicitly recorded planned outcome still open.
5. The user has not snoozed or dismissed the reminder.

The visible reason card names the chosen cadence, the elapsed in-person gap, and any matching confirmed interests or intentions. Proposed facts and preferences do not affect activity matching. A user can snooze, dismiss, or turn reminders off per friend.

## Activities and plan drafts

Manual ideas are the primary offline path. They may be saved with an optional place and time, but are shown as relevant only when their title, detail, or tags overlap a confirmed shared interest or explicit intention.

Drafts are editable local records. The user can copy a draft into a channel of their choice, but InnerCircle never sends it. A user can explicitly record `planned`, `met`, or `not now`; the app never derives an outcome from a draft, activity click, or elapsed time.

## Optional public-events adapter

`JsonFeedPublicEventsAdapter` is a deliberately thin public-events adapter. A deployment can set `NEXT_PUBLIC_EVENTS_FEED_URL` to a public JSON feed that accepts `city`, `q`, `from`, and `to` query parameters and returns an array of:

```json
[{ "title": "Pottery night", "description": "Optional", "location": "Optional", "startsAt": "2026-10-01T18:00:00+10:00", "url": "https://public.example/event", "tags": ["pottery"] }]
```

The public URL is intentionally build-time public configuration, never a secret. Searches happen only after the user presses the search button. Every result retains location, time, source URL, and retrieval time. Results older than 48 hours are labelled as potentially stale. A missing configuration, non-OK response, malformed feed, and an empty result all leave the manual offline flow available.
