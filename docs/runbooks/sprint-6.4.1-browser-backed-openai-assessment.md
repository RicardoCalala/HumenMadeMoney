# Sprint 6.4.1 — browser-backed OpenAI development assessment

This runbook prepares exactly one development-only, synthetic/non-sensitive browser assessment. Preparation is not authorization. Stop before pressing **Request AI Assessment** until the founder has reviewed the ready page and explicitly authorized one call. Never use customer/private data or a production credential.

## Frozen PostgreSQL fixture

- Agreement: `agreement-simulated-execution-qa`
- Accepted version: `version-simulated-execution-qa-v1`
- Route: `http://localhost:3000/agreements/agreement-simulated-execution-qa`
- Local profile: Alex
- Fixture label: `hmm-browser-assessment-fixture-v1`
- Criterion/requirement: `qa-criterion` / `qa-evidence-requirement`
- Frozen revision: `evidence-revision-simulated-qa`
- Source: `qa-fixture-source`, `sourceRefKind=fixture`, standard sensitivity, synthetic local/test data

The authorization command computes the exact document and evidence-set digests from PostgreSQL and binds them to the one-time record. Any changed accepted version, revision membership, configuration, model, price, contract version, fixture label, or project label fails before transport construction.

## Reviewed non-secret envelope

Use the pinned `gpt-4.1-mini-2025-04-14` snapshot. Official OpenAI documentation reviewed 2026-08-09 lists Responses API and Structured Outputs support and text pricing of USD $0.40 input / $1.60 output per million tokens. The adapter prices are integer US cents per million tokens, so use `40` and `160`. With the 1,500/800 token ceilings, the upward-rounded maximum estimate is one cent.

- prompt `hmm-advisory-v2`
- schema `assessment-draft-v2`
- policy `ai-provider-policy-v1`
- claim references `claim-reference-v1`
- advisory actions `advisory-action-v1`
- evidence canonicalization `evidence-set-v1`
- timeout/latency `15000` ms; attempts/concurrency/rate `1`; input/output `1500`/`800`; maximum estimated cost `1` cent

## Same private terminal: prepare, authorize, and launch

Run from `apps/web` in a new private zsh terminal that is not recorded. Commands below do not echo or persist the key. Replace only the non-secret project label and expiry. Do not put the key on a command line or in a file.

```sh
unset HISTFILE
setopt NO_SHARE_HISTORY
umask 077
read -rs "HMM_AI_OPENAI_API_KEY?OpenAI development key (hidden): "
print
export HMM_AI_OPENAI_API_KEY

export NODE_ENV=development
export DATABASE_URL='postgresql://hmm:hmm_local_only@127.0.0.1:5432/hmm_local?schema=public'
export HMM_PERSISTENCE_ADAPTER=prisma
export HMM_AUTH_MODE=local_development
export HMM_CURSOR_SIGNING_SECRET='sprint-6.4.1-local-only-signing-secret'
export HMM_AI_ASSESSMENT_UI_ENABLED=true
export HMM_AI_PROVIDER=openai
export HMM_AI_CREDENTIAL_ENVIRONMENT=development
export HMM_AI_DATA_CLASSIFICATION=synthetic_non_sensitive
export HMM_AI_OPENAI_MODEL=gpt-4.1-mini-2025-04-14
export HMM_AI_OPENAI_MODEL_ALLOWLIST=gpt-4.1-mini-2025-04-14
export HMM_AI_PROMPT_VERSION=hmm-advisory-v2
export HMM_AI_SCHEMA_VERSION=assessment-draft-v2
export HMM_AI_POLICY_VERSION=ai-provider-policy-v1
export HMM_AI_TIMEOUT_MS=15000 HMM_AI_MAX_LATENCY_MS=15000 HMM_AI_MAX_ATTEMPTS=1
export HMM_AI_MAX_INPUT_TOKENS=1500 HMM_AI_MAX_OUTPUT_TOKENS=800
export HMM_AI_MAX_CONCURRENT=1 HMM_AI_MAX_REQUESTS_PER_MINUTE=1 HMM_AI_MAX_ESTIMATED_COST_MINOR=1
export HMM_AI_INPUT_COST_MINOR_PER_MILLION=40 HMM_AI_OUTPUT_COST_MINOR_PER_MILLION=160
export HMM_AI_KILL_SWITCH=false HMM_AI_ENVIRONMENT_KILL_SWITCH=false HMM_AI_OPENAI_KILL_SWITCH=false HMM_AI_MODEL_KILL_SWITCH=false
export HMM_AI_PROVIDER_ENABLED=true HMM_AI_OPENAI_ENABLED=true HMM_AI_MODEL_ENABLED=true
export HMM_AI_NON_SECRET_PROJECT_LABEL='<EXACT NON-SECRET PROJECT LABEL>'
export HMM_AI_BROWSER_FIXTURE_ID=hmm-browser-assessment-fixture-v1
export HMM_AI_BROWSER_AUTHORIZATION_RECORD=../../.hmm-product-assessment-authorizations/sprint-6.4.1-attempt.json

pnpm ai:smoke:preflight -- --synthetic-only --browser-backed --ready-for-authorized-call
mkdir -p ../../.hmm-product-assessment-authorizations
pnpm ai:browser:authorize -- --synthetic-only \
  --record "$HMM_AI_BROWSER_AUTHORIZATION_RECORD" \
  --project-label "$HMM_AI_NON_SECRET_PROJECT_LABEL" \
  --fixture-id "$HMM_AI_BROWSER_FIXTURE_ID" \
  --agreement-id agreement-simulated-execution-qa \
  --version-id version-simulated-execution-qa-v1 \
  --expires-at '<FUTURE RFC3339 TIMESTAMP WITHIN THE SUPERVISED WINDOW>'
stat -f '%Sp %N' "$HMM_AI_BROWSER_AUTHORIZATION_RECORD"
git check-ignore "$HMM_AI_BROWSER_AUTHORIZATION_RECORD"
pnpm --filter web dev
```

The authorization file must report `-rw-------`, be ignored by Git, and remain `authorized`. Record its non-secret `configDigest`, `fixtureDigest`, `documentDigest`, and `evidenceSetDigest`. Do not open or paste the JSON. The server atomically creates a permanent `.consumed` marker before transport construction and finalizes the record as `completed` or `failed`; a crash still prevents reuse.

Open the route, sign in as **Alex (local profile)**, and verify before the click:

- accepted Version 1 and `version-simulated-execution-qa-v1`;
- one ready frozen evidence revision and the capability evidence digest matching authorization output;
- `Eligible`, `OpenAI development assessment`, and operational budget `available`;
- the enabled **Request AI Assessment** button;
- advisory-only language and no reviewer, Financial Safety, resolution, settlement, release/refund, or funds-movement authority.

Stop here. A fresh founder statement must name the project label, pinned model, fixture, exact four digests, limits, and one browser-backed call. Then click exactly once.

## Immediate cleanup after the single attempt (or without clicking)

Stop the server, then in the same private terminal:

```sh
export HMM_AI_KILL_SWITCH=true
export HMM_AI_PROVIDER_ENABLED=false HMM_AI_OPENAI_ENABLED=false HMM_AI_MODEL_ENABLED=false
unset HMM_AI_OPENAI_API_KEY HMM_AI_OPENAI_MODEL HMM_AI_OPENAI_MODEL_ALLOWLIST
unset HMM_AI_BROWSER_AUTHORIZATION_RECORD HMM_AI_NON_SECRET_PROJECT_LABEL HMM_AI_BROWSER_FIXTURE_ID
docker compose down
```

Delete/revoke the development key in the isolated project. A failed call or validation result does not authorize a retry. Keep the ignored authorization record as the local audit artifact; do not commit it. Confirm no provider-enabled process remains and all three flags are false.
