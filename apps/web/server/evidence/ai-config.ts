export const AI_PROVIDER_DISABLED = "AI_PROVIDER_DISABLED";

export interface AiProviderConfig {
  environment: "development" | "test" | "production";
  enabled: boolean;
  provider: "openai" | null;
  openAiEnabled: boolean;
  modelEnabled: boolean;
  apiKey?: string;
  model?: string;
  modelAllowlist: readonly string[];
  promptVersion: string;
  schemaVersion: string;
  policyVersion: string;
  timeoutMs: number;
  maxAttempts: number;
  maxConcurrent: number;
  maxRequestsPerMinute: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxLatencyMs: number;
  maxEstimatedCostMinor: number;
  inputCostMinorPerMillion: number;
  outputCostMinorPerMillion: number;
  globalKillSwitch: boolean;
  environmentKillSwitch: boolean;
  openAiKillSwitch: boolean;
  modelKillSwitch: boolean;
}

export class AiConfigurationError extends Error {
  readonly code = "AI_CONFIGURATION_INVALID";
}

const bool = (value: string | undefined, fallback: boolean, name: string) => {
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AiConfigurationError(`${name} must be true or false.`);
};

const integer = (value: string | undefined, fallback: number, min: number, max: number, name: string) => {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new AiConfigurationError(`${name} must be an integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) throw new AiConfigurationError(`${name} is outside the allowed range.`);
  return parsed;
};

const version = (value: string | undefined, fallback: string, name: string) => {
  const selected = value || fallback;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(selected)) throw new AiConfigurationError(`${name} is invalid.`);
  return selected;
};

export function parseAiProviderConfig(env: NodeJS.ProcessEnv): AiProviderConfig {
  const environment = (env.NODE_ENV || "development") as AiProviderConfig["environment"];
  if (!(["development", "test", "production"] as string[]).includes(environment)) throw new AiConfigurationError("NODE_ENV is invalid.");
  const enabled = bool(env.HMM_AI_PROVIDER_ENABLED, false, "HMM_AI_PROVIDER_ENABLED");
  const openAiEnabled = bool(env.HMM_AI_OPENAI_ENABLED, false, "HMM_AI_OPENAI_ENABLED");
  const modelEnabled = bool(env.HMM_AI_MODEL_ENABLED, false, "HMM_AI_MODEL_ENABLED");
  const provider = env.HMM_AI_PROVIDER === undefined || env.HMM_AI_PROVIDER === "" ? null : env.HMM_AI_PROVIDER;
  if (provider !== null && provider !== "openai") throw new AiConfigurationError("HMM_AI_PROVIDER is not allowlisted.");
  const modelAllowlist = (env.HMM_AI_OPENAI_MODEL_ALLOWLIST || "").split(",").map((item) => item.trim()).filter(Boolean);
  if (new Set(modelAllowlist).size !== modelAllowlist.length || modelAllowlist.some((item) => !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(item))) throw new AiConfigurationError("HMM_AI_OPENAI_MODEL_ALLOWLIST is invalid.");
  const model = env.HMM_AI_OPENAI_MODEL || undefined;
  if ((enabled || openAiEnabled || modelEnabled) && (provider !== "openai" || !enabled || !openAiEnabled || !modelEnabled)) throw new AiConfigurationError("AI provider flags are inconsistent.");
  if (enabled && (!env.HMM_AI_OPENAI_API_KEY || !model || !modelAllowlist.includes(model))) throw new AiConfigurationError("Enabled OpenAI configuration requires an external key and allowlisted model.");
  if (environment === "production" && enabled) throw new AiConfigurationError("OpenAI production enablement is not approved.");
  return {
    environment, enabled, provider: provider as "openai" | null, openAiEnabled, modelEnabled, apiKey: env.HMM_AI_OPENAI_API_KEY, model, modelAllowlist,
    promptVersion: version(env.HMM_AI_PROMPT_VERSION, "hmm-advisory-v1", "HMM_AI_PROMPT_VERSION"),
    schemaVersion: version(env.HMM_AI_SCHEMA_VERSION, "assessment-draft-v1", "HMM_AI_SCHEMA_VERSION"),
    policyVersion: version(env.HMM_AI_POLICY_VERSION, "ai-provider-policy-v1", "HMM_AI_POLICY_VERSION"),
    timeoutMs: integer(env.HMM_AI_TIMEOUT_MS, 8_000, 100, 30_000, "HMM_AI_TIMEOUT_MS"),
    maxAttempts: integer(env.HMM_AI_MAX_ATTEMPTS, 2, 1, 3, "HMM_AI_MAX_ATTEMPTS"),
    maxConcurrent: integer(env.HMM_AI_MAX_CONCURRENT, 2, 1, 10, "HMM_AI_MAX_CONCURRENT"),
    maxRequestsPerMinute: integer(env.HMM_AI_MAX_REQUESTS_PER_MINUTE, 10, 1, 60, "HMM_AI_MAX_REQUESTS_PER_MINUTE"),
    maxInputTokens: integer(env.HMM_AI_MAX_INPUT_TOKENS, 8_000, 128, 32_000, "HMM_AI_MAX_INPUT_TOKENS"),
    maxOutputTokens: integer(env.HMM_AI_MAX_OUTPUT_TOKENS, 2_000, 128, 8_000, "HMM_AI_MAX_OUTPUT_TOKENS"),
    maxLatencyMs: integer(env.HMM_AI_MAX_LATENCY_MS, 10_000, 100, 30_000, "HMM_AI_MAX_LATENCY_MS"),
    maxEstimatedCostMinor: integer(env.HMM_AI_MAX_ESTIMATED_COST_MINOR, 5, 0, 1_000, "HMM_AI_MAX_ESTIMATED_COST_MINOR"),
    inputCostMinorPerMillion: integer(env.HMM_AI_INPUT_COST_MINOR_PER_MILLION, 100, 0, 100_000, "HMM_AI_INPUT_COST_MINOR_PER_MILLION"),
    outputCostMinorPerMillion: integer(env.HMM_AI_OUTPUT_COST_MINOR_PER_MILLION, 400, 0, 100_000, "HMM_AI_OUTPUT_COST_MINOR_PER_MILLION"),
    globalKillSwitch: bool(env.HMM_AI_KILL_SWITCH, false, "HMM_AI_KILL_SWITCH"),
    environmentKillSwitch: bool(env.HMM_AI_ENVIRONMENT_KILL_SWITCH, false, "HMM_AI_ENVIRONMENT_KILL_SWITCH"),
    openAiKillSwitch: bool(env.HMM_AI_OPENAI_KILL_SWITCH, false, "HMM_AI_OPENAI_KILL_SWITCH"),
    modelKillSwitch: bool(env.HMM_AI_MODEL_KILL_SWITCH, false, "HMM_AI_MODEL_KILL_SWITCH"),
  };
}

export function assertOpenAiEnabled(config: AiProviderConfig) {
  if (!config.enabled || config.provider !== "openai" || !config.openAiEnabled || !config.modelEnabled || config.globalKillSwitch || config.environmentKillSwitch || config.openAiKillSwitch || config.modelKillSwitch) {
    const error = new Error("The advisory model provider is disabled.");
    error.name = AI_PROVIDER_DISABLED;
    throw error;
  }
}
