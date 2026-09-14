# ADR 0002: AI proposals never become memory automatically

- **Status:** Accepted
- **Date:** 2026-09-14

## Decision

Extraction output is a source-linked `FactProposal`. Only an explicit user approval can create a durable `MemoryFact`; unreviewed proposals cannot influence prompt eligibility.

## Alternatives considered

1. **Automatic low-confidence memory.** Low-friction, but errors are difficult to notice and can make later prompts feel invasive.
2. **Auto-approval by category.** Could be useful later, but still requires a carefully understood policy and does not belong in the first privacy boundary.
3. **Review by default.** Adds an approval step, but preserves user control and provenance.

## Consequences

The data model needs distinct proposal and memory records, source references, edit history, forget/delete flows, and extraction tests for invented or adversarial content.
