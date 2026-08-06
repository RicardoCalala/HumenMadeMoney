import type { Agreement, AgreementId, AgreementSummary, CreateAgreementInput } from "@/types/agreement";

export const DEMO_NOW = "2026-08-06T18:00:00Z";
const people = {
  alex: { id: "p-alex", displayName: "Alex Morgan", initials: "AM", role: "creator", acceptanceStatus: "accepted", acceptedVersion: 2, acceptedAt: "2026-07-20T16:00:00Z", responsibilitySummary: "Provides the completed work and supporting evidence.", canAuthorizeResolution: true },
  jordan: { id: "p-jordan", displayName: "Jordan Lee", initials: "JL", role: "participant", acceptanceStatus: "accepted", acceptedVersion: 2, acceptedAt: "2026-07-20T17:00:00Z", responsibilitySummary: "Reviews the work against the agreed success conditions.", canAuthorizeResolution: true },
} as const;

function fixture(id: string, title: string, status: Agreement["status"], funding: Agreement["funding"], overrides: Partial<Agreement> = {}): Agreement {
  const timeline: Agreement["timeline"] = [
    { id: `${id}-t1`, status: "draft", label: "Terms prepared", description: "The purpose and responsibilities were documented.", state: "complete", occurredAt: "2026-07-18T15:00:00Z" },
    { id: `${id}-t2`, status: "in_review", label: "Shared review", description: "Participants reviewed the same agreement version.", state: status === "in_review" ? "current" : "complete", occurredAt: "2026-07-19T15:00:00Z" },
    { id: `${id}-t3`, status: "in_progress", label: "Commitments underway", description: "Participants complete responsibilities and collect evidence.", state: ["active","in_progress"].includes(status) ? "current" : ["draft","in_review","accepted"].includes(status) ? "upcoming" : "complete" },
    { id: `${id}-t4`, status: "verification", label: "Evidence review", description: "Evidence is assessed against the agreed conditions.", state: status === "verification" ? "current" : ["awaiting_decision","resolved","closed"].includes(status) ? "complete" : "upcoming" },
    { id: `${id}-t5`, status: "awaiting_decision", label: "Human authorization", description: "An authorized participant reviews any consequential outcome.", state: status === "awaiting_decision" ? "current" : ["resolved","closed"].includes(status) ? "complete" : "upcoming" },
  ];
  return {
    id, version: 2, title, description: "A shared commitment with explicit responsibilities, evidence, and a review path.", plainLanguageSummary: "Alex will deliver the agreed work and Jordan will review it against the documented success conditions.", status,
    createdAt: "2026-07-18T15:00:00Z", updatedAt: "2026-08-05T15:00:00Z", deadline: "2026-08-12T23:59:00Z",
    participants: [people.alex, people.jordan] as Agreement["participants"], currentUserParticipantId: "p-alex",
    obligations: ["Alex delivers the final materials by the deadline.", "Jordan reviews the materials within two business days."],
    successConditions: ["All agreed materials are complete and accessible.", "The result matches the approved scope."],
    evidenceExpectations: ["Final delivery link", "Participant confirmation"],
    verification: { method: "source_check", criteria: ["Required materials are present", "Delivery occurred before the deadline"], approvedSources: ["Project delivery record", "Participant confirmation"], reviewRoute: "If evidence is incomplete or contested, pause for human review.", state: status === "verification" ? "assessment_ready" : status === "disputed" ? "human_review" : "collecting_evidence", requiresHumanReview: status === "disputed", humanReviewReason: status === "disputed" ? "Participants disagree about whether the scope was completed." : undefined,
      assessment: ["verification","awaiting_decision","disputed"].includes(status) ? { summary: "Available evidence supports most criteria, but one confirmation remains outstanding.", matchedCriteria: ["Required materials are present"], missingInformation: ["Jordan’s confirmation of the final scope"], sourceEvidenceIds: [`${id}-e1`], confidence: status === "disputed" ? "low" : "medium", limitations: ["This mock assessment cannot authenticate source records or decide an outcome."], recommendedAction: "Collect the missing confirmation, then ask an authorized participant or reviewer to decide." } : undefined },
    evidence: status === "draft" ? [] : [{ id: `${id}-e1`, kind: "document", title: "Final delivery record", source: "Participant-provided project record", submittedBy: "Alex Morgan", capturedAt: "2026-08-04T16:20:00Z", relatedCriterion: "Required materials are present", availability: "available" }],
    timeline, funding, auditEvents: status === "draft" ? [] : [{ id: `${id}-a1`, agreementId: id, occurredAt: "2026-07-20T17:00:00Z", actor: "Jordan Lee", type: "agreement_accepted", summary: "Accepted agreement version 2.", fromStatus: "in_review", toStatus: "accepted", agreementVersion: 2, source: "participant" }],
    visibility: "participants", nextAction: status === "in_review" ? "Jordan needs to review and accept version 2." : status === "verification" ? "Review the evidence assessment and supply the missing confirmation." : status === "awaiting_decision" ? "An explicitly authorized participant must review the proposed outcome." : status === "disputed" ? "Human review is required before any resolution." : "Continue the documented responsibilities and collect evidence.", nextActionParticipantId: "p-jordan",
    resolution: { expectedOutcome: funding.mode === "none" ? "Participants confirm completion and close the agreement." : "After verification, an authorized participant chooses the documented simulated release or refund outcome.", reviewPath: "Uncertain or contested outcomes pause for human review; no automatic settlement occurs.", declaredOutcome: ["resolved","closed"].includes(status) ? "Participants confirmed the agreement was completed." : undefined },
    ...overrides,
  };
}

const noFunding: Agreement["funding"] = { mode: "none", status: "not_applicable", explanation: "No funding protection selected. This agreement is non-financial.", isSimulated: true };
const protectedFunding: Agreement["funding"] = { mode: "protection", status: "protected", explanation: "Demo funds are shown as protected for this simulation; no real money is held.", amountMinor: 240000, currency: "CAD", feesMinor: 4800, providerLabel: "Simulated protection provider", releaseConditions: "Participant authorization after the success conditions are verified.", refundConditions: "Participant authorization or human review when the conditions are not met.", isSimulated: true };
const intentFunding: Agreement["funding"] = { mode: "conditional_intent", status: "intent_recorded", explanation: "A future payment intention is recorded. Funds are not held, reserved, or guaranteed.", amountMinor: 85000, currency: "CAD", isSimulated: true };

const records: Agreement[] = [
  fixture("agr-community-garden", "Coordinate the community garden harvest schedule", "in_progress", noFunding),
  fixture("agr-brand-delivery", "Complete the brand identity delivery and evidence review", "verification", protectedFunding),
  fixture("agr-workshop", "Facilitate the neighbourhood repair workshop and share attendance evidence", "in_review", intentFunding),
  fixture("agr-accessibility-review", "Review the accessibility findings", "awaiting_decision", noFunding),
  fixture("agr-contested-scope", "Resolve the contested project scope", "disputed", protectedFunding, { exceptionState: { title: "Outcome is contested", description: "No resolution or simulated fund action can proceed until a human reviewer considers both participants’ evidence." } }),
  fixture("agr-expired-quote", "Confirm the expired event quote", "expired", intentFunding, { exceptionState: { title: "Agreement expired", description: "The review window ended without acceptance. Create a new draft if the participants still want to proceed." }, evidence: [], auditEvents: [] }),
  fixture("agr-completed-mentoring", "Complete the six-week mentoring plan", "closed", noFunding, { closedAt: "2026-07-30T18:00:00Z", nextAction: "No action is required. This agreement is complete." }),
  fixture("agr-draft-retreat", "Plan the volunteer retreat responsibilities", "draft", noFunding),
];

function summary(a: Agreement): AgreementSummary { const { id,title,plainLanguageSummary,status,deadline,participants,verification,funding,nextAction,updatedAt,exceptionState } = a; return { id,title,plainLanguageSummary,status,deadline,participants,verification,funding,nextAction,updatedAt,exceptionState }; }
export async function listAgreements(): Promise<AgreementSummary[]> { return records.map(summary); }
export async function getAgreementById(id: AgreementId): Promise<Agreement | null> { return records.find(a => a.id === id) ?? null; }
export async function createAgreementPreview(input: CreateAgreementInput): Promise<Agreement> { return fixture("agr-local-preview", input.title, "draft", input.fundingMode === "none" ? noFunding : input.fundingMode === "protection" ? protectedFunding : intentFunding, { description: input.purpose, plainLanguageSummary: `${input.participantName} will ${input.participantResponsibility.toLowerCase()}.`, obligations: [input.obligation], successConditions: [input.successCondition], evidenceExpectations: [input.evidenceSource], deadline: `${input.deadline}T23:59:00Z`, visibility: input.visibility, resolution: { expectedOutcome: input.resolutionApproach, reviewPath: "Uncertain or contested outcomes require human review." } }); }
