# Sprint 6.4 — Development OpenAI Product Integration

## Outcome

The existing **Request AI Assessment** browser action remains a `versionId`-only request. Server composition now selects the credential-free deterministic evaluator by default and may select the OpenAI Responses adapter only for an explicitly configured development, synthetic-only envelope. The browser never selects a provider and never receives a credential, prompt, raw response, MCP handle, or provider configuration.

OpenAI selection requires every gate to pass: `NODE_ENV=development`; `HMM_AI_ASSESSMENT_UI_ENABLED=true`; explicit `HMM_AI_PROVIDER=openai`; all three provider enable flags; all four kill switches false; one selected model that is the sole allowlisted model; external key presence; `HMM_AI_CREDENTIAL_ENVIRONMENT=development`; `HMM_AI_DATA_CLASSIFICATION=synthetic_non_sensitive`; and an exact accepted version whose frozen, standard-sensitivity evidence consists only of fixture sources. The adapter then independently enforces token, rate, concurrency, latency, retry, and estimated-cost budgets.

Blocked OpenAI configuration is safely reported as reason codes and selects deterministic evaluation. No configuration values or secrets are returned. A failure after an OpenAI attempt uses the approved fail-closed orchestrator: deterministic fallback is allowed only when every criterion is explicitly deterministic, is stored as local deterministic output with `fallbackFromProvider=openai` and a bounded reason, and is never presented as model output. Unsupported cases return a safe evidence or human-review route.

Completed model assessments use the same immutable version/evidence-set, finding, citation, confidence, limitation, action, and authority contract. Provenance stores provider, adapter, requested and resolved model, prompt/schema/policy/action/claim-reference versions, exact digests, and fallback lineage. No provider output can call MCP, Financial Safety, reviewer assignment/decision, authorization, resolution, settlement, release/refund, or funds movement.

## First real browser-backed development assessment

Implementation and offline validation do not authorize a provider call. The founder must complete all of these steps later:

1. Select a fresh key from a separate non-production OpenAI project. In a private terminal that is not recorded and has shell history disabled, load it directly into `HMM_AI_OPENAI_API_KEY` without echoing it, placing it on a command line, or writing it to a file.
2. Set `NODE_ENV=development`, `HMM_AI_ASSESSMENT_UI_ENABLED=true`, `HMM_AI_PROVIDER=openai`, `HMM_AI_CREDENTIAL_ENVIRONMENT=development`, and `HMM_AI_DATA_CLASSIFICATION=synthetic_non_sensitive`.
3. Set the reviewed model as both `HMM_AI_OPENAI_MODEL` and the sole entry in `HMM_AI_OPENAI_MODEL_ALLOWLIST`. Set pinned prompt/schema/policy versions, reviewed price inputs, and the conservative token, cost, timeout, rate, concurrency, latency, and one-attempt limits.
4. Explicitly set all four kill switches false, then enable `HMM_AI_PROVIDER_ENABLED`, `HMM_AI_OPENAI_ENABLED`, and `HMM_AI_MODEL_ENABLED`.
5. Run the existing preflight and confirm it passes without revealing configuration values. Use only a seeded synthetic agreement whose accepted version and every frozen evidence revision are non-sensitive fixtures.
6. Give a new, explicit authorization for exactly one real browser-backed OpenAI development assessment. The authorization must name the reviewed model/configuration and synthetic fixture scope. Configuration or preflight alone is not authorization.
7. Start the development server in that same private environment and click **Request AI Assessment** once. Inspect persisted requested/resolved model provenance, exact document/evidence digests, citations, action semantics, `authoritySafe`, confidence, uncertainty, and limitations. Immediately disable the three enable flags or engage the kill switch after the single call.

Any changed model, configuration bundle, fixture, evidence digest, or second call requires a separate fresh authorization. Production and non-synthetic/customer/private/sensitive data remain prohibited.

The exact browser-backed procedure and server-consumed one-time record are documented in `docs/runbooks/sprint-6.4.1-browser-backed-openai-assessment.md`.
