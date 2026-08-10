import assert from "node:assert/strict";
import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { buildOpenAiRequest, OpenAiAssessmentAdapter, ProviderAssessmentError, validateOpenAiDraft, type OpenAiTransport } from "../server/evidence/openai-adapter.ts";
import { smokeFixtureId, smokeInput, smokeOutput } from "../tests/fixtures/openai-smoke-fixture.ts";

const env = { NODE_ENV: "test" as const, HMM_AI_PROVIDER_ENABLED: "true", HMM_AI_PROVIDER: "openai", HMM_AI_OPENAI_ENABLED: "true", HMM_AI_MODEL_ENABLED: "true", HMM_AI_OPENAI_API_KEY: "boolean-presence-sentinel", HMM_AI_OPENAI_MODEL: "approved-smoke-model", HMM_AI_OPENAI_MODEL_ALLOWLIST: "approved-smoke-model", HMM_AI_TIMEOUT_MS: "15000", HMM_AI_MAX_LATENCY_MS: "15000", HMM_AI_MAX_ATTEMPTS: "1", HMM_AI_MAX_INPUT_TOKENS: "1500", HMM_AI_MAX_OUTPUT_TOKENS: "800", HMM_AI_MAX_CONCURRENT: "1", HMM_AI_MAX_REQUESTS_PER_MINUTE: "1", HMM_AI_MAX_ESTIMATED_COST_MINOR: "1", HMM_AI_INPUT_COST_MINOR_PER_MILLION: "1", HMM_AI_OUTPUT_COST_MINOR_PER_MILLION: "1" };
const config = parseAiProviderConfig(env);
let calls = 0;
const fake: OpenAiTransport = { async createResponse() { calls++; return { id: "offline-response", model: "approved-smoke-model", status: "completed", output_text: JSON.stringify(smokeOutput), usage: { input_tokens: 1, output_tokens: 1 } }; } };
const request = buildOpenAiRequest(smokeInput, config);
assert.equal(request.store, false); assert.equal(request.tools, undefined); assert.equal(request.text.format.strict, true); assert.equal(request.max_output_tokens, 800);
validateOpenAiDraft(smokeOutput, smokeInput);
const result = await new OpenAiAssessmentAdapter(fake, config).evaluate(smokeInput);
assert.equal(result.recommendedNextAction, "participant_review"); assert.equal(calls, 1);
for (const change of [{ globalKillSwitch: true }, { environmentKillSwitch: true }, { openAiKillSwitch: true }, { modelKillSwitch: true }]) {
  const blocked: OpenAiTransport = { async createResponse() { throw new Error("network boundary reached"); } };
  await assert.rejects(() => new OpenAiAssessmentAdapter(blocked, { ...config, ...change }).evaluate(smokeInput), (error: unknown) => error instanceof ProviderAssessmentError && error.code === "KILL_SWITCH");
}
await assert.rejects(() => new OpenAiAssessmentAdapter(fake, { ...config, maxEstimatedCostMinor: 0 }).evaluate(smokeInput), (error: unknown) => error instanceof ProviderAssessmentError && error.code === "BUDGET");
console.log(JSON.stringify({ fixture: smokeFixtureId, mode: "offline-fake-transport", networkRequests: 0, requestConstruction: "pass", schema: "pass", frozenEvidenceSet: "pass", claimReferencesAndCanonicalResolution: "pass", advisoryAuthority: "pass", budgets: "pass", killSwitches: "pass" }));
