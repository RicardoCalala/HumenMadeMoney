# Sprint 6.2.1 OpenAI smoke-test runbook

This is a development-only, synthetic-only, one-call procedure. Sprint 6.2.3 uses `hmm-smoke-fixture-v2`, `hmm-advisory-v2`, and `assessment-draft-v2`: model output contains only HMM-issued `claimReferenceIds`, and HMM resolves canonical values from the frozen evidence set. Preparation and preflight do not authorize a provider request. The provider remains disabled until the founder gives the exact fresh authorization required by the Sprint plan. A chat statement records human intent, but the live harness accepts only a matching local one-time authorization record.

## Offline preparation

From `apps/web`, run `pnpm ai:smoke:dry-run`. It uses an in-memory fake transport, validates request construction, strict output, frozen-set citation and claim-reference support, canonical server-side resolution, advisory authority boundaries, budgets, and every kill switch, and reports `networkRequests: 0`.

Any authorization record created for fixture v1 or the v1 prompt/schema bundle is intentionally invalid for v2 because its configuration or fixture digest cannot match. Do not edit, replay, or replace an old record. A new record requires a new explicit live-call authorization; Sprint 6.2.3 itself creates none.

Run the disabled preflight with the selected approved model and exact reviewed prices in the server process environment. Do not set the key and keep `HMM_AI_PROVIDER_ENABLED`, `HMM_AI_OPENAI_ENABLED`, and `HMM_AI_MODEL_ENABLED` false. Set `NODE_ENV=development`, the provider/model/sole allowlist, pinned versions, all four kill switches, and the limits from the Sprint plan, then run:

```sh
pnpm ai:smoke:preflight -- --synthetic-only
```

The report contains only key presence as `apiKeyPresent: false`; it never prints a value. A passing offline record also proves there is no accidental production enablement and all three provider enable flags remain disabled.

## Later authorized one-call window

Do not perform this section without a fresh founder statement naming the non-production project, approved model, fixture `hmm-smoke-fixture-v1`, limits, and date/time.

1. In a new terminal that is not being recorded, disable shell history for the session. Securely read the project-scoped key without echoing it, then export it as `HMM_AI_OPENAI_API_KEY`. Do not put the value on a command line, in a file, or in chat.
2. Set `NODE_ENV=development`; the approved model as both `HMM_AI_OPENAI_MODEL` and the sole `HMM_AI_OPENAI_MODEL_ALLOWLIST`; the exact approved upward-rounded input/output prices; pinned prompt/schema/policy versions; the eight numeric limits in the Sprint plan; all four kill switches explicitly false; and only then all three enable flags true.
3. Run the boolean-only final preflight:

   ```sh
   pnpm ai:smoke:preflight -- --synthetic-only --ready-for-authorized-call
   ```

4. After reviewing a passing preflight and confirming request count zero, reflect the founder's fresh chat authorization into a local audit record. The record contains UUIDs, timestamps, the non-secret project label, model, fixture, limits, pinned versions, and SHA-256 configuration/fixture digests. It never contains an API key, project identifier, organization identifier, authorization header, billing credential, raw prompt, or model response. Choose a short expiry inside the supervised run window and a path under the ignored `.hmm-smoke-authorizations/` directory:

   ```sh
   mkdir -p ../../.hmm-smoke-authorizations
   pnpm ai:smoke:authorize -- --synthetic-only \
     --record ../../.hmm-smoke-authorizations/sprint-6.2.2.json \
     --project-label "<EXACT NON-SECRET PROJECT LABEL>" \
     --expires-at "<FUTURE RFC3339 TIMESTAMP>"
   ```

   Creation uses exclusive file creation and refuses to overwrite a record. Review its bounded summary and protect the local file as an audit artifact; do not add it to Git or paste it into chat.

5. Invoke the guarded command exactly once with that record and the same project label:

   ```sh
   pnpm ai:smoke:live -- --synthetic-only \
     --authorization-record ../../.hmm-smoke-authorizations/sprint-6.2.2.json \
     --project-label "<EXACT NON-SECRET PROJECT LABEL>"
   ```

6. Immediately set the global kill switch true, stop the process, set all three enable flags false, unset the key, clear the model and allowlist, and delete or revoke the smoke-test key. Follow the cleanup checklist in `docs/sprints/sprint-6.2.1-smoke-test-plan.md`.

The live harness has no loop or retry runner, requires `maxAttempts=1`, accepts only the checked-in synthetic fixture, and prints only validated advisory status plus redacted run metadata. Before constructing the HTTPS transport, it validates expiry and exact project/model/fixture/limit/version/digest equivalence, then atomically creates a permanent consumption marker and changes the record to `consumed`. Success or failure is finalized in the same record. A crash after consumption still leaves the marker, so exact reuse is rejected. Any attempted request consumes the one-call authorization; do not invoke it again without a new authorization.

## Claim-support contract

The model must bind each factual statement to a cited revision and permitted metadata field, copying the canonical JSON value verbatim without changing type, spelling, timestamp precision, or timezone notation. The validator remains fail-closed for fabricated citations, missing fields, altered values, type changes, inference, and authority escalation.

One deterministic equivalence is formally defined for metadata fields ending in `At` or `Timestamp`: two valid timestamp strings are equivalent only when they parse to the identical millisecond instant. This covers harmless `Z` versus `.000Z` formatting while rejecting changed instants, human-readable paraphrases, non-timestamp fields, and every other normalization.
