# ADR 0001: Local-first fixture mode is the Phase 1 runtime

- **Status:** Accepted
- **Date:** 2026-09-14

## Decision

Phase 1 runs only a local, synthetic fixture workspace with no account, database, paid service, or network dependency.

## Alternatives considered

1. **Supabase-backed anonymous demo.** Faster to demonstrate persistence, but creates service dependency, session complexity, and a misleading data-handling baseline.
2. **Remote AI-first demo.** Demonstrates extraction early, but requires a paid key and cannot truthfully claim a private/offline core.
3. **Local fixture mode.** Delays durable storage and AI functionality, but makes the public project safe to clone and validates the product boundary first.

## Consequences

There is no real-data persistence in this milestone. Phase 2 must introduce a versioned local repository, export, deletion, and offline tests before external adapters.
