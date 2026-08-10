import { createHash } from "node:crypto";
import type { AgreementLanguageDocument, ConfidenceRepresentation } from "../../lib/agreement-language/types.ts";

export type EvidenceLifecycle = "active" | "superseded" | "withdrawn" | "revoked";
export type EvidenceAvailability = "available" | "missing" | "inaccessible" | "stale" | "revoked";
export type EvidenceIntegrity = "unverified" | "verified" | "failed";
export type EvidenceValidation = "pending" | "valid" | "invalid";
export type EvidenceRequirementState = "satisfied_for_assessment" | "missing" | "conflicting" | "invalid" | "stale" | "inaccessible" | "insufficient";
export type SourceRefKind = "https_url" | "provider_object" | "system_record" | "fixture";

export interface EvidenceRevision {
  evidenceRevisionId: string; evidenceId: string; agreementId: string; versionId: string; revisionNumber: number; supersedesRevisionId?: string;
  criterionIds: string[]; evidenceClass: "participant_claim" | "external_fact" | "document" | "media" | "system_event" | "human_attestation";
  origin: "participant" | "external" | "system" | "human_reviewer"; submittedByPartyId?: string; submittedByAccountId?: string;
  sourceConstraintId: string; sourceRefKind?: SourceRefKind; sourceRef?: string; sourceDisplayLabel?: string; observedAt?: string;
  capturedAt: string; receivedAt: string; availability: EvidenceAvailability; integrity: EvidenceIntegrity; validation: EvidenceValidation;
  validationReasons: string[]; metadata: Record<string, string | number | boolean | null>; contentDigest?: string;
}
export interface EvidenceItem { evidenceId: string; agreementId: string; versionId: string; evidenceRequirementId: string; currentRevisionId: string; lifecycle: EvidenceLifecycle; createdAt: string; createdByAccountId: string; revision: number; currentRevision: EvidenceRevision }
export interface EvidenceSet { evidenceSetId: string; agreementId: string; versionId: string; canonicalizationVersion: "evidence-set-v1"; digest: string; evidenceRevisionIds: string[]; createdAt: string; createdByAccountId: string }
export interface CriterionFinding { criterionId: string; result: "satisfied" | "not_satisfied" | "indeterminate" | "not_applicable"; supportingEvidenceRevisionIds: string[]; conflictingEvidenceRevisionIds: string[]; evidenceRequirementIds: string[]; explanation: string; limitations: string[] }
export interface Assessment { assessmentId: string; agreementId: string; versionId: string; documentDigest?: string; evidenceSetId: string; evidenceSetDigest?: string; evidenceCanonicalizationVersion?: "evidence-set-v1"; supersedesAssessmentId?: string; adapterKind: "deterministic" | "manual" | "model"; adapterVersion: string; providerClass?: "local_deterministic" | "development_model"; providerName?: string; modelVersion?: string; requestedModelVersion?: string; resolvedModelVersion?: string; promptVersion?: string; schemaVersion?: string; claimReferenceContractVersion?: string; actionContractVersion?: string; policyVersion: string; status: "pending" | "completed" | "failed" | "superseded"; executionPhase?: "queued" | "in_progress"; criterionFindings: CriterionFinding[]; confidence: ConfidenceRepresentation; limitations: string[]; recommendedNextAction: "request_evidence" | "wait" | "request_human_review" | "participant_review" | "no_action"; authoritySafe?: boolean; semanticExpectationMatched?: "matched" | "mismatched" | "not_applicable"; acceptableActionMatched?: "matched" | "mismatched" | "not_applicable"; requestedByAccountId?: string; requestedByPartyId?: string; requestedByRole?: string; requestedAt?: string; completedAt?: string; fallbackReason?: string; fallbackFromProvider?: string; failureCode?: string; occurredAt: string; revision: number }
export interface AssessmentCapability { status: "eligible" | "eligible_with_gaps" | "unavailable"; reasonCodes: string[]; canRequest: boolean; providerClass: "local_deterministic" | "development_model"; providerLabel: string; budgetState: "available" | "paused" | "unavailable"; agreementId: string; versionId: string; acceptedAgreementVersion: number; documentDigest: string; evidenceSetDigest?: string; evidenceCanonicalizationVersion: "evidence-set-v1"; evidenceRevisionCount: number; activeAssessmentId?: string }
export type ReviewReason = "missing_required_evidence" | "conflicting_evidence" | "source_unavailable" | "manual_assessment" | "low_or_unassessed_confidence" | "participant_challenge" | "dispute_or_risk_flag" | "evaluator_failure" | "consequential_outcome" | "version_or_authority_unproven";
export interface HumanReviewRequest { reviewRequestId: string; agreementId: string; versionId: string; assessmentId?: string; evidenceSetId?: string; reasonCodes: ReviewReason[]; affectedCriterionIds: string[]; requestedByAccountId: string; route: string; state: "open" | "assigned" | "in_review" | "completed" | "cancelled" | "superseded"; assignedAccountId?: string; createdAt: string; updatedAt: string; revision: number }
export interface ReviewerDecision { reviewerDecisionId: string; reviewRequestId: string; agreementId: string; versionId: string; evidenceSetId?: string; evidenceRevisionIds: string[]; assessmentIds: string[]; reviewerAccountId: string; reviewerPartyId: string; authorityBasis: "active_assigned_reviewer_membership"; decisionType: "request_more_evidence" | "confirm_assessment" | "reject_assessment" | "record_indeterminate" | "escalate"; criterionFindings: CriterionFinding[]; explanation: string; limitations: string[]; createdAt: string; supersedesDecisionId?: string }

export function evidenceSetDigest(agreementId: string, versionId: string, revisionIds: readonly string[]) {
  const ordered = [...new Set(revisionIds)].sort();
  const canonical = JSON.stringify({ canonicalizationVersion: "evidence-set-v1", agreementId, versionId, evidenceRevisionIds: ordered });
  return { ordered, digest: createHash("sha256").update(canonical).digest("hex") };
}

export function acceptedVersion(document: AgreementLanguageDocument, acceptedPartyIds: readonly string[]) {
  if (document.versionState !== "accepted" && document.versionState !== "superseded") return false;
  const accepted = new Set(acceptedPartyIds);
  return document.parties.filter((party) => party.acceptanceRequired).every((party) => accepted.has(party.partyId));
}

export function requirementState(revisions: readonly EvidenceRevision[], minimumDistinctSources: number, independentSourcesRequired: boolean): { state: EvidenceRequirementState; reasons: string[] } {
  if (!revisions.length) return { state: "missing", reasons: ["NO_ELIGIBLE_EVIDENCE"] };
  const reasons: string[] = [];
  if (revisions.some((r) => r.validation === "invalid" || r.integrity === "failed")) reasons.push("INVALID_EVIDENCE");
  if (revisions.some((r) => r.availability === "inaccessible" || r.availability === "revoked")) reasons.push("SOURCE_UNAVAILABLE");
  if (revisions.some((r) => r.availability === "stale")) reasons.push("STALE_EVIDENCE");
  const claims = new Set(revisions.map((r) => r.metadata.result).filter((v) => typeof v === "string" || typeof v === "boolean" || typeof v === "number"));
  if (claims.size > 1) reasons.push("CONFLICTING_EVIDENCE");
  const distinct = new Set(revisions.map((r) => `${r.sourceRefKind ?? "none"}:${r.sourceConstraintId}:${r.sourceRef ?? "none"}`)).size;
  if (distinct < minimumDistinctSources) reasons.push("MINIMUM_SOURCES_UNMET");
  if (independentSourcesRequired) reasons.push("SOURCE_INDEPENDENCE_UNPROVEN");
  const precedence: Array<[string, EvidenceRequirementState]> = [["INVALID_EVIDENCE", "invalid"], ["SOURCE_UNAVAILABLE", "inaccessible"], ["STALE_EVIDENCE", "stale"], ["CONFLICTING_EVIDENCE", "conflicting"], ["MINIMUM_SOURCES_UNMET", "insufficient"], ["SOURCE_INDEPENDENCE_UNPROVEN", "insufficient"]];
  return { state: precedence.find(([reason]) => reasons.includes(reason))?.[1] ?? "satisfied_for_assessment", reasons };
}
