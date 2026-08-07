# Sprint 6.0 Technical Design Summary — Local AI + MCP Verification Layer

## 1. Purpose and scope

Sprint 6.0 defines a local/test AI and Model Context Protocol (MCP) verification layer that can inspect an exact accepted agreement version, retrieve only deterministic approved sources, normalize observations into the existing evidence workflow, request an explainable advisory assessment, and request human review. This is a technical design only. It does not authorize runtime changes, dependency installation, database migrations, external connections, or production credentials.

The layer is deliberately subordinate to the agreement, evidence, authorization, review, Financial Safety, and resolution domains. MCP is a bounded transport for approved capabilities, not a new source of authority. AI output is an assessment or recommendation, never a verdict or authorization.

### Goals

- Define a minimal local MCP server and versioned, structured tool contracts.
- Reuse the accepted Agreement Language and Sprint 5.6 evidence/assessment records rather than creating a parallel AI evidence model.
- Permit deterministic fixture retrieval through a replaceable source-retrieval port with strict allowlists, reference validation, output bounds, and provenance.
- Preserve source independence, contradiction, missing/stale data, uncertainty, explainability, reproducibility, authorization, privacy, and audit boundaries.
- Provide a deterministic local assessment adapter and a provider-neutral future advisory model interface without SDKs, keys, or live calls.
- Make authority-escalation, prompt-injection, malicious reference, replay, concurrency, and resource-exhaustion behavior explicit and testable.
- Preserve a future seam for remote MCP and production model providers without committing to a host, vendor, transport, or credential model.

### Explicitly out of scope

- Real funds, custody, payment rails, provider settlement, releases, refunds, charges, or transfers.
- KYC/AML, sanctions, transaction monitoring, production identity verification, or production compliance operations.
- Remote MCP hosting, public network exposure, external live connectors, webhooks, browser automation, or autonomous monitoring/workers.
- Production model/API credentials, model SDKs, model calls, prompt-management vendors, or model training.
- Autonomous adjudication, reviewer operations, dispute decisions, legal conclusions, or compliance clearance.
- Vector databases, embeddings, RAG, semantic search, OCR, file/blob ingestion, malware-scanning services, or new dependencies without a separately demonstrated need.
- Changes to accepted Agreement Language, runtime code, Prisma schema, migrations, UI implementation, or dependencies in this design-only sprint.

## 2. Existing baseline and compatibility rules

Sprints 5.1–5.7.1 established the agreement-centered UI, canonical versioned Agreement Language, authenticated request context, active membership and party binding, PostgreSQL/Prisma persistence, immutable agreement versions and evidence revisions, evidence-set snapshots, advisory assessment adapters, attributable human review, and simulated resolution orchestration. Sprint 6.0 preserves these invariants:

- Only the exact accepted or historically accepted `versionId`, proven by exact-version acceptance records, may be verified. A mutable current-version pointer is insufficient.
- Canonical `EvidencePolicy`, `VerificationPolicy`, source constraints, permitted fields, submitter scope, visibility, sensitivity, freshness, and review route are authoritative.
- Evidence is stored through the existing `EvidenceItem`/immutable `EvidenceRevision` model. Retrieved content never silently modifies accepted terms or prior evidence.
- An assessment references one immutable evidence set and exact adapter/policy versions. New evidence creates a new assessment; it does not alter a completed one.
- Membership, party roles, UI capabilities, tool availability, model output, source content, and possession of an identifier are not authority.
- Human-review assignment and reviewer decisions remain separate from assessment generation and do not themselves authorize resolution or settlement.
- Resolution orchestration independently enforces `record_resolution` authority, accepted-version state, review/dispute state, consequence-bound participant grants, Financial Safety, concurrency, and execution idempotency.
- Structured errors are stable and non-sensitive; inaccessible resources use non-disclosing not-found behavior.
- PostgreSQL is authoritative when that adapter is selected. No database failure falls back to process memory.

### Current implementation gaps that Sprint 6.0 must not inherit

The existing evidence service is the integration baseline, not proof that every future MCP projection is already sufficiently narrow. Its current read authorization primarily establishes an active account, exact accepted version, and active agreement membership. Before exposing evidence or assessment reads through MCP, implementation must add or reuse one centralized projection policy that enforces each requirement's `visibility` and `sensitivity`, party/reviewer scope, field minimization, and non-disclosing lookup behavior. The MCP mapper may further reduce a result, but it must not become the only privacy boundary.

Likewise, the current general evidence command accepts fields such as `origin`, `availability`, and `integrity` for participant-facing workflows, and the current review-request command does not by itself prove every optional assessment/evidence-set/criterion reference belongs to one exact scope. A later MCP implementation must therefore use a dedicated controlled-observation application command, or first strengthen the shared service, so those values and all receipt/provenance fields are server-derived and cross-record bindings are transactionally validated. It must not pass MCP input straight through the existing transport shape. These are implementation prerequisites, not runtime changes authorized by this design.

### Absolute authority prohibition

Neither AI, an MCP client, an MCP server, a tool call, retrieved content, a source adapter, nor an assessment provider may:

- grant or satisfy `record_resolution` authority;
- accept an agreement or grant participant authorization;
- create, renew, revoke, or substitute a resolution authorization grant;
- assign or confer reviewer authority, impersonate a reviewer, or record a reviewer decision;
- set or clear Financial Safety status or represent compliance clearance;
- create a settlement instruction, execute even simulated settlement, release/refund/transfer value, or call resolution execution services.

These actions are absent from the MCP tool registry, absent from provider interfaces, and denied again in the application layer. A prompt, source document, tool result, or future remote client cannot expand that set.

## 3. Architecture and trust boundaries

The minimal design is one local stdio MCP process composed over application ports. It has no inbound network listener, no unrestricted filesystem access, no browser, no shell, no direct Prisma client, and no settlement or resolution-service dependency.

```text
Local MCP client
  -> MCP transport/schema validation
  -> local session + actor-context binding
  -> HMM MCP capability registry (deny by default)
  -> verification application facade
       -> agreement/evidence authorization services
       -> controlled source retrieval port
            -> deterministic fixture/local adapter
       -> evidence normalization and existing evidence service
       -> deterministic assessment adapter / future advisory provider port
       -> existing human-review request service
  -> existing repositories and append-oriented audit

No path from MCP registry or provider port to resolution execution,
authorization grants, reviewer decisions, Financial Safety transitions,
payment/custody providers, unrestricted network, or production databases.
```

The MCP process is a client of domain application services, not a privileged peer and not a repository adapter. Every tool invocation constructs the existing server-derived `RequestContext` shape used by the web application and receives no greater permission than the authenticated account would receive through the ordinary API. MCP-specific audience/purpose scope is an additional restriction around that context, not a replacement principal type or an authority claim.

### Package boundary proposed for a later implementation

Prefer a small workspace such as `services/mcp-verification` plus narrow application ports in `apps/web/server/verification` only if import/runtime constraints require separation. The MCP package owns protocol schemas and mapping only. Domain validation and authorization remain in application services. Shared contracts may move to an existing package only when two real consumers justify it; do not pre-emptively reorganize the monorepo.

## 4. MCP capability registry and tool contracts

All contracts use opaque IDs, ISO 8601 UTC times, bounded arrays/strings, a required `contractVersion`, and structured responses. The server rejects unknown top-level fields for mutation requests and ignores no authority-relevant field. Actor IDs, roles, visibility, adapter selection, policy version, provenance state, and timestamps are server-derived rather than accepted from the model.

### Read/query tools

#### `hmm_get_agreement_terms`

Input: `contractVersion`, `agreementId`, `versionId`.

Returns only the authorized verification projection: purpose, relevant criteria and condition operators, evidence requirements, source constraints, verification policy, review route, and non-sensitive resolution-policy context needed to explain limitations. It excludes account identifiers, sessions, private evidence payloads, settlement destinations, authorization grants, Financial Safety internals, and unrelated participant data.

The result states whether exact-version acceptance is proven. It never treats draft/proposed content as accepted instructions.

#### `hmm_get_evidence_requirements`

Input: `contractVersion`, `agreementId`, `versionId`, optional bounded `criterionIds`.

Returns authorized requirements, allowed source constraints, permitted metadata fields, retrieval methods, visibility/sensitivity, freshness/window rules, distinct-source minimums, independence requirements, and current derived state/reason codes. It does not mint source access.

#### `hmm_list_evidence_metadata`

Input: `contractVersion`, `agreementId`, `versionId`, optional `criterionId`, opaque cursor, bounded page size.

Returns authorized metadata projections and exact revision IDs: evidence class/origin, source constraint, safe display label, captured/observed/received times, availability/integrity/validation state, related criteria, and provenance summary. It excludes arbitrary payloads, secret-bearing references, credentials, raw source content, and evidence outside actor visibility.

#### `hmm_get_assessment`

Input: `contractVersion`, `agreementId`, `assessmentId`.

Returns an authorized advisory assessment projection with exact version/evidence-set references, findings, supporting/conflicting revision IDs, confidence basis, limitations, recommended next action, adapter/provider provenance, and reproducibility status. It never returns chain-of-thought or labels an output a decision.

### Tightly bounded write/request tools

#### `hmm_submit_source_observation`

Input: `contractVersion`, `agreementId`, `versionId`, `evidenceRequirementId`, `criterionIds`, `sourceConstraintId`, `retrievalReceiptId`, normalized observation fields, `capturedAt`, and `idempotencyKey`.

This does not accept an arbitrary URL or raw document body. A prior controlled retrieval produces a short-lived, actor/agreement/version/source-constraint-bound receipt. The tool validates that receipt, accepted policy, allowed evidence class/origin, permitted field names/types/sizes, freshness, and submitter/retriever authority. It then calls the existing evidence service to append an immutable evidence item/revision with origin `external` or `system` as appropriate.

The model cannot set integrity to `verified`, choose another submitter, widen visibility, backdate `receivedAt`, mark independence, or attach arbitrary payload references. The server records normalization provenance and may conservatively use `unverified`/`pending` until deterministic validation completes.

#### `hmm_request_assessment`

Input: `contractVersion`, `agreementId`, `versionId`, optional bounded `criterionIds`, and `idempotencyKey`.

The service independently selects eligible current evidence revisions, derives requirement states, freezes the evidence set, selects the configured server-side adapter, validates its output, and persists through the existing assessment workflow. Initially this is the existing `deterministic` adapter kind; `deterministic_local` is a provider-interface description, not a second persisted enum. The caller cannot select an adapter/provider or supply findings, confidence, prompt text, provider credentials, model name, evidence IDs outside eligibility, or a recommendation that bypasses policy.

#### `hmm_request_human_review`

Input: `contractVersion`, `agreementId`, `versionId`, optional `assessmentId`/`evidenceSetId`, bounded enumerated reason codes, affected criterion IDs, and `idempotencyKey`.

This opens or replays an existing review request through the Sprint 5.6 service only after independently proving that every supplied assessment, evidence set, and criterion belongs to the same agreement and exact accepted version, that the assessment references the evidence set when both are supplied, and that each reason is permitted by the accepted verification policy/current workflow. It cannot assign the review, confer reviewer authority, record a decision, resolve a dispute, or select a route other than the accepted `VerificationPolicy.reviewRoute`.

### Optional retrieval resource, not a general tool

A later implementation may expose fixture manifests as read-only MCP resources using opaque fixture IDs. If a tool is needed, `hmm_retrieve_approved_source` accepts only `agreementId`, `versionId`, `sourceConstraintId`, an allowlisted opaque reference, and a bounded field selection. It returns normalized candidate observations plus a signed/opaque retrieval receipt and provenance; it never fetches caller-supplied network locations.

No tools named or equivalent to `record_resolution`, `grant_authorization`, `assign_reviewer`, `record_reviewer_decision`, `transition_financial_safety`, `create_settlement_instruction`, `execute_settlement`, or unrestricted `fetch_url` may exist.

## 5. Controlled source retrieval and reference validation

### Source allowlists

The accepted source constraint is necessary but not alone sufficient. Runtime configuration maps each supported `sourceConstraintId` to a reviewed local adapter and bounded reference namespace. A source is retrievable only when all are true:

1. the exact version is accepted and authorizes the constraint;
2. the authenticated actor may use that source for that agreement and purpose;
3. the retrieval method matches the constraint;
4. the adapter and reference namespace are enabled in the environment;
5. requested fields are a subset of `permittedFields`; and
6. time, result-size, call-count, and sensitivity limits pass.

The initial adapter reads checked-in deterministic synthetic fixtures only. Fixture manifests declare stable IDs, schema/version, synthetic status, logical publisher/origin, capture time, permissible fields, and content digest. A fixture may simulate error, missing, stale, conflicting, or malicious content without making a live call.

### Reference validation

- Initial retrieval accepts opaque fixture/local IDs with conservative length and character bounds; display labels are never references.
- No caller-supplied path, path traversal, symlink resolution, glob, host, redirect, user-info URL, fragment, alternate IP notation, or arbitrary query is accepted.
- Existing `https_url` evidence may remain display/reference metadata, but Sprint 6.0 does not dereference it.
- A future URL adapter must require an exact scheme/host/port/path policy, perform DNS/IP checks before every connection and redirect, block loopback/private/link-local/metadata networks, cap redirects and bytes, validate content type, apply timeouts, and never forward ambient cookies or credentials. That adapter needs separate threat modeling and approval.
- Provider-object references use adapter-specific patterns and never become URLs through string concatenation.

### Retrieval receipt

A receipt is opaque, short-lived, single-purpose, and bound to actor account, agreement/version, source constraint, adapter/version, reference digest, requested field set, content digest, retrieval time, and correlation ID. It contains no secret or raw content. Submission verifies the binding and expiry. Replay with the same idempotency scope is safe; reuse for a different request is rejected.

## 6. Normalization into immutable evidence

Retrieval returns untrusted source material to a deterministic normalizer, not directly to persistence. The normalizer:

- selects only policy-permitted fields;
- validates exact primitive types, units, enumerations, lengths, timestamps, and null behavior;
- retains the distinction among retrieved external fact, participant claim, system event, human attestation, and AI inference;
- records source adapter/version, fixture/reference digest, retrieval receipt, observed/captured/received times, transformation identifiers, content digest where useful, and validation reasons;
- emits no fact that cannot be traced to a source field and deterministic transformation; and
- refuses ambiguous coercion, returning missing/invalid/indeterminate reasons instead.

Normalized data enters the existing evidence service, which remains responsible for requirement/criterion scope, source constraint, submitter/retriever permission, metadata allowlist, revision append, CAS, idempotency, audit, and visibility. The MCP layer cannot write `EvidenceRevision` rows directly.

AI-generated extraction, summarization, or classification is not evidence truth. If introduced later, its output is a separately labeled inference with source spans/references and model provenance; it cannot upgrade integrity or overwrite the source observation.

## 7. Multi-source verification and independence

Distinct source counting uses stable source identities derived server-side from approved adapter namespaces and provenance, not URL count, filenames, evidence count, submitters, mirrors, or repeated calls.

An independence determination may be:

- `established`: a reviewed deterministic rule proves different controlling origins or approved independent publishers;
- `not_established`: sources share an origin, syndication chain, owner, dataset, or fixture lineage; or
- `unknown`: available provenance cannot establish independence.

Only `established` sources satisfy `independentSourcesRequired`. `unknown` is never promoted by model judgment. Mirrored articles, API and webpage views of one dataset, reposts, two URLs on one provider, and multiple observations from one underlying event remain one origin group unless a reviewed rule proves otherwise.

Assessment records include the source groups considered, rule/version used, and limitations. If a minimum count or independence requirement is unmet, the requirement is `insufficient` and the policy route is request evidence or human review.

## 8. Contradiction, missing data, stale data, and uncertainty

- **Contradiction:** retain all eligible supporting and conflicting revision IDs. Do not silently rank sources unless accepted policy defines transparent deterministic precedence. Material conflict yields `indeterminate` and normally requests review.
- **Missing:** identify the exact unmet requirement/field/criterion. Absence of a result is not a negative result. Follow `onMissing` and deadline rules.
- **Stale:** apply only machine-readable accepted freshness/window rules. Compare injected UTC time against the relevant captured/observed time; never invent a freshness threshold. A stale observation remains historical provenance but is ineligible for a fresh conclusion.
- **Unavailable/inaccessible:** record a bounded reason and safe retry/review route without treating failure as evidence of the condition.
- **Invalid:** preserve a non-sensitive validation outcome; do not persist rejected arbitrary content merely for debugging.
- **Uncertainty:** use the existing `low|medium|high|not_assessed` representation with enumerated basis and limitations. It describes evidentiary support, not truthfulness, legal correctness, reviewer authority, or permission to act.

Provider timeout, invalid structured output, unsupported operator, prompt-injection signal, truncation, or budget exhaustion fails the run safely. The result is a failed assessment or `indeterminate` finding with a request-evidence/human-review/no-action route; never a guessed success/failure.

## 9. Explainable advisory assessment generation

The assessment pipeline is server-orchestrated:

1. authorize the actor and prove the exact accepted version;
2. load only the necessary accepted terms and authorized evidence projections;
3. derive requirement state and freeze a canonical evidence set;
4. build a bounded provider input with explicit data/instruction separation;
5. invoke the configured adapter with timeout and resource budget;
6. validate the complete structured result against criteria, result enums, evidence membership, and policy;
7. reject invented IDs, unsupported conclusions, missing citations, authority claims, or prohibited recommendations;
8. persist the assessment and provenance atomically, or persist a safe failed run without partial findings; and
9. present assessment, sources, contradictions, gaps, confidence basis, limitations, and review action to the participant.

Each criterion finding names the exact accepted statement, result, supporting/conflicting evidence revision IDs, deterministic operations or provider inference used, concise explanation, unresolved questions, and limitations. Explanations must be derived from validated structured fields; private chain-of-thought is neither requested nor stored.

Allowed next actions remain `request_evidence`, `wait`, `request_human_review`, `participant_review`, and `no_action`. Assessment output cannot propose an API call that grants authority or executes a consequence.

## 10. AI/provider boundary and reproducibility

### Provider-neutral port

```ts
interface AdvisoryAssessmentProvider {
  readonly providerKind: "deterministic_local" | "future_model";
  readonly providerVersion: string;
  assess(input: ValidatedAssessmentInput, budget: AssessmentBudget):
    Promise<ProviderAssessmentResult>;
}
```

`ValidatedAssessmentInput` contains the exact accepted document digest/schema version, policy/config version, immutable evidence-set digest and authorized projections, prompt-template ID/version, tool-contract version, locale, deterministic time, and correlation/run ID. It contains no repository handle, session token, provider credential, arbitrary tool callback, or settlement capability.

`ProviderAssessmentResult` is data only. It is schema-validated, bounded, and unable to mutate state. Provider choice is server configuration, never model/user input. The orchestrator owns tools; a future provider cannot issue arbitrary MCP calls or recursively delegate.

### Deterministic local adapter

The initial adapter uses only existing declared operators and validated synthetic fields. It has an injected clock/IDs, stable canonical ordering, explicit adapter/config version, and no randomness or network. Unsupported/manual/conflicting inputs become `indeterminate`. Given identical accepted-document digest, evidence-set digest, adapter/config version, and clock, it produces byte-stable canonical structured output.

### Future model provider

A future adapter may be added behind the same port only after separate approval for vendor, data handling, retention/training, region, credentials, model, cost, evaluations, incident handling, and production operations. Credentials remain server-side and outside prompts, MCP messages, database records, errors, and logs. No production credential or SDK is needed now.

### Run provenance

For every run record: run ID, actor/account purpose, agreement/version and document digest, evidence-set/digest, provider kind/name/model and immutable version when available, adapter version, prompt-template ID/version and digest, tool-contract/server version, source adapter/normalizer versions, policy/config version, structured-input digest, structured-output digest, timestamps, status, retry lineage, token/latency/cost counters when applicable, and correlation/causation IDs.

Reproduction means replaying captured non-secret references and immutable versions in an authorized test environment. Exact output reproducibility is guaranteed only for the deterministic adapter. Future nondeterministic providers record sampling configuration, seed if supported, response/request identifiers, and limitations; provenance is not a promise that a vendor will reproduce bytes indefinitely.

## 11. MCP authentication, authorization, and actor context

Local stdio does not equal trusted. The MCP server starts only in an explicit local/test environment and requires a short-lived HMM-issued local capability/session bound to an authenticated development account. It must not accept `accountId`, `partyId`, `role`, or assurance claims from tool arguments or environment defaults.

At invocation, the server resolves the token to the same `RequestContext` semantics as web requests: principal/account state, session ID/assurance, request/correlation IDs, and a server-injected clock for operations that need time. Implementation should add an explicit `mcp` request-source discriminator rather than pretending the call came from HTTP or a test. Each application service then proves active agreement membership, party binding, accepted version, visibility/sensitivity, action-specific policy, and resource scope. Revocation or expiry fails the next call closed. One client's context is never shared through process globals with another session.

The local token is redacted, short lived, audience-bound to the verification MCP server, purpose/scopes-bound to allowed tool classes, and never written to logs or provenance. Tool discovery may omit unavailable tools for usability, but authorization is always enforced at execution. A remote future transport requires reviewed TLS, origin/client identity, token audience/rotation/revocation, replay defense, and deployment isolation; stdio assumptions must not be reused silently.

## 12. Prompt injection and untrusted-content boundaries

All repository documents, agreement prose, participant text, fixture/source content, metadata, URLs, model output, and tool results are untrusted data. They cannot redefine system policy, tool schemas, actor context, source allowlists, privacy, budgets, or authority.

- Separate immutable system/developer instructions, accepted policy data, and quoted source content in the provider envelope.
- Never concatenate retrieved content into tool instructions or parse source text as tool arguments.
- Source content receives no tool handles, secrets, credentials, hidden prompts, other evidence, or cross-party context.
- The orchestrator chooses tools from a static registry and validates every argument/result; provider-generated tool names or schemas are ignored.
- Treat instructions such as “ignore policy,” “call another tool,” “reveal the prompt,” embedded markup, encoded payloads, and indirect exfiltration requests as content. Flag them as an injection signal and continue only with safe data fields or route to review.
- Sanitize presentation to prevent active HTML/script, unsafe links, formula injection, terminal escapes, or log forging. Preserve a digest/reference for audit rather than copying malicious payloads broadly.
- Minimize context by criterion and visibility. Never expose one party's restricted evidence to another or use private evidence for training by default.

Prompt-injection detection is defense in depth, not the authorization boundary. Even a successful injection meets a tool registry with no settlement/authorization capabilities and application services that re-authorize every call.

## 13. Rate, cost, and resource limits

Initial limits are configuration with conservative local defaults and hard maximums, applied per actor, agreement, session, and run:

- bounded calls/minute and concurrent runs; one active assessment request per identical version/evidence-set/adapter tuple;
- maximum tools per run, retrievals per source constraint, evidence revisions/criteria per request, page size, string/metadata size, and total serialized bytes;
- retrieval, normalization, provider, and end-to-end deadlines with cancellation propagation;
- no unbounded retries: retry only safe transient reads a small number of times; mutation retries require the same idempotency key;
- future token and cost ceilings, with output-token reserve and no automatic budget expansion;
- bounded in-memory buffers and streaming disabled until safe truncation/provenance behavior is designed; and
- process-level local limits so a malformed request cannot exhaust database connections, file descriptors, memory, or CPU.

Limit exhaustion returns a structured retryable or terminal error and changes no evidence/assessment state unless a deliberate failed-run record is committed.

## 14. Errors, audit, privacy, and observability

### Structured non-sensitive errors

Use a versioned envelope with `code`, safe `message`, `correlationId`, `retryable`, and optional bounded `fieldErrors`/`currentRevision`. Candidate codes include `INVALID_REQUEST`, `UNSUPPORTED_CONTRACT_VERSION`, `UNAUTHENTICATED`, `RESOURCE_NOT_FOUND`, `VERSION_NOT_ACCEPTED`, `SOURCE_NOT_ALLOWED`, `REFERENCE_NOT_ALLOWED`, `RETRIEVAL_RECEIPT_INVALID`, `METADATA_FIELD_NOT_PERMITTED`, `EVIDENCE_VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`, `ASSESSMENT_ALREADY_RUNNING`, `PROVIDER_OUTPUT_INVALID`, `PROMPT_INJECTION_SUSPECTED`, `RATE_LIMITED`, `RESOURCE_LIMIT_EXCEEDED`, and `SERVICE_UNAVAILABLE`.

Do not reveal resource existence, membership, source credentials, filesystem paths, SQL/provider errors, prompts, raw private content, tokens, or other parties' data. Messages state whether anything changed and the safest next action.

### Audit and provenance

Record attributable, append-oriented events for MCP session resolution, tool requested/completed/denied/failed, controlled retrieval, normalization, evidence append/replay/conflict, assessment requested/completed/failed, and human review requested. Store references/digests and bounded reason codes rather than raw sensitive payloads. Audit failure rolls back a mutation when the audit is part of the required transaction; optional telemetry failure does not rewrite a committed outcome.

### Observability

Measure counts, latency, timeout/error class, rate-limit events, provider/adapter version, retry count, evidence/criterion counts, assessment outcome distribution, human-review route, injection/invalid-output signals, and database transaction conflicts. Use correlation IDs and coarse environment labels. Do not log prompts, source bodies, evidence metadata values, agreement JSON, participant names/emails, tokens, URLs with queries, provider credentials, or model outputs by default. Access to diagnostic provenance follows evidence visibility and retention policy.

Alerts for a future operated system should cover authorization-denial anomalies, injection spikes, invalid provider output, error/latency budgets, runaway cost, and audit gaps, each with an owner and response playbook. Production alerting/retention is out of scope.

## 15. Idempotency and concurrency

Every write/request tool requires a high-entropy idempotency key scoped to actor, operation, agreement, version, and target. Persist a request fingerprint and result resource reference in the same transaction as the mutation. Exact replay returns the original resource; same key/different fingerprint returns `IDEMPOTENCY_KEY_REUSED`.

- Source submission validates and consumes/replays the receipt atomically with evidence append and audit.
- Evidence correction remains append-only and uses expected revision/CAS through the existing service.
- Assessment creation freezes one canonical evidence set. A uniqueness rule or transaction lock prevents duplicate active/completed runs for the same exact tuple where reuse is intended; a deliberate re-assessment creates a new linked run under an explicit policy/version change.
- Human-review requests deduplicate the same open reason/scope or deliberately create a linked request when policy requires it.
- Concurrent authorization or policy changes are rechecked inside the transaction. A call authorized before session/membership/version change must not commit after its prerequisite is lost where current persistence contracts can prove that loss.
- Provider work should not hold a database transaction open. Reserve a pending run transactionally, call the provider with a lease/deadline, then complete via CAS. Lease expiry permits bounded recovery; a late provider result cannot overwrite a terminal/superseded run.

No write has an external financial side effect, and no MCP retry can invoke resolution execution.

## 16. PostgreSQL/Prisma integration

The design prefers existing Sprint 5.6 records. No schema change is required merely to expose MCP tools or use the deterministic adapter. Existing `EvidenceItem`, `EvidenceRevision`, `EvidenceSet`, `Assessment`, `AssessmentFinding`, `HumanReviewRequest`, generalized idempotency, and audit records remain authoritative.

During implementation, first attempt to represent additional provenance in existing bounded fields/events. Add relational records only when actual queries, retry safety, or reproducibility cannot be met otherwise. Plausible additive needs are:

- `AiRun` for provider/prompt/tool/config provenance, status/lease, digests, timings, and retry lineage;
- `AiToolCall` for bounded call metadata and result/error digests;
- `SourceRetrieval` for receipt binding, adapter/reference/content digests, field set, status, expiry, and provenance; and
- join/reference fields linking a completed `Assessment` to its run.

Do not add raw prompt/source blobs, secrets, unrestricted JSON dumps, embeddings, vector columns, or an `ai_decisions` table. Any later schema requires an additive forward migration, explicit mappers/ports, foreign keys to exact agreement/version scope, indexes for bounded operational queries/cleanup, append-oriented audit, adapter contract tests, and reviewed retention. Prisma types do not cross the persistence boundary.

## 17. UI integration points

No UI changes occur in this design sprint. A later implementation should extend the existing agreement Evidence/Verification surfaces:

- show “AI assessment” or “deterministic assessment,” never verdict/approved/cleared;
- display exact accepted version, evidence snapshot time, sources, supporting/conflicting evidence, missing/stale/independence states, confidence basis, limitations, and adapter/version provenance in progressive disclosure;
- distinguish retrieved facts, participant claims, deterministic derivations, AI inferences, and reviewer decisions;
- provide authorized actions to request assessment, submit approved observations, request more evidence, or request human review;
- never render AI/MCP controls for authorization, Financial Safety, reviewer assignment/decision, or settlement execution;
- handle loading, empty, partial, stale, permission-denied, rate-limited, provider-failed, superseded, challenged, and recovery states;
- announce status changes accessibly, preserve keyboard/focus behavior, and avoid color-only confidence/status;
- explain that high confidence cannot authorize resolution and that human review remains available; and
- keep sensitive source references and evidence out of URLs, analytics, notifications, and screenshots by default.

## 18. Test strategy

### Contract and domain tests

- MCP initialization/version negotiation, exact schemas, unknown fields, enum/size bounds, pagination, stable errors, and output minimization.
- Accepted-version proof, evidence-policy mapping, deterministic normalization, canonical digests/order, requirement-state precedence, staleness boundaries, contradiction, missing data, and unsupported operators.
- Distinct versus independent source grouping, mirrors/syndication/common-origin cases, and `unknown` independence failing insufficient.
- Deterministic adapter golden fixtures and byte-stable results for identical inputs/clock/version.
- Provider-output validation rejects invented criteria/evidence, missing citations, unsupported conclusions, authority language, prohibited actions, overlong content, and partial output.

### Authorization and security tests

- Anonymous, expired, disabled, pending, revoked, observer, cross-agreement, cross-version, cross-party visibility, owner-overreach, reviewer-overreach, and guessed-ID attempts fail closed/non-disclosing.
- Attempts to supply account/party/role/assurance, widen visibility, set integrity, forge timestamps/receipts, reuse receipts across actors/scopes, select providers/prompts, or access raw payloads are rejected.
- Enumerate the MCP registry and assert forbidden resolution, settlement, participant authorization, reviewer decision/assignment, and Financial Safety capabilities are absent.
- Mock direct application calls and assert the verification facade has no dependency/reference capable of those operations.
- Malicious tool input: traversal, symlink/path forms, oversized/nested metadata, prototype keys, control characters, Unicode confusables, malformed IDs/times, URL user-info/fragments, localhost/private/metadata IP representations, redirect chains in future adapter tests, and log/formula/HTML injection.
- Prompt injection in agreement prose/source data/model output cannot change tool choice, arguments, actor context, allowlist, visibility, budget, or authority; exfiltration attempts reveal no secrets/cross-party data.
- Repeated requests, key conflicts, concurrent receipt consumption, duplicate assessment requests, stale CAS, lease expiry, late provider results, and database failures produce one safe outcome.
- Rate, concurrency, byte, time, tool-count, and future token/cost budgets terminate safely without partial unauthorized writes.

### Integration and persistence tests

- Shared evidence/assessment repository contracts remain green in memory and real isolated PostgreSQL.
- MCP facade calls existing services and persists the same immutable evidence and assessment shapes as HTTP flows.
- Transaction rollback includes evidence/assessment, idempotency, receipt state, and required audit.
- Process restart preserves receipts/runs/idempotency if those records are added; no fallback occurs on database outage.
- Provenance can reproduce deterministic runs from exact version/evidence/config references while respecting authorization.

### UI and end-to-end tests for a later implementation

- Keyboard/screen-reader and narrow/zoomed views expose sources, uncertainty, errors, and human-review action.
- Browser flow: authorized local sign-in → accepted agreement → deterministic fixture retrieval → immutable evidence → assessment → participant review/human-review request.
- Browser attempts to turn an assessment into authority or settlement remain impossible; simulated resolution continues to require its independent existing guards.

### Design-sprint validation

- Read governing and Sprint 5.1–5.7.1 documentation/code boundaries.
- Run `git diff --check`.
- Review the document for consistency with canonical terms and existing contracts.
- Perform a focused security-boundary review for authority, injection, SSRF/reference handling, privacy, resource exhaustion, idempotency, concurrency, and sensitive logging.

## 19. Future remote MCP and production-provider seam

Protocol transport, source adapters, assessment providers, and repositories remain behind separate ports. A remote deployment may replace stdio and local credentials without changing domain tool semantics, and a production model may replace the deterministic adapter without receiving mutation authority. Contract versions are additive where possible; breaking semantics require a new major version and compatibility window.

Before any remote MCP or live provider implementation, require a separate technical/security/privacy/operations design covering hosting and network isolation, client identity and tenant boundaries, secret management, credential scopes/rotation, vendor data use/training/retention/region, model evaluations and rollback, source licensing/terms, connector consent/revocation, egress/SSRF defenses, quotas/cost controls, incident response, monitoring/on-call, deletion/export/legal hold, and production compliance review.

Remote transport does not justify autonomous workers. Monitoring, scheduled retrieval, notifications, and queues each require explicit consent, scope, cadence, expiry, revocation, retry, deduplication, and operational ownership before implementation.

## 20. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| MCP becomes a privileged back door | Same server-derived actor context and application authorization; no direct Prisma or resolution dependency; deny-by-default registry. |
| Model/tool output is mistaken for authority | Advisory-only schemas/copy; prohibited tools absent; independent resolution guards remain mandatory. |
| Prompt injection expands capability | Static registry, data/instruction separation, no recursive delegation, validated arguments/results, least privilege. |
| Arbitrary references cause SSRF/file access | Fixture IDs only initially; no general fetch/path; future exact allowlist and network controls require separate review. |
| Retrieved data bypasses immutable evidence | All observations enter through existing evidence service with receipts, normalization provenance, idempotency, and CAS. |
| Multiple URLs create false corroboration | Server-derived origin groups; independence only from reviewed deterministic rules; unknown fails insufficient. |
| AI hides contradiction or uncertainty | Preserve both sides, explicit indeterminate/gaps/limitations, deterministic policy routing to evidence/review. |
| Provider change makes outcomes irreproducible | Version/digest prompts, model, tools, policy, inputs/outputs; deterministic adapter goldens; disclose future limitations. |
| Sensitive data leaks into prompts/logs | Criterion-scoped minimization, visibility filtering, references/digests, no payload logging, restricted provenance access. |
| Retries duplicate evidence/reviews | Durable actor/operation/scope idempotency and transactionally bound receipts/results. |
| Long provider call creates races | Pending run lease then CAS completion; revalidate prerequisites; late result cannot overwrite terminal state. |
| Local design is mistaken for production readiness | Explicit local/test labels and exclusions; separate approval gate for remote/live providers and operations. |
| Speculative infrastructure expands scope | Reuse existing records/ports; no RAG/vector DB/new dependency; add schema only for proven provenance/retry needs. |

## 21. Founder decisions and approvals

No founder decision is required to proceed later with a reversible local/test implementation that uses checked-in synthetic fixtures, the deterministic adapter, local stdio MCP, development authentication, existing evidence/assessment services, no new dependencies where practical, and the absolute authority prohibitions in this document.

The following are genuine founder approval gates, informed by appropriate security/privacy/legal/operational advice, before their respective future work:

- selection and use of any production model provider, including data-use/training, retention, region, credentials, cost/latency targets, evaluation thresholds, and fallback policy;
- any remote MCP hosting or third-party client access, including tenant/client identity, scopes, quotas, support, incident response, and availability target;
- any live external source connector, including source/provider choice, licensing/terms, participant consent, credential ownership, retrieval cadence, revocation, data retention, and acceptable provenance/independence rules;
- retention, deletion/export, legal hold, audit/provenance access, and private-evidence model-use policy beyond the current “no training by default” rule;
- numeric confidence/calibration thresholds or any policy that changes routing based on model output;
- production reviewer authority, staffing, escalation, appeals, fraud/compliance operations, or service-level commitments; and
- any real-funds/custody/payment/KYC/AML/Financial Safety or settlement execution capability, which additionally requires specialist legal, compliance, security, and regulated-provider review.

These decisions are not blockers for the local deterministic technical implementation. They must not be inferred from approval of this design.

## 22. Future implementation acceptance criteria

A separately authorized Sprint 6.0 implementation is complete only when:

- the local MCP server exposes only the approved registry and uses server-derived authenticated actor context;
- every call reuses application authorization and exact accepted-version/evidence-policy validation;
- deterministic fixtures are the only retrievable sources, arbitrary URL/path/network access is impossible, and observations enter the immutable evidence workflow through bounded receipts;
- the deterministic assessment adapter and provider port produce validated, sourced, explainable advisory assessments with full version provenance;
- contradiction, missing/stale/invalid/inaccessible data, insufficient independence, provider failure, and injection signals fail safely to evidence/review/no action;
- forbidden authority and settlement capabilities are absent structurally and rejected in security tests;
- write/request operations are durable, idempotent, CAS-safe, audited, and race-tested;
- errors and telemetry are structured and non-sensitive, with enforced rate/resource limits;
- existing agreement, auth, evidence, review, persistence, and simulated-resolution tests remain green;
- focused MCP/provider contract, malicious-input, prompt-injection, authority-escalation, PostgreSQL, and browser tests pass;
- documentation truthfully labels the capability local/test and advisory; and
- no real funds/custody, production credentials, remote hosting, external live connector, autonomous worker, production compliance operation, RAG/vector database, or unjustified dependency is introduced.
