# Sprint 6.2.1 — OpenAI Smoke-Test Plan

## 1. Status, purpose, and authorization boundary

**Status:** plan only; the test is disabled and no live call is authorized by this document.

This plan defines one manually invoked, development-only OpenAI Responses API smoke test of the credential-free adapter delivered in Sprint 6.2. Its purpose is to prove that the existing server boundary can send one minimized synthetic assessment, receive strict structured output, validate citations and claim support, capture redacted provenance, and stop safely. It does not approve credentials, dependencies, runtime changes, production use, private data, or a permanent model.

The founder must give a fresh, explicit authorization immediately before the live call after reviewing the completed preflight record. Preparing the project, transport, fixture, or environment is not authorization to call OpenAI. Automated tests and normal local development remain offline and credential-free.

### Success criteria

All of the following must be true:

1. Exactly one provider request is attempted in a separate non-production OpenAI project using only the fixture in section 7.
2. The request uses the Responses API, strict JSON Schema, `store: false`, no tools, and the approved provisional model.
3. The adapter accepts a response only if schema, criterion ordering, citation membership/binding, conflicts, claim support, markup/injection, and authority checks pass.
4. The accepted draft is advisory and matches the expected semantic result; normal model wording may vary.
5. Logs and the test report contain only redacted metadata/digests and no API key, authorization header, raw prompt, raw response, participant identity, private evidence, or chain-of-thought.
6. The request remains within the approved timeout, retry, token, concurrency, rate, latency, and cost ceilings.
7. The provider is disabled again and the smoke-test key is deleted or rotated immediately after evidence is collected.

Any extra request, non-synthetic input, invalid output, budget breach, unexpected retention/configuration, secret exposure, or authority-boundary signal makes the test unsuccessful and triggers cleanup.

## 2. Controlling sources and implementation baseline

This plan is subordinate to Sprint 6.1, Sprint 6.2, `docs/decisions/ai-provider-policy-v1.md`, the Product Bible, Engineering Playbook, Security Architecture, Privacy Model, and repository guidance. Those sources keep the provider optional, provider-neutral, advisory-only, minimized, independently validated, attributable, fail-closed, and separate from consequential domain services.

The current implementation provides `OpenAiAssessmentAdapter` behind `AdvisoryAssessmentProvider`, a transport interface, strict Responses API request/response types, `store: false`, no `tools`, model allowlisting, server-only configuration, validation, bounded execution, and deterministic fallback. It has no live transport registered by default. This plan does not change that code.

Current OpenAI documentation says API data is not used for training unless the customer opts in, default abuse-monitoring logs may retain customer content for up to 30 days, and `/v1/responses` may retain application state for at least 30 days by default; `store: false` and any approved project retention control must therefore be verified rather than assumed. Data residency availability and processing behavior vary by project region. API keys must remain server-side in an environment variable or secret manager. Record the review date and links in the preflight record:

- <https://developers.openai.com/api/docs/guides/your-data>
- <https://developers.openai.com/api/reference/overview#authentication>
- <https://developers.openai.com/api/docs/models/compare>

## 3. Exact preconditions

Before the founder may authorize the live call, Codex and the founder must confirm and record every item below:

- repository `main` is clean, current, and contains the Sprint 6.2 adapter tests;
- relevant credential-free tests pass; no test requires network access;
- `NODE_ENV=development`; production enablement remains rejected by configuration;
- a separate OpenAI project exists and is named clearly as non-production/smoke-test only;
- project membership is least-privilege and billing/spend controls are isolated from any production project;
- only the approved synthetic fixture is permitted; no customer, participant, production, private, regulated, payment, identity, or raw evidence data is allowed;
- the founder has reviewed the applicable OpenAI terms, Data Controls page, region/residency behavior, retention/abuse-monitoring setting, no-training status, and current subprocessor list;
- the chosen region is documented and acceptable for this synthetic test; if a desired residency or retention control is unavailable, the test either remains synthetic under an explicitly accepted default or does not run;
- data sharing/feedback/evaluation opt-ins that could use test content for model improvement are disabled for the project;
- a currently available Responses API model with strict Structured Outputs is selected provisionally and placed alone in the allowlist;
- pricing for that exact model/snapshot is recorded with an effective date and expressed in the adapter's configured minor-unit convention;
- the live transport has been separately reviewed and wired outside this plan without weakening the adapter boundary;
- the fixture and expected result have been reviewed, all enablement flags are still false, all kill switches have been tested without a provider call, and the key is not yet present in shell history, files, logs, screenshots, chat, or source control;
- the founder owns the development kill switch and is present for the one-call window; and
- the founder states explicit authorization for **one synthetic OpenAI request**, identifying the project, provisional model, fixture version, limits, and date/time.

No checkbox may be inferred from another. A failed or unknown precondition means no call.

## 4. Project, data-handling, and model decision

### Separate project

Create a new OpenAI API project dedicated to this smoke test. Do not reuse a personal default, shared staging, or production project. Give it a recognizable name such as `hmm-sprint-6-2-1-smoke-nonprod`, restrict membership, create a project-scoped standard/service-account key (not an organization admin key), and set the lowest practical project budget/rate controls. Archive the project after the test if it has no continuing approved development purpose.

### Synthetic-data-only scope

The allowlist contains only the fixture in section 7 and its generated opaque identifiers. Prohibited content includes real names, emails, addresses, account identifiers, customer agreements, production database values, private evidence, raw attachments, URLs, credentials, payment data, financial-account data, identity/KYC data, sanctions/fraud/AML signals, and data copied from real disputes. Synthetic data remains subject to minimization and redacted logging.

### Region, retention, no-training, and subprocessors

The preflight record must state: selected project region; whether regional storage and regional processing are both provided; organization and project retention-control values; `/v1/responses` behavior with `store: false`; default abuse-monitoring retention or approved Modified Abuse Monitoring/Zero Data Retention status; confirmation that API data is not used for training unless opted in; data-sharing opt-in state; current subprocessor review link/date; and the founder's accept/reject decision. Do not describe `store: false` as equivalent to Zero Data Retention.

Because the fixture is wholly synthetic, the founder may explicitly accept documented default retention for this single test. That acceptance does not approve non-synthetic data, staging, production, or future calls.

### Provisional model criteria

Choose at run time from current official OpenAI documentation. The candidate must:

- be available to the isolated project and selected region through `/v1/responses`;
- support strict Structured Outputs/JSON Schema for the request shape already implemented;
- support the configured input/output ceilings with predictable text-only behavior;
- require no tools, web search, files, background mode, conversation state, or fine-tuning;
- have published pricing that fits the ceiling and acceptable latency for a 15-second deadline;
- permit a pinned snapshot when available, or have its alias and resolved response model recorded; and
- be added explicitly to `HMM_AI_OPENAI_MODEL_ALLOWLIST` as the sole entry.

The selected identifier is provisional development configuration, not a permanent or production default. Model changes require a new review and authorization.

## 5. Transport recommendation

Use a **minimal hand-written HTTPS transport** for this one-call smoke test, implementing only `OpenAiTransport.createResponse` and `POST /v1/responses`. The repository already owns the request/response abstraction, schema, timeout signal, idempotency scope, and error classification; a narrow transport avoids adding and auditing a dependency solely for one request. It must send bearer authentication, JSON content type, the adapter-built body, the run ID as the reviewed idempotency/client request identifier where supported, and return only the bounded fields required by `OpenAiResponsesResponse`.

Review the official SDK again before broader integration. Prefer it later if it provides a concrete reviewed benefit in supported authentication, cancellation, response parsing, request-ID access, or API compatibility that outweighs dependency and supply-chain cost. Either choice stays behind `OpenAiTransport`; provider types must not enter domain code and tests must use a fake transport.

No transport implementation or dependency change is authorized by this plan.

## 6. Provisional one-call operating envelope

Use these development-only values, subject to confirming exact model pricing. They are intentionally below implementation hard maxima and do not establish production defaults:

| Control | Environment value | Smoke-test value |
| --- | --- | ---: |
| End-to-end timeout | `HMM_AI_TIMEOUT_MS` | `15000` ms |
| Maximum latency | `HMM_AI_MAX_LATENCY_MS` | `15000` ms |
| Maximum attempts | `HMM_AI_MAX_ATTEMPTS` | `1` (no retry) |
| Maximum input | `HMM_AI_MAX_INPUT_TOKENS` | `1500` tokens |
| Maximum output | `HMM_AI_MAX_OUTPUT_TOKENS` | `800` tokens |
| Global concurrency | `HMM_AI_MAX_CONCURRENT` | `1` |
| Request rate | `HMM_AI_MAX_REQUESTS_PER_MINUTE` | `1` |
| Estimated cost ceiling | `HMM_AI_MAX_ESTIMATED_COST_MINOR` | `1` minor unit (one cent if configured in USD cents) |
| Input price | `HMM_AI_INPUT_COST_MINOR_PER_MILLION` | exact approved model price, rounded up in the same minor unit |
| Output price | `HMM_AI_OUTPUT_COST_MINOR_PER_MILLION` | exact approved model price, rounded up in the same minor unit |

The founder must also set the OpenAI project budget to the lowest practical amount and verify the preflight estimate is at or below the one-minor-unit ceiling. If pricing cannot be represented accurately by the integer configuration, round upward; if the estimate does not fit, do not increase the ceiling during the run window—stop and revise this plan. `maxAttempts=1` means any transient failure ends the smoke test; it prevents an accidental second provider request.

### Feature flags and kill-switch order

Startup/configuration must pass in this order:

1. `NODE_ENV=development` (production is rejected).
2. `HMM_AI_KILL_SWITCH=false` (global).
3. `HMM_AI_ENVIRONMENT_KILL_SWITCH=false` (environment).
4. `HMM_AI_PROVIDER_ENABLED=true` and `HMM_AI_PROVIDER=openai` (registry/global provider gate).
5. `HMM_AI_OPENAI_KILL_SWITCH=false` then `HMM_AI_OPENAI_ENABLED=true` (provider gate).
6. `HMM_AI_OPENAI_MODEL_ALLOWLIST=<one-approved-model>` and `HMM_AI_OPENAI_MODEL=<same-model>`.
7. `HMM_AI_MODEL_KILL_SWITCH=false` then `HMM_AI_MODEL_ENABLED=true` (model gate).
8. `HMM_AI_PROMPT_VERSION=hmm-advisory-v1`, `HMM_AI_SCHEMA_VERSION=assessment-draft-v1`, and `HMM_AI_POLICY_VERSION=ai-provider-policy-v1`.
9. Apply the numeric limits above and externally inject `HMM_AI_OPENAI_API_KEY` last.

To stop new calls, set the narrowest applicable switch first for diagnosis (`HMM_AI_MODEL_KILL_SWITCH=true`, then provider, environment, global), or set `HMM_AI_KILL_SWITCH=true` immediately when scope is unknown or a secret/data/authority incident is suspected. Disablement order after the test is: global kill switch true; three enablement flags false; remove the key; clear model selection/allowlist; then restore kill-switch configuration to its documented disabled baseline only after confirming no process can call the provider.

## 7. Synthetic fixture and expected assessment

Fixture ID: `hmm-smoke-fixture-v1`. All identifiers and facts are invented.

- Agreement/version: `agr_smoke_001` / `ver_smoke_001`; accepted document digest is precomputed locally.
- Criterion `criterion_delivery`: “The synthetic design package is delivered on or before 2026-08-01.”
- Allowed results: `satisfied`, `not_satisfied`, `indeterminate`; evaluation mode is evidence-based advisory assessment.
- Requirement `requirement_delivery`: one valid `delivery_record` source, bound only to the criterion; on missing, request evidence; on conflict, request human review.
- Frozen set/revision: `evidence_set_smoke_001` containing `evidence_revision_smoke_001`.
- Permitted metadata only: `result="delivered"`, `deliveredAt="2026-07-31T18:00:00Z"`, `packageDigest="synthetic-sha256-001"`.
- Evidence state: available, integrity valid, validation valid, captured/observed timestamps synthetic and internally consistent.

Expected semantic structured assessment:

```json
{
  "findings": [{
    "criterionId": "criterion_delivery",
    "result": "satisfied",
    "supportingEvidenceRevisionIds": ["evidence_revision_smoke_001"],
    "conflictingEvidenceRevisionIds": [],
    "evidenceRequirementIds": ["requirement_delivery"],
    "explanation": "The cited synthetic delivery record reports delivery before the criterion deadline.",
    "limitations": [],
    "claims": [
      {"evidenceRevisionId": "evidence_revision_smoke_001", "field": "result", "value": "delivered"},
      {"evidenceRevisionId": "evidence_revision_smoke_001", "field": "deliveredAt", "value": "2026-07-31T18:00:00Z"}
    ]
  }],
  "confidence": {
    "level": "high",
    "basis": ["The single required synthetic delivery record is valid and consistent."],
    "limitations": []
  },
  "limitations": [],
  "recommendedNextAction": "participant_review"
}
```

Exact prose and confidence may vary. Success requires the criterion/result, citation arrays, requirement binding, claim field/value pairs, and an allowed non-consequential next action to validate. The validator must reject invented IDs, a claim not exactly present in permitted metadata, omitted material conflict, duplicated/misbound citations, active markup, prompt/tool instructions, or authority language. A validator rejection is a successful fail-closed safety observation but not a successful end-to-end smoke result; do not make another live call under the one-call authorization.

## 8. Capability and authority prohibitions

The request contains no tool definitions and the model receives no MCP client, remote MCP server, tool choice, browser, shell, filesystem, database, connector, URL fetcher, callback, repository, session, or credential. HMM performs all input construction and validation.

The model and its output have no access or authority to create/assign/complete reviewer work; decide a review; grant participant, agent, organization, or `record_resolution` authority; change or clear Financial Safety; make identity, sanctions, fraud, AML, or compliance determinations; open/decide/cancel a resolution; create a settlement instruction; move, release, refund, or settle value; or invoke simulated execution. An assessment is advisory data only. Existing application services independently enforce authorization and every consequential gate.

## 9. Logging, provenance, and evidence collection

Capture only: local run/correlation IDs; environment; provider and adapter version; requested and provider-resolved model; prompt/schema/policy versions; input/output digests; completed/failed status and bounded failure code; attempt count; elapsed latency; provider-reported input/output tokens; locally estimated and reconciled cost; provider request ID (`x-request-id` when available and response ID as applicable); kill-switch state transition; and fallback route. Record configuration values but never the key.

Do not record raw prompts, evidence, responses, authorization headers, key fragments, participant data, URLs, chain-of-thought, or unrestricted error bodies. Console, test runner, proxy, tracing, analytics, terminal history, screenshots, and this document follow the same rule. The final report may include the validated structured fixture result because it is synthetic, but should prefer its digest and validation summary.

The current adapter exposes bounded in-memory `lastRunMetadata`; `AiRun` persistence remains deferred. Do not add persistence for this smoke test. Preserve a short founder-controlled redacted test record containing the preflight approvals, timestamps, metadata, validation outcome, cleanup confirmation, and credential deletion/rotation confirmation.

## 10. Failure scenarios and required response

- **Configuration/allowlist/production rejection:** no call; correct offline and repeat preflight.
- **Any kill switch active:** no call; do not bypass it during invocation.
- **Preflight token/cost/rate/concurrency failure:** no call; do not raise limits ad hoc.
- **Authentication/permission/model unavailable/invalid request:** fail closed; no retry and no second call.
- **Timeout, cancellation, 429, network error, or 5xx:** fail closed; `maxAttempts=1`, so do not retry.
- **Refusal, incomplete/failed status, missing output, malformed JSON/schema, unknown finish state:** reject the response and persist no completed model assessment.
- **Citation, conflict, or claim-support failure:** reject the entire draft; never repair model prose or accept partial findings.
- **Injection, active markup, secret/tool request, or authority escalation:** reject, activate the global kill switch, inspect only redacted metadata, and rotate/delete the key.
- **Late response after deadline/disablement:** discard it; it cannot complete a terminal or superseded run.
- **Eligible deterministic fallback:** if the orchestrator invokes it, record a separate `deterministic_local` result and failure lineage; never label it OpenAI. Otherwise route to evidence or human review. A fallback does not justify another provider call.
- **Possible secret or non-synthetic data exposure:** stop, activate global kill switch, remove/rotate the key, preserve redacted incident metadata, follow the repository incident process, and do not resume under this plan.

## 11. Founder/Codex runbook

### Phase A — offline preparation (no credential, no live transport call)

1. Codex confirms clean `main`, reads controlling documents and implementation, and records the commit under test.
2. Codex runs the credential-free adapter/config tests and `git diff --check`; the founder reviews any failure.
3. Codex prepares the exact fixture and verifies locally with the fake transport that request construction uses strict schema, `store: false`, no tools, and passes expected validation.
4. Codex verifies all three enablement flags are false and exercises all four kill switches without network access.
5. Founder creates/reviews the isolated project, access, project budget, region, retention, no-training/data-sharing state, subprocessors, model capability/availability/pricing, and records approvals.
6. Founder and Codex review the minimal transport implementation separately. This plan does not authorize creating it.
7. Codex prepares a redacted preflight sheet containing project ID/name (no key), model, snapshot/alias handling, fixture ID/digest, configuration, price date, maximum estimated cost, and exact command/process to invoke one test.

### Phase B — explicit authorization and one-call window

8. Founder reviews the preflight sheet and states: “I authorize one synthetic OpenAI Responses API call for Sprint 6.2.1 using project `<project>`, model `<model>`, fixture `hmm-smoke-fixture-v1`, and the limits in this plan.” Without that statement, stop.
9. Founder creates a least-privilege project-scoped smoke-test key. Inject it only into the server process as `HMM_AI_OPENAI_API_KEY` using an approved secret manager or a non-persistent, non-recorded process environment method. Never paste it into chat, a command captured in shell history, `.env`, source, fixtures, logs, or screenshots.
10. Codex applies the configuration in section 6, verifies the one-cent preflight ceiling, confirms the request counter is zero, and starts the bounded development process.
11. Codex invokes exactly one fixture assessment. Do not use a generic retrying task runner, watcher, CI job, or browser action that could repeat it.
12. Codex immediately prevents further calls by setting the global kill switch and stopping the process. It records only redacted metadata and validation outcome.

### Phase C — validation and cleanup

13. Codex confirms request count `<= 1`, attempts `= 1`, schema/citation/claim/authority validation result, tokens, latency, cost, requested/resolved model, request ID, and any fallback lineage.
14. Founder deletes the smoke-test key. If deletion cannot be confirmed immediately, rotate/revoke it and treat it as active until verified. Remove it from the process and approved secret store.
15. Codex confirms the three enablement flags are false, the key and model values are absent, no live process remains, automated tests are still credential-free, repository status contains no secret/runtime changes, and provider/project usage shows no unexpected request.
16. Founder either archives the isolated project or records why it remains, who owns it, its zero/lowest budget, and that future calls require separate authorization.
17. Codex produces a redacted report with success/failure, no-call or one-call count, validation, limits/actuals, cleanup, and any follow-up. A new plan/authorization is required for another live call.

## 12. Rollback and cleanup checklist

Rollback is configuration-only: activate `HMM_AI_KILL_SWITCH`, stop the process, set `HMM_AI_PROVIDER_ENABLED`, `HMM_AI_OPENAI_ENABLED`, and `HMM_AI_MODEL_ENABLED` to `false`, remove `HMM_AI_OPENAI_API_KEY`, clear model/allowlist values, and retain the deterministic provider as default. No database migration, deployment rollback, or model-generated state reinterpretation is permitted.

Before closing the test, verify:

- [ ] no more than one provider request/attempt occurred;
- [ ] key deleted/revoked and removed from every process/approved secret location;
- [ ] no credential, raw payload, or private data appears in Git, files, history, logs, traces, screenshots, chat, or test artifacts;
- [ ] all model flags are disabled and provider selection is inactive;
- [ ] deterministic tests remain offline and pass;
- [ ] project usage/cost agrees with recorded bounded metadata;
- [ ] unexpected provider application state is deleted where possible and retention limitations are recorded;
- [ ] the separate project is archived or left locked down with a documented owner and budget; and
- [ ] any incident/failure has an owner and no retry occurs without a new explicit founder authorization.

## 13. Exit decision

Passing this smoke test proves only that one synthetic request can cross the implemented boundary and return a valid advisory draft under the recorded configuration. It does not approve a second call, the official SDK, non-synthetic data, staging, production, a permanent model, production limits, MCP access, Financial Safety integration, reviewer automation, resolution, or settlement. Each requires its own reviewed change and approval.
