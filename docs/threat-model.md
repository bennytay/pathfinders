# Initial threat model

This is a living baseline for a product that can contain sensitive interpersonal context. It must be updated before a feature changes storage, processing, sharing, or network behavior.

| Threat | Risk | Initial mitigation | Residual risk / follow-up |
| --- | --- | --- | --- |
| Device loss or shared device | Someone reads notes or memories locally. | Default local-first storage; no real data in fixtures; document device lock expectations. | Define encryption-at-rest and app-lock requirements before real data storage. |
| Accidental remote disclosure | A note is sent to an undisclosed processor. | No remote adapter in Phase 1; future remote path requires per-note consent, destination, and audit event. | Verify network behavior with automated tests before shipping. |
| Model invention or prompt injection | Incorrect or malicious text becomes relationship context. | Proposals are separate from memory; review/source provenance is mandatory. | Add schema validation and adversarial tests in Phase 4. |
| Event-provider tracking | Queries reveal interests, location, or plans. | No provider enabled now; manual ideas remain a core path. | Minimize query data, disclose provider, and support no-network operation. |
| Over-broad internal access | A contributor, log, or analytics sink sees content. | No account/backend/logging pipeline in Phase 1; synthetic fixtures only. | Define least privilege, retention, and redaction before services are added. |
| Unwanted social action | A draft is mistaken for a sent message or calendar commitment. | Product contract defines drafts as user-controlled only. | Test clear language and UI state in planning work. |

Report vulnerabilities privately under [SECURITY.md](../SECURITY.md). Do not include personal notes, recordings, or secrets in public issues.
