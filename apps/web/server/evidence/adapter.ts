import type { AgreementLanguageDocument } from "../../lib/agreement-language/types.ts";
import type { CriterionFinding, EvidenceRevision, EvidenceRequirementState } from "./domain.ts";

export interface AssessmentAdapterInput { document: AgreementLanguageDocument; documentDigest: string; evidenceSetId: string; evidenceSetDigest: string; evidenceCanonicalizationVersion: "evidence-set-v1"; evidence: EvidenceRevision[]; requirementStates: Map<string, EvidenceRequirementState> }
export const advisoryNextActions = ["request_evidence", "wait", "request_human_review", "participant_review", "no_action"] as const;
export type AdvisoryNextAction = typeof advisoryNextActions[number];
export interface AssessmentDraft { findings: CriterionFinding[]; confidence: { level: "low" | "medium" | "high" | "not_assessed"; basis: string[]; limitations: string[] }; limitations: string[]; recommendedNextAction: AdvisoryNextAction }
export interface AssessmentAdapter { readonly kind: "deterministic" | "manual" | "model"; readonly version: string; evaluate(input: AssessmentAdapterInput): Promise<AssessmentDraft> }
export interface AdvisoryAssessmentProvider extends AssessmentAdapter { readonly providerKind: "deterministic_local" | "future_model"; readonly providerVersion: string }

export class DeterministicAssessmentAdapter implements AdvisoryAssessmentProvider {
  readonly kind = "deterministic" as const; readonly version = "deterministic-v1"; readonly providerKind = "deterministic_local" as const; readonly providerVersion = "deterministic-local-v1";
  supports(input: AssessmentAdapterInput) { return input.document.verificationPolicy.criterionIds.every((criterionId) => input.document.terms.successCriteria.find((criterion) => criterion.criterionId === criterionId)?.evaluationMode === "deterministic"); }
  async evaluate(input: AssessmentAdapterInput): Promise<AssessmentDraft> {
    const findings = input.document.verificationPolicy.criterionIds.map((criterionId): CriterionFinding => {
      const requirements = input.document.evidencePolicy.evidenceRequirements.filter((r) => r.criterionIds.includes(criterionId)); const evidence = input.evidence.filter((r) => r.criterionIds.includes(criterionId));
      const usable = requirements.length > 0 && requirements.every((r) => input.requirementStates.get(r.evidenceRequirementId) === "satisfied_for_assessment");
      const typed = evidence.map((r) => r.metadata.result).filter((v) => typeof v === "boolean"); const result = usable && typed.length && typed.every(Boolean) ? "satisfied" : usable && typed.length && typed.every((v) => v === false) ? "not_satisfied" : "indeterminate";
      return { criterionId, result, supportingEvidenceRevisionIds: result === "satisfied" ? evidence.map((r) => r.evidenceRevisionId) : [], conflictingEvidenceRevisionIds: result === "indeterminate" && typed.length > 1 ? evidence.map((r) => r.evidenceRevisionId) : [], evidenceRequirementIds: requirements.map((r) => r.evidenceRequirementId), explanation: result === "indeterminate" ? "The declared deterministic evidence is not sufficient for a conclusion." : `Validated typed evidence deterministically produced ${result}.`, limitations: result === "indeterminate" ? ["No heuristic inference was used."] : [] };
    });
    const indeterminate = findings.some((f) => f.result === "indeterminate"); return { findings, confidence: { level: indeterminate ? "low" : "high", basis: ["Deterministic evaluation of validated typed fixture evidence."], limitations: indeterminate ? ["At least one criterion could not be determined."] : [] }, limitations: ["Advisory assessment only; it grants no decision or settlement authority."], recommendedNextAction: indeterminate ? "request_human_review" : "participant_review" };
  }
}

export class ManualAssessmentAdapter implements AssessmentAdapter {
  readonly kind = "manual" as const; readonly version = "manual-v1"; private readonly findings: CriterionFinding[]; constructor(findings: CriterionFinding[]) { this.findings = findings; }
  async evaluate(): Promise<AssessmentDraft> { return { findings: structuredClone(this.findings), confidence: { level: "not_assessed", basis: [], limitations: ["Manual fixture findings are not calibrated reviewer decisions."] }, limitations: ["Advisory manual assessment only."], recommendedNextAction: "request_human_review" }; }
}
