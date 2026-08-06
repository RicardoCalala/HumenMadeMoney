import assert from "node:assert/strict";
import test from "node:test";
import { toSprint51Agreement } from "../lib/agreement-language/compatibility.ts";
import { evaluateAmendment, guardSettlementExecution, requiresHumanReview, validateUnanimousAcceptance } from "../lib/agreement-language/policy.ts";
import { AGREEMENT_SCHEMA_VERSION, DEFAULT_REVIEW_WINDOW_SECONDS, type AcceptanceRecord, type AgreementLanguageDocument, type AssessmentRecord, type AuthorizationGrant, type DisputeRecord, type SettlementGuardContext } from "../lib/agreement-language/types.ts";
import { validateAgreementDocument } from "../lib/agreement-language/validation.ts";

function documentFixture(): AgreementLanguageDocument {
  return {
    schemaVersion: AGREEMENT_SCHEMA_VERSION, agreementId: "agr-1", agreementVersion: 2, versionId: "ver-2", previousVersionId: "ver-1", versionState: "accepted",
    economicSides: [{ economicSideId: "side-alex", partyIds: ["party-alex"], settlementDestinationRef: "dest-alex" }, { economicSideId: "side-jordan", partyIds: ["party-jordan"], settlementDestinationRef: "dest-jordan" }],
    purpose: { title: "Deliver the brand package", description: "Alex delivers and Jordan reviews the package.", plainLanguageSummary: "Both parties share one inspectable agreement." },
    parties: [
      { partyId: "party-alex", partyType: "person", displayName: "Alex Morgan", roles: ["creator", "performer"], responsibilityObligationIds: ["obl-deliver"], acceptanceRequired: true, economicSideId: "side-alex" },
      { partyId: "party-jordan", partyType: "person", displayName: "Jordan Lee", roles: ["recipient", "reviewer"], responsibilityObligationIds: [], acceptanceRequired: true, economicSideId: "side-jordan" },
    ],
    terms: {
      obligations: [{ obligationId: "obl-deliver", title: "Deliver", description: "Alex delivers the final package.", responsiblePartyIds: ["party-alex"], beneficiaryPartyIds: ["party-jordan"], requirement: "required", deadlineId: "deadline-delivery", prerequisiteConditionIds: [], successCriterionIds: ["criterion-files"], evidenceRequirementIds: ["evidence-files"], exceptionOutcome: "review_required" }],
      conditions: [{ conditionId: "condition-files", statement: "The required files are present.", operator: "event_present", evidenceRequirementIds: ["evidence-files"] }],
      successCriteria: [{ criterionId: "criterion-files", obligationId: "obl-deliver", statement: "All required files are present.", evaluationMode: "deterministic", conditionIds: ["condition-files"], evidenceRequirementIds: ["evidence-files"], allowedResults: ["satisfied", "not_satisfied", "indeterminate"] }],
      deadlines: [{ deadlineId: "deadline-delivery", instant: "2026-08-12T23:59:00Z", timezone: "America/Edmonton", inclusive: true, onReached: "request_review", extensionRequiresAmendment: true }],
    },
    evidencePolicy: {
      evidenceRequirements: [{ evidenceRequirementId: "evidence-files", criterionIds: ["criterion-files"], importance: "required", evidenceClass: "document", submitterPartyIds: ["party-alex"], sourceConstraintIds: ["source-project"], minimumDistinctSources: 1, independentSourcesRequired: false, visibility: "participants", sensitivity: "standard", onMissing: "request_human_review", onConflict: "request_human_review" }],
      sourceConstraints: [{ sourceConstraintId: "source-project", category: "Project delivery record", retrievalMethod: "participant_submission", permittedFields: ["file_name", "captured_at"], participantConfirmationRequired: true }],
    },
    verificationPolicy: { criterionIds: ["criterion-files"], aggregation: "all_required", policyVersion: "verification-1", missingEvidenceResult: "indeterminate", conflictingEvidenceResult: "indeterminate", mandatoryReviewTriggers: ["missing_required_evidence", "conflicting_evidence", "manual_assessment", "participant_challenge", "dispute_or_risk_flag", "evaluator_failure", "version_or_authority_unproven"], reviewRoute: "Route uncertainty or conflict to an authorized human reviewer." },
    protectionPolicy: { mode: "protection", terms: { money: { amountMinor: 240000, currency: "CAD" }, feesMinor: 4800, releaseOutcomeIds: ["outcome-complete"], refundOutcomeIds: ["outcome-cancel"], providerContext: "Simulation only" } },
    authorizationPolicy: { aiMayAuthorize: false, requirements: [{ action: "record_resolution", eligiblePartyIds: ["party-alex", "party-jordan"], minimumApprovals: 1, selfApprovalProhibited: false, requiredVersionState: ["accepted"], humanReviewRequired: false }, { action: "create_settlement_instruction", eligiblePartyIds: ["party-alex", "party-jordan"], minimumApprovals: 1, selfApprovalProhibited: false, requiredVersionState: ["accepted"], humanReviewRequired: false }] },
    resolutionPolicy: { reviewWindowSeconds: DEFAULT_REVIEW_WINDOW_SECONDS, maxAppeals: 1, cancellation: { beforeAcceptance: "creator_may_withdraw", afterAcceptance: "required_party_consent", eligibleInitiatorPartyIds: ["party-alex", "party-jordan"] }, outcomes: [{ outcomeId: "outcome-complete", type: "completion", prerequisiteCriterionIds: ["criterion-files"], authorizationAction: "record_resolution", explanationRequired: true, appealAllowed: false }, { outcomeId: "outcome-cancel", type: "cancellation", prerequisiteCriterionIds: [], authorizationAction: "approve_cancellation", explanationRequired: true, appealAllowed: true }] },
    privacyPolicy: { defaultEvidenceVisibility: "participants_and_authorized_reviewers", privateEvidenceTrainingUse: false },
    financialSafetyPolicy: { initialState: "clear", hooks: ["identity_status", "sanctions_screening", "transaction_monitoring", "risk_flags", "destination_integrity", "human_compliance_review"], complianceHoldOverridesTimers: true },
    createdAt: "2026-07-18T15:00:00Z", createdByPartyId: "party-alex", effectiveAt: "2026-07-20T17:00:00Z",
  };
}

const acceptance = (partyId: string): AcceptanceRecord => ({ acceptanceId: `accept-${partyId}`, agreementId: "agr-1", versionId: "ver-2", partyId, acceptedAt: "2026-07-20T17:00:00Z", consentContext: "Reviewed exact version", assuranceContext: "Demo participant session" });
const grant = (): AuthorizationGrant => ({ authorizationId: "auth-1", agreementId: "agr-1", versionId: "ver-2", partyId: "party-jordan", action: "create_settlement_instruction", consequenceRef: "outcome-complete", grantedAt: "2026-08-13T00:00:00Z" });
const settlementContext = () => ({ document: documentFixture(), assessmentResult: "satisfied" as const, proposedAt: "2026-08-13T00:00:00Z", evaluatedAt: "2026-08-14T00:00:00Z", financialSafetyState: "clear" as const, authorizationGrants: [grant()], consequenceRef: "outcome-complete" });

test("valid canonical document keeps schema and content versions separate", () => {
  const document = documentFixture(); const result = validateAgreementDocument(document);
  assert.equal(result.valid, true); assert.equal(document.schemaVersion, "1.0"); assert.equal(document.agreementVersion, 2); assert.equal(document.versionId, "ver-2"); assert.equal(document.resolutionPolicy.reviewWindowSeconds, 86400);
});

test("validator returns stable paths and codes for broken references and unsupported schema", () => {
  const document = documentFixture(); (document as { schemaVersion: string }).schemaVersion = "2.0"; document.terms.obligations[0]!.responsiblePartyIds = ["missing-party"];
  const result = validateAgreementDocument(document);
  assert.equal(result.valid, false); assert.ok(result.errors.some((item) => item.code === "SCHEMA_VERSION_UNSUPPORTED" && item.path === "/schemaVersion")); assert.ok(result.errors.some((item) => item.code === "REFERENCE_NOT_FOUND" && item.relatedIds?.includes("missing-party")));
});

test("duplicate IDs, unevaluable criteria, invalid money, and unbounded appeals fail safely", () => {
  const document = documentFixture(); document.parties.push({ ...document.parties[0]! }); document.terms.successCriteria[0]!.conditionIds = []; document.resolutionPolicy.maxAppeals = -1;
  if (document.protectionPolicy.mode === "protection") { document.protectionPolicy.terms.money.amountMinor = 1.5; document.protectionPolicy.terms.money.currency = "cad"; }
  const codes = new Set(validateAgreementDocument(document).errors.map((item) => item.code));
  ["DUPLICATE_ID", "CRITERION_UNEVALUABLE", "MONEY_INVALID", "CURRENCY_INVALID", "APPEAL_LIMIT_INVALID"].forEach((code) => assert.ok(codes.has(code), code));
});

test("solo financial transfers and missing economic sides are rejected while solo non-financial agreements remain valid", () => {
  const solo = documentFixture(); solo.parties = [solo.parties[0]!]; solo.economicSides = [solo.economicSides[0]!];
  const financialCodes = new Set(validateAgreementDocument(solo).errors.map((item) => item.code)); assert.ok(financialCodes.has("SOLO_FINANCIAL_TRANSFER_PROHIBITED")); assert.ok(financialCodes.has("ECONOMIC_SIDES_REQUIRED"));
  solo.protectionPolicy = { mode: "none" }; const nonFinancialCodes = new Set(validateAgreementDocument(solo).errors.map((item) => item.code)); assert.equal(nonFinancialCodes.has("SOLO_FINANCIAL_TRANSFER_PROHIBITED"), false); assert.equal(nonFinancialCodes.has("ECONOMIC_SIDES_REQUIRED"), false);
});

test("unanimous acceptance binds every required party to the exact version", () => {
  const document = documentFixture(); assert.equal(validateUnanimousAcceptance(document, [acceptance("party-alex")]).valid, false); assert.equal(validateUnanimousAcceptance(document, [acceptance("party-alex"), acceptance("party-jordan")]).valid, true);
  const wrongVersion = { ...acceptance("party-jordan"), versionId: "ver-1" }; assert.equal(validateUnanimousAcceptance(document, [acceptance("party-alex"), wrongVersion]).valid, false);
});

test("material amendments require renewed acceptance while display-only purpose metadata does not", () => {
  const previous = documentFixture(); const material = structuredClone(previous); material.versionId = "ver-3"; material.agreementVersion = 3; material.terms.obligations[0]!.description = "Changed responsibility";
  assert.deepEqual(evaluateAmendment(previous, material), { material: true, renewedAcceptanceRequired: true, reasons: ["obligations, criteria, or deadlines"] });
  const cosmetic = structuredClone(previous); cosmetic.purpose.title = "Shorter display title"; assert.equal(evaluateAmendment(previous, cosmetic).renewedAcceptanceRequired, false);
});

test("missing or conflicting evidence stays indeterminate and triggers accountable review", () => {
  const assessment: AssessmentRecord = { assessmentId: "assessment-1", agreementId: "agr-1", versionId: "ver-2", actorType: "ai", actorId: "model-config-1", criterionResults: [{ criterionId: "criterion-files", result: "indeterminate", supportingEvidenceIds: ["evidence-1"], conflictingEvidenceIds: ["evidence-2"], explanation: "Sources conflict." }], confidence: { level: "low", basis: ["One source"], limitations: ["Conflict unresolved"] }, limitations: ["Advisory only"], recommendedNextAction: "Request human review", policyVersion: "verification-1", occurredAt: "2026-08-13T00:00:00Z" };
  assert.equal(requiresHumanReview(assessment), true); assert.equal(assessment.actorType, "ai");
});

test("settlement guard rejects active windows, disputes, held/restricted states, missing authority, and indeterminate evidence", () => {
  const cases: Array<[SettlementGuardContext, string]> = [
    [{ ...settlementContext(), evaluatedAt: "2026-08-13T23:59:59Z" }, "REVIEW_WINDOW_ACTIVE"],
    [{ ...settlementContext(), dispute: { disputeId: "dispute-1", agreementId: "agr-1", versionId: "ver-2", openedAt: "2026-08-13T12:00:00Z", openedByPartyId: "party-alex", status: "open", claimRefs: [] } satisfies DisputeRecord }, "ACTIVE_DISPUTE"],
    [{ ...settlementContext(), financialSafetyState: "held" as const }, "FINANCIAL_SAFETY_HELD"],
    [{ ...settlementContext(), financialSafetyState: "restricted" as const }, "FINANCIAL_SAFETY_RESTRICTED"],
    [{ ...settlementContext(), authorizationGrants: [] as AuthorizationGrant[] }, "AUTHORITY_MISSING"],
    [{ ...settlementContext(), assessmentResult: "indeterminate" as const }, "EVIDENCE_INDETERMINATE"],
  ];
  for (const [context, expectedCode] of cases) assert.ok(guardSettlementExecution(context).errors.some((item) => item.code === expectedCode), expectedCode);
  assert.equal(guardSettlementExecution(settlementContext()).valid, true);
});

test("compatibility adapter preserves current UI meaning without making AI or simulation authoritative", () => {
  const document = documentFixture(); const view = toSprint51Agreement(document, { status: "verification", currentUserPartyId: "party-alex", updatedAt: "2026-08-13T00:00:00Z", acceptances: [acceptance("party-alex"), acceptance("party-jordan")], evidence: [], audit: [], financialSafetyState: "review_required", nextAction: "An authorized human reviews the evidence." });
  assert.equal(view.id, document.agreementId); assert.equal(view.version, document.agreementVersion); assert.equal(view.participants.every((party) => party.acceptedVersion === 2), true); assert.equal(view.funding.isSimulated, true); assert.equal(view.verification.requiresHumanReview, true); assert.match(view.funding.explanation, /no real money/i);
});
