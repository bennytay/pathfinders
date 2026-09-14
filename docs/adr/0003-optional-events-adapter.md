# ADR 0003: Manual ideas precede one opt-in events adapter

- **Status:** Accepted
- **Date:** 2026-09-14

## Decision

Planning must work with a user-entered activity idea. A public-events provider may be added only as an optional, documented adapter and must disclose source and freshness.

## Alternatives considered

1. **Require an events API.** Offers richer suggestions, but adds network dependency, tracking exposure, cost, and no-result failure modes.
2. **Scrape venues or social networks.** Broadens coverage, but conflicts with privacy and responsible data collection.
3. **Manual ideas plus an opt-in provider.** Keeps the core loop offline while allowing a narrow enhancement later.

## Consequences

The event interface must be swappable, surface errors/no results, and never be necessary to create a plan draft.
