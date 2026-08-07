# Sprint 6.1 Technical Design Summary — Real AI Provider Integration

## 1. Purpose and scope

Sprint 6.1 designs an optional real-model advisory assessment adapter behind the provider-neutral seam established in Sprint 6.0. The existing deterministic adapter remains the default for tests and local development. This is a technical design only: it authorizes no runtime code, dependency, schema, credential, network, deployment, or provider-account change.

The model compares a minimized projection of one exact accepted Agreement Language version with one immutable evidence-set snapshot and returns a structured advisory draft. The application remains responsible for authentication, authorization, accepted-version proof, evidence eligibility, policy interpretation, provider selection, validation, persistence, audit, and human-review routing.

### Goals

- Define a provider-neutral model contract that preserves the current `AdvisoryAssessmentProvider` seam.
- Align model output with existing `Assessment`, `CriterionFinding`, confidence, limitation, and next-action records.
- Make prompts bounded, versioned, attributable, injection-resistant, and privacy-minimized.
- Specify failure, budget, idempotency, concurrency, observability, evaluation, rollout, rollback, and kill-switch behavior.
- Preserve deterministic, offline, byte-stable tests and a safe fallback path.
- Leave a small future seam for a second provider without building a routing platform.

### Explicitly out of scope

- Production credentials or choosing/contracting with a production model vendor.
- Remote MCP hosting, live source connectors, unrestricted retrieval, browser/network tools, RAG, embeddings, or vector databases.
- Changes to accepted Agreement Language, runtime code, dependencies, Prisma schema, migrations, or UI in this design sprint.
- Real funds/custody, payment rails, KYC/AML providers, production compliance operations, or autonomous resolution/settlement.

## 2. Existing baseline and compatibility rules

Sprints 5.1–6.0.1 established the agreement-centered experience, canonical and versioned Agreement Language, authenticated actor context, active membership and party binding, PostgreSQL/Prisma persistence, immutable evidence revisions and evidence-set snapshots, advisory assessments, attributable human review, simulated resolution orchestration, a local stdio MCP server, controlled synthetic retrieval, and hostile end-to-end security coverage.

Sprint 6.1 preserves these invariants:

- Accepted terms and policies are authoritative data. A model cannot amend, reinterpret beyond the accepted schema, or invent policy.
- Every assessment references one exact accepted version and immutable evidence set. New evidence requires a new assessment.
- Evidence visibility and sensitivity are enforced before provider input is built. Provider output cannot widen access.
- `Assessment` remains advisory. It is not a reviewer decision, resolution, authorization, Financial Safety state, or settlement instruction.
- The deterministic adapter remains available, uses no network or randomness, and stays the default for automated tests.
- PostgreSQL/Prisma repositories remain authoritative; provider SDK types and responses never cross the adapter boundary.
- The local MCP implementation remains deny-by-default and all eight existing tools retain their current authority. No production-model integration expands that registry.

### Absolute authority prohibition

The model, provider adapter, prompt, response, tool call, MCP client/server, assessment, or confidence value may not:

- grant, satisfy, or infer `record_resolution` authority;
- grant participant, reviewer, organization, or agent authority;
- assign a reviewer or record/approve a reviewer decision;
- transition, clear, or bypass Financial Safety;
- open, decide, cancel, or execute a resolution except through separately authorized existing domain services;
- create a settlement instruction, move value, release/refund funds, or invoke simulated execution; or
- override a dispute, review window, participant authorization, accepted policy, or deterministic execution guard.

These capabilities are absent from the provider interface and tool policy and are denied again by the application and resolution domains. Any output claiming such authority is invalid, produces no completed assessment, and normally triggers security telemetry and human review.

## 3. Architecture and provider-neutral interface

```text
Authorized assessment request
  -> EvidenceAssessmentService / assessment orchestrator
     -> prove actor, membership, exact accepted version, visibility
     -> derive requirement states and freeze evidence set
     -> build minimized, versioned provider envelope
     -> selected AdvisoryAssessmentProvider
        -> deterministic local adapter (default/test)
        -> optional configured model adapter (feature flagged)
     -> strict output validation and policy routing
     -> atomically complete Assessment + provenance, or fail closed

No provider dependency on resolution, Financial Safety, reviewer-decision,
settlement, Prisma, credentials, filesystem, browser, shell, or unrestricted MCP.
```

Extend the current seam narrowly rather than creating a second assessment stack. The implemented Sprint 6.0 seam currently extends `AssessmentAdapter`, exposes `providerKind: "deterministic_local" | "future_model"`, and calls `evaluate(AssessmentAdapterInput)`. Preserve that contract while adding the validated envelope and run controls; do not create a competing `assess` path. A compatible target shape is:

```ts
interface AdvisoryAssessmentProvider extends AssessmentAdapter {
  readonly providerKind: "deterministic_local" | "future_model";
  readonly providerName?: string;
  readonly providerVersion: string;
  readonly modelId?: string;
  evaluate(
    input: ValidatedAssessmentInput,
    controls: ProviderRunControls,
  ): Promise<ProviderAssessmentResult>;
}

interface ProviderRunControls {
  deadlineAt: string;
  signal: AbortSignal;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxEstimatedCostMinor: number;
  correlationId: string;
}
```

`ValidatedAssessmentInput` is the implementation evolution of `AssessmentAdapterInput`: an immutable data transfer object containing only authorized projections and pinned versions. The deterministic adapter may be adapted through the same orchestrator without changing its offline behavior. `ProviderAssessmentResult` remains assignable to the existing `AssessmentDraft`/`CriterionFinding` persistence contract and is data only. It exposes no repository, callback, credential, session token, URL fetcher, MCP client, tool handle, policy mutation, or resolution capability.

Provider selection is an environment-owned server configuration. Requests, agreement text, evidence, MCP arguments, and model output cannot choose a provider, model, prompt, sampling configuration, or budget. The initial implementation should use a small hand-written HTTP adapter if the selected provider supports the repository's existing runtime primitives cleanly. Add an SDK only when it provides a reviewed, concrete benefit—such as supported authentication, cancellation, or structured-output reliability—that cannot be achieved safely with existing dependencies.

## 4. Structured input and output contracts

### Validated provider input

The orchestrator constructs a canonical envelope with:

- run/correlation ID and deterministic request time;
- accepted `agreementId`, `versionId`, schema version, and document digest;
- prompt-template ID/version/digest;
- provider adapter/config, tool-contract, policy, and normalizer versions;
- locale and bounded presentation guidance;
- each included criterion ID and exact accepted statement;
- relevant evidence-requirement rules and derived state;
- immutable `evidenceSetId`, digest, and authorized evidence projections;
- explicit fact classification: participant claim, external fact, system event, human attestation, deterministic derivation, or prior reviewer input;
- source labels, exact allowed evidence revision IDs, timestamps, integrity/availability/validation states, and bounded permitted fields; and
- explicit prohibited-authority and output-schema constraints.

Exclude full unrelated agreement sections, identities not needed for attribution, emails, raw source URLs with queries, payload references, credentials, session data, private reviewer notes, other agreements, and evidence not visible for this purpose.

### Provider result

The response maps to the existing assessment draft rather than introducing an `ai_decision`:

```ts
interface ProviderAssessmentResult {
  findings: Array<{
    criterionId: string;
    result: "satisfied" | "not_satisfied" | "indeterminate" | "not_applicable";
    supportingEvidenceRevisionIds: string[];
    conflictingEvidenceRevisionIds: string[];
    evidenceRequirementIds: string[];
    explanation: string;
    limitations: string[];
  }>;
  confidence: {
    level: "low" | "medium" | "high" | "not_assessed";
    basis: string[];
    limitations: string[];
    calibrationReference?: string;
  };
  limitations: string[];
  recommendedNextAction:
    | "request_evidence"
    | "wait"
    | "request_human_review"
    | "participant_review"
    | "no_action";
}
```

Validation requires exactly one finding per requested criterion in canonical order; only accepted IDs; citations that are members of the frozen evidence set and authorized for that criterion/requirement; no overlap between supporting and conflicting IDs; bounded plain text; and only existing next-action enums. Missing citations for a factual conclusion, fabricated IDs, schema drift, unknown fields, chain-of-thought, executable content, authority claims, or prohibited actions invalidate the entire output. Partial findings are never persisted as a completed assessment. Unresolved questions may be expressed in bounded finding limitations or the recommended next action; adding a dedicated persisted field requires a separately reviewed schema/domain change.

The persisted `adapterKind` should use the existing planned `ai_advisory` value only when the domain/schema implementation is deliberately extended. Do not overload `manual`, mislabel a model run as `deterministic`, or migrate merely for provider marketing metadata. Detailed provider provenance may live in an additive `AiRun` linked to `Assessment` if existing bounded audit/provenance fields cannot meet retry and reproducibility requirements.

## 5. Prompt construction and tool policy

### Prompt envelope

The orchestrator—not the adapter and never the caller—selects a pinned prompt template. Construct messages in fixed sections:

1. immutable system policy: advisory role, authority prohibitions, privacy, schema, and refusal rules;
2. task contract: assess only listed criteria and return only the structured object;
3. accepted policy context: exact version/digests, criterion statements, requirement states, allowed results, and review rules;
4. evidence records: individually delimited, typed, cited, size-bounded untrusted data; and
5. output reminder: cite exact supplied revision IDs, expose uncertainty, never infer authorization, and provide no chain-of-thought.

Use canonical serialization and explicit length/count bounds. Never concatenate evidence into system instructions, interpolate it into tool schemas, or allow source markup to alter message roles. Long inputs fail or are deterministically reduced by an approved criterion-scoped projection; they are never silently truncated in a way that drops contrary evidence.

### Tool policy

For Sprint 6.1 the model receives **no direct MCP tools** and makes a single structured assessment call. The HMM orchestrator owns all retrieval and persistence. It may invoke existing application services or the already-bounded MCP facade before the provider call, under the authenticated actor context, then pass only validated results into the frozen input.

This choice prevents recursive delegation, confused-deputy behavior, prompt-driven tool selection, non-reproducible context growth, and provider access to write/request capabilities. In particular, the model cannot call even the existing `hmm_submit_source_observation`, `hmm_request_assessment`, or `hmm_request_human_review` tools.

A future model-driven read-only tool loop requires a separate approved design, static per-run allowlist, maximum calls, argument/result validation, provenance, and equivalent evaluations. It must still exclude writes, review assignment/decision, participant authority, Financial Safety, resolution, and settlement. Sprint 6.1 does not need it.

## 6. Untrusted evidence and prompt-injection defenses

Agreement prose, participant text, metadata, source content, encoded text, filenames, markup, previous model output, and provider output are untrusted data.

- Preserve instruction/data separation with typed envelopes and unique delimiters.
- Normalize encoding, reject control/log-forging characters where not meaningful, and bound nesting, strings, arrays, and total bytes.
- Treat “ignore instructions,” requests for secrets/tools/other evidence, fake system messages, encoded directives, and authority assertions as evidence content, never commands.
- Provide no credentials, hidden prompts, cross-party data, arbitrary URLs, tool handles, filesystem paths, database handles, browser, shell, or network access in model context.
- Detect likely injection signals before and after the call. Detection is defense in depth; the true boundary is absent capability plus strict validation.
- If suspicious content cannot be safely isolated without losing material meaning, return an indeterminate/failed run and request human review.
- Render stored explanations as escaped text; never active HTML, Markdown links from untrusted URLs, formulas, terminal sequences, or executable instructions.
- Keep private chain-of-thought neither requested nor stored. Concise source-grounded explanations, limitations, and unresolved questions are sufficient.

## 7. Citations, contradictions, missing evidence, and uncertainty

Every `satisfied` or `not_satisfied` finding requires at least one valid supporting revision ID and must include every material conflicting revision supplied in the criterion projection. An `indeterminate` result cites relevant support/conflict when present and explicitly describes missing, stale, inaccessible, invalid, insufficient, or contradictory evidence. `not_applicable` is allowed only when the accepted criterion/policy permits it.

The validator independently checks citation membership and criterion/requirement binding; it does not ask the model whether a citation exists. Explanations may only make claims traceable to cited structured fields. A citation ID with an unsupported explanation is treated as citation fabrication and invalid output.

Confidence describes evidentiary support for this advisory assessment—not truthfulness, legal correctness, authority, permission, or execution readiness:

- `high`: complete, mutually consistent cited evidence and strong evaluation support under a calibrated configuration;
- `medium`: useful support with non-material limitations or calibration uncertainty;
- `low`: material gaps, conflicts, weak support, or provider uncertainty; and
- `not_assessed`: confidence was not validly produced.

No numeric probability is introduced until a founder-approved scale has calibration evidence and tested user meaning. Model self-reported confidence is an input to validation, not a trusted score. High confidence never changes authority or bypasses participant review, dispute, Financial Safety, or deterministic guards.

Material contradiction, required missing evidence, unknown source independence, unsupported/manual criteria, or inability to cite produces `indeterminate` and normally `request_human_review` or `request_evidence` according to the accepted policy. The model may not rank conflicting sources unless a transparent accepted deterministic precedence rule exists.

## 8. Timeouts, retries, cancellation, and failure behavior

Use layered configured deadlines: connection, provider response, and end-to-end run. Propagate one cancellation signal from client/server shutdown through the adapter. A cancelled or timed-out result cannot later complete a terminal/superseded run.

Retry only errors classified as transient before a valid response is accepted: connection reset, timeout where the provider confirms no durable operation matters, throttling, or provider 5xx. Use exponential backoff with bounded jitter, honor bounded `Retry-After`, and cap both attempts and total deadline. Authentication, permission, invalid request, context-too-large, safety refusal, schema violation, citation failure, or authority escalation are not retried automatically. Retries retain one run ID/idempotency scope and record attempt lineage/provider request IDs.

Provider work must not hold a database transaction open. Reserve a pending run/assessment with a lease, invoke the provider, then complete by compare-and-swap. Lease expiry permits bounded recovery; late results are discarded. Exact concurrent requests for the same actor/version/evidence-set/provider/prompt/policy tuple converge on one run or return `ASSESSMENT_ALREADY_RUNNING`.

### Fail-closed and deterministic fallback

The model path fails closed on outage, deadline, cancellation, malformed/partial output, unknown finish reason, budget exhaustion, citation fabrication, injection concern, authority language, or persistence failure. No model finding is completed and no downstream consequence is proposed automatically.

Fallback is policy-controlled, explicit, and observable:

- If every requested criterion is supported by the deterministic adapter, the orchestrator may run it as a **new attributable fallback attempt** under the same frozen inputs and persist only that deterministic assessment, labeled `deterministic` with fallback reason provenance.
- If deterministic evaluation does not support the inputs, persist a safe failed `AiRun`/attempt if that additive record has been implemented, then request human review or more evidence. The current assessment service creates only completed assessments after `evaluate`; it must not fabricate or partially persist an `Assessment` merely to record provider failure.
- Never translate malformed model prose into findings, accept a partial output, lower validation rules during outage, or silently present deterministic output as model output.
- No fallback on database/authorization/privacy failures; those stop the workflow.

Provider outage is therefore a loss of optional advisory capacity, not a relaxation of security or authority.

## 9. Budgets, limits, rate control, and cost

All limits are server configuration with conservative environment-specific defaults and hard maximums:

- input/output token ceilings with an output reserve;
- maximum criteria, evidence revisions per criterion, citations, strings, and serialized bytes;
- maximum estimated and actual cost per run plus daily environment/tenant circuit breakers;
- provider requests/minute, per-actor/agreement/session limits, and global concurrency;
- one active identical assessment tuple and bounded queued work;
- maximum attempts and end-to-end duration; and
- no streaming until partial-output, cancellation, logging, and validation semantics are designed.

Estimate tokens/cost before calling and reject over-budget input without provider contact. Do not auto-expand budgets, switch to an unapproved model, or drop conflicting evidence to fit. Record provider-reported usage and locally computed estimates without logging content. Cost is never accepted from the client or model as authoritative.

## 10. Version pinning and provenance

Record for every attempt:

- run/attempt IDs, actor purpose, environment, correlation/causation IDs;
- agreement/version/document digest and evidence-set ID/digest;
- provider kind/name, adapter version, requested model ID and provider-reported resolved model/version when available;
- prompt-template ID/version/digest and complete non-secret configuration digest;
- tool-contract, evidence projection/normalizer, policy, and output-schema versions;
- sampling parameters, deterministic seed when supported, and provider request/response IDs;
- input/output digests, status/failure reason, retry/fallback lineage;
- start/end times, latency, token counts, estimated/actual cost, finish reason; and
- injection, validation, citation, and escalation signals using bounded reason codes.

Do not store credentials, raw prompts, raw evidence/source bodies, unrestricted provider responses, or chain-of-thought in general provenance. Exact replay is guaranteed only for the deterministic adapter. A model run is traceable, not promised byte-reproducible.

## 11. Secrets and environment separation

- Credentials are server-side secret-manager/environment references, never source, client bundles, prompts, MCP messages, database rows, logs, errors, screenshots, or test fixtures.
- Use separate development, staging, and production provider projects/accounts, keys, quotas, allowlists, budgets, and telemetry. Never reuse production credentials locally.
- Local/test defaults to `deterministic_local` and must run with no provider key or network.
- Optional real-provider development mode requires an explicit flag plus a non-production credential. Missing/invalid configuration fails startup or model selection closed; it never falls back to an ambient credential.
- Staging uses synthetic or explicitly approved non-production data and production-like limits. Production enablement requires separate founder/security/privacy/operations approval.
- Define credential scope, rotation, revocation, incident ownership, and emergency disablement before any non-local rollout.

No `.env` file containing credentials is committed. Error objects and debug tooling must redact authorization headers, request bodies, and provider identifiers where they could expose tenancy.

## 12. Privacy, vendor data use, and observability

Send the minimum criterion-scoped, authorized data needed. Prefer opaque party labels and evidence IDs. Do not send unrelated terms, identity attributes, source secrets, precise location, or unrestricted attachments. Private evidence is not used for training by default.

Before enabling a vendor in any environment with non-synthetic data, document and approve: API data not used for training by default; retention/zero-retention setting where available; subprocessors; region/residency; encryption; access controls; deletion/incident terms; model-abuse monitoring implications; and contractual handling. If these cannot meet HMM policy, do not enable the provider.

Structured logs contain correlation/run IDs, coarse environment, provider/model version aliases, latency, status/error class, retry count, token/cost counters, evidence/criterion counts, output distribution, validation/injection signals, and review route. They exclude prompts, agreement JSON, evidence bodies/metadata values, names/emails, URLs, credentials, raw model output, and private reviewer content.

Metrics/alerts cover availability, latency, invalid/schema/citation rates, injection and authority-escalation attempts, fallback rate, human-review rate, token/cost budget, rate limiting, concurrency conflicts, and audit gaps. Diagnostic access follows least privilege, evidence visibility, retention, and attributable access logging.

## 13. Idempotency and concurrency

Assessment requests keep the existing actor/operation/agreement/version-scoped idempotency contract. The fingerprint includes evidence-set digest, provider/config/model alias, prompt/schema/policy/tool versions, and normalized request purpose. Exact replay returns the original authorized assessment. Same key with changed fingerprint fails.

Provider request idempotency headers are used when supported but do not replace HMM durability. Database uniqueness/lease/CAS is the final duplicate-completion defense. A retry or fallback never creates two completed assessments for one reserved run. A deliberate reassessment after new evidence, prompt, model, or policy version creates a new linked assessment and provenance chain.

Rate-limit and concurrency state must be durable or shared before multi-process production use; process-local guards remain acceptable only for local mode and must be labeled accordingly.

## 14. Human-review escalation rules

Request or recommend human review, without assigning a reviewer or recording a decision, when any applies:

- material conflict, missing required evidence, stale/inaccessible/invalid evidence, insufficient source independence, or unsupported/manual criterion;
- low or unassessed confidence, failed calibration threshold, or model/deterministic disagreement;
- timeout/outage with no supported deterministic fallback;
- malformed output, citation fabrication, injection signal, data-exfiltration attempt, or authority-escalation language;
- material provider/prompt/model version change awaiting evaluation;
- participant challenge, accepted-policy review trigger, high-impact/consequential outcome, or other existing Sprint 5.6 reason; or
- privacy/authorization ambiguity or inability to construct a complete minimized context.

The existing `requestHumanReview` service validates exact scope and route. The provider cannot create, assign, complete, or decide review records. Duplicate requests follow existing idempotency/deduplication rules.

Provider-specific triggers map into the existing bounded reason-code vocabulary rather than allowing model-authored reasons: malformed output, citation/injection/authority failures, disagreement, and provider failure map to `evaluator_failure`; missing/conflicting/unavailable evidence map to their existing evidence reason codes; privacy or authority ambiguity maps to `version_or_authority_unproven`; and consequential outcomes map to `consequential_outcome`. Any new reason code requires a separate domain, persistence, API, and migration review.

## 15. PostgreSQL/Prisma persistence

Reuse existing `EvidenceSet`, `Assessment`, `AssessmentFinding`, citation joins, `HumanReviewRequest`, idempotency, and audit records. Do not store provider output in a parallel assessment table.

Implementation may add an additive `AiRun`/`AiRunAttempt` relation only if needed for leases, retries, cost, failure status, and version provenance that current records cannot represent safely. Keep query-critical fields relational and bounded; use JSON only for validated small arrays/config snapshots. Use restrictive foreign keys to exact agreement/version/evidence-set/assessment scope, UTC timestamps, append-oriented attempt history, cleanup indexes, and no raw prompts, evidence blobs, secrets, embeddings, vector columns, or `ai_decisions`.

Any migration requires a separate implementation review, forward/roll-forward plan, Prisma/schema parity, disposable PostgreSQL migration validation, and contract/concurrency tests. This design adds no migration.

## 16. Test and evaluation strategy

### Contract and unit tests

- Deterministic adapter golden tests remain byte-stable and offline.
- Provider request mapper snapshots verify minimization, canonical ordering, delimiters, version pinning, and absence of secrets/tools/authority.
- Output validator rejects unknown/missing fields, invalid enums/types, duplicates, excessive lengths, invented criterion/requirement/evidence IDs, missing or contradictory citations, partial output, chain-of-thought, unsafe markup, and prohibited actions.
- Timeout, cancellation, retry classification/backoff, attempt cap, late-result discard, cost/token estimates, and circuit breakers use injected clocks/randomness.

### Adversarial evaluation corpus

Use synthetic fixtures covering direct/indirect prompt injection, encoded/Unicode/markup instructions, prompt extraction, cross-party exfiltration, arbitrary tool calls, citation fabrication, plausible-but-unsupported explanations, hidden conflicting evidence, schema smuggling, JSON prefix/suffix, excessive output, model refusal, and attempts to grant `record_resolution`, participant/reviewer authority, Financial Safety clearance, reviewer decisions, resolution, or settlement.

Also cover missing/stale/inaccessible/invalid evidence, conflicting sources, unknown independence, every allowed result and next action, locale variance, long-but-bounded input, provider outage/throttling/5xx, malformed/empty/truncated responses, and deterministic/model disagreement.

### Integration and persistence tests

- Fake provider adapter tests require no network and exercise success/failure/fallback through the existing evidence service.
- Exact replay, changed idempotency fingerprint, duplicate concurrent request, lease expiry, process restart, late result, fallback lineage, and transaction rollback produce one safe outcome.
- Real isolated PostgreSQL contract tests cover any later run/attempt schema and ensure no partial assessment/citations/audit.
- Assert the provider object graph and MCP registry have no resolution, reviewer-decision, Financial Safety, settlement, Prisma, shell, browser, filesystem, or unrestricted network capability.
- Logging tests prove redaction of credentials, prompts, evidence, identities, URLs, and raw responses.

### Quality gates

Before optional staging enablement, pin an evaluation set and thresholds for schema validity, citation precision/recall, criterion result agreement, contradiction detection, missing-evidence behavior, escalation recall, injection resistance, authority-boundary refusal, latency, token use, and cost. Compare against deterministic/manual expected outcomes and review errors by user group. A model/prompt/config change cannot roll out merely because aggregate accuracy improves if a dangerous-boundary regression occurs.

No live-provider test is required in the default test suite. An explicitly enabled, budget-capped, synthetic-data smoke test may run separately and must never be required for offline contributor success.

## 17. Rollout, kill switch, and recovery

1. Land contracts, fake provider, validator, and evaluations while deterministic remains the only enabled adapter.
2. Add the chosen provider adapter behind an off-by-default server feature flag and environment allowlist.
3. Run synthetic shadow evaluations; do not persist shadow output as participant-visible assessment or let it influence routing.
4. Enable staging for authorized synthetic test tenants with strict budgets and alerts.
5. After explicit approvals and passed gates, canary a small allowlisted production cohort; deterministic/manual review remains available.
6. Expand only while quality, privacy, security, cost, and latency thresholds hold.

The kill switch is server-controlled, audited, rapidly reversible, and disables new model calls globally or by provider/model/environment. It does not disable authorization checks, erase completed assessments, or silently switch labels. In-flight calls are cancelled where possible and late results rejected. Recovery routes new eligible requests to deterministic fallback or human review under the rules above.

Rollback pins the last approved provider/model/prompt/config bundle or disables the feature. Historical assessments retain exact provenance and remain readable according to authorization; they are never reinterpreted in place.

## 18. Future multi-provider seam

Keep one adapter registry keyed by reviewed server configuration and one selected provider per run. A future second provider can implement the same interface and evaluation suite. Do not build dynamic model auctions, autonomous routing, ensemble voting, provider-written fallback policy, or cross-provider prompt translation now.

Future routing may choose among approved adapters using deterministic environment/tenant capability, data-residency, availability, quality, and cost policy. The route, reason, versions, and fallback lineage must be recorded. Agreement/evidence/model content cannot select the route, and every provider must pass the same authority, privacy, citation, and structured-output gates.

## 19. Risks and mitigations

- **Model prose is mistaken for authority.** Preserve separate records, fixed advisory labels, prohibited schema fields, strict validation, and independent resolution guards.
- **Prompt injection changes behavior or exfiltrates data.** Give the model no tools/secrets, separate instructions from data, minimize context, validate output, and escalate suspicious content.
- **Fabricated citations look grounded.** Restrict citations to exact frozen IDs and independently verify claim support against structured fields.
- **Fallback hides an outage or changes semantics.** Make fallback explicit, attributable, supported only for deterministic criteria, and never relabel it.
- **Retries duplicate/cost-amplify work.** Use one lease/idempotency scope, bounded attempts/deadline/backoff, provider idempotency where available, and cost circuit breakers.
- **Vendor retention or training violates expectations.** Require no-training-by-default and reviewed retention/region/contracts before non-synthetic data.
- **Provider/model drift breaks reproducibility.** Pin requested versions/config, record resolved identifiers, run regression gates, and retain a kill switch.
- **A generic abstraction overengineers the first integration.** Keep the existing port, one adapter, one schema, no direct tools, and no routing platform.
- **Deterministic tests become network-dependent.** Keep deterministic/fake adapters as defaults; isolate optional synthetic smoke tests.
- **Observability leaks private evidence.** Log references, counts, digests, and bounded reason codes—not content.

## 20. Founder decisions and approvals

No founder decision is required to approve this design-only document. The following implementation/production choices genuinely require approval before the corresponding step:

1. **Provider and data terms:** vendor, API product, region/residency, retention/zero-retention, no-training terms, subprocessors, contractual/privacy review, and permitted data classes.
2. **Model and operating envelope:** initial model/version, quality/security thresholds, per-run and aggregate cost limits, latency objective, and staging/production cohort.
3. **Fallback product policy:** whether supported deterministic fallback should run automatically after model failure or whether all such failures should go directly to human review. This design permits either while prohibiting silent fallback.
4. **Production retention/access:** `AiRun`/attempt retention, diagnostic access, deletion/legal-hold treatment, and incident-response ownership.
5. **Production enablement:** explicit approval after evaluation, security/privacy review, secret management, monitoring/playbooks, kill-switch drill, and operational ownership.

Direct model MCP tool use is not recommended or required for Sprint 6.1. Changing that decision is a separate architecture/security approval, not a hidden implementation choice.

## 21. Future implementation acceptance criteria

When implementation is separately authorized, Sprint 6.1 is complete only when:

- the existing deterministic adapter remains the default for local/tests and all prior tests stay green;
- the model adapter is optional, provider-neutral at the service boundary, off by default, and selected only by server configuration;
- prompts use one exact accepted version, one immutable evidence set, pinned policy/config/schema versions, minimized authorized context, and no direct model tools;
- structured output maps to existing advisory assessment semantics and rejects fabricated citations, schema violations, injection effects, and authority claims;
- timeout, cancellation, bounded retry/backoff, rate/concurrency, token/cost budgets, idempotency, leases, late-result rejection, outage, and explicit fallback behavior are tested;
- secrets remain outside source/prompts/storage/logs, environments are isolated, and vendor no-training/retention expectations are approved before private data;
- provenance and redacted observability are sufficient to trace model/prompt/tool/policy versions without storing raw sensitive content;
- human-review escalation, feature flag, rollout gates, kill switch, and rollback work without weakening authorization;
- no provider or MCP path can grant `record_resolution`, participant/reviewer authority, Financial Safety clearance, reviewer decisions, resolution, or settlement;
- no production credential, remote MCP, live connector, RAG/vector database, real-money/custody/payment/KYC/AML, production compliance, or autonomous settlement capability is introduced outside separately approved scope; and
- focused tests, PostgreSQL contracts if schema changes, repository tests, lint, typecheck, build, `git diff --check`, and documentation/security-boundary review pass.
