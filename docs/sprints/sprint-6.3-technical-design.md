# Sprint 6.3 Technical Design Summary — AI Assessment Product Integration

## 1. Purpose and decision

Sprint 6.3 integrates the existing advisory assessment capability into the agreement evidence experience as **Request AI Assessment**. The product flow remains agreement-first: an authenticated agreement member requests an assessment of a unanimously accepted, exact agreement version against an immutable evidence snapshot; the server selects and runs an approved advisory provider; Human Made Money validates and records the result; participants inspect evidence-backed findings and may request human review.

The conservative product decision is:

- the deterministic local provider is the default and requires no credential;
- OpenAI may be reachable from the browser flow **only in development**, only through the server, and only when all server-side provider/model flags are enabled, all kill switches are clear, the selected model is allowlisted, budgets are valid, and a non-production server credential is present;
- the browser never selects a provider, receives a credential, calls OpenAI directly, or calls MCP directly;
- test and production compositions fail closed to deterministic-only for this sprint; and
- every result is advisory. It cannot decide, authorize, resolve, release, refund, settle, or move funds.

This is a technical design only. It authorizes no runtime change, dependency installation, credential access, provider call, migration, commit, push, or deployment.

## 2. Existing baseline and compatibility

This design extends the boundaries established in Sprints 5.1–6.2.4:

- canonical agreement documents and immutable versions are authoritative;
- authentication is session-derived and authorization is active-membership-backed;
- PostgreSQL/Prisma is an existing optional durable adapter, while in-memory storage remains valid for focused development/tests;
- evidence revisions are immutable, exact-version-scoped, visibility-filtered, and frozen into digest-bound evidence sets;
- assessments, human-review requests, reviewer assignment, and immutable reviewer decisions already have service, API, UI, in-memory, and Prisma paths;
- MCP exposes a least-privilege deterministic assessment operation and no settlement tools;
- the model adapter has no tools, uses strict structured output, resolves HMM-issued claim references server-side, and fails closed;
- the one-time authorization workflow applies to the bounded smoke harness only and must not be reused as browser authorization; and
- the closed `recommendedNextAction` set is `request_evidence`, `wait`, `request_human_review`, `participant_review`, and `no_action`.

The current browser POST accepts a client `adapterKind` and executes synchronously. Sprint 6.3 must remove provider selection from the public request contract. Manual fixture findings remain test-only and must not be accepted from the product browser route.

## 3. Goals and non-goals

### Goals

- Offer a legible, accessible Request AI Assessment workflow only when the exact accepted version and evidence/privacy requirements are satisfied.
- Centralize provider selection, enablement, budgets, fallback, validation, persistence, and audit in the server application/orchestrator boundary.
- Represent pending and terminal assessment states honestly through the existing assessment lifecycle and repository contracts; add only the lease/provenance fields needed for coalescing and late-result rejection, without introducing a second run subsystem or worker system.
- Show assessment history with exact agreement, evidence-set, adapter, policy, prompt/schema/model, validation, and fallback provenance.
- Preserve participant control and create a direct, attributable human-review handoff.
- Test all behavior offline with fakes.

### Out of scope

- Production OpenAI enablement or credentials; a permanent production model choice; remote MCP hosting; browser-to-MCP access; live connectors; background workers or distributed queues; RAG/vector databases; KYC/AML providers; production identity expansion; real funds, custody, payment rails, or autonomous settlement authority.
- Direct model or MCP access to Financial Safety, reviewer assignment/decisions, `record_resolution`, participant authorization, resolution, release/refund, settlement, funds movement, or any real-money action.
- Reinterpreting prior assessments after a prompt, policy, model, evidence, or agreement change.

No new dependency is justified for the first slice. Existing Next.js, Node, repository, Prisma, `fetch`, `AbortController`, and UI primitives are sufficient. A queue/worker library would create durability claims the sprint explicitly does not support.

## 4. Product workflow and offer rules

### 4.1 User flow

1. The agreement Evidence area shows the exact accepted agreement version and current evidence requirement states.
2. If eligible, an authenticated active owner or participant sees **Request AI Assessment** with short copy: “Creates an advisory assessment of the frozen evidence below. It does not approve an outcome or move money.” A reviewer may inspect history but does not initiate a participant assessment in the first slice.
3. Activation opens a confirmation summary naming the agreement version, number of frozen evidence revisions, known gaps/conflicts, provider class shown as “Local deterministic assessment” or “Optional development AI provider,” and the non-consequential nature of the result. It never shows secrets or raw configuration.
4. The client sends an idempotent request containing only `versionId` and an optional client-generated request intent ID/idempotency key. It cannot name a provider, model, prompt, evidence revision list, role, expected recommendation, or authority.
5. The server re-authenticates, re-authorizes, loads the exact accepted version, independently selects visible eligible revisions, freezes the evidence set, selects the provider, creates/claims the pending assessment, and evaluates it.
6. The UI displays queued/in-progress state and polls the assessment resource using bounded, visibility-aware refresh. A synchronous first implementation may pass through queued/in-progress during one request, but those states must be real server states, not client animation.
7. A completed card shows findings beside citations, confidence/uncertainty/limitations, recommended next action, advisory language, and complete provenance.
8. `request_human_review` offers a prefilled review handoff. Participants may also challenge any completed assessment. The review request is a distinct idempotent mutation and never silently assigns a reviewer or records a decision.

### 4.2 Exact eligibility contract

The UI may offer an enabled action only when a server-provided `assessmentCapability` says all of the following are true:

- the principal is an active account with active `owner` or `participant` membership bound to a party in the agreement;
- the requested `versionId` equals the loaded document `versionId` and the stored aggregate/version reference;
- the version state is `accepted` (not merely `superseded` for a new request), every `acceptanceRequired` party has an acceptance record for that exact version, and no material amendment/current-head mismatch exists;
- the verification policy has at least one criterion and a valid policy/review route;
- every evidence revision considered belongs to the exact agreement and version, is the current revision of an active evidence item at freeze time, is visible to the requesting member and permitted for assessment, and has not been withdrawn/revoked, failed integrity, or failed validation;
- every evidence requirement required by the assessment is `standard` sensitivity and its visibility can be enforced for both the requester and selected provider. Any private/role-only requirement not safely projectable makes the assessment unavailable rather than silently omitting decision-relevant evidence;
- the server can create the frozen `EvidenceSet` using canonicalization version `evidence-set-v1`, sorted exact revision IDs, and a recomputed digest; and
- applicable feature and service-health gates permit a request. An existing active or completed assessment for the same immutable evaluation envelope is a coalescing/replay result, not an eligibility failure. Provider-only kill-switch, credential, rate, token, concurrency, and cost gates affect only selection of the optional development OpenAI route; they must not disable an otherwise eligible deterministic request.

Missing, stale, conflicting, inaccessible, or insufficient standard evidence does not always hide the action: the deterministic policy may still produce an indeterminate assessment recommending evidence or review. The capability response must distinguish `eligible`, `eligible_with_gaps`, and `unavailable`, and list safe reason codes. A changed current revision, new evidence, withdrawal, amendment, or acceptance change between capability read and POST causes `409 ASSESSMENT_CONTEXT_STALE`; the server does not assess a mixed snapshot.

## 5. Feature controls and provider selection

### 5.1 Development controls

Add a product-surface feature flag separate from provider flags, default false outside explicitly configured development: `HMM_AI_ASSESSMENT_UI_ENABLED`. It controls whether the new browser capability can be offered, not whether a provider is safe to invoke. Enabling this product flag alone enables only the credential-free deterministic route and requires no provider approval.

Retain the existing provider gates and four kill switches:

- `HMM_AI_PROVIDER_ENABLED`, `HMM_AI_OPENAI_ENABLED`, `HMM_AI_MODEL_ENABLED`;
- `HMM_AI_KILL_SWITCH`, environment kill switch, OpenAI kill switch, and model kill switch;
- allowlisted model, pinned prompt/schema/policy versions, timeout, attempts, concurrency, request rate, token limits, latency, estimated-cost ceiling, and reviewed price inputs.

The product flow must additionally require `NODE_ENV=development`, a server-only `HMM_AI_OPENAI_API_KEY`, and an explicit non-production credential classification configured by a non-secret value such as `HMM_AI_CREDENTIAL_ENVIRONMENT=development`. A key cannot prove its own environment; operational setup remains responsible for using an isolated non-production project. Production composition rejects enabled model flags even if a key exists. Test composition uses fake transports only and rejects accidental network transport construction. No private, role-restricted, highly sensitive, or otherwise sensitive customer evidence may be sent to OpenAI until the founder separately approves the permitted data classes, processing region/residency, retention or zero-retention setting, training/data-use terms, subprocessors, access/deletion controls, and incident terms. Until that approval is recorded, the browser-backed OpenAI path is synthetic-data-only even in development.

The smoke one-time authorization record is not accepted by this workflow. Product development calls, if later authorized, need a separate founder-approved operating policy and bounded budget; this document does not authorize any call.

### 5.2 Server-only selection algorithm

`AssessmentProviderSelector` receives trusted capability/configuration and immutable assessment input; the request body provides no selection hint.

1. If the UI feature is disabled, return `unavailable` without creating an assessment.
2. Read a closed server-only routing mode whose default is `deterministic_local`. The request, agreement text, evidence, model output, and MCP input cannot alter it.
3. In the default mode, require deterministic support for every criterion and select `deterministic_local`; if support is incomplete, return the accepted evidence/human-review route without a provider call.
4. An explicitly configured `openai_development` mode may select OpenAI only when every development/provider/privacy gate above passes. This mode is off by default, impossible in test and production composition, and never selected merely because deterministic support is absent.
5. If OpenAI is disabled, killed, misconfigured, over budget/rate/concurrency, or unavailable before invocation, use deterministic fallback only if `supports(input)` is true; otherwise return a safe evidence/human-review route without a provider call.
6. If OpenAI fails after an assessment attempt starts, the orchestrator records the redacted failure. It may create a separate deterministic fallback assessment only if supported, with explicit lineage and reason code. It never relabels fallback as model output or retries beyond configured bounds.
7. Malformed, unsupported, citation-invalid, claim-reference-invalid, injection-like, or authority-escalating output fails the model attempt in full. No partial model finding is displayed or merged.

## 6. Application, orchestrator, and API contracts

### 6.1 Application model

Extend the existing `Assessment` application/persistence record, whose status already includes `pending`, instead of introducing both `AssessmentRun` and `Assessment` in the first slice. Treat `assessmentId` as the stable request/status identifier and add only the fields required for truthful execution, provenance, and replay:

- identity/scope: `assessmentId`, `agreementId`, exact `versionId`, `documentDigest`, `evidenceSetId`, `evidenceSetDigest`, canonicalization version;
- request: `requestedByAccountId`, `requestedByPartyId`, role at request, `requestedAt`, idempotency scope/fingerprint, correlation ID;
- state: existing `pending | completed | failed | superseded`, plus an execution phase `queued | in_progress` while pending; add `cancelled` only if cancellation ships in the same slice. `unavailable` is a capability/API outcome and is not persisted as an assessment. Use monotonic revision, timestamps, deadline/lease, and optional cancellation timestamp/reason;
- provider provenance: provider class/name, adapter/provider/model version where applicable, prompt/schema/policy/action-contract versions, configuration digest, fallback lineage;
- safe execution metadata: attempt lineage, bounded token counts, latency, estimated/actual cost minor units where known, validation outcome, `authoritySafe`, `semanticExpectationMatched?`, `acceptableActionMatched?`, recommended action, and redacted failure code;
- never: credentials, authorization headers, raw prompts/responses, chain-of-thought, unrestricted provider errors, private evidence values, or provider billing identifiers.

`authoritySafe` is true only after closed-schema and authority-text validation succeeds. It is not derived from the chosen recommendation. For ordinary product assessments there is no fixture-defined semantic expectation, so `semanticExpectationMatched` and `acceptableActionMatched` are `not_applicable` and normally omitted from participant UI; they remain available in development audit diagnostics when an explicit evaluation expectation exists. Never display a semantic mismatch as an authority failure.

Completed assessments add exact provenance needed for durable history: `requestedBy`, document/evidence-set digests, provider kind/version/name, prompt/schema/model identifiers or `model: none`, claim-reference contract version, validation/action-contract versions, and attempt/fallback lineage. Store only safe resolved citations to evidence revision IDs and requirement IDs; claim-reference IDs may be retained only if needed for explainability and bounded audit, never canonical values copied from model output.

### 6.2 Service operations

- `getAssessmentCapability(context, agreementId, versionId)` returns eligibility, safe reasons, effective provider class, budget availability bands, current frozen-context preview/digest, and an active assessment reference if one exists.
- `requestAssessment(context, agreementId, versionId, idempotencyKey, fingerprint)` performs all authorization, snapshot, selection, claim, and orchestration server-side.
- `getAssessment` and `listAssessments` return only records visible under the exact agreement/version access policy; the single-resource response includes pending execution phase when applicable.
- `cancelAssessment` is optional in the first synchronous slice. Do not expose a Cancel control unless the server persists and enforces cancellation. If implemented, the requester may cancel their pending assessment; an owner may cancel an active agreement assessment for availability control; a reviewer cannot cancel participant assessments merely by role. Cancellation aborts cooperative execution, writes a terminal state with `If-Match`, and rejects late completion.

Owner status grants no special assessment conclusion, review decision, or settlement authority. A requester cannot assign themselves as reviewer, decide their own review, alter findings, or convert an advisory recommendation into a resolution action. Existing reviewer assignment must additionally reject the assessment requester and any account/party disallowed by the accepted conflict policy. In the conservative first slice, owners and participants cannot hold the assigned reviewer role for their own requested assessment; if no independent eligible reviewer exists, the handoff remains open/unassigned.

### 6.3 HTTP surface

- `GET /api/v1/agreements/{agreementId}/assessment-capability?versionId=...`
- `POST /api/v1/agreements/{agreementId}/assessments` with `{ versionId }`; reject `adapterKind`, model/provider, findings, evidence IDs, or authority hints as unknown fields.
- `GET /api/v1/agreements/{agreementId}/assessments/{assessmentId}` for status refresh, extending the existing exact-resource route rather than adding a parallel run resource.
- existing assessment GET/list remains, extended with safe provenance and exact-version filtering; it must not return assessments from other versions merely because the agreement ID matches.
- optional `POST .../assessments/{assessmentId}/cancellation` with CSRF, idempotency, and `If-Match` only if cancellation is implemented.

Unsafe methods retain authenticated session, Origin/CSRF, bounded JSON, strict runtime validation, idempotency key, request fingerprint, and safe 401/403/404 behavior. A stable same-key/same-fingerprint retry returns the original assessment/result; same key with different input returns 409. Duplicate concurrent requests for the same immutable evaluation envelope coalesce to the active/completed assessment even with different keys, subject to permission-safe response shaping.

## 7. State, concurrency, durability, and restart behavior

State transitions are one-way: `pending/queued -> pending/in_progress -> completed|failed|cancelled`; terminal states never reopen. `unavailable` is returned before creation. Compare-and-swap revision checks prevent a late provider response from completing a cancelled, timed-out, killed, superseded, or stale assessment.

The first implementation may execute inside the request process because workers are out of scope. It must truthfully document the limitation:

- in-memory mode is disposable; refresh can read process-local state but restart loses active work;
- Prisma mode persists the evidence set, assessment claim, state transitions, completed assessment, idempotency result, and audit effects transactionally where current PostgreSQL support exists;
- a restart may leave pending assessments in `queued`/`in_progress`. On subsequent read/request, a bounded lease/deadline check marks them failed with `RUN_INTERRUPTED` or allows a new idempotent assessment. It does not silently resume a model call or assume whether an external request completed;
- no process-local promise is advertised as durable. True resume/dispatch requires a later worker/outbox design.

Create a unique evaluation-envelope constraint over agreement, version, document digest, evidence-set digest, provider/prompt/schema/policy/action-contract versions. Claim the pending assessment and evidence set atomically. Completion writes the validated findings, terminal assessment state, audit event, and idempotency outcome atomically in Prisma. Cancellation races use revision/deadline conditions and `AbortController`; a late response is discarded. Do not add a queue, outbox, scheduler, or second persistence abstraction in Sprint 6.3.

Refresh uses `no-store`, preserves the visible assessment ID, and applies bounded polling with backoff while the page is visible. Network loss shows “Still working; refresh safely” and never submits another POST automatically. The UI may offer an explicit retry only after a terminal retryable failure; retry creates a new key/assessment and shows lineage.

## 8. UI states and content

| State | User experience |
| --- | --- |
| Loading | Skeleton/neutral text for capability and history; existing content remains stable; `aria-busy` and a polite live region. |
| Eligible | Request button plus exact version/evidence preview and advisory explanation. |
| Queued | “Assessment queued on this server” with request time and, only when cancellation is implemented and authorized, Cancel; no progress percentage. |
| In progress | “Reviewing the frozen evidence” with provider class and elapsed-safe language; show refresh, and show Cancel only when cancellation is implemented and authorized; no claim of certainty. |
| Completed | Advisory label, findings/citations, uncertainty, limitations, recommended next step, provenance, review action. |
| Failed | Redacted explanation, correlation/reference ID, whether anything was recorded, safe retry/fallback/review action. No provider body or secret/config detail. |
| Unavailable | Specific safe reason such as version changed, provider disabled, budget paused, private evidence unsupported, or service unavailable; offer deterministic result or human review only when valid. |
| Cancelled | Conditional on cancellation being implemented: who cancelled, when, no completed assessment, and safe request-again conditions. |
| Human review | Separate handoff state and timeline; never style an open request as a decision. |

Cards visually distinguish facts/participant claims, HMM validation, and AI inference. Each criterion finding links to visible evidence cards and shows supporting and conflicting revision citations, requirement IDs, captured/received times, availability/integrity, and “citation unavailable to your role” rather than leaking hidden evidence. Show confidence level with basis, uncertainty, and limitations in text, never color alone. Present `recommendedNextAction` as “Suggested next step,” map the closed values to plain language, and never make it a direct settlement control.

Every assessment shows: accepted agreement version number and ID; assessment ID; frozen evidence-set ID/digest (digest shortened visually with full copyable value in details); requested/completed times; requester party; deterministic/model provider class; adapter/provider/model or `none`; prompt/schema/policy/action-contract versions; fallback lineage; and supersession status. History is newest first but preserves prior immutable results. A new evidence revision does not rewrite history; it marks old assessments “Based on an earlier evidence set.”

Participant-facing copy: **“This is an advisory assessment of the cited evidence against the accepted agreement version. It is not a verdict, reviewer decision, Financial Safety clearance, authorization, resolution, or instruction to release, refund, settle, or move funds.”**

On mobile, use a single-column order: status/advisory warning, summary, next step, findings, citations, uncertainty, provenance, review. Tables become labelled definition lists/cards; identifiers wrap; controls meet target-size requirements and remain reachable without horizontal scrolling. Use semantic headings, labelled controls, visible focus, keyboard-operable details/dialogs, status and alert live regions, reduced-motion support, adequate contrast, and screen-reader text that does not rely on badges or color.

## 9. Security, privacy, permissions, and audit

- The server derives actor, party, membership, exact version, evidence membership, provider, and budgets. Client fields cannot grant any of them.
- Owner: may request/read participant-visible assessments and cancel an eligible pending assessment when cancellation is implemented; cannot review their own request, clear Financial Safety, authorize a participant, resolve, or settle.
- Participant: may request/read within exact membership/evidence visibility and challenge/request review; cannot assign or decide review or invoke consequential actions.
- Reviewer: may read only explicitly authorized material, claim an eligible independent review, and record a reviewer decision through the existing review contract; cannot request on behalf of a participant, self-assign when conflicted, change evidence/terms, or settle.
- Observer: read-only where policy permits; cannot request/cancel/review.

The provider receives a minimal projection of the accepted document and standard-sensitivity frozen evidence. It receives HMM-issued claim reference records and returns IDs, never trusted canonical values. All citation, claim-reference, conflict, closed-action, injection/markup, and authority validations run before completion. No provider tools are registered. MCP remains a separate server-side least-privilege surface, deterministic-only unless a later design explicitly changes it, and has no settlement/financial tools.

Kill-switch changes are checked before selection, immediately before transport construction, and before accepting completion. An active global/provider/model kill switch prevents new calls; completion after disablement is discarded/fails closed according to assessment revision/deadline. Provider errors are mapped to stable codes (`PROVIDER_DISABLED`, `BUDGET_UNAVAILABLE`, `RATE_LIMITED`, `TIMEOUT`, `REFUSAL`, `MALFORMED_OUTPUT`, `CITATION_INVALID`, `CLAIM_SUPPORT_INVALID`, `AUTHORITY_ESCALATION`, `RUN_INTERRUPTED`) with generic user messages. Logs contain correlation/assessment/attempt IDs, digests, versions, counts, timings, bounded costs, and codes—not secrets, raw payloads, private evidence, URLs, or unrestricted errors.

Audit records cover capability denial category, request/replay/coalescing, evidence freeze, provider selection, assessment transitions, cancellation when implemented, validation result, fallback, assessment completion/failure, history access where warranted, and human-review handoff. Audit/provenance UI is visible to authorized participants without exposing internal security configuration or provider secrets.

Budget UX shows non-sensitive operational states, not billing credentials or exact secret configuration: “Available,” “Temporarily paused by safety limit,” or “Unavailable.” Before a development model request, show the configured maximum assessment cost as an upper bound only if product policy approves displaying it; after completion show bounded token/cost metadata only in development details. Never expose the API key, project ID, authorization headers, model allowlist internals, or price environment variables.

## 10. PostgreSQL integration

Use PostgreSQL only through the already-supported Prisma selection. Extend the current evidence schema narrowly with safe execution/provenance fields and relations on assessments, evidence sets, idempotency, and audit records. Do not add an `assessment_runs` table unless implementation proves that the existing assessment lifecycle cannot uphold a documented invariant; such a change requires a separate design amendment. Do not add a second database, queue, cache, or dual-write path.

Required database invariants include exact agreement/version/evidence-set foreign keys, immutable completed assessment content, unique evaluation envelope, monotonic assessment revision, valid state/timestamp checks, restrictive deletion, bounded JSON, and transactional completion. Migrations must be additive and rollback/roll-forward reviewed; in-memory adapters maintain contract parity. If the existing persistence layer cannot atomically provide an invariant, fail the feature closed in Prisma mode rather than emulating durability in the browser.

## 11. Test strategy

All automated tests are offline and credential-free. Fake providers/transports are injected; any unexpected network transport construction fails the test.

### Unit and contract tests

- Exact accepted version: unanimous exact-version acceptance succeeds; draft, proposed, superseded-for-new-request, partial acceptance, stale head/version, material amendment, and cross-version evidence fail closed.
- Frozen evidence: canonical order/digest, current active revisions only, corrections/withdrawals during request, duplicate/stale/cross-agreement revisions, non-standard sensitivity, visibility mismatch, integrity/validation failure, missing/conflicting/insufficient evidence.
- Provider selection: deterministic default; no model selection merely because deterministic support is absent; explicit development-only OpenAI routing mode; absent/non-production classification/key/model/allowlist/privacy approval; inconsistent flags; every kill switch; production/test rejection; budget/rate/token/concurrency/latency limits; deterministic fallback and no-supported-fallback routing.
- Output: valid fake model result, refusal, timeout/cancel, malformed JSON/schema, extra fields, unknown/consequential action, fabricated/duplicate/stale/misbound claim references, missing/material conflicting citations, active markup/injection, authority-escalating text, and late completion.
- Action reporting: all five allowed recommendations; `authoritySafe` independent of exact/acceptable semantic match; mismatches and not-applicable expectations; unknown values fail schema; no recommendation creates authority.
- Permissions: anonymous/suspended/disabled/unrelated/observer denial; owner/participant request; reviewer read/assignment; requester/self/party conflict rejection; body/header role impersonation; hidden evidence; safe 404 behavior; no direct settlement/MCP/model route.
- Idempotency/concurrency: replay, key reuse mismatch, two keys same envelope coalesce, simultaneous claims, retry lineage, no automatic duplicate after refresh; if cancellation ships, cancellation/completion race and stale `If-Match`.
- Persistence: in-memory contract; PostgreSQL exact foreign keys, uniqueness, transaction rollback, completed immutability, interrupted-assessment lease handling, restart-readable terminal state, and no unsupported resume claim. PostgreSQL-only tests may skip only under the existing documented condition.

### API, UI, accessibility, and security tests

- Strict capability/request/status/history envelopes; unknown provider/model/findings fields rejected; CSRF/origin/session/idempotency/no-store behavior; redacted errors and logs.
- Loading, eligible, queued, in-progress, completed, failed, unavailable, stale, fallback, empty history, and human-review handoff states; include cancelled only if cancellation ships.
- Findings resolve to visible cited evidence; exact provenance/version and earlier-evidence-set warning; confidence/uncertainty/limitations and closed next-action copy; advisory language always present.
- Keyboard flow, focus restoration, live-region announcements, semantic headings, accessible names/descriptions, contrast, reduced motion, zoom/reflow, touch targets, and narrow mobile layouts.
- Static/security checks assert no browser bundle credential access, no direct OpenAI URL or MCP client in UI code, no settlement/Financial Safety/reviewer-decision dependency in provider/orchestrator, no raw prompt/response/error logging, and no production provider enablement.

Validation for implementation should include focused tests, root/web test suites, lint, typecheck, production-shaped builds with provider disabled, offline smoke harness with `networkRequests: 0`, migration safety/Prisma contract tests when available, `git diff --check`, and documentation/security consistency review.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| “AI assessment” is mistaken for a verdict | Persistent advisory copy, evidence citations, uncertainty, human review, no consequential controls. |
| Browser or user selects a more powerful provider | Server-only closed selection; reject provider/model fields; deterministic default. |
| Model receives private, customer, or stale evidence | Exact-version eligibility, server freeze/digest, synthetic-only development gate until separate data-scope/region/retention/data-use approval, standard sensitivity only after approval, visibility enforcement, pre-call recheck. |
| Duplicate calls/cost after retry or refresh | Idempotency plus unique envelope claim; GET polling; no automatic POST; bounded concurrency/rate/cost. |
| Process restart loses or duplicates work | Durable pending-assessment claim in Prisma, deadline/lease terminalization, no silent resume; in-memory limitation labelled. |
| Cancellation races with completion, if cancellation ships | Abort plus compare-and-swap terminal transition; discard late output; otherwise expose no cancellation control or claim. |
| Model output fabricates support or authority | Strict schema, HMM claim references, citation/conflict/action/authority validation; reject whole draft. |
| Fallback provenance is misleading | Separate assessment attempt/result and explicit failure lineage; never label deterministic output as OpenAI. |
| Requester reviews their own assessment | Independent reviewer eligibility and conflict checks at assignment and decision, not UI alone. |
| Budget/config details leak | Coarse UX states, server-only secrets/config, redacted logs/errors. |
| Synchronous execution looks like a durable queue | Truthful state/limitations; workers remain out of scope. |

## 13. Founder decisions

No founder decision is required to approve this documentation-only design or to implement the conservative deterministic, credential-free, development UI path with OpenAI disabled.

Founder approval is genuinely required before allowing OpenAI from the development browser flow for:

- the separate operating authorization replacing the one-call smoke authorization: who may enable it, approved non-production project/model, synthetic versus private agreement data policy, supervised/unattended use, expiry, and revocation;
- maximum per-assessment/daily/project token and cost budgets, rate/concurrency/attempt limits, and whether participants see cost estimates;
- retention/data-use/region/training settings, subprocessors, access/deletion/incident terms, and the exact permitted data classes. Until approved, private, role-restricted, highly sensitive, sensitive, and real customer evidence remain prohibited; development OpenAI use is synthetic-only.

Independent-review conflicts do not block deterministic implementation: the conservative Sprint 6.3 rule is that a requester cannot review their own assessment or evidence, and a handoff remains open/unassigned when no independent eligible reviewer exists. Supported deterministic fallback also does not require a new founder decision: AI Provider Policy v1 already permits automatic fallback only when every requested criterion is supported, provided the fallback is a separate attributable attempt and is never presented as model output.

Production enablement, production credentials, provider/model selection, privacy/compliance review, monitoring/incident ownership, and any real-money or settlement integration require a later design and explicit approval. They are not Sprint 6.3 decisions.

## 14. Implementation acceptance criteria

When runtime implementation is separately authorized, Sprint 6.3 is complete only when:

- the browser can request an assessment without choosing a provider and deterministic remains the default;
- OpenAI is impossible outside fully enabled server-side development configuration with a valid non-production credential classification and credential, and remains off by default;
- exact acceptance, version, evidence freeze, privacy, permissions, budgets, kill switches, action semantics, citations, claims, and authority boundaries fail closed;
- all applicable listed states, history, exact provenance, uncertainty, citations, advisory language, accessible/mobile behavior, and human-review handoff are implemented;
- idempotency, concurrent coalescing, late-response rejection, refresh behavior, and truthful restart durability match this design; cancellation is required only if a Cancel control/API is included in the implementation slice;
- Prisma is used only through the existing adapter path and in-memory parity remains; no new dependency is added without a concrete reviewed need;
- provider/MCP code has no path to Financial Safety, reviewer decisions, `record_resolution`, participant authorization, resolution, release/refund, settlement, funds movement, or real-money action; and
- offline tests and all validation checks pass with zero live OpenAI requests.
