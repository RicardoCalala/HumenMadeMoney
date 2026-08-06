import type { Agreement, AgreementStatus, AuditEvent, EvidenceItem, Funding, Participant, TimelineEvent, Verification } from "../../types/agreement.ts";
import type { AcceptanceRecord, AgreementLanguageDocument, AssessmentRecord, AuditRecord, EvidenceItemRecord, FinancialSafetyState } from "./types.ts";

export interface Sprint51OperationalView {
  status: AgreementStatus;
  currentUserPartyId: string;
  updatedAt: string;
  acceptances: AcceptanceRecord[];
  evidence: EvidenceItemRecord[];
  assessment?: AssessmentRecord;
  audit: AuditRecord[];
  financialSafetyState: FinancialSafetyState;
  nextAction: string;
  nextActionPartyId?: string;
  declaredOutcome?: string;
  exceptionState?: Agreement["exceptionState"];
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

export function toSprint51Agreement(document: AgreementLanguageDocument, operational: Sprint51OperationalView): Agreement {
  const acceptedByParty = new Map(operational.acceptances.filter((item) => item.versionId === document.versionId).map((item) => [item.partyId, item]));
  const participants: Participant[] = document.parties.map((party) => ({
    id: party.partyId, displayName: party.displayName, initials: initials(party.displayName),
    role: party.roles.includes("creator") ? "creator" : party.roles.includes("reviewer") ? "reviewer" : party.roles.includes("observer") ? "observer" : "participant",
    acceptanceStatus: party.roles.includes("observer") ? "not_required" : acceptedByParty.has(party.partyId) ? "accepted" : "invited",
    acceptedVersion: acceptedByParty.has(party.partyId) ? document.agreementVersion : undefined,
    acceptedAt: acceptedByParty.get(party.partyId)?.acceptedAt,
    responsibilitySummary: document.terms.obligations.filter((obligation) => obligation.responsiblePartyIds.includes(party.partyId)).map((obligation) => obligation.description).join(" ") || "No performance obligation assigned.",
    canAuthorizeResolution: document.authorizationPolicy.requirements.some((requirement) => requirement.action === "record_resolution" && requirement.eligiblePartyIds.includes(party.partyId)),
  }));
  const evidence: EvidenceItem[] = operational.evidence.map((item) => {
    const requirement = document.evidencePolicy.evidenceRequirements.find((candidate) => candidate.evidenceRequirementId === item.evidenceRequirementId);
    return { id: item.evidenceId, kind: requirement?.evidenceClass === "external_fact" ? "external_fact" : requirement?.evidenceClass === "participant_claim" ? "participant_claim" : "document", title: requirement ? `Evidence for ${requirement.evidenceRequirementId}` : "Agreement evidence", source: item.origin, submittedBy: item.submittedByPartyId ? document.parties.find((party) => party.partyId === item.submittedByPartyId)?.displayName ?? "Participant" : item.origin, capturedAt: item.capturedAt, relatedCriterion: item.criterionIds.map((id) => document.terms.successCriteria.find((criterion) => criterion.criterionId === id)?.statement ?? id).join(", "), availability: item.availability === "available" ? "available" : item.availability === "missing" || item.availability === "inaccessible" ? "missing" : "under_review" };
  });
  const verification: Verification = {
    method: document.terms.successCriteria.some((criterion) => criterion.evaluationMode === "manual_assessment") ? "human_review" : "source_check",
    criteria: document.terms.successCriteria.map((criterion) => criterion.statement), approvedSources: document.evidencePolicy.sourceConstraints.map((source) => source.category), reviewRoute: document.verificationPolicy.reviewRoute,
    state: operational.assessment ? operational.assessment.criterionResults.some((result) => result.result === "indeterminate") ? "human_review" : "assessment_ready" : "collecting_evidence",
    requiresHumanReview: operational.financialSafetyState !== "clear" || !!operational.assessment?.criterionResults.some((result) => result.result === "indeterminate" || result.conflictingEvidenceIds.length > 0),
    humanReviewReason: operational.financialSafetyState !== "clear" ? "Financial Safety review or restriction prevents execution." : undefined,
    assessment: operational.assessment ? { summary: operational.assessment.criterionResults.map((result) => result.explanation).join(" "), matchedCriteria: operational.assessment.criterionResults.filter((result) => result.result === "satisfied").map((result) => document.terms.successCriteria.find((criterion) => criterion.criterionId === result.criterionId)?.statement ?? result.criterionId), missingInformation: operational.assessment.criterionResults.filter((result) => result.result === "indeterminate").map((result) => result.explanation), sourceEvidenceIds: operational.assessment.criterionResults.flatMap((result) => result.supportingEvidenceIds), confidence: operational.assessment.confidence.level === "not_assessed" ? "low" : operational.assessment.confidence.level, limitations: operational.assessment.limitations, recommendedAction: operational.assessment.recommendedNextAction } : undefined,
  };
  const funding: Funding = document.protectionPolicy.mode === "none" ? { mode: "none", status: "not_applicable", explanation: "No funding protection selected. This agreement is non-financial.", isSimulated: true } : { mode: document.protectionPolicy.mode, status: document.protectionPolicy.mode === "protection" ? "protected" : "intent_recorded", explanation: document.protectionPolicy.mode === "protection" ? "Simulated protection intent only; no real money is held." : "A future payment intention is recorded. Funds are not held, reserved, or guaranteed.", amountMinor: document.protectionPolicy.terms.money.amountMinor, currency: document.protectionPolicy.terms.money.currency, feesMinor: document.protectionPolicy.mode === "protection" ? document.protectionPolicy.terms.feesMinor : undefined, providerLabel: document.protectionPolicy.mode === "protection" ? document.protectionPolicy.terms.providerContext : undefined, isSimulated: true };
  const timeline: TimelineEvent[] = [{ id: `${document.versionId}-created`, status: "draft", label: "Terms prepared", description: "The agreement terms were documented.", state: operational.status === "draft" ? "current" : "complete", occurredAt: document.createdAt }, { id: `${document.versionId}-current`, status: operational.status, label: operational.status.replaceAll("_", " "), description: operational.nextAction, state: operational.exceptionState ? "exception" : "current", occurredAt: operational.updatedAt }];
  const auditEvents: AuditEvent[] = operational.audit.map((item) => ({ id: item.eventId, agreementId: item.agreementId, occurredAt: item.occurredAt, actor: item.actorId, type: item.action, summary: item.explanation, agreementVersion: document.agreementVersion, source: item.actorType === "ai" ? "ai_assessment" : item.actorType === "participant" ? "participant" : "system", evidenceIds: item.relatedObjectIds }));
  const deadline = document.terms.deadlines[0]?.instant ?? document.effectiveAt ?? document.createdAt;
  return { id: document.agreementId, version: document.agreementVersion, title: document.purpose.title, description: document.purpose.description, plainLanguageSummary: document.purpose.plainLanguageSummary, status: operational.status, createdAt: document.createdAt, updatedAt: operational.updatedAt, deadline, participants, currentUserParticipantId: operational.currentUserPartyId, obligations: document.terms.obligations.map((item) => item.description), successConditions: document.terms.successCriteria.map((item) => item.statement), evidenceExpectations: document.evidencePolicy.evidenceRequirements.map((item) => `${item.importance}: ${item.evidenceClass}`), verification, evidence, timeline, funding, auditEvents, visibility: "participants", nextAction: operational.nextAction, nextActionParticipantId: operational.nextActionPartyId, exceptionState: operational.exceptionState, resolution: { expectedOutcome: document.resolutionPolicy.outcomes.map((item) => item.type).join(", "), reviewPath: document.verificationPolicy.reviewRoute, declaredOutcome: operational.declaredOutcome } };
}
