import type { AssessmentAdapterInput, AssessmentDraft, AdvisoryAssessmentProvider } from "./adapter.ts";
import { DeterministicAssessmentAdapter } from "./adapter.ts";

export type AssessmentRoute =
  | { kind: "completed"; draft: AssessmentDraft; providerKind: AdvisoryAssessmentProvider["providerKind"]; fallbackReason?: string }
  | { kind: "request_evidence" | "request_human_review"; reason: "evaluator_failure"; providerFailure: string };

export async function evaluateWithFailClosedFallback(input: AssessmentAdapterInput, provider: AdvisoryAssessmentProvider, deterministic = new DeterministicAssessmentAdapter()): Promise<AssessmentRoute> {
  try { return { kind: "completed", draft: await provider.evaluate(input), providerKind: provider.providerKind }; }
  catch (error) {
    const providerFailure = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "PROVIDER_FAILURE";
    if (deterministic.supports(input)) return { kind: "completed", draft: await deterministic.evaluate(input), providerKind: deterministic.providerKind, fallbackReason: providerFailure };
    const remediable = [...input.requirementStates.values()].some((state) => state === "missing" || state === "stale" || state === "inaccessible" || state === "insufficient");
    return { kind: remediable ? "request_evidence" : "request_human_review", reason: "evaluator_failure", providerFailure };
  }
}
