# Human Made Money — API Architecture

## Purpose

This blueprint describes versioned interfaces around the Agreement domain. REST is appropriate for request/response workflows; events support asynchronous processing and integration. Neither transport bypasses domain authorization or lifecycle rules.

## Architecture principles

- The Agreement service owns agreement versions, acceptance, and lifecycle transitions.
- Evidence, verification, protection, intent, settlement, identity, and notifications have explicit boundaries.
- Every mutation validates actor, role, accepted version, current state, and idempotency where retries are possible.
- APIs return structured, non-sensitive errors and use pagination and bounded queries.
- Current endpoints must be distinguished from proposed interfaces.

## Representative APIs

All examples are conceptual and versioned under `/api/v1`.

### Identity

- `POST /auth/signup`
- `POST /auth/login`
- `GET /users/me`

Use secure sessions, rate limits, verified ownership, and step-up authentication for sensitive actions.

### Agreements

- `POST /agreements` creates a draft.
- `GET /agreements/{id}` returns the caller-authorized view.
- `POST /agreements/{id}/versions` proposes an amendment.
- `POST /agreements/{id}/acceptances` accepts an exact version.
- `POST /agreements/{id}/transitions` requests an allowed lifecycle transition.

A challenge may be represented by an agreement template or category; do not create a parallel core lifecycle around `/challenges`.

### Obligations and evidence

- `GET /agreements/{id}/obligations`
- `POST /agreements/{id}/evidence`
- `GET /agreements/{id}/evidence`

Uploads use type/size limits, malware controls, short-lived access, integrity metadata, and least-privilege visibility.

### Verification and review

- `POST /agreements/{id}/verification-runs`
- `GET /verification-runs/{id}`
- `POST /verification-runs/{id}/review-requests`
- `POST /reviews/{id}/outcomes`

Verification returns sources, matched conditions, gaps, confidence, explanation, and recommendation. It does not return an autonomous settlement decision.

### Funding intent and protection

- `POST /agreements/{id}/funding-intents`
- `GET /funding-intents/{id}`
- `POST /agreements/{id}/protection-requests`
- `GET /agreements/{id}/protection`

Intent responses explicitly distinguish conditional intent from reserved funds. Protection endpoints disclose amount, currency, fees, custody status, authorization requirements, expiry, and failure handling.

### Resolution and settlement

- `POST /agreements/{id}/resolution-requests`
- `POST /agreements/{id}/settlement-instructions`
- `GET /settlement-attempts/{id}`

An accepted deterministic policy may create a settlement instruction only after a configurable review window, with no dispute and a `clear` Financial Safety gate. Execution is performed by a bounded settlement service after revalidating the exact version, policy authorization, current state, destination integrity, compliance state, and idempotency; AI cannot call the payment provider, hold release authority, or release funds directly. A dispute freezes execution for explicit human review and authorization, and a compliance hold overrides the timer.

## Events

Representative events include `AgreementCreated`, `AgreementVersionAccepted`, `EvidenceSubmitted`, `AssessmentCompleted`, `ReviewRequested`, `ResolutionApproved`, `SettlementInstructionCreated`, `SettlementAttempted`, and `AgreementClosed`.

Events include stable identifiers, schema version, occurred-at time, correlation/causation identifiers, and minimal non-sensitive payloads. Consumers handle duplication, ordering limits, retries, and dead-letter recovery. The transactional outbox pattern is preferred where database state and publication must remain consistent.

## MCP and external tools

MCP servers may expose narrowly scoped, read-oriented tools for authorized finance, sports, public-data, or internal sources. Tool calls use allowlists, validated parameters, timeouts, rate limits, result-size limits, provenance, and audit records. Retrieved content is untrusted and cannot expand permissions. Write-capable tools require a separate reviewed authorization model and are not implied by this blueprint.

## Security and operations

Require deny-by-default authorization, CSRF/session protection as applicable, request limits, safe logs, webhook signature verification, replay defense, idempotency keys, provider reconciliation, and secret management outside source. Instrument transition failures, provider latency, webhook processing, assessment quality, and settlement discrepancies without logging sensitive payloads.

## Versioning

Use stable versioned contracts and additive evolution where possible. Breaking changes require a migration window, consumer inventory, deprecation plan, and rollback or roll-forward strategy.
