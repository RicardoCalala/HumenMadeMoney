import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { buildOpenAiRequest } from "../server/evidence/openai-adapter.ts";
import { smokeInput } from "../tests/fixtures/openai-smoke-fixture.ts";

const ready = process.argv.includes("--ready-for-authorized-call");
const syntheticOnly = process.argv.includes("--synthetic-only");
const browserBacked = process.argv.includes("--browser-backed");
const names = ["HMM_AI_PROVIDER_ENABLED", "HMM_AI_OPENAI_ENABLED", "HMM_AI_MODEL_ENABLED"] as const;
const switches = ["HMM_AI_KILL_SWITCH", "HMM_AI_ENVIRONMENT_KILL_SWITCH", "HMM_AI_OPENAI_KILL_SWITCH", "HMM_AI_MODEL_KILL_SWITCH"] as const;
const failures: string[] = [];
if (process.env.NODE_ENV !== "development") failures.push("NODE_ENV must be development.");
if (!syntheticOnly) failures.push("The explicit --synthetic-only argument is required.");
if (ready) {
  if (names.some((name) => process.env[name] !== "true")) failures.push("All three enable flags must be true.");
  if (switches.some((name) => process.env[name] !== "false")) failures.push("All four kill switches must be explicitly false.");
} else if (names.some((name) => process.env[name] === "true")) failures.push("Offline preflight requires all three enable flags disabled.");
if (process.env.HMM_AI_PROVIDER !== "openai") failures.push("HMM_AI_PROVIDER must be openai.");
if (browserBacked) {
  if (process.env.HMM_AI_ASSESSMENT_UI_ENABLED !== "true") failures.push("HMM_AI_ASSESSMENT_UI_ENABLED must be true.");
  if (process.env.HMM_AI_CREDENTIAL_ENVIRONMENT !== "development") failures.push("HMM_AI_CREDENTIAL_ENVIRONMENT must be development.");
  if (process.env.HMM_AI_DATA_CLASSIFICATION !== "synthetic_non_sensitive") failures.push("HMM_AI_DATA_CLASSIFICATION must be synthetic_non_sensitive.");
  if (!process.env.HMM_AI_BROWSER_AUTHORIZATION_RECORD || !process.env.HMM_AI_NON_SECRET_PROJECT_LABEL || !process.env.HMM_AI_BROWSER_FIXTURE_ID) failures.push("The browser authorization path, non-secret project label, and fixture ID are required.");
}
const allowlist = (process.env.HMM_AI_OPENAI_MODEL_ALLOWLIST ?? "").split(",").filter(Boolean);
if (allowlist.length !== 1 || allowlist[0] !== process.env.HMM_AI_OPENAI_MODEL) failures.push("The selected model must be the sole allowlisted model.");
const expected = { HMM_AI_TIMEOUT_MS: "15000", HMM_AI_MAX_LATENCY_MS: "15000", HMM_AI_MAX_ATTEMPTS: "1", HMM_AI_MAX_INPUT_TOKENS: "1500", HMM_AI_MAX_OUTPUT_TOKENS: "800", HMM_AI_MAX_CONCURRENT: "1", HMM_AI_MAX_REQUESTS_PER_MINUTE: "1", HMM_AI_MAX_ESTIMATED_COST_MINOR: "1" } as const;
for (const [name, value] of Object.entries(expected)) if (process.env[name] !== value) failures.push(`${name} must be ${value}.`);
if (!process.env.HMM_AI_INPUT_COST_MINOR_PER_MILLION || !process.env.HMM_AI_OUTPUT_COST_MINOR_PER_MILLION) failures.push("Approved model prices must be configured.");
let estimatedInputTokens: number | null = null; let estimatedCostMinor: number | null = null;
try {
  const config = ready ? parseAiProviderConfig(process.env) : parseAiProviderConfig({ ...process.env, HMM_AI_PROVIDER_ENABLED: "false", HMM_AI_OPENAI_ENABLED: "false", HMM_AI_MODEL_ENABLED: "false", HMM_AI_OPENAI_API_KEY: undefined });
  const request = buildOpenAiRequest(smokeInput, config); estimatedInputTokens = Math.ceil(JSON.stringify(request.input).length / 4); estimatedCostMinor = Math.ceil((estimatedInputTokens * config.inputCostMinorPerMillion + config.maxOutputTokens * config.outputCostMinorPerMillion) / 1_000_000);
  if (estimatedInputTokens > config.maxInputTokens || estimatedCostMinor > config.maxEstimatedCostMinor) failures.push("The synthetic request exceeds its token or estimated-cost budget.");
} catch (error) { failures.push(error instanceof Error ? error.message : "Configuration is invalid."); }
const report = { mode: ready ? "ready-for-authorized-call" : "offline-disabled", browserBacked, environment: process.env.NODE_ENV ?? null, syntheticOnly, model: process.env.HMM_AI_OPENAI_MODEL ?? null, allowlistCount: allowlist.length, enableFlags: Object.fromEntries(names.map((name) => [name, process.env[name] === "true"])), killSwitches: Object.fromEntries(switches.map((name) => [name, process.env[name] === "true"])), apiKeyPresent: Boolean(process.env.HMM_AI_OPENAI_API_KEY), productionEnabled: process.env.NODE_ENV === "production" && names.some((name) => process.env[name] === "true"), limits: expected, estimatedInputTokens, estimatedCostMinor, passed: failures.length === 0, failures };
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
