export const AGREEMENT_SCHEMA_VERSION = "1.0" as const;
export const DEFAULT_REVIEW_WINDOW_SECONDS = 24 * 60 * 60;

export type StableId = string;
export type ISODateTime = string;
export type PartyId = StableId;
export type AgreementId = StableId;
export type VersionId = StableId;
export type CriterionResult = "satisfied" | "not_satisfied" | "indeterminate" | "not_applicable";
export type FinancialSafetyState = "clear" | "review_required" | "held" | "restricted";

export interface AgreementRef { agreementId: AgreementId; versionId: VersionId }
export interface AgreementPurpose { title: string; description: string; plainLanguageSummary: string }

export interface EconomicSide {
  economicSideId: StableId;
  partyIds: PartyId[];
  settlementDestinationRef?: StableId;
}

export interface Party {
  partyId: PartyId;
  partyType: "person" | "organization" | "external_participant";
  displayName: string;
  roles: Array<"creator" | "performer" | "recipient" | "reviewer" | "observer">;
  responsibilityObligationIds: StableId[];
  acceptanceRequired: boolean;
  economicSideId?: StableId;
  externalIdentityRef?: StableId;
}

export type Condition =
  | { conditionId: StableId; statement: string; operator: "event_present" | "event_absent"; evidenceRequirementIds: StableId[] }
  | { conditionId: StableId; statement: string; operator: "equals" | "not_equals" | "greater_than" | "greater_than_or_equal" | "less_than" | "less_than_or_equal"; valueType: "string" | "number" | "boolean" | "instant"; expectedValue: string | number | boolean; unit?: string; evidenceRequirementIds: StableId[] }
  | { conditionId: StableId; statement: string; operator: "before" | "after"; instant: ISODateTime; evidenceRequirementIds: StableId[] }
  | { conditionId: StableId; statement: string; operator: "all" | "any"; conditionIds: StableId[]; evidenceRequirementIds: StableId[] }
  | { conditionId: StableId; statement: string; operator: "not"; conditionIdRef: StableId; evidenceRequirementIds: StableId[] };

export interface Deadline {
  deadlineId: StableId;
  instant?: ISODateTime;
  localDateTime?: string;
  timezone: string;
  inclusive: boolean;
  onReached: "expire" | "request_review" | "remain_open";
  gracePeriodSeconds?: number;
  extensionRequiresAmendment: boolean;
}

export interface Obligation {
  obligationId: StableId;
  title: string;
  description: string;
  responsiblePartyIds: PartyId[];
  beneficiaryPartyIds: PartyId[];
  requirement: "required" | "optional";
  deadlineId?: StableId;
  prerequisiteConditionIds: StableId[];
  successCriterionIds: StableId[];
  evidenceRequirementIds: StableId[];
  exceptionOutcome: "not_applicable" | "review_required" | "amendment_required";
}

export interface SuccessCriterion {
  criterionId: StableId;
  obligationId?: StableId;
  statement: string;
  evaluationMode: "deterministic" | "manual_assessment";
  conditionIds: StableId[];
  evidenceRequirementIds: StableId[];
  allowedResults: CriterionResult[];
}

export interface Terms {
  obligations: Obligation[];
  conditions: Condition[];
  successCriteria: SuccessCriterion[];
  deadlines: Deadline[];
}

export interface SourceConstraint {
  sourceConstraintId: StableId;
  category: string;
  approvedProviderRef?: StableId;
  retrievalMethod: "participant_submission" | "authorized_read" | "human_attestation" | "system_record";
  permittedFields: string[];
  participantConfirmationRequired: boolean;
}

export interface EvidenceRequirement {
  evidenceRequirementId: StableId;
  criterionIds: StableId[];
  importance: "required" | "supporting";
  evidenceClass: "participant_claim" | "external_fact" | "document" | "media" | "system_event" | "human_attestation";
  submitterPartyIds: PartyId[];
  sourceConstraintIds: StableId[];
  minimumDistinctSources: number;
  independentSourcesRequired: boolean;
  visibility: "participants" | "authorized_reviewers" | "specified_parties";
  sensitivity: "standard" | "sensitive" | "highly_sensitive";
  onMissing: "request_evidence" | "wait_until_deadline" | "request_human_review";
  onConflict: "request_human_review";
}

export interface EvidencePolicy { evidenceRequirements: EvidenceRequirement[]; sourceConstraints: SourceConstraint[] }
export interface ConfidenceRepresentation { level: "low" | "medium" | "high" | "not_assessed"; basis: string[]; limitations: string[]; calibrationReference?: string }
export interface VerificationPolicy {
  criterionIds: StableId[];
  aggregation: "all_required" | "any_required" | "manual";
  policyVersion: string;
  missingEvidenceResult: "indeterminate";
  conflictingEvidenceResult: "indeterminate";
  mandatoryReviewTriggers: Array<"missing_required_evidence" | "conflicting_evidence" | "source_unavailable" | "manual_assessment" | "low_or_unassessed_confidence" | "participant_challenge" | "dispute_or_risk_flag" | "evaluator_failure" | "consequential_outcome" | "version_or_authority_unproven">;
  reviewRoute: string;
}

export interface Money { amountMinor: number; currency: string }
export type ProtectionPolicy =
  | { mode: "none" }
  | { mode: "protection"; terms: { money: Money; feesMinor?: number; fundingDeadlineId?: StableId; releaseOutcomeIds: StableId[]; refundOutcomeIds: StableId[]; providerContext?: string } }
  | { mode: "conditional_intent"; terms: { money: Money; triggerConditionIds: StableId[]; expiresAt: ISODateTime; participantConfirmationRequired: true } };

export type AuthorizationAction = "accept_terms" | "material_amendment" | "waive_obligation" | "extend_deadline" | "decide_dispute" | "approve_cancellation" | "record_resolution" | "create_settlement_instruction";
export interface AuthorizationRequirement {
  action: AuthorizationAction;
  eligiblePartyIds: PartyId[];
  minimumApprovals: number;
  selfApprovalProhibited: boolean;
  requiredVersionState: AgreementLanguageDocument["versionState"][];
  humanReviewRequired: boolean;
}
export interface AuthorizationPolicy { requirements: AuthorizationRequirement[]; aiMayAuthorize: false }

export interface ResolutionOutcome {
  outcomeId: StableId;
  type: "completion" | "partial" | "alternative" | "dispute" | "expiry" | "cancellation" | "insufficient_evidence" | "withdrawal";
  prerequisiteCriterionIds: StableId[];
  authorizationAction: AuthorizationAction;
  explanationRequired: boolean;
  appealAllowed: boolean;
}
export interface CancellationPolicy { beforeAcceptance: "creator_may_withdraw"; afterAcceptance: "required_party_consent" | "authorized_review"; eligibleInitiatorPartyIds: PartyId[] }
export interface ResolutionPolicy { outcomes: ResolutionOutcome[]; reviewWindowSeconds: number; cancellation: CancellationPolicy; maxAppeals: number }
export interface AgreementPrivacyPolicy { defaultEvidenceVisibility: "participants_and_authorized_reviewers"; privateEvidenceTrainingUse: false }
export interface FinancialSafetyPolicy { initialState: FinancialSafetyState; hooks: Array<"identity_status" | "sanctions_screening" | "transaction_monitoring" | "source_of_funds" | "amount_velocity_limits" | "risk_flags" | "destination_integrity" | "human_compliance_review">; complianceHoldOverridesTimers: true }

export interface AgreementLanguageDocument {
  schemaVersion: typeof AGREEMENT_SCHEMA_VERSION;
  agreementId: AgreementId;
  agreementVersion: number;
  versionId: VersionId;
  previousVersionId?: VersionId;
  versionState: "draft" | "proposed" | "accepted" | "superseded" | "withdrawn";
  amendmentKind?: "material" | "cosmetic";
  economicSides: EconomicSide[];
  purpose: AgreementPurpose;
  parties: Party[];
  terms: Terms;
  evidencePolicy: EvidencePolicy;
  verificationPolicy: VerificationPolicy;
  protectionPolicy: ProtectionPolicy;
  authorizationPolicy: AuthorizationPolicy;
  resolutionPolicy: ResolutionPolicy;
  privacyPolicy: AgreementPrivacyPolicy;
  financialSafetyPolicy: FinancialSafetyPolicy;
  effectiveAt?: ISODateTime;
  createdAt: ISODateTime;
  createdByPartyId: PartyId;
}

export interface AcceptanceRecord extends AgreementRef { acceptanceId: StableId; partyId: PartyId; acceptedAt: ISODateTime; consentContext: string; assuranceContext: string }
export interface EvidenceItemRecord extends AgreementRef { evidenceId: StableId; evidenceRequirementId: StableId; criterionIds: StableId[]; origin: "participant" | "external" | "system" | "human_reviewer"; submittedByPartyId?: PartyId; capturedAt: ISODateTime; availability: "available" | "missing" | "revoked" | "stale" | "inaccessible"; integrity: "unverified" | "verified" | "failed"; payloadRef?: StableId }
export interface AssessmentRecord extends AgreementRef { assessmentId: StableId; actorType: "deterministic_evaluator" | "ai" | "human_reviewer"; actorId: StableId; criterionResults: Array<{ criterionId: StableId; result: CriterionResult; supportingEvidenceIds: StableId[]; conflictingEvidenceIds: StableId[]; explanation: string }>; confidence: ConfidenceRepresentation; limitations: string[]; recommendedNextAction: string; policyVersion: string; occurredAt: ISODateTime }
export interface AuthorizationGrant extends AgreementRef { authorizationId: StableId; partyId: PartyId; action: AuthorizationAction; consequenceRef: StableId; grantedAt: ISODateTime; expiresAt?: ISODateTime; revokedAt?: ISODateTime }
export interface DisputeRecord extends AgreementRef { disputeId: StableId; openedAt: ISODateTime; openedByPartyId: PartyId; status: "open" | "under_review" | "resolved" | "appealed"; claimRefs: StableId[] }
export interface AuditRecord extends AgreementRef { eventId: StableId; actorType: "participant" | "system" | "ai" | "human_reviewer"; actorId: StableId; action: string; occurredAt: ISODateTime; recordedAt: ISODateTime; correlationId: StableId; causationId?: StableId; sourceSystem: string; relatedObjectIds: StableId[]; policyVersion?: string; explanation: string }

export interface AmendmentEvaluation { material: boolean; renewedAcceptanceRequired: boolean; reasons: string[] }
export interface SettlementGuardContext {
  document: AgreementLanguageDocument;
  assessmentResult: CriterionResult;
  dispute?: DisputeRecord;
  proposedAt: ISODateTime;
  evaluatedAt: ISODateTime;
  financialSafetyState: FinancialSafetyState;
  authorizationGrants: AuthorizationGrant[];
  consequenceRef: StableId;
}
