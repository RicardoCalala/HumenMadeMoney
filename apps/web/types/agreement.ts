export type AgreementId = string;
export type ParticipantId = string;
export type ISODateTime = string;

export type AgreementStatus =
  | "draft"
  | "in_review"
  | "accepted"
  | "active"
  | "in_progress"
  | "verification"
  | "awaiting_decision"
  | "resolved"
  | "closed"
  | "cancelled"
  | "expired"
  | "disputed";

export type FundingMode = "none" | "protection" | "conditional_intent";
export type FundingStatus =
  | "not_applicable"
  | "not_started"
  | "intent_recorded"
  | "funding_required"
  | "protected"
  | "authorized"
  | "settled"
  | "failed";
export type EvidenceKind = "participant_claim" | "external_fact" | "document";
export type VerificationMethod =
  | "participant_confirmation"
  | "source_check"
  | "human_review";
export type AssessmentConfidence = "low" | "medium" | "high";
export type AgreementVisibility = "participants" | "private_link";

export interface Participant {
  id: ParticipantId;
  displayName: string;
  initials: string;
  role: "creator" | "participant" | "reviewer" | "observer";
  acceptanceStatus:
    | "not_invited"
    | "invited"
    | "accepted"
    | "changes_requested"
    | "not_required";
  acceptedVersion?: number;
  acceptedAt?: ISODateTime;
  responsibilitySummary: string;
  canAuthorizeResolution: boolean;
}

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  title: string;
  source: string;
  submittedBy: string;
  capturedAt: ISODateTime;
  relatedCriterion: string;
  availability: "available" | "missing" | "under_review";
}

export interface VerificationAssessment {
  summary: string;
  matchedCriteria: string[];
  missingInformation: string[];
  sourceEvidenceIds: string[];
  confidence: AssessmentConfidence;
  limitations: string[];
  recommendedAction: string;
}

export interface Verification {
  method: VerificationMethod;
  criteria: string[];
  approvedSources: string[];
  reviewRoute: string;
  state:
    | "not_started"
    | "collecting_evidence"
    | "assessment_ready"
    | "human_review"
    | "complete";
  assessment?: VerificationAssessment;
  requiresHumanReview: boolean;
  humanReviewReason?: string;
}

export interface TimelineEvent {
  id: string;
  status: AgreementStatus;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming" | "exception";
  occurredAt?: ISODateTime;
  actorParticipantId?: ParticipantId;
  auditEventId?: string;
}

export interface Funding {
  mode: FundingMode;
  status: FundingStatus;
  explanation: string;
  amountMinor?: number;
  currency?: string;
  feesMinor?: number;
  providerLabel?: string;
  releaseConditions?: string;
  refundConditions?: string;
  isSimulated: true;
}

export interface AuditEvent {
  id: string;
  agreementId: AgreementId;
  occurredAt: ISODateTime;
  actor: string;
  type: string;
  summary: string;
  fromStatus?: AgreementStatus;
  toStatus?: AgreementStatus;
  agreementVersion: number;
  source: "participant" | "system" | "ai_assessment";
  evidenceIds?: string[];
}

export interface Agreement {
  id: AgreementId;
  version: number;
  title: string;
  description: string;
  plainLanguageSummary: string;
  status: AgreementStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deadline: ISODateTime;
  closedAt?: ISODateTime;
  participants: Participant[];
  currentUserParticipantId: ParticipantId;
  obligations: string[];
  successConditions: string[];
  evidenceExpectations: string[];
  verification: Verification;
  evidence: EvidenceItem[];
  timeline: TimelineEvent[];
  funding: Funding;
  auditEvents: AuditEvent[];
  visibility: AgreementVisibility;
  nextAction: string;
  nextActionParticipantId?: ParticipantId;
  exceptionState?: { title: string; description: string };
  resolution: {
    expectedOutcome: string;
    reviewPath: string;
    declaredOutcome?: string;
  };
}

export type AgreementSummary = Pick<
  Agreement,
  | "id"
  | "title"
  | "plainLanguageSummary"
  | "status"
  | "deadline"
  | "participants"
  | "verification"
  | "funding"
  | "nextAction"
  | "updatedAt"
  | "exceptionState"
>;

export interface CreateAgreementInput {
  title: string;
  purpose: string;
  participantName: string;
  participantResponsibility: string;
  obligation: string;
  successCondition: string;
  evidenceSource: string;
  deadline: string;
  fundingMode: FundingMode;
  verificationMethod: VerificationMethod;
  resolutionApproach: string;
  visibility: AgreementVisibility;
}
