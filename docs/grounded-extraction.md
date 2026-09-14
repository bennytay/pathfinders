# Grounded memory extraction, Phase 4 start

The only active extractor is `fixture-extractor-v1`, a deterministic offline adapter for synthetic fixtures. It is intended to exercise the proposal/review boundary, not to claim general-language understanding.

Every proposal must validate against a strict schema: a locally resolved friend ID, fact type, value, optional temporal qualifier, exact source note/span, confidence, suggested intent, and adapter name. The adapter cannot write a memory. It returns a proposal only when local identity resolution has exactly one match.

Ambiguous names return no proposal and require a future clarification UI. Notes containing instruction-like text are treated as note content, never as commands. Sensitive or unsupported claims are not extracted by the fixture adapter.

The Review screen provides an explicit local extraction action, shows the exact source span and adapter metadata, and keeps proposals separate from confirmed memories. Approval creates a source-linked memory; rejection and deletion leave no durable context. Confirmed memories can be edited, merged only with another memory for the same friend, or forgotten. The `ExtractionAdapter` interface is swappable, but no networked model adapter is enabled until its data-disclosure contract is approved.
