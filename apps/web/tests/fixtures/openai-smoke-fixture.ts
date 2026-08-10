import type { AgreementLanguageDocument } from "../../lib/agreement-language/types.ts";
import type { AssessmentAdapterInput } from "../../server/evidence/adapter.ts";
import { buildClaimReferences } from "../../server/evidence/openai-adapter.ts";
import type { ActionExpectation } from "../../server/evidence/action-semantics.ts";
import { evidenceSetDigest } from "../../server/evidence/domain.ts";

const stamp = "2026-08-01T00:00:00.000Z";
export const smokeFixtureId = "hmm-smoke-fixture-v2";
export const smokeActionExpectation: ActionExpectation = {
  expectedAction: "participant_review",
  acceptableActions: ["request_evidence", "wait", "request_human_review", "participant_review", "no_action"],
};
const document = {
  schemaVersion: "1.0", agreementId: "agr_smoke_001", agreementVersion: 1, versionId: "ver_smoke_001", versionState: "accepted",
  economicSides: [], purpose: { title: "Synthetic delivery", description: "Synthetic smoke-test agreement.", plainLanguageSummary: "Synthetic smoke-test agreement." }, parties: [],
  terms: { obligations: [], conditions: [], successCriteria: [{ criterionId: "criterion_delivery", statement: "The synthetic design package is delivered on or before 2026-08-01.", evaluationMode: "manual_assessment", conditionIds: [], evidenceRequirementIds: ["requirement_delivery"], allowedResults: ["satisfied", "not_satisfied", "indeterminate"] }], deadlines: [] },
  evidencePolicy: {
    sourceConstraints: [{ sourceConstraintId: "synthetic_delivery_source", category: "synthetic", retrievalMethod: "participant_submission", permittedFields: ["result", "deliveredAt", "packageDigest"], participantConfirmationRequired: true }],
    evidenceRequirements: [{ evidenceRequirementId: "requirement_delivery", criterionIds: ["criterion_delivery"], importance: "required", evidenceClass: "participant_claim", submitterPartyIds: [], sourceConstraintIds: ["synthetic_delivery_source"], minimumDistinctSources: 1, independentSourcesRequired: false, visibility: "participants", sensitivity: "standard", onMissing: "request_evidence", onConflict: "request_human_review" }],
  },
  verificationPolicy: { criterionIds: ["criterion_delivery"], aggregation: "all_required", policyVersion: "verification-v1", missingEvidenceResult: "indeterminate", conflictingEvidenceResult: "indeterminate", mandatoryReviewTriggers: [], reviewRoute: "authorized-review" },
  protectionPolicy: { mode: "none" }, authorizationPolicy: { requirements: [], aiMayAuthorize: false },
  resolutionPolicy: { outcomes: [], reviewWindowSeconds: 86400, cancellation: { beforeAcceptance: "creator_may_withdraw", afterAcceptance: "required_party_consent", eligibleInitiatorPartyIds: [] }, maxAppeals: 1 },
  privacyPolicy: { defaultEvidenceVisibility: "participants_and_authorized_reviewers", privateEvidenceTrainingUse: false },
  financialSafetyPolicy: { initialState: "clear", hooks: [], complianceHoldOverridesTimers: true }, createdAt: stamp, createdByPartyId: "party_smoke_001",
} as AgreementLanguageDocument;

export const smokeInput: AssessmentAdapterInput = {
  document, documentDigest: "synthetic-document-sha256-001", evidenceSetId: "evidence_set_smoke_001", evidenceSetDigest: evidenceSetDigest("agr_smoke_001", "ver_smoke_001", ["evidence_revision_smoke_001"]).digest, evidenceCanonicalizationVersion: "evidence-set-v1",
  requirementStates: new Map([["requirement_delivery", "satisfied_for_assessment"]]),
  evidence: [{ evidenceRevisionId: "evidence_revision_smoke_001", evidenceId: "evidence_smoke_001", agreementId: "agr_smoke_001", versionId: "ver_smoke_001", revisionNumber: 1, criterionIds: ["criterion_delivery"], evidenceClass: "participant_claim", origin: "participant", sourceConstraintId: "synthetic_delivery_source", sourceDisplayLabel: "Synthetic delivery record", capturedAt: "2026-07-31T18:00:00.000Z", receivedAt: "2026-07-31T18:00:00.000Z", observedAt: "2026-07-31T18:00:00.000Z", availability: "available", integrity: "verified", validation: "valid", validationReasons: [], metadata: { result: "delivered", deliveredAt: "2026-07-31T18:00:00Z", packageDigest: "synthetic-sha256-001" } }],
};

const smokeClaimReferenceIds = buildClaimReferences(smokeInput).filter((reference) => reference.field === "result" || reference.field === "deliveredAt").map((reference) => reference.claimReferenceId);
export const smokeOutput = {
  findings: [{ criterionId: "criterion_delivery", result: "satisfied", supportingEvidenceRevisionIds: ["evidence_revision_smoke_001"], conflictingEvidenceRevisionIds: [], evidenceRequirementIds: ["requirement_delivery"], explanation: "The cited synthetic delivery record reports delivery before the criterion deadline.", limitations: [], claimReferenceIds: smokeClaimReferenceIds }],
  confidence: { level: "high", basis: ["The single required synthetic delivery record is valid and consistent."], limitations: [] }, limitations: [], recommendedNextAction: "participant_review",
};
