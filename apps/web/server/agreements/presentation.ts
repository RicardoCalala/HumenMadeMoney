import type { AgreementResource } from "./application/contracts.ts";
import type { AgreementStatus, AgreementSummary, Funding, Participant, Verification } from "../../types/agreement.ts";

const participant = (party: AgreementResource["document"]["parties"][number], document: AgreementResource["document"]): Participant => ({
  id: party.partyId,
  displayName: party.displayName,
  initials: party.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join(""),
  role: party.roles.includes("creator") ? "creator" : party.roles.includes("reviewer") ? "reviewer" : party.roles.includes("observer") ? "observer" : "participant",
  acceptanceStatus: document.versionState === "accepted" ? "accepted" : "invited",
  ...(document.versionState === "accepted" ? { acceptedVersion: document.agreementVersion } : {}),
  responsibilitySummary: party.responsibilityObligationIds.length
    ? `Responsible for ${party.responsibilityObligationIds.length} accepted obligation${party.responsibilityObligationIds.length === 1 ? "" : "s"}.`
    : "Participates under the accepted agreement terms.",
  canAuthorizeResolution: false,
});

const funding = (policy: AgreementResource["document"]["protectionPolicy"]): Funding => {
  if (policy.mode === "none") return { mode: "none", status: "not_applicable", explanation: "No funding protection selected.", isSimulated: true };
  if (policy.mode === "conditional_intent") return { mode: "conditional_intent", status: "intent_recorded", explanation: "A conditional payment intent is recorded; funds are not held or guaranteed.", amountMinor: policy.terms.money.amountMinor, currency: policy.terms.money.currency, isSimulated: true };
  return { mode: "protection", status: "protected", explanation: "Simulated funding protection for local development only.", amountMinor: policy.terms.money.amountMinor, currency: policy.terms.money.currency, feesMinor: policy.terms.feesMinor, providerLabel: policy.terms.providerContext, isSimulated: true };
};

const verification = (resource: AgreementResource): Verification => ({
  method: "source_check",
  criteria: resource.document.terms.successCriteria.map((item) => item.statement),
  approvedSources: resource.document.evidencePolicy.sourceConstraints.map((item) => item.category),
  reviewRoute: resource.document.verificationPolicy.reviewRoute,
  state: resource.document.versionState === "accepted" ? "assessment_ready" : "collecting_evidence",
  requiresHumanReview: false,
});

export function toAgreementSummary(resource: AgreementResource): AgreementSummary {
  const document = resource.document;
  const deadline = document.terms.deadlines.map((item) => item.instant).find((item): item is string => Boolean(item)) ?? resource.updatedAt;
  return {
    id: resource.agreementId,
    title: document.purpose.title,
    plainLanguageSummary: document.purpose.plainLanguageSummary,
    status: resource.lifecycleState as AgreementStatus,
    deadline,
    participants: document.parties.map((party) => participant(party, document)),
    verification: verification(resource),
    funding: funding(document.protectionPolicy),
    nextAction: document.versionState === "accepted" ? "Review the accepted evidence and advisory assessment context." : "Continue reviewing the current agreement terms.",
    updatedAt: resource.updatedAt,
  };
}
