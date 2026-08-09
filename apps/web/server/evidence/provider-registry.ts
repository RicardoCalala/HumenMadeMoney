import type { AdvisoryAssessmentProvider } from "./adapter.ts";
import { DeterministicAssessmentAdapter } from "./adapter.ts";
import { parseAiProviderConfig } from "./ai-config.ts";
import { OpenAiAssessmentAdapter, type OpenAiTransport } from "./openai-adapter.ts";
import { OpenAiHttpsTransport } from "./openai-https-transport.ts";

export function selectAdvisoryAssessmentProvider(env: NodeJS.ProcessEnv, dependencies: { openAiTransport?: OpenAiTransport } = {}): AdvisoryAssessmentProvider {
  const config = parseAiProviderConfig(env);
  if (!config.enabled) return new DeterministicAssessmentAdapter();
  if (config.provider !== "openai") throw new Error("AI_PROVIDER_REGISTRATION_FAILED");
  return new OpenAiAssessmentAdapter(dependencies.openAiTransport ?? new OpenAiHttpsTransport(), config);
}
