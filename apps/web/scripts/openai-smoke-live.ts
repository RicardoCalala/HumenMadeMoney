import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { OpenAiAssessmentAdapter } from "../server/evidence/openai-adapter.ts";
import { OpenAiHttpsTransport } from "../server/evidence/openai-https-transport.ts";
import { smokeFixtureId, smokeInput } from "../tests/fixtures/openai-smoke-fixture.ts";

if (!process.argv.includes("--founder-authorized-one-call") || !process.argv.includes("--synthetic-only")) throw new Error("Explicit founder authorization and synthetic-only arguments are required.");
const config = parseAiProviderConfig(process.env);
if (config.environment !== "development" || config.maxAttempts !== 1 || config.maxConcurrent !== 1 || config.maxRequestsPerMinute !== 1 || config.timeoutMs !== 15_000 || config.maxLatencyMs !== 15_000 || config.maxInputTokens !== 1_500 || config.maxOutputTokens !== 800 || config.maxEstimatedCostMinor !== 1) throw new Error("The Sprint 6.2.1 one-call envelope is not configured exactly.");
const adapter = new OpenAiAssessmentAdapter(new OpenAiHttpsTransport(), config);
const draft = await adapter.evaluate(smokeInput);
console.log(JSON.stringify({ fixture: smokeFixtureId, validated: true, advisoryOnly: draft.recommendedNextAction === "participant_review", metadata: adapter.lastRunMetadata }));
