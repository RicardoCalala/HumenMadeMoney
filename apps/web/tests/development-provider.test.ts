import assert from "node:assert/strict";
import test from "node:test";
import { DevelopmentAssessmentProviderSelector, developmentProviderCapability } from "../server/evidence/development-provider.ts";
import { smokeInput } from "./fixtures/openai-smoke-fixture.ts";

const enabled = { NODE_ENV: "development", HMM_AI_ASSESSMENT_UI_ENABLED: "true", HMM_AI_PROVIDER_ENABLED: "true", HMM_AI_PROVIDER: "openai", HMM_AI_OPENAI_ENABLED: "true", HMM_AI_MODEL_ENABLED: "true", HMM_AI_OPENAI_API_KEY: "boolean-presence-sentinel", HMM_AI_CREDENTIAL_ENVIRONMENT: "development", HMM_AI_OPENAI_MODEL: "approved-development-model", HMM_AI_OPENAI_MODEL_ALLOWLIST: "approved-development-model", HMM_AI_DATA_CLASSIFICATION: "synthetic_non_sensitive", HMM_AI_KILL_SWITCH: "false", HMM_AI_ENVIRONMENT_KILL_SWITCH: "false", HMM_AI_OPENAI_KILL_SWITCH: "false", HMM_AI_MODEL_KILL_SWITCH: "false" } as NodeJS.ProcessEnv;

test("development OpenAI product selection requires every server-only gate", () => {
  assert.deepEqual(developmentProviderCapability(enabled, smokeInput), { providerClass: "development_model", providerLabel: "OpenAI development assessment", budgetState: "available", reasonCodes: [] });
  for (const [change, reason] of [[{ NODE_ENV: "production" }, "OPENAI_NOT_DEVELOPMENT"], [{ HMM_AI_ASSESSMENT_UI_ENABLED: "false" }, "OPENAI_UI_DISABLED"], [{ HMM_AI_PROVIDER_ENABLED: "false" }, "OPENAI_FLAGS_DISABLED"], [{ HMM_AI_OPENAI_API_KEY: "" }, "OPENAI_KEY_ABSENT"], [{ HMM_AI_CREDENTIAL_ENVIRONMENT: "production" }, "OPENAI_CREDENTIAL_NOT_DEVELOPMENT"], [{ HMM_AI_OPENAI_MODEL_ALLOWLIST: "approved-development-model,other" }, "OPENAI_MODEL_NOT_SOLE_ALLOWLISTED"], [{ HMM_AI_DATA_CLASSIFICATION: "customer" }, "OPENAI_DATA_NOT_SYNTHETIC"], [{ HMM_AI_OPENAI_KILL_SWITCH: "true" }, "OPENAI_KILL_SWITCH"]] as const) assert.ok(developmentProviderCapability({ ...enabled, ...change }, smokeInput).reasonCodes.includes(reason));
});

test("blocked configurations select deterministic without constructing network transport", () => {
  let constructed = 0; const selector = new DevelopmentAssessmentProviderSelector({ ...enabled, HMM_AI_OPENAI_API_KEY: undefined }, () => { constructed++; throw new Error("network transport must not be constructed"); });
  assert.equal(selector.select(smokeInput).requestedProvider, "deterministic"); assert.equal(constructed, 0);
});

test("fully enabled synthetic development configuration registers injected fake transport only", () => {
  let constructed = 0; const selector = new DevelopmentAssessmentProviderSelector(enabled, () => { constructed++; return { createResponse: async () => ({ id: "fake", status: "failed" }) }; });
  const selected = selector.select(smokeInput); assert.equal(selected.requestedProvider, "openai"); assert.equal(constructed, 1); assert.equal(selected.provider.kind, "model");
});
