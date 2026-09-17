# ADR 0004: Use a versioned browser-local repository for the domain core

- **Status:** Accepted
- **Date:** 2026-09-14

## Decision

Phase 2 persists one workspace as a versioned JSON record in browser local storage. The repository owns migrations, fixture seed/reset, export, capacity checks, and relationship deletion cascades.

## Alternatives considered

1. **Remote database first.** Supports multi-device state, but introduces accounts, network dependency, service cost, and a larger privacy/security surface before the core data lifecycle is proven.
2. **IndexedDB immediately.** Is more suitable for larger audio records, but adds implementation complexity before audio capture exists.
3. **Versioned local storage.** Keeps the text-first MVP inspectable and offline with a simple migration boundary. It is intentionally temporary for richer future media storage.

## Consequences

Users need browser data-management controls, which Phase 2 provides through export, reset, and deletion. Before recording audio or offering sync, the storage adapter must be reconsidered and the privacy model updated.
