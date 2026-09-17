# ADR 0005: Extraction returns validated proposals, never memories

- **Status:** Accepted
- **Date:** 2026-09-14

## Decision

All extractors must return a strict, source-span-validated `FactProposal` and resolve friend references locally first. A proposal is persisted separately from confirmed memory and may only become a memory through explicit review.

## Alternatives considered

1. **Let a model update memory directly.** Lower interaction cost, but creates untraceable mistakes and makes prompt behavior feel opaque.
2. **Use raw model prose for review.** Flexible, but not sufficiently constrained for provenance, validation, or interchangeable adapters.
3. **Use a strict proposal schema.** Requires validation and a review surface, but provides source attribution, meaningful tests, and model-adapter portability.

## Consequences

An extractor must be conservative. Ambiguity, malformed output, sensitive categories, and source-span mismatches resolve to no proposal, not a best guess.
