import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { OpenAiAssessmentAdapter } from "../server/evidence/openai-adapter.ts";
import { OpenAiHttpsTransport } from "../server/evidence/openai-https-transport.ts";
import { reportAdvisoryAction } from "../server/evidence/action-semantics.ts";
import { buildSmokeAuthorizationSnapshot, consumeSmokeAuthorization, finalizeSmokeAuthorization } from "../server/evidence/smoke-authorization.ts";
import { smokeActionExpectation, smokeFixtureId, smokeInput } from "../tests/fixtures/openai-smoke-fixture.ts";

const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
if (!process.argv.includes("--synthetic-only")) throw new Error("The explicit --synthetic-only argument is required.");
const authorizationPath = argument("--authorization-record"); const projectLabel = argument("--project-label");
if (!authorizationPath || !projectLabel) throw new Error("An authorization record and matching non-secret project label are required.");
const config = parseAiProviderConfig(process.env);
if (config.environment !== "development" || config.maxAttempts !== 1 || config.maxConcurrent !== 1 || config.maxRequestsPerMinute !== 1 || config.timeoutMs !== 15_000 || config.maxLatencyMs !== 15_000 || config.maxInputTokens !== 1_500 || config.maxOutputTokens !== 800 || config.maxEstimatedCostMinor !== 1) throw new Error("The Sprint 6.2.1 one-call envelope is not configured exactly.");
const snapshot = buildSmokeAuthorizationSnapshot(config, projectLabel, smokeFixtureId, smokeInput);
await consumeSmokeAuthorization(authorizationPath, snapshot);
const adapter = new OpenAiAssessmentAdapter(new OpenAiHttpsTransport(), config);
try {
  const draft = await adapter.evaluate(smokeInput);
  await finalizeSmokeAuthorization(authorizationPath, "completed");
  console.log(JSON.stringify({ fixture: smokeFixtureId, validated: true, ...reportAdvisoryAction(draft, smokeActionExpectation), metadata: adapter.lastRunMetadata }));
} catch (error) {
  await finalizeSmokeAuthorization(authorizationPath, "failed", error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "REDACTED_FAILURE");
  throw error;
}
