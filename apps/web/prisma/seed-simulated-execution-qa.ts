import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import type { AgreementLanguageDocument } from "../lib/agreement-language/types.ts";

export const SIMULATED_EXECUTION_QA_AGREEMENT_ID = "agreement-simulated-execution-qa";
const versionId = "version-simulated-execution-qa-v1";
const stamp = new Date("2026-08-06T00:00:00.000Z");
const json = (value: unknown) => value as Prisma.InputJsonValue;

const document: AgreementLanguageDocument = {
  schemaVersion: "1.0",
  agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID,
  agreementVersion: 1,
  versionId,
  versionState: "accepted",
  economicSides: [
    { economicSideId: "qa-side-alex", partyIds: ["qa-party-alex"], settlementDestinationRef: "simulated-destination-alex" },
    { economicSideId: "qa-side-jordan", partyIds: ["qa-party-jordan"], settlementDestinationRef: "simulated-destination-jordan" },
  ],
  purpose: {
    title: "SYNTHETIC QA — simulated execution walkthrough",
    description: "Deterministic local/test agreement for Sprint 5.7.1 browser execution QA. It never represents real work, real funds, custody, or payment.",
    plainLanguageSummary: "Alex and Jordan accepted a synthetic scenario whose only value consequence is a simulated, exactly balanced CAD 25.00 ledger record.",
  },
  parties: [
    { partyId: "qa-party-alex", partyType: "person", displayName: "Alex (synthetic QA)", roles: ["creator", "recipient"], responsibilityObligationIds: ["qa-obligation"], acceptanceRequired: true, economicSideId: "qa-side-alex" },
    { partyId: "qa-party-jordan", partyType: "person", displayName: "Jordan (synthetic QA)", roles: ["performer"], responsibilityObligationIds: ["qa-obligation"], acceptanceRequired: true, economicSideId: "qa-side-jordan" },
  ],
  terms: {
    obligations: [{ obligationId: "qa-obligation", title: "Complete the synthetic QA milestone", description: "A local/test-only milestone used to prove simulated execution.", responsiblePartyIds: ["qa-party-jordan"], beneficiaryPartyIds: ["qa-party-alex"], requirement: "required", prerequisiteConditionIds: [], successCriterionIds: ["qa-criterion"], evidenceRequirementIds: ["qa-evidence-requirement"], exceptionOutcome: "review_required" }],
    conditions: [],
    successCriteria: [{ criterionId: "qa-criterion", obligationId: "qa-obligation", statement: "The deterministic synthetic QA milestone is marked complete.", evaluationMode: "deterministic", conditionIds: [], evidenceRequirementIds: ["qa-evidence-requirement"], allowedResults: ["satisfied", "not_satisfied", "indeterminate"] }],
    deadlines: [],
  },
  evidencePolicy: {
    sourceConstraints: [{ sourceConstraintId: "qa-fixture-source", category: "synthetic_local_test", retrievalMethod: "system_record", permittedFields: ["result", "simulation"], participantConfirmationRequired: false }],
    evidenceRequirements: [{ evidenceRequirementId: "qa-evidence-requirement", criterionIds: ["qa-criterion"], importance: "required", evidenceClass: "system_event", submitterPartyIds: ["qa-party-jordan"], sourceConstraintIds: ["qa-fixture-source"], minimumDistinctSources: 1, independentSourcesRequired: false, visibility: "participants", sensitivity: "standard", onMissing: "request_evidence", onConflict: "request_human_review" }],
  },
  verificationPolicy: { criterionIds: ["qa-criterion"], aggregation: "all_required", policyVersion: "sprint-5.7.1-qa", missingEvidenceResult: "indeterminate", conflictingEvidenceResult: "indeterminate", mandatoryReviewTriggers: ["participant_challenge", "dispute_or_risk_flag", "version_or_authority_unproven"], reviewRoute: "local_test_human_review" },
  protectionPolicy: { mode: "protection", terms: { money: { amountMinor: 2500, currency: "CAD" }, releaseOutcomeIds: ["qa-complete"], refundOutcomeIds: [], providerContext: "SIMULATED_LOCAL_TEST_ONLY_NO_PROVIDER" } },
  authorizationPolicy: {
    aiMayAuthorize: false,
    requirements: [
      { action: "record_resolution", eligiblePartyIds: ["qa-party-alex"], minimumApprovals: 1, selfApprovalProhibited: false, requiredVersionState: ["accepted"], humanReviewRequired: false },
      { action: "create_settlement_instruction", eligiblePartyIds: ["qa-party-alex"], minimumApprovals: 1, selfApprovalProhibited: false, requiredVersionState: ["accepted"], humanReviewRequired: false },
    ],
  },
  resolutionPolicy: { outcomes: [{ outcomeId: "qa-complete", type: "completion", prerequisiteCriterionIds: ["qa-criterion"], authorizationAction: "record_resolution", explanationRequired: true, appealAllowed: true }], reviewWindowSeconds: 0, cancellation: { beforeAcceptance: "creator_may_withdraw", afterAcceptance: "required_party_consent", eligibleInitiatorPartyIds: ["qa-party-alex", "qa-party-jordan"] }, maxAppeals: 1 },
  privacyPolicy: { defaultEvidenceVisibility: "participants_and_authorized_reviewers", privateEvidenceTrainingUse: false },
  financialSafetyPolicy: { initialState: "clear", hooks: ["destination_integrity", "human_compliance_review"], complianceHoldOverridesTimers: true },
  effectiveAt: stamp.toISOString(),
  createdAt: stamp.toISOString(),
  createdByPartyId: "qa-party-alex",
};

export async function seedSimulatedExecutionQaAgreement(prisma: PrismaClient) {
  if (await prisma.agreement.findUnique({ where: { id: SIMULATED_EXECUTION_QA_AGREEMENT_ID }, select: { id: true } })) return;
  const documentDigest = createHash("sha256").update(`hmm:agreement-document:${JSON.stringify(document)}`).digest("base64url");
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO "agreements" ("id", "current_version_id", "lifecycle_state", "created_at", "updated_at", "created_by_actor_id", "last_changed_by_actor_id", "correlation_id", "source", "revision") VALUES (${SIMULATED_EXECUTION_QA_AGREEMENT_ID}, ${versionId}, 'accepted'::"AgreementLifecycleState", ${stamp}, ${stamp}, 'account-alex', 'account-alex', 'seed-simulated-execution-qa', 'development_seed', 0)`;
    await tx.agreementVersion.create({ data: { id: versionId, agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, agreementVersion: 1, schemaVersion: "1.0", versionState: "accepted", createdAt: stamp, createdByPartyId: "qa-party-alex", document: json(document), protectionMode: "protection", documentDigest } });
    await tx.agreementVersionParty.createMany({ data: document.parties.map((party) => ({ agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, partyId: party.partyId, acceptanceRequired: party.acceptanceRequired, partyType: party.partyType, roles: json(party.roles) })) });
    await tx.agreementMembership.createMany({ data: [
      { id: "membership-simulated-qa-alex", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, accountId: "account-alex", partyId: "qa-party-alex", role: "owner", state: "active", createdAt: stamp, createdByAccountId: "account-alex", activatedAt: stamp },
      { id: "membership-simulated-qa-jordan", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, accountId: "account-jordan", partyId: "qa-party-jordan", role: "participant", state: "active", createdAt: stamp, createdByAccountId: "account-alex", activatedAt: stamp },
    ] });
    await tx.agreementAcceptance.createMany({ data: [
      { id: "acceptance-simulated-qa-alex", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, partyId: "qa-party-alex", acceptedAt: stamp, consentContext: "synthetic_local_test_fixture", assuranceContext: "development_profile", accountId: "account-alex", recordedAt: stamp, correlationId: "seed-simulated-execution-qa" },
      { id: "acceptance-simulated-qa-jordan", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, partyId: "qa-party-jordan", acceptedAt: stamp, consentContext: "synthetic_local_test_fixture", assuranceContext: "development_profile", accountId: "account-jordan", recordedAt: stamp, correlationId: "seed-simulated-execution-qa" },
    ] });
    await tx.evidenceItem.create({ data: { id: "evidence-simulated-qa", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, evidenceRequirementId: "qa-evidence-requirement", lifecycle: "active", createdAt: stamp, createdByAccountId: "account-jordan", revision: 1 } });
    await tx.evidenceRevision.create({ data: { id: "evidence-revision-simulated-qa", evidenceId: "evidence-simulated-qa", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, revisionNumber: 1, criterionIds: ["qa-criterion"], evidenceClass: "system_event", origin: "system", submittedByPartyId: "qa-party-jordan", submittedByAccountId: "account-jordan", sourceConstraintId: "qa-fixture-source", sourceRefKind: "fixture", sourceRef: "synthetic-simulated-qa-complete", sourceDisplayLabel: "Synthetic local/test completion record", capturedAt: stamp, receivedAt: stamp, availability: "available", integrity: "verified", validation: "valid", validationReasons: [], metadata: { result: true, simulation: true, disclaimer: "No real funds or work" }, contentDigest: "synthetic-fixture-no-external-content" } });
    await tx.evidenceItem.update({ where: { id: "evidence-simulated-qa" }, data: { currentRevisionId: "evidence-revision-simulated-qa" } });
    await tx.evidenceSet.create({ data: { id: "evidence-set-simulated-qa", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, canonicalizationVersion: "1", digest: "synthetic-simulated-execution-qa-evidence-set", createdAt: stamp, createdByAccountId: "account-alex", members: { create: [{ evidenceRevisionId: "evidence-revision-simulated-qa", ordinal: 0 }] } } });
    await tx.assessment.create({ data: { id: "assessment-simulated-qa", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, evidenceSetId: "evidence-set-simulated-qa", adapterKind: "deterministic", adapterVersion: "sprint-5.7.1-qa", policyVersion: "sprint-5.7.1-qa", status: "completed", confidence: { level: "high", basis: ["Deterministic synthetic fixture"], limitations: ["Local/test scenario only; not proof of real-world performance"] }, limitations: ["Advisory assessment only; grants no authority and moves no funds"], recommendedNextAction: "participant_review", occurredAt: stamp, revision: 1, findings: { create: [{ criterionId: "qa-criterion", result: "satisfied", evidenceRequirementIds: ["qa-evidence-requirement"], explanation: "The deterministic synthetic fixture marks the QA criterion satisfied.", limitations: ["Synthetic local/test evidence only"], supporting: { create: [{ evidenceRevisionId: "evidence-revision-simulated-qa" }] } }] } } });
    await tx.financialSafetyStatus.create({ data: { agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, state: "clear", revision: 1, updatedAt: stamp } });
    await tx.auditRecord.create({ data: { id: "audit-simulated-execution-qa-seeded", agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId, actorType: "system", actorId: "local-test-seed", action: "qa.synthetic_fixture.seeded", occurredAt: stamp, recordedAt: stamp, correlationId: "seed-simulated-execution-qa", sourceSystem: "development-seed", policyVersion: "sprint-5.7.1-qa", relatedObjectIds: [versionId, "evidence-set-simulated-qa", "assessment-simulated-qa"], explanation: "Created a deterministic synthetic simulated-execution QA fixture. No real funds, custody, provider, or payment rail exists." } });
  });
}
