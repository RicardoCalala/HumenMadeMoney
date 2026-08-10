import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DevelopmentAssessmentProviderSelector, developmentProviderCapability } from "../server/evidence/development-provider.ts";
import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { buildSmokeAuthorizationSnapshot, createSmokeAuthorization, readSmokeAuthorization } from "../server/evidence/smoke-authorization.ts";
import { smokeInput, smokeOutput } from "./fixtures/openai-smoke-fixture.ts";

const enabled = { NODE_ENV: "development", HMM_AI_ASSESSMENT_UI_ENABLED: "true", HMM_AI_PROVIDER_ENABLED: "true", HMM_AI_PROVIDER: "openai", HMM_AI_OPENAI_ENABLED: "true", HMM_AI_MODEL_ENABLED: "true", HMM_AI_OPENAI_API_KEY: "boolean-presence-sentinel", HMM_AI_CREDENTIAL_ENVIRONMENT: "development", HMM_AI_OPENAI_MODEL: "approved-development-model", HMM_AI_OPENAI_MODEL_ALLOWLIST: "approved-development-model", HMM_AI_DATA_CLASSIFICATION: "synthetic_non_sensitive", HMM_AI_BROWSER_AUTHORIZATION_RECORD: "/tmp/unused-authorization.json", HMM_AI_NON_SECRET_PROJECT_LABEL: "HMM development", HMM_AI_BROWSER_FIXTURE_ID: "hmm-browser-fixture", HMM_AI_KILL_SWITCH: "false", HMM_AI_ENVIRONMENT_KILL_SWITCH: "false", HMM_AI_OPENAI_KILL_SWITCH: "false", HMM_AI_MODEL_KILL_SWITCH: "false" } as NodeJS.ProcessEnv;

test("development OpenAI product selection requires every server-only gate", () => {
  assert.deepEqual(developmentProviderCapability(enabled, smokeInput), { providerClass: "development_model", providerLabel: "OpenAI development assessment", budgetState: "available", reasonCodes: [] });
  for (const [change, reason] of [[{ NODE_ENV: "production" }, "OPENAI_NOT_DEVELOPMENT"], [{ HMM_AI_ASSESSMENT_UI_ENABLED: "false" }, "OPENAI_UI_DISABLED"], [{ HMM_AI_PROVIDER_ENABLED: "false" }, "OPENAI_FLAGS_DISABLED"], [{ HMM_AI_OPENAI_API_KEY: "" }, "OPENAI_KEY_ABSENT"], [{ HMM_AI_CREDENTIAL_ENVIRONMENT: "production" }, "OPENAI_CREDENTIAL_NOT_DEVELOPMENT"], [{ HMM_AI_OPENAI_MODEL_ALLOWLIST: "approved-development-model,other" }, "OPENAI_MODEL_NOT_SOLE_ALLOWLISTED"], [{ HMM_AI_DATA_CLASSIFICATION: "customer" }, "OPENAI_DATA_NOT_SYNTHETIC"], [{ HMM_AI_BROWSER_AUTHORIZATION_RECORD: "" }, "OPENAI_AUTHORIZATION_ABSENT"], [{ HMM_AI_OPENAI_KILL_SWITCH: "true" }, "OPENAI_KILL_SWITCH"]] as const) assert.ok(developmentProviderCapability({ ...enabled, ...change }, smokeInput).reasonCodes.includes(reason));
});

test("blocked configurations select deterministic without constructing network transport", () => {
  let constructed = 0; const selector = new DevelopmentAssessmentProviderSelector({ ...enabled, HMM_AI_OPENAI_API_KEY: undefined }, () => { constructed++; throw new Error("network transport must not be constructed"); });
  assert.equal(selector.select(smokeInput).requestedProvider, "deterministic"); assert.equal(constructed, 0);
});

test("fully enabled synthetic development configuration registers injected fake transport only", () => {
  let constructed = 0; const selector = new DevelopmentAssessmentProviderSelector(enabled, () => { constructed++; return { createResponse: async () => ({ id: "fake", status: "failed" }) }; });
  const selected = selector.select(smokeInput); assert.equal(selected.requestedProvider, "openai"); assert.equal(constructed, 1); assert.equal(selected.provider.kind, "model");
});

test("browser model evaluation consumes one exact authorization before the fake transport", async () => {
  const directory = await mkdtemp(join(tmpdir(), "hmm-browser-authorization-")); const path = join(directory, "authorization.json"); let calls = 0;
  try {
    const env = { ...enabled, HMM_AI_BROWSER_AUTHORIZATION_RECORD: path }; const config = parseAiProviderConfig(env);
    const envelope = { input: { ...smokeInput, evidenceSetId: "browser-authorization-preview" }, uiEnabled: "true", credentialEnvironment: "development", dataClassification: "synthetic_non_sensitive" };
    const authorization = await createSmokeAuthorization(path, buildSmokeAuthorizationSnapshot(config, "HMM development", "hmm-browser-fixture", envelope), new Date(Date.now() + 60_000).toISOString());
    const selector = new DevelopmentAssessmentProviderSelector(env, () => ({ createResponse: async () => { calls++; return { id: "offline", model: config.model, status: "completed", output_text: JSON.stringify(smokeOutput) }; } }));
    const provider = selector.select(smokeInput).provider; await provider.evaluate(smokeInput); assert.equal(calls, 1); assert.equal((await readSmokeAuthorization(path)).status, "completed");
    const provenance = provider.completedRunProvenance?.(); assert.equal(provenance?.configurationDigest, authorization.configDigest); assert.equal(provenance?.authorizationId, authorization.authorizationId); assert.equal(provenance?.attemptId, authorization.attemptId); assert.equal(provenance?.adapterVersion, "openai-adapter-v2"); assert.equal(provenance?.requestedModelVersion, config.model); assert.equal(provenance?.resolvedModelVersion, config.model); assert.equal(provenance?.policyVersion, config.policyVersion);
    const failedProvider = selector.select(smokeInput).provider; await assert.rejects(() => failedProvider.evaluate(smokeInput)); assert.equal(calls, 1); assert.equal(failedProvider.completedRunProvenance?.(), undefined);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
