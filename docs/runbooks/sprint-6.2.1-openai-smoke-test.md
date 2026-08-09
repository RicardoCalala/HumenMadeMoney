# Sprint 6.2.1 OpenAI smoke-test runbook

This is a development-only, synthetic-only, one-call procedure. Preparation and preflight do not authorize a provider request. The provider remains disabled until the founder gives the exact fresh authorization required by the Sprint plan.

## Offline preparation

From `apps/web`, run `pnpm ai:smoke:dry-run`. It uses an in-memory fake transport, validates request construction, strict output, citation and claim support, advisory authority boundaries, budgets, and every kill switch, and reports `networkRequests: 0`.

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

4. After reviewing a passing record and confirming request count zero, invoke exactly once:

   ```sh
   pnpm ai:smoke:live -- --synthetic-only --founder-authorized-one-call
   ```

5. Immediately set the global kill switch true, stop the process, set all three enable flags false, unset the key, clear the model and allowlist, and delete or revoke the smoke-test key. Follow the cleanup checklist in `docs/sprints/sprint-6.2.1-smoke-test-plan.md`.

The live harness has no loop or retry runner, requires `maxAttempts=1`, accepts only the checked-in synthetic fixture, and prints only validated advisory status plus redacted run metadata. Any failure consumes the one-call authorization; do not invoke it again without a new authorization.
