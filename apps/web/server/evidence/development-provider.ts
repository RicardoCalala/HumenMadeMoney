import type { AssessmentAdapterInput, AdvisoryAssessmentProvider } from "./adapter.ts";
import { DeterministicAssessmentAdapter } from "./adapter.ts";
import { parseAiProviderConfig, type AiProviderConfig } from "./ai-config.ts";
import { OpenAiAssessmentAdapter, type OpenAiTransport } from "./openai-adapter.ts";
import { OpenAiHttpsTransport } from "./openai-https-transport.ts";
import { buildSmokeAuthorizationSnapshot, consumeSmokeAuthorization, finalizeSmokeAuthorization } from "./smoke-authorization.ts";
import { ProviderAssessmentError } from "./openai-adapter.ts";

export type ProviderBlockedReason = "OPENAI_NOT_SELECTED" | "OPENAI_NOT_DEVELOPMENT" | "OPENAI_UI_DISABLED" | "OPENAI_FLAGS_DISABLED" | "OPENAI_KILL_SWITCH" | "OPENAI_KEY_ABSENT" | "OPENAI_CREDENTIAL_NOT_DEVELOPMENT" | "OPENAI_MODEL_NOT_SOLE_ALLOWLISTED" | "OPENAI_DATA_NOT_SYNTHETIC" | "OPENAI_AUTHORIZATION_ABSENT" | "OPENAI_CONFIGURATION_INVALID";
export interface DevelopmentProviderCapability { providerClass: "local_deterministic" | "development_model"; providerLabel: string; budgetState: "available" | "paused" | "unavailable"; reasonCodes: ProviderBlockedReason[] }
export interface ProductProviderSelection { provider: AdvisoryAssessmentProvider; requestedProvider: "deterministic" | "openai"; config?: AiProviderConfig }

function safeConfig(env: NodeJS.ProcessEnv) { try { return parseAiProviderConfig(env); } catch { return undefined; } }
function syntheticOnly(input?: AssessmentAdapterInput) {
  if (!input) return true;
  const requirements = input.document.evidencePolicy.evidenceRequirements;
  const sources = new Map(input.document.evidencePolicy.sourceConstraints.map((item) => [item.sourceConstraintId, item]));
  return requirements.every((item) => item.sensitivity === "standard") && input.evidence.every((item) => (item.sourceRefKind === "fixture" || sources.get(item.sourceConstraintId)?.category === "synthetic") && requirements.some((requirement) => requirement.sensitivity === "standard" && requirement.sourceConstraintIds.includes(item.sourceConstraintId)));
}

export function developmentProviderCapability(env: NodeJS.ProcessEnv, input?: AssessmentAdapterInput): DevelopmentProviderCapability {
  if (env.HMM_AI_PROVIDER !== "openai") return { providerClass: "local_deterministic", providerLabel: "Local deterministic assessment", budgetState: "available", reasonCodes: ["OPENAI_NOT_SELECTED"] };
  const reasons: ProviderBlockedReason[] = [];
  if (env.NODE_ENV !== "development") reasons.push("OPENAI_NOT_DEVELOPMENT");
  if (env.HMM_AI_ASSESSMENT_UI_ENABLED !== "true") reasons.push("OPENAI_UI_DISABLED");
  if (env.HMM_AI_PROVIDER_ENABLED !== "true" || env.HMM_AI_OPENAI_ENABLED !== "true" || env.HMM_AI_MODEL_ENABLED !== "true") reasons.push("OPENAI_FLAGS_DISABLED");
  if ([env.HMM_AI_KILL_SWITCH, env.HMM_AI_ENVIRONMENT_KILL_SWITCH, env.HMM_AI_OPENAI_KILL_SWITCH, env.HMM_AI_MODEL_KILL_SWITCH].includes("true")) reasons.push("OPENAI_KILL_SWITCH");
  if (!env.HMM_AI_OPENAI_API_KEY) reasons.push("OPENAI_KEY_ABSENT");
  if (env.HMM_AI_CREDENTIAL_ENVIRONMENT !== "development") reasons.push("OPENAI_CREDENTIAL_NOT_DEVELOPMENT");
  const allowlist = (env.HMM_AI_OPENAI_MODEL_ALLOWLIST ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (!env.HMM_AI_OPENAI_MODEL || allowlist.length !== 1 || allowlist[0] !== env.HMM_AI_OPENAI_MODEL) reasons.push("OPENAI_MODEL_NOT_SOLE_ALLOWLISTED");
  if (env.HMM_AI_DATA_CLASSIFICATION !== "synthetic_non_sensitive" || !syntheticOnly(input)) reasons.push("OPENAI_DATA_NOT_SYNTHETIC");
  if (!env.HMM_AI_BROWSER_AUTHORIZATION_RECORD || !env.HMM_AI_NON_SECRET_PROJECT_LABEL || !env.HMM_AI_BROWSER_FIXTURE_ID) reasons.push("OPENAI_AUTHORIZATION_ABSENT");
  const config = safeConfig(env); if (!config) reasons.push("OPENAI_CONFIGURATION_INVALID");
  return reasons.length ? { providerClass: "local_deterministic", providerLabel: "Local deterministic assessment", budgetState: reasons.includes("OPENAI_KILL_SWITCH") ? "paused" : "unavailable", reasonCodes: [...new Set(reasons)] } : { providerClass: "development_model", providerLabel: "OpenAI development assessment", budgetState: "available", reasonCodes: [] };
}

export class DevelopmentAssessmentProviderSelector {
  private readonly env: NodeJS.ProcessEnv; private readonly transportFactory: () => OpenAiTransport;
  constructor(env: NodeJS.ProcessEnv = process.env, transportFactory: () => OpenAiTransport = () => new OpenAiHttpsTransport()) { this.env = env; this.transportFactory = transportFactory; }
  capability(input?: AssessmentAdapterInput) { return developmentProviderCapability(this.env, input); }
  select(input: AssessmentAdapterInput): ProductProviderSelection {
    const capability = this.capability(input);
    if (capability.providerClass !== "development_model") return { provider: new DeterministicAssessmentAdapter(), requestedProvider: "deterministic" };
    const config = parseAiProviderConfig(this.env);
    const provider = new OpenAiAssessmentAdapter(this.transportFactory(), config);
    const path = this.env.HMM_AI_BROWSER_AUTHORIZATION_RECORD!; const projectLabel = this.env.HMM_AI_NON_SECRET_PROJECT_LABEL!; const fixture = this.env.HMM_AI_BROWSER_FIXTURE_ID!;
    const guarded: AdvisoryAssessmentProvider = { kind: provider.kind, version: provider.version, providerKind: provider.providerKind, providerVersion: provider.providerVersion, evaluate: async (value) => {
      const productEnvelope = { input: { ...value, evidenceSetId: "browser-authorization-preview" }, uiEnabled: this.env.HMM_AI_ASSESSMENT_UI_ENABLED, credentialEnvironment: this.env.HMM_AI_CREDENTIAL_ENVIRONMENT, dataClassification: this.env.HMM_AI_DATA_CLASSIFICATION };
      const snapshot = buildSmokeAuthorizationSnapshot(config, projectLabel, fixture, productEnvelope);
      try { await consumeSmokeAuthorization(path, snapshot); } catch { throw new ProviderAssessmentError("CONFIGURATION", "A fresh matching one-time browser authorization is required."); }
      try { const result = await provider.evaluate(value); await finalizeSmokeAuthorization(path, "completed"); return result; }
      catch (error) { await finalizeSmokeAuthorization(path, "failed", error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "PROVIDER_FAILURE"); throw error; }
    } };
    return { provider: guarded, requestedProvider: "openai", config };
  }
}
