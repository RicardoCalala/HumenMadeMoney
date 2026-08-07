# Sprint 6.2 — OpenAI Provider Adapter Technical Design Summary

## 1. Status and purpose

This design selects OpenAI as the first **non-production development target** behind Human Made Money's existing provider-neutral advisory assessment seam. It authorizes no runtime change, dependency, credential, provider call, production model, or production enablement. The approved `docs/decisions/ai-provider-policy-v1.md`, Sprint 6.0 and 6.1 designs, and existing domain boundaries remain controlling.

The implementation objective, when separately authorized, is a small OpenAI-specific outer adapter that accepts one validated, minimized assessment envelope and returns one strict structured draft. Human Made Money continues to own authorization, accepted-version and evidence-set freezing, prompt policy, validation, fallback routing, persistence, review escalation, and every consequential action.

## 2. Scope and invariants

Sprint 6.2 covers the technical shape of:

- an OpenAI adapter behind the existing `AdvisoryAssessmentProvider`/`AssessmentAdapter` contract;
- off-by-default server configuration, feature flags, layered kill switches, and externally supplied development secrets;
- a Responses API structured-output boundary, subject to implementation-time confirmation against current official OpenAI documentation;
- minimized request construction from one exact accepted agreement version, one immutable evidence-set snapshot, and pinned policy context;
- strict output, schema, citation-membership, citation-binding, and claim-support validation;
- prompt-injection isolation, bounded execution, redacted provenance, explicit failure/fallback behavior, tests, evaluation, monitoring, rollout, rollback, and future second-provider compatibility.

The following invariants are absolute:

- The model produces an advisory assessment, never a verdict or decision.
- The provider receives no MCP tools, tool-choice capability, repository, database, browser, shell, filesystem, connector, credential, callback, or unrestricted network capability.
- Model output cannot grant participant, organization, agent, reviewer, or `record_resolution` authority; assign or decide human review; change or clear Financial Safety; resolve an agreement or dispute; create a settlement instruction; move value; release or refund funds; or invoke simulated or real settlement.
- Existing application services independently enforce membership, visibility, accepted-version scope, review, resolution, Financial Safety, and settlement boundaries. Provider output never bypasses them.
- Local development and automated tests remain deterministic, offline, and credential-free.

## 3. Existing seam and proposed architecture

The implementation must evolve, not replace, `apps/web/server/evidence/adapter.ts`. Today `AdvisoryAssessmentProvider` extends `AssessmentAdapter`, identifies `deterministic_local` or `future_model`, and returns the existing `AssessmentDraft`. Sprint 6.2 should preserve that provider-neutral application contract while adding a provider-neutral validated input and run controls already anticipated by Sprint 6.1.

```text
Authenticated assessment request
  -> EvidenceAssessmentService / assessment orchestrator
     -> prove actor, active membership, visibility, accepted version
     -> derive requirement states and freeze immutable evidence set
     -> build canonical minimized ValidatedAssessmentInput
     -> reserve bounded run/attempt and select adapter from server config
        -> DeterministicAssessmentAdapter (local/test default)
        -> OpenAiAssessmentAdapter (explicit non-production flag only)
           -> OpenAI Responses API, strict structured output, no tools
     -> HMM schema + citation + claim-support + authority validation
     -> atomically persist advisory Assessment and redacted provenance
        or fail closed to supported deterministic fallback / evidence / review
```

`OpenAiAssessmentAdapter` is an outer infrastructure adapter. It translates the provider-neutral envelope and controls into the OpenAI wire format, authenticates the request, classifies the response or error, captures bounded usage metadata, and returns untrusted structured data for HMM validation. It must not load agreements or evidence, decide visibility, choose criteria, create reviews, persist assessments directly, or call resolution services.

The current `providerKind: "future_model"` may remain during the narrow implementation. A clearer provider-neutral discriminator such as `model` or `remote_model` may be considered only as an intentional contract change; provider marketing names do not belong in the core assessment enum. Model assessments must never be stored as `deterministic` or `manual`. If current persistence cannot represent them honestly, make an additive, separately reviewed domain/schema change rather than overloading an existing value.

### 3.1 Approved scalable operating model

Human Made Money uses **human-on-the-loop** operation: people oversee policy, alerts, exceptions, quality, and escalation boundaries; they do not approve every ordinary transaction or simulated execution. This is a scalability principle and future production hook, not authorization to add a queue, worker, compliance operation, payment rail, or real-value execution in Sprint 6.2.

The control plane remains strictly separated:

```text
AI or deterministic evidence assessment (advisory, sourced, untrusted)
  -> deterministic policy decision (eligibility and route)
     -> independent Financial Safety/compliance clearance
        -> separate deterministic settlement service
           -> simulated execution only in the current architecture
```

An assessment is not a policy decision. A policy decision is not compliance clearance. Compliance clearance is not execution. No record, score, confidence value, recommendation, or elapsed timer may substitute for the next boundary.

Future high-volume routing must use deterministic, server-owned rules:

- **Straight-through processing:** low-risk, fully verifiable, uncontested, policy-compliant **simulated** cases may proceed without per-case human approval only after every deterministic policy, authorization, review-window, Financial Safety, and execution guard passes.
- **Enhanced automated review:** cases needing additional evidence, validation, source-independence checks, or other deterministic checks remain non-executable while those checks run; failure to establish every required fact routes to more evidence or human review.
- **Human review:** disputes, conflicting or unclear evidence, unusual amounts or patterns, sensitive accounts, and system/provider/validation failures route to an authorized human case workflow. Humans review alerts and cases, not every transaction.
- **Compliance hold:** sanctions, fraud, AML, account-takeover, prohibited-use, or equivalent Financial Safety signals place or preserve a hold. A hold is not an accusation, never clears automatically from model output, and overrides timers, confidence, approvals, and otherwise eligible routing.

Future production operations may add deterministic case grouping, risk-based prioritization, duplicate-alert suppression, sampling and quality review of straight-through outcomes, and auditable escalation boundaries. Those hooks must preserve the underlying events and provenance, prevent suppression from hiding a materially different or worsening signal, define ownership and service levels, and make policy/routing changes versioned and reviewable. Sprint 6.2 implements none of that operations infrastructure.

Before any future automated execution, the deterministic policy and settlement services must independently prove at least:

1. the exact accepted agreement version and consequence snapshot are current and mutually consistent;
2. explicit action-, version-, and consequence-specific authority exists, including the established `record_resolution` and execution-authorization requirements where applicable;
3. the configured review window is closed;
4. no active dispute, appeal, cancellation, expiry, or required human review blocks the case;
5. Financial Safety is currently `clear`, with no sanctions, fraud, AML, account-takeover, prohibited-use, or other risk hold;
6. identity and account state are permitted under the applicable server-owned policy;
7. amount and velocity limits pass;
8. the destination is the unchanged, pre-approved destination fixed in the accepted version; and
9. every remaining version, evidence, authorization, economic-side, idempotency, concurrency, and settlement invariant passes immediately before execution.

The current settlement architecture remains simulation-only. These gates describe how a later system may scale safely; they do not claim that production identity, transaction monitoring, compliance clearance, custody, or payment execution exists.

## 4. Provider contract and OpenAI boundary

A compatible target shape is:

```ts
interface AdvisoryAssessmentProvider extends AssessmentAdapter {
  readonly providerKind: "deterministic_local" | "future_model";
  readonly providerName?: string;
  readonly providerVersion: string;
  evaluate(
    input: ValidatedAssessmentInput,
    controls: ProviderRunControls,
  ): Promise<ProviderAssessmentResult>;
}

interface ProviderRunControls {
  runId: string;
  correlationId: string;
  deadlineAt: string;
  signal: AbortSignal;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxEstimatedCostMinor: number;
}
```

The OpenAI adapter should use the Responses API with a strict JSON Schema response format and **no tools**. The exact endpoint fields, supported structured-output feature, request idempotency mechanism, usage fields, retention controls, and model snapshot semantics must be verified against official OpenAI documentation at implementation time because provider APIs change. The official OpenAI SDK may be used behind the outer adapter, subject to normal dependency and supply-chain review; it must not leak provider types into the application/domain contract or make tests require credentials or network access. Dependency installation is not part of this design.

The API key is read only by server composition, passed into the adapter as a private dependency, and used only in the authorization header. It must never enter the provider-neutral input, client bundle, prompt, assessment, database, audit event, error body, test fixture, screenshot, MCP message, or general log.

## 5. Server configuration, flags, and kill switches

All configuration is parsed once by a typed, fail-closed server-only loader. Unknown values, missing required values, malformed numbers, mutually inconsistent flags, or an OpenAI flag in production without a recorded approval must prevent model adapter registration rather than fall back to ambient settings.

Provisional names for implementation review are:

- `HMM_AI_PROVIDER_ENABLED=false` — global off-by-default gate;
- `HMM_AI_PROVIDER=openai` — explicit registry selection, never caller-controlled;
- `HMM_AI_OPENAI_ENABLED=false` — provider gate;
- `HMM_AI_OPENAI_API_KEY` — required only when the provider is explicitly enabled; supplied outside the repository;
- `HMM_AI_OPENAI_MODEL` — requested non-production model identifier or approved snapshot;
- `HMM_AI_OPENAI_MODEL_ALLOWLIST` — server-owned reviewed allowlist;
- `HMM_AI_PROMPT_VERSION`, `HMM_AI_SCHEMA_VERSION`, and `HMM_AI_POLICY_VERSION` — pinned configuration bundle;
- bounded timeout, retry, rate, concurrency, token, latency, and cost settings; and
- global, environment, provider, and model kill-switch state from a server-controlled operational source.

These names and every numeric value are provisional. No production model is selected here. Implementation may define a provisional non-production default only after confirming structured-output support, recording it as development-only, pinning or resolving its exact version when possible, and obtaining founder approval. Production must require an explicit model value and may not inherit a development default.

Selection is based only on reviewed server configuration and environment/tenant allowlists. Request bodies, agreement text, evidence, MCP arguments, and model output cannot select the provider, model, prompt, sampling parameters, budget, or fallback policy.

Kill switches must block new calls globally and by environment/provider/model, be auditable, and be testable without provider access. In-flight work is cancelled where supported; otherwise completion uses a run lease and compare-and-swap so disabled, cancelled, expired, or superseded runs reject late results. Killing OpenAI does not disable authorization, evidence, deterministic assessment, or human review.

## 6. Minimized request construction

The HMM orchestrator, not the OpenAI adapter or caller, creates a canonical immutable envelope. It contains only:

- opaque run/correlation references and deterministic request time;
- exact `agreementId`, accepted `versionId`, document digest, and schema version;
- immutable `evidenceSetId`, evidence-set digest, and canonicalization version;
- prompt-template, adapter, provider-config, policy, schema, and normalizer versions/digests;
- requested criterion IDs in canonical order, exact accepted criterion statements, allowed results, and evaluation mode;
- relevant evidence requirements, source constraints, derived requirement states, and accepted review route/policy context needed to recommend a next action;
- criterion-scoped authorized evidence projections with opaque revision IDs, fact classification, bounded source label, timestamps, availability, integrity, validation state, and only allowlisted normalized metadata fields; and
- explicit advisory-authority prohibitions and the output schema.

Exclude unrelated agreement sections, unnecessary participant identity, emails, credentials, session data, raw source bodies, unrestricted attachments, private payloads, URLs with secrets or query strings, private reviewer notes, other agreements, hidden operational policy, and evidence outside the authorized criterion projection. Highly sensitive evidence is excluded from the initial adapter. Synthetic data is preferred during development.

Canonical ordering, Unicode normalization, length/count/depth bounds, and typed serialization happen before token estimation. Oversized context fails closed or uses an approved deterministic criterion-scoped projection that preserves material contrary evidence. It is never silently truncated.

## 7. Prompt construction and injection isolation

Use fixed message sections with instruction/data separation:

1. immutable HMM system policy: advisory role, privacy, authority prohibitions, refusal behavior, and no chain-of-thought;
2. task contract: assess only supplied criteria and return only the schema;
3. accepted policy context: exact version, criteria, requirements, allowed results, and review behavior;
4. individually delimited typed evidence records labeled as untrusted data; and
5. output reminder: cite only supplied revision IDs, expose uncertainty, and request no tools or authority.

Agreement prose, evidence text/metadata, filenames, markup, encoded strings, prior model output, and provider output are untrusted data. They never become system/developer instructions or tool definitions. Normalize or reject dangerous control characters, bound nested content, escape active markup on display, and detect instruction-like, exfiltration, fake-role, prompt-extraction, encoded-directive, and authority-escalation signals before and after the call. Detection is defense in depth: the primary controls are absent capabilities, minimized context, fixed roles, and strict validation.

If suspicious content cannot be isolated without dropping material meaning, do not call the provider or accept its output; route to more evidence or human review with a bounded reason. Never request or retain private chain-of-thought. Store only concise, source-grounded explanations and limitations.

## 8. Strict output and independent validation

The provider result must map exactly to the existing `AssessmentDraft` and `CriterionFinding` semantics:

- exactly one finding for every requested criterion, in canonical order;
- result limited to `satisfied`, `not_satisfied`, `indeterminate`, or policy-permitted `not_applicable`;
- supporting and conflicting evidence revision IDs and evidence requirement IDs;
- bounded plain-text explanation and limitations;
- bounded confidence level/basis/limitations; and
- one existing advisory next action: `request_evidence`, `wait`, `request_human_review`, `participant_review`, or `no_action`.

Use provider-side strict JSON Schema as the first gate, then independently validate in HMM. Reject the entire result for missing/unknown fields, wrong types/enums/order/cardinality, duplicate findings or citations, excessive size, extra prefix/suffix text, truncation or unknown finish status, chain-of-thought, active markup, invented IDs, mixed accepted versions, prohibited actions, or authority claims. Partial output never becomes a completed assessment.

Citation validation has three independent layers:

1. **Membership:** every citation exists in the frozen evidence set.
2. **Binding:** the cited revision is authorized and bound to the finding's criterion and evidence requirement.
3. **Claim support:** every material factual statement in the explanation is supported by allowlisted structured fields from cited revisions; unsupported embellishment, source ranking, causality, identity, timing, or certainty invalidates the output.

Every `satisfied` or `not_satisfied` finding requires valid support and must surface all material conflicts included in the projection. `Indeterminate` describes relevant missing, stale, inaccessible, invalid, insufficient, conflicting, or independence-unproven evidence and cites what is available. `Not applicable` is accepted only when the exact policy permits it. The validator, not the model, computes citation membership and known conflict/missing-evidence conditions.

Model-reported confidence is advisory and untrusted. It never expresses legal correctness, truth probability, permission, or execution readiness and never changes authority. No numeric confidence threshold is introduced without calibration and founder approval.

## 9. Bounded execution and budgets

Enforce conservative configured controls before and around the call:

- connection, response, and end-to-end deadlines;
- cancellation propagation from request/server shutdown through the adapter;
- bounded attempts with exponential backoff and bounded jitter;
- bounded `Retry-After` handling;
- per-actor/tenant/provider rate and concurrency limits;
- input byte/token and output token limits;
- per-attempt, per-run, daily/environment, and aggregate cost ceilings;
- latency objectives and circuit-breaker thresholds; and
- one idempotency/run scope with attempt lineage and late-result rejection.

Retry only classified transient failures such as connection reset, throttling, or provider 5xx, within the same total deadline and budget. Authentication/permission/configuration errors, invalid requests, context-too-large responses, safety refusals, schema/citation/claim-support failures, injection concerns, and authority language are not automatically retried. Provider work must not hold an application database transaction open.

Pricing is configuration with an effective date and model mapping, never trusted from the model. Preflight estimates must fit the remaining ceiling; reconcile against provider usage when returned. Missing or unknown pricing fails closed for a cost-enforced environment. Because no production thresholds are approved, implementation defaults must be conservative, explicitly non-production, testable with injected clocks/randomness, and founder-approved before an optional real call.

## 10. Provenance, retention, and observability

Record only bounded, redacted provenance needed for attribution, evaluation, cost control, debugging, and incident response:

- run/attempt IDs, correlation ID, actor/purpose reference, and environment;
- agreement/version/evidence-set references and digests, not raw evidence;
- provider/adapter requested and resolved model identifiers when supplied;
- prompt/schema/policy/config/normalizer versions and digests;
- start/end time, latency, attempt/fallback lineage, token/usage and estimated/reconciled cost;
- provider request ID where safe, finish/status classification, validation result, bounded reason codes, and kill-switch state; and
- linked assessment or review reference when one is validly created.

Do not retain raw sensitive prompts, raw evidence, unrestricted responses, chain-of-thought, credentials, authorization headers, private payloads, source URLs, or unnecessary participant identifiers in application records, logs, analytics, traces, errors, fixtures, or MCP messages. If transient in-memory response handling is necessary for validation, discard it after bounded processing. Provider-side retention/training behavior must be explicitly reviewed; no non-synthetic data may be sent until no-training-by-default terms, bounded or approved zero retention, subprocessors, processing region/residency, access, deletion, and incident terms are approved.

Monitoring hooks should report aggregate availability, error class, schema/citation/claim-support failure rate, injection and authority-boundary signals, fallback/review routing, latency percentiles, tokens, cost, rate/concurrency saturation, late-result rejection, and kill-switch activity without content. Alerts require an owner and response playbook before production.

## 11. Failure routing and deterministic fallback

OpenAI timeout, cancellation, outage, throttling exhaustion, refusal, malformed/partial output, unknown finish state, budget exhaustion, schema/citation/claim-support failure, injection concern, authority claim, persistence conflict, or kill-switch transition fails closed. No invalid model finding is persisted as completed and no downstream consequence is authorized.

Deterministic fallback is allowed only when **every requested criterion is explicitly supported** by the deterministic adapter under the same frozen accepted version, evidence set, and policy. It may run automatically as a new attributable attempt, is labeled deterministic, records the provider-failure reason and lineage, and is never presented as OpenAI output. If any criterion is unsupported, do not produce a partial or mixed assessment: route to `request_evidence` when the accepted evidence policy identifies a remediable gap, otherwise request human review with the existing bounded reason vocabulary (normally `evaluator_failure`, evidence-specific reasons, or `version_or_authority_unproven`). Silent fallback is prohibited.

## 12. MCP, review, resolution, and Financial Safety boundaries

OpenAI receives no direct MCP tools. Existing local MCP remains a separate, authenticated, static verification-only facade; its registry denies resolution, authorization, reviewer assignment/decision, Financial Safety, settlement, URL, shell, browser, filesystem, and database capabilities. The provider does not call even currently permitted MCP tools such as assessment or human-review requests.

Only HMM application services may request human review, using exact scope and the existing reason-code vocabulary. The model cannot create, assign, complete, or decide a review. Assessment persistence creates no resolution proposal, authority grant, Financial Safety transition, settlement instruction, or simulated execution. Existing resolution orchestration must continue to require explicit accepted `record_resolution` authority, reviewer state where applicable, participant authorization, an uncontested review window, clear Financial Safety, idempotency, and every deterministic readiness guard independently of the assessment source.

At scale, application-owned routing may group related alerts into cases, prioritize them, suppress exact duplicates, and sample eligible straight-through results for quality review only under versioned deterministic policy. Those operations cannot be model-authored, cannot erase source events or audit history, cannot make a held or disputed case executable, and cannot let a sampled approval become authority for unsampled cases. Detailed case-management and compliance operations remain future work.

## 13. Credential-free tests and optional smoke test

Default local and automated tests use the deterministic adapter or a scripted fake OpenAI transport and require no network or credential. Add, when implementation is authorized:

- provider-neutral contract tests shared by deterministic and model adapters;
- request-mapper snapshots proving minimization, canonical ordering, version pinning, instruction/data separation, and absence of secrets/tools/authority;
- strict validator tests for schema smuggling, fabricated/misbound citations, unsupported claims, hidden conflicts, authority language, refusals, truncation, and oversized output;
- adversarial synthetic fixtures for direct/indirect/encoded injection, prompt extraction, cross-party exfiltration, fake roles, Unicode/markup attacks, tool requests, and prohibited resolution/Financial Safety/settlement actions;
- injected-clock tests for timeout, cancellation, retry/backoff/jitter, rate/concurrency, leases, circuit breakers, tokens, pricing/cost ceilings, kill switches, and late results;
- explicit fallback eligibility, attribution, disagreement, and fail-closed review/evidence routing tests;
- logging/redaction tests proving prompts, evidence, identities, URLs, secrets, and raw responses do not leak; and
- integration tests proving provider objects and MCP registries cannot reach repositories, resolution, reviewer decisions, Financial Safety, settlement, shell, browser, filesystem, databases, or unrestricted networks.

An optional manual smoke test is permitted only after the founder explicitly supplies a separate OpenAI development project/key outside the repository and approves the provisional model, synthetic dataset, region/retention settings, one-run budget, and kill switch. It is manually invoked, non-production, synthetic-only by default, budget-capped, never required for CI or contributor success, and reports redacted results. No credential is added to `.env` examples, source control, fixtures, or task output.

## 14. Rollout, canary, rollback, and monitoring hooks

1. Land provider-neutral controls, fake transport, mapper, validator, and evaluation corpus while deterministic remains the only enabled adapter.
2. Add the OpenAI adapter unregistered/off by default and verify kill-switch behavior without a network call.
3. With explicit founder approval, run a one-off synthetic smoke test in a separate development project.
4. Run synthetic shadow evaluation; shadow results are not participant-visible and do not affect routing.
5. Only after separate privacy/security/quality/operations approvals, allow staging for synthetic or explicitly approved minimized data and allowlisted test tenants.
6. Production canary and expansion require a later written approval covering provider terms, model/version, region, permitted data, thresholds, budgets, owners, alerts, incident response, retention, kill-switch drill, rollback, and cohort.

Rollback disables new model calls or pins the last approved provider/model/prompt/schema/policy/config bundle. Completed advisory assessments retain their exact redacted provenance and are not reinterpreted in place. Recovery routes new requests only through the explicitly approved deterministic fallback or human-review/evidence paths.

## 15. Future second-provider compatibility

Keep one provider-neutral input/result contract, validator, run-control contract, evaluation corpus, provenance vocabulary, and adapter registry. OpenAI-specific wire fields, headers, request IDs, finish reasons, usage translation, and error classification remain inside `OpenAiAssessmentAdapter` and its transport.

A future second provider implements the same contract and passes the same privacy, injection, citation, claim-support, authority, quality, budget, and failure tests. Do not build autonomous routing, provider auctions, ensemble voting, cross-provider prompt translation, or provider-selected fallback now. Any future routing is deterministic server policy based on approved environment/tenant capability, data residency, availability, quality, and cost; content and model output cannot select the route.

## 16. Explicitly out of scope

- Production OpenAI credentials, production enablement, a production model/version, or production numeric thresholds.
- Remote MCP hosting, direct model MCP access, third-party MCP clients, or model-driven tool loops.
- Live connectors, arbitrary URL retrieval, monitoring external sources, RAG, embeddings, or vector databases.
- Raw sensitive prompt/evidence retention, private raw evidence use, or provider training on HMM data.
- Real funds, custody, payment rails, transfers, release/refund execution, or autonomous settlement.
- KYC/AML, sanctions or transaction-monitoring providers, production compliance operations, or production Financial Safety operations.
- Production identity/account clearance, sanctions/fraud/AML/account-takeover/prohibited-use determinations, alert queues, case-management operations, or staffing/service-level design.
- Production credentials, payment-provider keys, custody credentials, or production customer/transaction data.
- Model authority over participants, reviewers, reviewer decisions, disputes, resolution, Financial Safety, settlement instructions, or settlement.
- Dependency installation, runtime implementation, database migration, deployment, credential creation, commit, or push.

## 17. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Provider-specific fields leak into the domain | Keep OpenAI wire mapping/error translation in the outer adapter; share HMM input/result contracts and validators. |
| A model/version alias drifts | Prefer approved snapshots where supported; record requested/resolved identifiers; gate changes with regression evaluation and rollback. |
| Structured JSON appears trustworthy | Treat it as untrusted; apply independent schema, citation, claim-support, conflict, and authority validation. |
| Prompt injection changes behavior or exfiltrates data | Minimize context, separate instruction/data, supply no tools/secrets, bound content, detect signals, and fail closed. |
| Fabricated citations create false confidence | Restrict to frozen IDs and independently check membership, binding, material conflicts, and field-level support. |
| Retries amplify cost or duplicate results | One run scope, leases, bounded attempts/deadline/backoff, rate/concurrency/cost ceilings, and late-result rejection. |
| Fallback hides an outage or changes semantics | Require full deterministic support, a separate labeled attempt, visible lineage, and the approved automatic-eligibility routing policy. |
| Logs or provider retention expose private evidence | Store digests/references and bounded codes only; prohibit raw prompt/evidence/response retention; approve vendor terms before non-synthetic use. |
| Advisory output is mistaken for execution authority | Fixed advisory schema/labels, absent capabilities, output rejection, and unchanged review/resolution/Financial Safety/settlement guards. |
| A provisional development model becomes an accidental production default | Require explicit production model configuration and later approval; reject development defaults in production. |
| High volume is mistaken for permission to bypass controls | Use human-on-the-loop exception oversight while deterministic policy, Financial Safety, and settlement services revalidate every case; never let throughput weaken a gate. |
| Alert suppression hides distinct or escalating risk | Preserve source events, suppress only policy-defined duplicates, re-open on material change, and audit grouping, priority, suppression, sampling, and escalation decisions. |

## 18. Approved defaults and setup required before implementation

OpenAI as the first non-production adapter, the Responses API, continued provider neutrality, human-on-the-loop operations, automatic eligible deterministic fallback, advisory-only model authority, use of synthetic/minimized non-sensitive development data, and optional use of the official OpenAI SDK behind the adapter are approved design defaults. The founder owns the development kill switch and development incident response. Before implementing or making an optional real call, setup still requires:

1. **OpenAI project and development data terms:** create/confirm a separate non-production project; approve processing region/residency, no-training treatment, retention/zero-retention choice, subprocessors, and the synthetic/minimized non-sensitive data allowlist.
2. **Provisional non-production model/config bundle:** model identifier or snapshot, prompt/schema/policy versions, and any sampling configuration. This is not a production-model approval.
3. **Development operating envelope:** explicit timeout/retry, rate/concurrency, input/output token, latency, per-run/daily cost limits, and smoke-test budget.
4. **Secret handling:** approve the external server-side secret store/injection method and who may access the development credential; no key may enter Git, a client, a fixture, or general logs.
5. **Implementation scope that changes persistence or dependencies:** decide whether an additive `AiRun`/attempt record is required and complete the normal dependency review if the official OpenAI SDK is selected.
6. **Production ownership:** before any production enablement, name security and privacy incident owners and approve escalation, monitoring, rollback, and kill-switch responsibilities.

Production provider terms, model/version, thresholds, retention/access, incident owners, rollout cohort, monitoring, rollback, and enablement remain separate later approvals.

## 19. Design review acceptance checklist

- Preserves the current provider-neutral assessment seam and deterministic local/test default.
- Places OpenAI-specific mapping and error handling only in an outer adapter.
- Keeps feature flags and kill switches server-controlled, off by default, and late-result safe.
- Uses only one exact accepted version, frozen evidence set, minimized authorized context, and pinned configuration.
- Requires strict structured output plus independent schema, citation, conflict, claim-support, injection, and authority validation.
- Bounds deadlines, cancellation, retries, backoff, rate/concurrency, tokens, latency, and cost.
- Stores redacted provenance without raw sensitive prompts/evidence/responses or secrets.
- Makes fallback explicit and full-criterion-only; otherwise fails closed to evidence or human review.
- Gives the model no MCP tools and no reviewer, resolution, Financial Safety, or settlement capability.
- Keeps assessment, deterministic policy decision, Financial Safety/compliance clearance, and settlement execution non-substitutable.
- Uses human-on-the-loop exception oversight: only fully guarded low-risk simulated cases may follow straight-through processing; evidence gaps, human-review triggers, and risk holds route safely.
- Leaves case grouping, prioritization, duplicate suppression, sampling/quality review, and escalation operations as auditable future hooks rather than implemented capabilities.
- Keeps tests offline and credentials optional and external.
- Defers production, remote MCP, live connectors, RAG/vector storage, real money, KYC/AML, and production compliance operations.
- Supports a later second provider without building speculative routing infrastructure.
