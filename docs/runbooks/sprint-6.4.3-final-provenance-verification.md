# Sprint 6.4.3 — final browser-backed OpenAI provenance verification

This is the final development-only, synthetic/non-sensitive verification of the Sprint 6.4.2 persistence fix. Preparation, inspection, preflight, and authorization-record creation do not themselves authorize a provider call. Never use customer/private data, a production credential, or more than one browser click. Do not update or backfill any prior immutable assessment.

## Frozen target and reviewed envelope

- Agreement: `agreement-simulated-execution-qa`
- Accepted version: `version-simulated-execution-qa-v1`
- Route: `http://localhost:3000/agreements/agreement-simulated-execution-qa`
- Local profile: Alex
- Fixture: `hmm-browser-assessment-fixture-v1`
- Criterion/requirement: `qa-criterion` / `qa-evidence-requirement`
- Frozen revision: `evidence-revision-simulated-qa`
- Provider/model: OpenAI / `gpt-4.1-mini-2025-04-14`
- Adapter: `openai-adapter-v2`
- Prompt/schema/policy: `hmm-advisory-v2` / `assessment-draft-v2` / `ai-provider-policy-v1`
- Claim/action/evidence contracts: `claim-reference-v1` / `advisory-action-v1` / `evidence-set-v1`
- Limits: input/output `1500`/`800` tokens; timeout/latency `15000` ms; attempts/concurrency/rate `1`; maximum estimated cost `1` cent
- Price inputs: `40`/`160` integer US cents per million input/output tokens

Credential-free inspection on 2026-08-09 produced this exact envelope:

```text
configuration  cf38e1caab4fe7f12f7466df1a54788bb8fc9f4c0b2586af29f724b62a0886a8
fixture        a5e31a2e07d2606fdfb6503831c6e99f76b1d387d760fb4fc0d5fbf72df813e0
document       f26350692fd589e6fae693a161278d7708c778f93b64a54a1aba20355b7720cf
evidence set   94f9f4c3f6cc8a8fc1ce482edce40fe5e19b36b8f2020d08a106a4485b0f0717
```

Any mismatch is a STOP. Re-run credential-free preparation and review the change; do not create, edit, or reuse an authorization record.

## Same private terminal: load, prepare, inspect, then authorize the record

Use a new private zsh terminal that is not recorded, starting in `apps/web`. Use the repository scripts below exactly: Prisma CLI seed discovery is intentionally not configured, so `pnpm prisma db seed` does not seed this fixture. The founder supplies a fresh isolated, non-production, project-scoped key. The hidden read is the first founder action; it does not echo the key, put it on a command line, or write it to a file. Replace only the non-secret project label and short expiry.

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
export HMM_CURSOR_SIGNING_SECRET='sprint-6.4.3-local-only-signing-secret'
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
export HMM_AI_BROWSER_AUTHORIZATION_RECORD=../../.hmm-product-assessment-authorizations/sprint-6.4.3-attempt.json

docker compose up -d --wait postgres
pnpm db:migrate
pnpm db:seed
pnpm db:seed:verify
pnpm ai:smoke:preflight -- --synthetic-only --browser-backed --ready-for-authorized-call
mkdir -p ../../.hmm-product-assessment-authorizations
pnpm ai:browser:authorize -- --synthetic-only --inspect-only \
  --record "$HMM_AI_BROWSER_AUTHORIZATION_RECORD" \
  --project-label "$HMM_AI_NON_SECRET_PROJECT_LABEL" \
  --fixture-id "$HMM_AI_BROWSER_FIXTURE_ID" \
  --agreement-id agreement-simulated-execution-qa \
  --version-id version-simulated-execution-qa-v1
```

The seed verifier must report the exact agreement/version, two required acceptances, only `evidence-revision-simulated-qa`, document digest `f26350692fd589e6fae693a161278d7708c778f93b64a54a1aba20355b7720cf`, and evidence-set digest `94f9f4c3f6cc8a8fc1ce482edce40fe5e19b36b8f2020d08a106a4485b0f0717`. It performs no provider operation and does not read an API key.

Confirm the four inspection digests exactly match the frozen values above and preflight reports zero requests. Then, and only after the founder gives a fresh authorization specifically to create the short-lived local one-time record for this reviewed envelope, create it:

```sh
pnpm ai:browser:authorize -- --synthetic-only \
  --record "$HMM_AI_BROWSER_AUTHORIZATION_RECORD" \
  --project-label "$HMM_AI_NON_SECRET_PROJECT_LABEL" \
  --fixture-id "$HMM_AI_BROWSER_FIXTURE_ID" \
  --agreement-id agreement-simulated-execution-qa \
  --version-id version-simulated-execution-qa-v1 \
  --expires-at '<FUTURE RFC3339 TIMESTAMP, NO MORE THAN 20 MINUTES AWAY>'
stat -f '%Sp %N' "$HMM_AI_BROWSER_AUTHORIZATION_RECORD"
git check-ignore "$HMM_AI_BROWSER_AUTHORIZATION_RECORD"
node --input-type=module -e 'import{readFile}from"node:fs/promises";const r=JSON.parse(await readFile(process.argv[1],"utf8"));const expected={status:"authorized",consumedAt:null,model:"gpt-4.1-mini-2025-04-14",fixture:"hmm-browser-assessment-fixture-v1",configDigest:"cf38e1caab4fe7f12f7466df1a54788bb8fc9f4c0b2586af29f724b62a0886a8",fixtureDigest:"a5e31a2e07d2606fdfb6503831c6e99f76b1d387d760fb4fc0d5fbf72df813e0"};for(const[k,v]of Object.entries(expected))if(r[k]!==v)throw Error(`STOP: ${k} mismatch`);if(!r.authorizationId||!r.attemptId)throw Error("STOP: missing IDs");const ttl=Date.parse(r.expiresAt)-Date.now();if(!(ttl>0&&ttl<=1200000))throw Error("STOP: expiry outside supervised window");console.log(JSON.stringify({authorizationId:r.authorizationId,attemptId:r.attemptId,status:r.status,consumedAt:r.consumedAt,expiresAt:r.expiresAt,model:r.model,fixture:r.fixture,configDigest:r.configDigest,fixtureDigest:r.fixtureDigest},null,2))' "$HMM_AI_BROWSER_AUTHORIZATION_RECORD"
```

The file mode must be `-rw-------`; Git must report the path as ignored; the bounded output must show non-empty authorization/attempt IDs, `authorized`, `consumedAt: null`, a future expiry within 20 minutes, and the exact model, fixture, configuration digest, and fixture digest. The creation output must also show the exact agreement/version and document/evidence-set digests. Do not paste or inspect the full record. Never edit, replace, replay, or delete its permanent `.consumed` marker.

## Ready browser check and exact STOP

Start the server in that same terminal:

```sh
pnpm --filter web dev
```

Open the route, sign in as **Alex (local profile)**, and verify accepted Version 1; exact version ID; one ready frozen evidence revision; capability evidence digest; `Eligible`; `OpenAI development assessment`; budget `available`; enabled **Request AI Assessment**; advisory-only language; and no reviewer, Financial Safety, resolution, settlement, release/refund, or funds-movement authority.

**STOP HERE. Do not click.** The verified local record is necessary but not sufficient authorization for a live request. The founder must now give a separate, fresh statement authorizing exactly one browser-backed call. It must name the non-secret project label, pinned model, fixture, all four exact digests, the reviewed limits, and this agreement/version. Only after that statement, click **Request AI Assessment** exactly once. Do not double-click, refresh to retry, or make a second attempt if the request or validation fails.

## Immediate kill switch and key cleanup

Immediately after the single attempt, successful or not, stop the server and run in the same terminal:

```sh
export HMM_AI_KILL_SWITCH=true
export HMM_AI_PROVIDER_ENABLED=false HMM_AI_OPENAI_ENABLED=false HMM_AI_MODEL_ENABLED=false
unset HMM_AI_OPENAI_API_KEY HMM_AI_OPENAI_MODEL HMM_AI_OPENAI_MODEL_ALLOWLIST
unset HMM_AI_BROWSER_AUTHORIZATION_RECORD HMM_AI_NON_SECRET_PROJECT_LABEL HMM_AI_BROWSER_FIXTURE_ID
```

Delete/revoke the development key in the isolated OpenAI project. Confirm no provider-enabled process remains and all three enable flags are false. Do not retry. Keep the ignored authorization record as the local audit artifact.

## Read-only persistence verification

Keep PostgreSQL running temporarily. The query below is read-only and selects only bounded provenance and contract fields. Replace the two UUID placeholders with the IDs printed during record verification; do not read the key or full authorization record again.

```sh
docker compose exec -T postgres psql -U hmm -d hmm_local -P pager=off -v ON_ERROR_STOP=1 \
  -v authorization_id='<AUTHORIZATION UUID>' -v attempt_id='<ATTEMPT UUID>' -c "
SELECT id, agreement_id, version_id, status, adapter_kind, adapter_version,
       provider_class, provider_name, requested_model_version, resolved_model_version,
       model_version, prompt_version, schema_version, policy_version,
       claim_reference_contract_version, action_contract_version,
       evidence_canonicalization_version, configuration_digest,
       browser_authorization_id, browser_attempt_id, document_digest,
       evidence_set_digest, recommended_next_action, authority_safe,
       semantic_expectation_matched, acceptable_action_matched,
       fallback_from_provider, fallback_reason, failure_code
FROM assessments
WHERE browser_authorization_id = :'authorization_id'
  AND browser_attempt_id = :'attempt_id';

SELECT f.assessment_id, f.criterion_id, f.result, f.evidence_requirement_ids,
       s.evidence_revision_id AS supporting_evidence_revision_id,
       c.evidence_revision_id AS conflicting_evidence_revision_id
FROM assessment_findings f
LEFT JOIN assessment_finding_support s
  ON s.assessment_id=f.assessment_id AND s.criterion_id=f.criterion_id
LEFT JOIN assessment_finding_conflicts c
  ON c.assessment_id=f.assessment_id AND c.criterion_id=f.criterion_id
JOIN assessments a ON a.id=f.assessment_id
WHERE a.browser_authorization_id = :'authorization_id'
  AND a.browser_attempt_id = :'attempt_id';

SELECT id, adapter_kind, provider_class, provider_name, model_version,
       browser_authorization_id, browser_attempt_id
FROM assessments
WHERE agreement_id='agreement-simulated-execution-qa'
ORDER BY occurred_at, id;

SELECT column_name
FROM information_schema.columns
WHERE table_schema='public' AND table_name='assessments'
  AND column_name ~ '(raw|prompt_body|response_body|request_body|secret|credential|api_key)';
"
```

Exactly one row must match the authorization/attempt pair. It must be `completed`, `model`, `openai-adapter-v2`, `development_model`, provider name `openai`, requested model `gpt-4.1-mini-2025-04-14`, a non-null provider-returned resolved model equal to `model_version`, the exact prompt/schema/policy/contracts/canonicalization versions, configuration/document/evidence-set digests above, and the exact agreement/version. The finding must cite `evidence-revision-simulated-qa` for `qa-criterion` and retain `qa-evidence-requirement`; conflicting citations should be absent for the successful fixture.

`recommended_next_action` must be in the closed advisory enum, `authority_safe` must be true, and semantic/acceptable-action reporting must not imply consequential authority. There must be no reviewer decision, Financial Safety clearance mutation, resolution, authorization grant, settlement instruction/attempt, release, refund, or funds movement attributable to this assessment. The ordered list must keep the seeded deterministic assessment separate from the new OpenAI assessment. The sensitive-column query must return zero rows; schema and persistence deliberately contain no raw prompt, raw response, request/response body, credential, secret, or API-key field. Provider run/correlation identifiers may exist but raw provider content must not.

Do not change the prior immutable assessment even if it has legacy nullable provenance. A missing or incorrect field fails Sprint 6.4.3; it does not authorize a repair, backfill, or retry.

After read-only verification:

```sh
docker compose down
```

Provider gates remain disabled and the key remains unset/revoked.
