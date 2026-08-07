# AI Provider Policy v1 — Founder Decision

## Status and approval record

- **Status:** Approved for Sprint 6.1 development policy
- **Decision owner:** Founder
- **Approved:** 2026-08-06
- **Applies to:** Optional real-model advisory assessment development described in `docs/sprints/sprint-6.1-technical-design.md`
- **Production status:** Not approved; every production gate in this document remains required

## Scope

This decision authorizes implementation planning and development within the existing provider-neutral advisory assessment seam. It does not authorize a production provider, production model, API key, private-data rollout, runtime change by itself, or any expansion of model authority. The Sprint 6.1 technical design and repository sources of truth remain controlling where this policy does not make a decision.

## Decisions

1. **Provider-neutral and off by default.** Keep the application boundary provider-neutral. No production provider, model, project, or API key is selected or enabled. Local development and automated tests remain deterministic, offline, and credential-free.
2. **Isolated development access.** Real-provider development may use only a separate non-production provider project and a server-side credential stored outside the repository. It requires explicit configuration and must not reuse production credentials or depend on ambient credentials.
3. **Minimized permitted data.** Initial provider inputs exclude highly sensitive evidence, unrestricted attachments, private raw payloads, raw source bodies, secrets, and unrelated participant data. Send only authorized, criterion-scoped structured context with exact accepted-version and evidence-set references, validated citations, opaque identifiers where practical, and redacted provenance. Synthetic data is preferred during development.
4. **Vendor data-handling prerequisites.** Before any provider is enabled with non-synthetic data, approve no-training-by-default terms, bounded retention or an approved zero-retention setting, documented subprocessors, and an approved processing region/residency. If these requirements are not met, the provider stays disabled.
5. **Conservative configurable controls.** Require strict structured output; independent schema, citation-membership, and citation-support validation; bounded retries and end-to-end timeout; input/output token budgets; per-run and aggregate cost ceilings; rate and concurrency limits; and server-controlled feature flags and kill switches. Limits must be conservative, configurable, and enforced before or around the provider call. Any development numeric defaults are provisional and do not constitute production thresholds.
6. **Fail closed.** After provider failure, deterministic fallback may run only when every requested criterion is explicitly supported by the deterministic adapter, as a separately attributable attempt. Otherwise fail closed and route to more evidence or human review. Never accept partial or malformed model output, weaken validation, or silently relabel fallback output.
7. **Redacted AI-run records.** Retain structured, redacted provenance needed for attribution, validation, retry/fallback lineage, evaluation, cost, latency, and incident response. Do not retain unnecessary raw prompts, raw evidence, unrestricted responses, chain-of-thought, credentials, or private payloads. Diagnostic access is least-privilege, attributable, and auditable. Retention duration, deletion, export, and legal-hold behavior remain configurable pending production policy.
8. **Development incident authority.** The founder owns development incident response and has authority to use the kill switch. Production enablement requires named security and privacy incident ownership, escalation paths, and a tested response and rollback process.
9. **Advisory authority only.** A model or provider output cannot grant participant, reviewer, organization, agent, or `record_resolution` authority; change, clear, or bypass Financial Safety; assign a reviewer or make a reviewer decision; resolve a dispute or agreement; create a settlement instruction; move value; release or refund funds; or invoke settlement. Existing authorized domain services and human-review paths retain those responsibilities.
10. **Production is a separate approval.** Production enablement requires explicit review and approval of security, privacy, quality, cost, latency, evaluation results and thresholds, monitoring and alert ownership, incident readiness, rollout, kill-switch operation, and rollback. Approval must cover the selected provider, region, data classes, terms, model/version, operating limits, and production cohort.

## Non-decisions and deferred items

The following are intentionally not selected or approved by this decision:

- a production provider, API product, region, project/account, credential, model, or model version;
- production numeric thresholds for quality, security, citation performance, latency, tokens, cost, rates, concurrency, retries, or cohort size;
- production-permitted sensitive data classes or use of private raw evidence;
- production retention periods, diagnostic roles, deletion/export behavior, or legal-hold rules;
- production subprocessors, contractual terms, monitoring/abuse-retention settings, incident owners, or operational playbooks;
- production rollout, canary, expansion, or autonomous provider routing; and
- direct model access to MCP tools, resolution, reviewer-decision, Financial Safety, settlement, browser, shell, filesystem, production databases, payment providers, or unrestricted networks.

## Implementation gates

### Before an optional real-provider development call

- Preserve the existing provider-neutral adapter and deterministic local/test default.
- Use an explicit off-by-default server feature flag, non-production project, external server-side secret, synthetic or approved minimized data, strict validation, bounded controls, attributable provenance, and a working kill switch.
- Keep credentials, provider payloads, and sensitive content out of source control, client bundles, logs, errors, screenshots, fixtures, and MCP messages.

### Before staging or any non-synthetic data

- Approve the provider, region/residency, no-training terms, bounded retention, subprocessors, permitted data classes, access controls, deletion and incident terms.
- Pass the security, privacy, injection, authority-boundary, citation, structured-output, failure/fallback, quality, cost, latency, and redaction evaluations defined by the Sprint 6.1 design.

### Before production

- Record explicit founder, security, privacy, and operations approval for all deferred production choices.
- Name security/privacy incident owners; set reviewed numeric limits and evaluation thresholds; establish least-privilege diagnostics, monitoring, alerts, retention/deletion/legal-hold rules, rollout criteria, and rollback ownership.
- Demonstrate the feature flag, global/provider/model/environment kill switch, in-flight cancellation or late-result rejection, safe fallback/human-review route, and rollback in a production-like environment.

Production remains disabled until every production gate is satisfied and recorded in a later approval.
