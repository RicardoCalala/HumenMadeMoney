# Sprint 5.7 Technical Design Summary — Simulated Resolution and Settlement Orchestration

## 1. Purpose and scope

Sprint 5.7 designs the first durable resolution-orchestration slice after the implemented agreement, authentication, PostgreSQL, evidence, assessment, and human-review workflows. It records a proposed outcome, gives authorized participants the configured opportunity to review or dispute it, applies Financial Safety and authorization gates, and records a simulated execution. It does not hold, move, reserve, release, refund, charge, or settle real value.

The Agreement remains the product center. A resolution is a consequence of an exact accepted agreement version and its evidence/review record, not a free-standing payment command. AI and local/test assessment adapters may recommend an outcome, but they cannot decide a dispute, grant authorization, change Financial Safety, create executable authority, or execute settlement.

### Goals

- Pin every proposed resolution to the exact `agreementId`, accepted `versionId`, agreement content digest, `evidenceSetId`, and `assessmentId`; pin a reviewer decision when policy or assessment conditions require it.
- Persist a review/dispute window whose duration comes from the accepted `ResolutionPolicy`; the product default remains 24 hours, but the orchestration schema does not hard-code that duration.
- Make disputes and Financial Safety states durable execution blockers, with safety state taking precedence over elapsed timers.
- Separate proposal, human-review decision, authorization grant, execution eligibility, simulated execution, and ledger recording.
- Make every consequential transition deterministic, authorization-checked, idempotent, concurrency-safe, attributable, restart-durable, and testable against PostgreSQL.
- Preserve a narrow future seam for a separately reviewed regulated settlement provider without claiming that one exists.

### In scope

- Proposed-resolution lifecycle and immutable proposal snapshots.
- Review-window calculation and on-request time evaluation.
- Participant disputes, execution freeze, and links to the existing human-review workflow.
- Financial Safety state and append-oriented transition history using only locally recorded simulated states.
- Consequence-specific authorization grants and revocations.
- Deterministic readiness evaluation and simulated execution.
- Simulated settlement intent, execution event, and balanced ledger records.
- API/application contracts, persistence design, UI integration points, audit/event hooks, and tests.

### Explicitly out of scope

- Real funds or value, custody, escrow operations, banking/payment rails, charges, transfers, release/refund, provider webhooks, or reconciliation with a financial institution.
- KYC/AML, sanctions, transaction-monitoring, source-of-funds, identity-verification, or other compliance providers and production compliance operations.
- Production AI or MCP authority, external evidence or payment connectors, external notifications, background workers, schedulers, or queues.
- Automated appeals/adjudication, multi-level operations tooling, destination onboarding/change, foreign exchange, fees, tax, or accounting exports.
- New dependencies, generic workflow engines, event buses, provider SDKs, or speculative abstraction layers.

## 2. Existing baseline and compatibility rules

The implementation must extend, not replace, these established boundaries:

- Canonical `AgreementLanguageDocument` version `1.0` carries economic sides, accepted-version state, evidence/verification policy, protection mode, authorization requirements, resolution outcomes, configurable `reviewWindowSeconds`, and Financial Safety policy. `DEFAULT_REVIEW_WINDOW_SECONDS` is a product-authoring default, not a persistence default.
- `guardSettlementExecution` is the current pure-policy precedent. Sprint 5.7 should refine it into named, testable guard reasons while preserving: exact accepted version, satisfied outcome, no active dispute, Financial Safety `clear`, elapsed review window, and action/version/consequence-specific authority.
- Agreements and immutable versions are persisted through Prisma/PostgreSQL. Agreement documents and digests are durable; material changes create a new version and require renewed acceptance.
- Membership and ownership are server-enforced. Unauthorized access is concealed with the existing non-sensitive not-found behavior where appropriate; the UI is never an authorization boundary.
- Evidence revisions are append-oriented. `EvidenceSet` is a canonical ordered snapshot, and `Assessment` is pinned to it and the accepted version. Human-review requests and immutable reviewer decisions are already separate from assessment output.
- Existing mutation conventions use request context, CSRF protection for cookie-authenticated writes, idempotency keys and fingerprints, optimistic revision/CAS checks, correlation IDs, and transactional audit/provenance writes.
- No current protection mode represents real custody. All Sprint 5.7 money-like records must be unambiguously `simulated` in data, API, UI, tests, and audit descriptions.

No Sprint 5.7 state may silently mutate the accepted agreement document, evidence, assessment, or reviewer decision. A newer agreement version, evidence correction, assessment, or decision does not rewrite an existing proposal; it can instead make that proposal stale/cancellable and require a new proposal.

## 3. Domain records and invariants

### 3.1 Proposed resolution

`ProposedResolution` is the mutable lifecycle head for one immutable proposed consequence:

- `id`, `agreementId`, `versionId`, `agreementDocumentDigest`;
- `resolutionOutcomeId` and a normalized `consequenceRef` derived from agreement/version/outcome and proposed simulated effect;
- `evidenceSetId`, `assessmentId`, optional `reviewerDecisionId`;
- `proposalSource`: `deterministic_assessment` or `human_reviewer` (never an authority designation);
- `simulatedEffect`: non-financial completion or a simulated value instruction containing integer `amountMinor`, uppercase ISO currency, direction between two economic-side IDs, and fixed destination references already present in the accepted version;
- `reviewWindowSeconds`, `proposedAt`, `reviewWindowEndsAt`;
- `expiresAt` when the accepted outcome/policy supplies a bounded expiry; no invented default expiry;
- `state`, `revision`, `createdByAccountId`, `createdAt`, `updatedAt`.

Creation validates that all referenced records share the same agreement and version and that the assessment references the exact evidence set. `agreementDocumentDigest`, policy values, economic sides, destination references, amount/currency, and window endpoints are copied as an immutable proposal snapshot so later reads never reinterpret a consequence under changed policy. The proposal stores references, not evidence bodies or private assessment payloads.

Only one non-terminal proposal for the same `agreementId + versionId + resolutionOutcomeId` is allowed. A materially different consequence requires cancellation/expiry of the prior proposal and creation of a new one with a new review window and authorization scope.

### 3.2 Lifecycle and state machine

The persisted state union is:

```text
proposed
  -> review_window_open
       -> disputed -> held -> authorized -> execution_ready -> simulated_executed
       -> held ---------------------------> authorized -> execution_ready -> simulated_executed
       -> authorized -> execution_ready -> simulated_executed

Any non-terminal state -> cancelled
proposed | review_window_open | held | authorized -> expired
```

State meaning and transitions:

- `proposed`: the immutable snapshot has been recorded inside its creation transaction. It immediately transitions to `review_window_open`; retaining the state makes creation/audit sequencing explicit and supports recovery if orchestration is later split, but API creation should normally return `review_window_open`.
- `review_window_open`: participants may inspect and dispute. Elapsed time alone does not write a new state.
- `disputed`: an active dispute freezes readiness. Resolution requires the existing human-review path and an immutable reviewer decision with the required authority basis.
- `held`: Financial Safety is not `clear`, or policy requires additional human review. It is a safe no-execution state, not an accusation.
- `authorized`: the review window has elapsed, disputes are resolved, required human review is complete, and current consequence-specific authorization grants satisfy policy. Financial Safety may still prevent readiness.
- `execution_ready`: all guards were re-evaluated inside the execution transaction and are currently satisfied. This is short-lived; simulated execution normally moves to `simulated_executed` atomically in the same request.
- `simulated_executed`: terminal; one simulated intent, execution event, and balanced ledger transaction are recorded.
- `cancelled`: terminal; an authorized cancellation occurred before execution.
- `expired`: terminal; the accepted expiry boundary passed before execution.

Transitions are operations, never arbitrary state patches. A read may derive `effectiveState` and reason codes from durable facts and the supplied server time. Because Sprint 5.7 adds no worker, timers never independently mutate rows. An authorized `evaluate` or `execute-simulated` request performs transitions transactionally. Restarting the application cannot lose timers because `proposedAt`, `reviewWindowEndsAt`, policy snapshot, disputes, safety state, and grants are durable.

### 3.3 Separation of authority

Four records answer four different questions:

1. `Assessment`: what the deterministic/local test adapter found, with citations, uncertainty, and advisory recommendation.
2. `ReviewerDecision`: how an assigned authorized human resolved evidence or dispute questions.
3. `ResolutionAuthorizationGrant`: who explicitly authorized this exact version and `consequenceRef` under the accepted policy.
4. `SimulatedSettlementExecution`: whether the deterministic service revalidated every guard and recorded the simulated consequence.

No record implies another. A reviewer decision is not automatically a participant authorization unless the canonical authorization policy expressly makes that reviewer party eligible and the actor separately grants the required authorization. An authorization does not make an unsafe, disputed, premature, expired, or stale proposal executable. AI-originated data is excluded from actor/authority fields.

### 3.4 Review and dispute window

At proposal creation:

- read `document.resolutionPolicy.reviewWindowSeconds` from the exact accepted version;
- validate it against an application-owned safe range and integer precision;
- persist that value and `reviewWindowEndsAt = proposedAt + reviewWindowSeconds`;
- use the existing 86,400-second constant only when authoring/validating a document that omitted a product default before acceptance, never as a database column default.

The window uses UTC instants and an injected server clock. It is open while `evaluatedAt < reviewWindowEndsAt`; equality is eligible for the next guards. Pausing for a hold does not shorten the window or cause automatic execution when the hold clears. If the hold clears after the window, a fresh explicit evaluation is still required.

Any active accepted-version participant may submit one or more append-oriented dispute claims while the proposal is non-terminal and not executed. Submission atomically records `ResolutionDispute`, links or creates a `HumanReviewRequest`, transitions the proposal to `disputed`, increments its revision, and writes audit/outbox records. A dispute submitted concurrently with execution wins by database serialization/locking: execution must lock the proposal and check for active disputes in the same transaction before inserting its unique execution record.

Dispute reasons are bounded codes plus a length-limited participant explanation stored outside general audit summaries. Claims must not duplicate sensitive evidence. Resolution records the reviewer-decision reference and disposition; it never deletes the dispute. Appeals are bounded by the accepted `maxAppeals`, create a new review request, and refreeze execution.

### 3.5 Financial Safety precedence

`FinancialSafetyStatus` has `clear`, `review_required`, `held`, and `restricted`. It is agreement/version scoped for Sprint 5.7 and has an integer revision. An append-only `FinancialSafetyTransition` records from/to state, bounded reason codes, actor, authority basis, correlation, and time.

Precedence is:

```text
restricted > held > review_required > clear
```

Any non-`clear` state blocks `execution_ready` regardless of elapsed time, assessment confidence, reviewer decision, or participant approvals. `restricted` additionally prevents creation of a financial simulated proposal; reads remain available to authorized users. State changes require an active reviewer/owner role explicitly designated by server policy for this simulated environment; ordinary participants and AI cannot clear or downgrade safety. Production compliance roles and semantics are intentionally not designed here.

Safety transitions never auto-cancel a proposal and never reset its review window. Clearing a state requires a new CAS-protected operation and audit event; execution still re-reads the current state under lock. UI and errors use neutral copy and do not expose internal risk signals.

### 3.6 Authorization policy

Proposal creation requires an active agreement member mapped to an eligible canonical party and an explicit, unambiguous `record_resolution` authorization requirement in the exact accepted version. If that requirement is absent, duplicated inconsistently, references ineligible parties, or is otherwise ambiguous, creation must fail with a safe policy error. The service must never infer `record_resolution` authority from agreement ownership, membership or participation, reviewer assignment or status, AI confidence, proposal source, prior proposals, prior grants, or past behavior. The agreement must instead be materially amended to state the authority and every required party must renew acceptance of the amended version before a proposal can proceed. An assigned reviewer may initiate a proposal only when the accepted policy expressly makes that reviewer an eligible canonical party for `record_resolution`; completing a review route alone never supplies proposal authority. Creating a proposal is not authorization to execute it.

Execution requires the canonical `create_settlement_instruction` requirement from the exact accepted version:

- every grant matches `agreementId`, `versionId`, `consequenceRef`, and action;
- every grant belongs to a distinct eligible party and meets the minimum approval count;
- grant is not revoked or expired at evaluation time;
- `selfApprovalProhibited` is enforced against the proposal/review actor and affected economic side as defined by policy;
- `requiredVersionState` includes `accepted`;
- `humanReviewRequired` requires a completed existing review request and immutable reviewer decision pinned to the same version/evidence set/assessment/consequence.

Grants are append-oriented. Revocation creates a revocation record/time and immediately removes eligibility until simulated execution commits. CAS guards prevent lost updates. Step-up authentication is a future production requirement; Sprint 5.7 records current session assurance and rejects insufficient assurance if the existing development policy defines a threshold, without claiming identity proofing.

### 3.7 Economic-side and simulated-value invariants

- A canonical document with fewer than two distinct valid economic sides may have only a non-financial resolution. A solo agreement can never create a simulated value intent.
- A simulated value intent has exactly one source economic side and one distinct destination economic side, both present in the accepted version. Each side must contain at least one accepted party.
- The same party set cannot constitute both sides; circular/self-dealing routes are rejected. HMM/platform/system accounts can never be an economic side or counterparty.
- Destination references must be fixed in the accepted version before the assessed outcome. Sprint 5.7 cannot add or change a destination.
- Amount is a positive safe integer in minor units, currency is explicit and identical across proposal, intent, events, and ledger entries, and no fees/FX are inferred.
- `ProtectionPolicy.mode = "none"` permits only non-financial outcomes. `conditional_intent` and `protection` may produce simulated records only when their exact canonical terms authorize the outcome; neither implies funds are present or guaranteed.
- Every API/resource includes `simulation: true`; database records use a non-null `executionMode = simulated` enum/check. No provider reference, account number, payment token, or custody balance exists.

## 4. Deterministic execution guards

One pure `evaluateResolutionReadiness(snapshot, evaluatedAt)` function returns all blocking reason codes in stable precedence order and no side effects. The execution service repeats the function inside a serializable transaction or while holding a row lock on the proposal and all mutable guard heads.

Required guards:

1. proposal exists, is non-terminal, not expired/cancelled/executed, and expected revision matches;
2. exact version remains accepted, its persisted digest matches the proposal snapshot, and all required parties accepted that version;
3. outcome exists in that version and consequence matches its prerequisites and simulated effect;
4. evidence set, assessment, and any required reviewer decision still exist and match one another and the proposal snapshot;
5. assessment is completed, not superseded/failed, and supports the outcome; indeterminate, not-satisfied, missing/conflicting evidence, or required review blocks execution;
6. review window has ended;
7. no open, under-review, or appealed dispute exists;
8. Financial Safety is currently `clear`;
9. authorization grants currently satisfy the accepted action policy;
10. economic-side, destination, amount, currency, protection-mode, and simulation invariants hold;
11. no prior execution exists for the proposal or consequence, and the idempotency request is new or an exact replay.

Typical stable error codes include `REVIEW_WINDOW_ACTIVE`, `ACTIVE_DISPUTE`, `HUMAN_REVIEW_REQUIRED`, `FINANCIAL_SAFETY_REVIEW_REQUIRED`, `FINANCIAL_SAFETY_HELD`, `FINANCIAL_SAFETY_RESTRICTED`, `AUTHORIZATION_MISSING`, `AUTHORIZATION_REVOKED`, `VERSION_NOT_ACCEPTED`, `SNAPSHOT_MISMATCH`, `ASSESSMENT_NOT_ELIGIBLE`, `PROPOSAL_EXPIRED`, `PROPOSAL_STALE`, `SOLO_FINANCIAL_PROHIBITED`, `ECONOMIC_SIDES_INVALID`, `SIMULATED_DESTINATION_INVALID`, and `ALREADY_EXECUTED`.

The API may return all user-actionable blockers on a read. A mutation returns a structured primary code, safe message, correlation ID, and current revision; it never reveals hidden membership, internal risk reasons, private evidence, reviewer notes, or destination data.

## 5. Simulated settlement records and ledger

`SimulatedSettlementIntent` is created only inside successful execution. It references the proposal and exact consequence, repeats amount/currency/economic-side references, has `executionMode = simulated`, and has no provider fields.

`SimulatedSettlementEvent` is append-only and records `intent_created` and `simulated_executed` (or a pre-commit `simulation_failed` only if a durable attempt model is intentionally needed). Events carry IDs, timestamps, actor/service identity, correlation/causation IDs, and safe reason codes—not financial credentials or evidence text.

`SimulatedLedgerTransaction` groups balanced entries. For a simulated value outcome it creates exactly two entries in the same currency and amount:

- debit the source economic-side simulation account;
- credit the destination economic-side simulation account.

Signed minor-unit totals per transaction/currency must equal zero. Accounts are labels for scenario history, not assets, wallets, custody balances, claims, or provider accounts. A non-financial outcome records an execution event but no monetary ledger entries. Ledger rows are append-only; corrections use an explicit linked reversal transaction plus a newly authorized proposal, never update/delete. Sprint 5.7 does not expose reversal/refund execution unless the accepted policy models it as a distinct outcome and the same full guards run again.

Proposal transition to `simulated_executed`, unique intent, execution event, ledger transaction/entries, audit record, and domain-event hook commit atomically. A unique `proposalId` on execution and intent plus a unique consequence execution key prevents duplicate simulated settlement.

## 6. Idempotency, concurrency, retry, and durability

- All writes require an `Idempotency-Key`. Reuse with the same normalized actor/operation/scope and fingerprint returns the original resource/status; reuse with a different fingerprint returns `IDEMPOTENCY_KEY_REUSED`.
- All mutable heads use integer `revision`; commands require `expectedRevision`. A mismatch returns a 409 with no partial write.
- Creation uses unique active-proposal constraints. Authorization uses uniqueness by proposal/action/party/consequence. Disputes, safety changes, and cancellation lock or CAS-update the proposal.
- Simulated execution uses the strongest practical PostgreSQL boundary: serializable transaction with bounded retry for serialization failure, or explicit `SELECT ... FOR UPDATE` through a narrow repository method. Revalidate every guard after locks are acquired.
- Database uniqueness, not process memory, is the final duplicate-execution defense. Never retry business rejections. Infrastructure/serialization retry is bounded and reuses the same idempotency record.
- If the process stops before commit, nothing becomes executed. After commit, replay returns the committed representation. No worker or in-memory timer is required for recovery.

Cancellation before execution follows the exact accepted `CancellationPolicy`: pre-acceptance rules are irrelevant because proposals require an accepted version; post-acceptance requires the configured party consent or authorized review. Cancellation revokes readiness but retains proposals, grants, disputes, and audit history.

Sprint 5.7 must not invent a separate proposal-expiry duration or default for MVP. A proposal remains governed only by the exact accepted agreement's deadlines and outcome rules, the snapshotted review window, authorized cancellation, dispute state, and current Financial Safety status. When an accepted deadline or outcome rule supplies a bounded expiry, it is snapshotted as `expiresAt`, prevents new authorization/execution after that boundary, and may be persisted as `expired` on the next command/read-side maintenance operation. When the accepted version supplies no such boundary, `expiresAt` remains null; neither application code nor the database may synthesize one. Expiry never substitutes for cancellation and never fabricates a financial reversal. A failed guard evaluation is safe to retry after the blocking condition changes; a successfully simulated execution is terminal and exact replays return the original result.

## 7. PostgreSQL and Prisma design

Add only domain-specific models/enums required by the slice:

- `ResolutionState`, `ResolutionProposalSource`, `ExecutionMode` enums.
- `ProposedResolution` with composite foreign keys to `AgreementVersion`, `EvidenceSet`, and `Assessment`; optional reviewer-decision relation; snapshot columns/JSON for the bounded consequence; lifecycle/revision/times.
- `ResolutionDispute` with proposal/version/opener, status, bounded reason codes, private explanation, review-request/decision links, appeal ordinal, revision, and times.
- `ResolutionAuthorizationGrant` with proposal/version/party/account/action/consequence, session assurance, grant/expiry/revocation times, and revision.
- `FinancialSafetyStatus` head and `FinancialSafetyTransition` history.
- `SimulatedSettlementIntent`, `SimulatedSettlementExecution`, `SimulatedSettlementEvent`, `SimulatedLedgerTransaction`, and `SimulatedLedgerEntry`.
- `ResolutionAuditEvent` and `ResolutionDomainEvent` outbox-like hook records, or extend the existing general `AuditRecord` only if its current shape cleanly supports these references. Do not overload evidence provenance events.

Important constraints/indexes:

- composite relations preserve agreement/version identity across every snapshot reference;
- unique execution and intent per proposal; unique ledger transaction per execution;
- unique grant per proposal/action/party/consequence, with revocation represented on the row or append record;
- unique dispute appeal ordinal per proposal/root dispute;
- unique active proposal enforced with a partial unique SQL index if Prisma cannot express it;
- checks for non-negative review duration, ordered timestamps, positive minor units, distinct economic sides, and simulated-only execution mode where PostgreSQL migration SQL is clearer than Prisma;
- indexes for agreement/version/state lists, proposal deadline/expiry reads, active disputes, safety head, authorization lookup, and chronological audit/event pagination.

Use `DateTime @db.Timestamptz(3)`, integer minor units, opaque string IDs, restrictive deletes, and append-oriented history. Prisma JSON is acceptable only for bounded canonical snapshots/reason arrays that are validated before persistence; query-critical IDs, state, amount, currency, and timestamps remain columns.

### Additive migration strategy

1. Add enums/tables, foreign keys, checks, and indexes in a new forward-only migration; do not alter or backfill existing agreement/evidence behavior.
2. Existing rows need no proposal or safety row. Create Financial Safety status lazily/transactionally at first proposal using the accepted policy's initial state, or via an explicit deterministic seed step in tests. Absence never means `clear` during execution.
3. Deploy code that tolerates no resolution records and exposes the feature only for supported accepted versions. There is no destructive rollback; roll forward by disabling creation while retaining readable records.
4. Validate Prisma schema/generation, migration deploy/status on disposable PostgreSQL, migration safety from the current Sprint 5.6 schema, and real PostgreSQL contract tests.

No migration creates provider tables, credentials, real balances, or a default review duration.

## 8. Application and repository contracts

Add a focused `server/resolution` domain, application service, repository interface, Prisma implementation, in-memory contract double, transport validation, and composition module, mirroring the existing evidence boundary.

Representative application commands/queries:

```ts
proposeResolution(context, input, mutation): Promise<MutationResult<ResolutionView>>
getResolution(context, agreementId, proposalId): Promise<ResolutionView>
listResolutions(context, agreementId, cursor?): Promise<Page<ResolutionSummary>>
evaluateResolution(context, agreementId, proposalId, evaluatedAt?): Promise<ReadinessView>
submitDispute(context, input, mutation): Promise<MutationResult<DisputeView>>
resolveDispute(context, input, mutation): Promise<MutationResult<DisputeView>>
grantAuthorization(context, input, mutation): Promise<MutationResult<AuthorizationView>>
revokeAuthorization(context, input, mutation): Promise<MutationResult<AuthorizationView>>
transitionFinancialSafety(context, input, mutation): Promise<MutationResult<SafetyView>>
cancelResolution(context, input, mutation): Promise<MutationResult<ResolutionView>>
executeSimulated(context, input, mutation): Promise<MutationResult<SimulatedExecutionView>>
```

The service owns authorization, canonical snapshot validation, clocks, IDs, idempotency fingerprints, transaction boundaries, guard evaluation, and safe errors. The repository exposes named atomic operations rather than generic CRUD or a generic state-machine API. Time is injected in tests; clients cannot choose `proposedAt`, window end, execution time, actor, safety state, or audit metadata.

`evaluateResolution` is a read and may derive readiness without persisting. `executeSimulated` is the only operation that creates intent/event/ledger records. It must not accept an assessment result, authorization count, readiness boolean, or Financial Safety state from the client.

## 9. API contracts

Use authenticated `/api/v1` agreement-scoped routes and existing transport conventions:

- `POST /api/v1/agreements/{agreementId}/resolution-proposals`
- `GET /api/v1/agreements/{agreementId}/resolution-proposals`
- `GET /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}`
- `GET /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}/readiness`
- `POST /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}/disputes`
- `POST /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}/authorizations`
- `POST /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}/authorizations/{authorizationId}/revocation`
- `POST /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}/cancellation`
- `POST /api/v1/agreements/{agreementId}/resolution-proposals/{proposalId}/simulated-execution`
- reviewer-only dispute resolution and Financial Safety transition routes under the same proposal/version scope.

Mutation bodies contain exact snapshot IDs, intended outcome/effect, `expectedRevision`, and participant-provided bounded explanation where applicable. Headers carry CSRF and idempotency data. Responses include `simulation: true`, exact version/snapshot references, persisted/effective state, safe blockers, review-window timestamps, allowed actions derived server-side, and revision. Lists are bounded and cursor-paginated.

Use 400 validation, 401 authentication, concealed 404 authorization/resource scope, 409 CAS/idempotency/state conflicts, and 422 policy-ineligible requests where consistent with existing transport. Never return raw Prisma errors, policy documents, evidence metadata, hidden safety reasons, reviewer-private notes, account emails, or destination secrets.

## 10. Audit, provenance, and event hooks

Every command writes an attributable audit record in the same transaction: actor type/ID, agreement/version/proposal, action, from/to state, policy/digest references, safe reason codes, occurred/recorded time, correlation/causation IDs, idempotency record, and related object IDs. Audit explanations are bounded and non-sensitive; participant dispute text remains in the protected dispute record.

Persist domain-event hook records such as `ResolutionProposed`, `ReviewWindowOpened`, `DisputeSubmitted`, `ResolutionHeld`, `AuthorizationGranted`, `ResolutionExecutionReady`, `SimulatedSettlementExecuted`, `ResolutionCancelled`, and `ResolutionExpired`. These are transactional facts for future notifications/operations, not a promise of delivery. Sprint 5.7 adds no publisher, worker, queue, email, push, webhook, or connector. The UI reads current state after a mutation; later work can claim hooks with its own idempotency and authorization design.

## 11. UI integration points

Extend the existing Agreement Detail `Resolution` area:

- proposal summary with plain-language outcome, exact accepted version, assessment/evidence snapshot context, proposal source, and prominent “Simulation only—no funds move” copy;
- review window with absolute end time/timezone, remaining duration as presentation only, and explanation that elapsed time does not guarantee execution;
- role-aware dispute action while allowed, neutral dispute state, human-review status, and immutable decision reference;
- separate rows for assessment recommendation, reviewer decision, participant authorizations, Financial Safety, and deterministic execution readiness;
- blocker list explaining safe next actions without exposing sensitive risk signals;
- consequence-specific authorization confirmation that names amount/currency/economic sides (or non-financial result), version, reversibility, and simulation status;
- simulated execution receipt with event/ledger references and no language such as paid, transferred, released, deposited, held balance, or settled funds;
- cancellation/expiry/retry, loading, empty, stale/CAS conflict, permission, authentication/CSRF, idempotent replay, unavailable, and terminal states.

Do not use optimistic success for disputes, authorizations, safety changes, cancellation, or execution. Refresh after 409 and require the user to review the new state. Preserve semantic headings, keyboard access, visible focus, status announcements, 200% zoom, 375px no-overflow behavior, and non-color state cues. Timer updates must respect reduced motion and must not be the only indication of eligibility.

## 12. Privacy and security

- Deny by default and resolve every resource through agreement membership plus canonical party mapping. Never trust client role, party, version, assessment, consequence, readiness, or safety claims.
- Enforce CSRF/origin protections, bounded payloads, strict enums/IDs/timestamps, rate limits at the established boundary, and non-sensitive structured logs.
- Do not copy evidence bodies, assessment explanations, dispute narratives, reviewer notes, canonical documents, emails, source URLs, or destination values into audit, domain events, errors, analytics, or notification hooks.
- Treat assessment/reviewer content as untrusted display data. It cannot invoke tools, expand permissions, provide executable instructions, or alter policy.
- Protect against IDOR, confused deputy/self-review, duplicate execution, authorization replay, stale grants, race-to-dispute, forged snapshot IDs, integer overflow, currency mismatch, and unsafe destination changes.
- Store no secrets, provider credentials, bank/payment identifiers, or real customer financial data. Simulated labels must be synthetic/non-sensitive.
- Retention/deletion policy remains future work; restrictive relations preserve consequence provenance. Any later redaction must preserve the fact and digest/reference chain without exposing removed content.

## 13. Test strategy

### Domain and dangerous-invariant tests

- exhaustive allowed/forbidden lifecycle transition table;
- 24-hour authoring default versus arbitrary accepted `reviewWindowSeconds`, exact boundary time, invalid/overflow/negative windows, UTC/DST independence, and injected clock;
- dispute at the execution boundary always freezes execution; appeal refreezes; clearing a dispute alone does not authorize;
- each non-clear Financial Safety state overrides timers and approvals; clearing requires authorized CAS and explicit re-evaluation;
- AI assessment, reviewer decision, authorization, and execution remain non-substitutable;
- exact accepted version/content digest/evidence set/assessment/reviewer decision pinning; superseded or mismatched records block;
- solo financial prohibition, exactly two distinct sides, no circular/self-dealing/platform side, fixed destination, positive safe minor units, currency consistency;
- authorization minimum/distinct eligible parties, self-approval prohibition, expiry/revocation, exact consequence binding, and required human review;
- balanced simulated ledger per currency, no ledger for non-financial outcomes, one execution per proposal/consequence, append-only reversal semantics;
- cancellation and expiry authorization, terminal-state immutability, safe retry, and no execution after terminal state.

### Application, API, and authorization tests

- owner/participant/reviewer/observer matrix for every command; non-member and cross-agreement IDs are concealed;
- authentication, suspended account, CSRF/origin, malformed payload, overlong explanation, and non-sensitive error contracts;
- idempotent exact replay, changed fingerprint rejection, expected-revision conflicts, and current representation recovery;
- proposal creation validates every snapshot relation and policy outcome;
- no client-controlled clock, safety/readiness/actor, policy duration, or authority;
- UI/API always expose simulation status and never claim real movement.

### PostgreSQL, migration, and concurrency tests

- repository contract parity for in-memory and Prisma implementations using disposable PostgreSQL;
- migration from the current Sprint 5.6 schema, Prisma validate/generate, deploy/status, and forward-only safety;
- concurrent duplicate proposal, grant/revoke, dispute/execute, safety-clear/execute, cancel/execute, and two execution requests;
- forced serialization failure/bounded retry and process-restart replay after commit;
- foreign keys/checks/unique indexes reject cross-version snapshots, unbalanced ledger entries, duplicate execution, and invalid simulation data;
- transaction rollback proves no partial intent/event/ledger/audit/event-hook writes.

### Browser and repository validation for implementation

- full participant proposal/review/dispute/reviewer/authorization/simulated execution journeys;
- held/restricted, cancelled, expired, stale conflict, retry/replay, unavailable, and non-financial solo journeys;
- keyboard, screen-reader status announcements, semantic headings, reduced motion, 200% zoom, 375px layout, and clean console;
- web and root tests, lint, typecheck, production build, Prisma checks, migration/contracts, `git diff --check`, and documentation consistency review.

For this design-only change, run `git diff --check` and manually compare terminology, defaults, boundaries, routes, models, and invariants against Sprints 5.1–5.6, the foundational bibles/playbook, architecture/data/API documents, canonical agreement language, and implemented services/schema.

## 14. Future regulated-provider seam

A later, separately approved settlement domain may consume an immutable, fully guarded `SettlementExecutionCommand` containing only the exact proposal/consequence, amount/currency, authorized pre-registered destination references, idempotency key, and audit context. It would implement provider authentication, custody model, KYC/AML and sanctions controls, limits, webhooks, retries, reconciliation, failure/reversal semantics, secrets, operational review, incident response, and regulatory/legal approvals.

That future adapter must sit after the same independent deterministic guards and revalidate current safety/authorization immediately before provider submission. It cannot accept AI authority or infer destination changes. Sprint 5.7 does not define an interface that pretends simulated execution is provider-ready, does not name a provider, and does not make any claim that HMM can custody or move money.

## 15. Risks and mitigations

- **A timer appears to authorize execution.** Persist duration/endpoints but require independent dispute, safety, review, authorization, version, and snapshot guards on every execution.
- **Assessment is mistaken for a verdict.** Keep separate records, permissions, UI sections, and foreign-key chains; prohibit AI actor types in grants/execution authority.
- **Race causes execution after dispute/hold/revocation.** Lock and re-read mutable guard heads in one transaction; enforce unique execution in PostgreSQL.
- **Simulation is mistaken for custody or payment.** Require simulation markers throughout; exclude provider/account credentials and real-balance language; test copy/contracts.
- **Proposal drifts from accepted terms or evidence.** Snapshot exact IDs/digest/policy/effect; never reinterpret; require a new proposal after material change.
- **Generic orchestration grows ahead of requirements.** Use resolution-specific operations and records, existing service patterns, no workers/dependencies/event framework.
- **Safety states imply production compliance.** Limit them to local simulated gates with neutral reason codes; explicitly defer provider and operations semantics.
- **Ledger looks like financial accounting.** Label it a balanced simulation history, not custody, ownership, or a source of truth for real assets.

## 16. Founder/CTO decisions and remaining boundaries

The founder/CTO has approved the following binding MVP rules:

1. **Missing or ambiguous `record_resolution` authority is a hard rejection.** Never infer authority from ownership, participation, reviewer status, AI confidence, or prior behavior. Require a material agreement amendment that explicitly supplies the authority and renewed acceptance by every required party before proposal creation may proceed.
2. **There is no separate proposal-expiry default.** Proposals remain governed by the accepted agreement's deadlines and outcome rules, the configured review window, authorized cancellation, dispute state, and Financial Safety status. Persist `expiresAt` only when the accepted agreement supplies the applicable boundary; never synthesize one in application or schema defaults.

These decisions remove the only local/test implementation questions identified during design. No additional founder decision blocks Sprint 5.7 implementation as scoped. Real-money/provider selection, custody and compliance roles, step-up identity requirements, provider-specific expiry, reconciliation, production appeal operations, retention/redaction, and external event delivery remain production-only decisions for separately approved work; they must not be pulled into Sprint 5.7.

## 17. Future implementation acceptance criteria

- All resolution records pin and validate one exact accepted agreement/content/evidence/assessment snapshot, plus required reviewer decision.
- The accepted configurable review window is durable; 24 hours is not a schema default; elapsed time never bypasses another guard.
- Dispute, review, authorization, Financial Safety, readiness, and simulated execution are distinct and auditable.
- Dangerous invariants are enforced in domain policy, application transactions, and database constraints where possible.
- Execution is simulated-only, idempotent, concurrency-safe, restart-durable, and atomically records balanced scenario history.
- Solo/two-side, cancellation, expiry, retry, privacy, security, error, accessibility, and notification-hook behavior matches this design.
- Missing or ambiguous `record_resolution` authority is rejected until a material amendment is renewed and accepted; no owner, participant, reviewer, AI, or historical behavior can supply inferred authority.
- No application or database proposal-expiry default exists; only an accepted agreement deadline/outcome rule may populate `expiresAt`.
- No real-funds, custody, provider, external connector, worker, production AI/MCP authority, compliance-provider, or production-operations capability is added or implied.
- No new dependency or speculative framework is introduced.
