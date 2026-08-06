# Human Made Money — Database Model

## Purpose and boundaries

This conceptual model supports the agreement lifecycle defined in the Product Bible. It is directional documentation, not a claim that every table or capability exists. The Agreement is the aggregate root; protection, verification, intent, and settlement are separate supporting domains.

## Data principles

- Use stable opaque identifiers, UTC timestamps, explicit schema versions, and precise currency minor units.
- Enforce authorization server-side and minimize stored personal data.
- Model lifecycle transitions as validated operations; do not permit arbitrary status writes.
- Keep audit records append-oriented and attributable. Claim immutability only when storage guarantees it.
- Separate participant claims, external facts, and AI inferences.

## Core entities

### User and identity

`users` stores account state and minimal profile references. Identity claims, verification provider references, authentication methods, and risk flags belong in separately protected records with retention controls.

### Agreement

`agreements` stores owner/organization, current version, lifecycle state, funding mode, verification policy, privacy context, and timestamps. A “challenge” is an optional template or category, not a separate primary object.

`agreement_versions` stores immutable accepted content: purpose, summary, terms, timing, evidence policy, protection policy, and resolution policy.

`agreement_participants` links users or invitees to roles, permissions, invitation state, and acceptance state. `acceptances` records participant, agreement version, timestamp, and consent context.

### Obligations and milestones

`obligations` and `milestones` describe responsible parties, due dates, conditions, and completion state. Amendments create versioned terms rather than mutating already accepted meaning.

### Evidence

`evidence_items` stores submitter, source type/reference, retrieval or submission time, integrity metadata, visibility, and retention classification. Store large or sensitive payloads outside the relational row and reference them through controlled storage.

### Verification

`verification_runs` records agreement version, evaluated conditions, model/rules configuration, status, and timestamps. `assessments` stores sourced findings, gaps, confidence, recommended action, and explanation. Do not name this record an `ai_decision`; an assessment is advisory until the authorized policy or person approves a transition.

`human_reviews` records reviewer, reason, evidence considered, outcome, and appeal context.

### Protection, intent, and settlement

`protection_accounts` or provider references exist only for funded agreements. `funding_intents` records conditional intent, authorization scope, expiry, and status; it never represents guaranteed funds.

`transactions` records requested and provider-observed money events using minor units, currency, idempotency key, provider reference, status, and reconciliation state. `settlement_instructions` records an instruction created only after the accepted policy, configurable review window, dispute state, required authorization, and Financial Safety gate are satisfied; `settlement_attempts` records deterministic execution and provider results. AI output may support a proposed resolution but never creates release authority or executes either record directly.

`financial_safety_reviews` (or equivalent protected records) represents `clear`, `review_required`, `held`, and `restricted` gates and future identity/KYC, sanctions, transaction-monitoring, funding-source, amount/velocity, risk, hold, and reviewer context. Holds override settlement timers. Settlement destinations are fixed before outcomes and changes are separately authorized and audited. Solo agreements are non-financial in the MVP; contingent financial agreements require two valid economic sides.

### Disputes and activity

`disputes` records opener, reason, lifecycle, assigned reviewer, outcome, and appeal route. `activity_events` provides the attributable chronological record. Sensitive payloads are redacted or referenced, not copied into general logs.

### Organizations and subscriptions

Organizations, memberships, roles, templates, and subscription/billing records remain separate from agreement state. Organization policy cannot erase agreement-level consent requirements.

## Relationships

An Agreement has many Versions, Participants, Obligations, Milestones, Evidence Items, Verification Runs, Reviews, Activity Events, and possibly Disputes. It may have zero or one active protection context and multiple transaction or settlement attempts. All consequential records reference the exact accepted agreement version.

## Security, migration, and retention

Use row-level or equivalent authorization as defense in depth, encryption where appropriate, verified provider callbacks, replay protection, idempotency, and reconciliation. Schema changes need forward/backward compatibility, migration validation, and rollback or roll-forward plans. Define deletion and legal-retention behavior per data class; AI training or memory reuse is opt-in and purpose-limited.
