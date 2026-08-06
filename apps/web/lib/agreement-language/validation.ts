import { AGREEMENT_SCHEMA_VERSION, type AgreementLanguageDocument, type AgreementValidationError, type AgreementValidationResult } from "./validation-types.ts";

const MAX_COLLECTION_ITEMS = 500;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const currencyPattern = /^[A-Z]{3}$/;

function error(code: string, path: string, message: string, category: AgreementValidationError["category"], relatedIds?: string[]): AgreementValidationError {
  return { code, path, message, category, severity: "error", relatedIds };
}

export function validateAgreementDocument(document: AgreementLanguageDocument): AgreementValidationResult {
  const errors: AgreementValidationError[] = [];
  if (document.schemaVersion !== AGREEMENT_SCHEMA_VERSION) errors.push(error("SCHEMA_VERSION_UNSUPPORTED", "/schemaVersion", "Only Agreement Language 1.0 is supported.", "shape"));
  for (const [path, value] of [["/agreementId", document.agreementId], ["/versionId", document.versionId], ["/createdByPartyId", document.createdByPartyId]] as const) {
    if (!idPattern.test(value)) errors.push(error("ID_INVALID", path, "Identifier must be opaque, non-empty, and use safe characters.", "shape"));
  }
  if (!Number.isSafeInteger(document.agreementVersion) || document.agreementVersion < 1) errors.push(error("AGREEMENT_VERSION_INVALID", "/agreementVersion", "Agreement version must be a positive integer.", "shape"));
  if (!Number.isSafeInteger(document.resolutionPolicy.reviewWindowSeconds) || document.resolutionPolicy.reviewWindowSeconds < 0) errors.push(error("REVIEW_WINDOW_INVALID", "/resolutionPolicy/reviewWindowSeconds", "Review window must be a configurable non-negative integer.", "policy"));
  if (!Number.isSafeInteger(document.resolutionPolicy.maxAppeals) || document.resolutionPolicy.maxAppeals < 0) errors.push(error("APPEAL_LIMIT_INVALID", "/resolutionPolicy/maxAppeals", "Appeals must have a bounded non-negative limit.", "policy"));

  const collections: Array<[string, unknown[], (value: unknown) => unknown, string]> = [
    ["/parties", document.parties, (value) => (value as { partyId?: unknown }).partyId, "partyId"], ["/economicSides", document.economicSides, (value) => (value as { economicSideId?: unknown }).economicSideId, "economicSideId"], ["/terms/obligations", document.terms.obligations, (value) => (value as { obligationId?: unknown }).obligationId, "obligationId"],
    ["/terms/conditions", document.terms.conditions, (value) => (value as { conditionId?: unknown }).conditionId, "conditionId"], ["/terms/successCriteria", document.terms.successCriteria, (value) => (value as { criterionId?: unknown }).criterionId, "criterionId"], ["/terms/deadlines", document.terms.deadlines, (value) => (value as { deadlineId?: unknown }).deadlineId, "deadlineId"],
    ["/evidencePolicy/evidenceRequirements", document.evidencePolicy.evidenceRequirements, (value) => (value as { evidenceRequirementId?: unknown }).evidenceRequirementId, "evidenceRequirementId"], ["/evidencePolicy/sourceConstraints", document.evidencePolicy.sourceConstraints, (value) => (value as { sourceConstraintId?: unknown }).sourceConstraintId, "sourceConstraintId"],
    ["/resolutionPolicy/outcomes", document.resolutionPolicy.outcomes, (value) => (value as { outcomeId?: unknown }).outcomeId, "outcomeId"],
  ];
  for (const [path, values, getId, key] of collections) {
    if (values.length > MAX_COLLECTION_ITEMS) errors.push(error("COLLECTION_LIMIT_EXCEEDED", path, `Collection may contain at most ${MAX_COLLECTION_ITEMS} items.`, "shape"));
    const seen = new Set<string>();
    values.forEach((value, index) => {
      const id = getId(value);
      if (typeof id !== "string" || !idPattern.test(id)) errors.push(error("ID_INVALID", `${path}/${index}/${key}`, "Identifier must be opaque, non-empty, and use safe characters.", "shape"));
      else if (seen.has(id)) errors.push(error("DUPLICATE_ID", `${path}/${index}/${key}`, "Identifier must be unique within its collection.", "reference", [id]));
      else seen.add(id);
    });
  }

  const parties = new Set(document.parties.map((party) => party.partyId));
  const sides = new Set(document.economicSides.map((side) => side.economicSideId));
  const obligations = new Set(document.terms.obligations.map((obligation) => obligation.obligationId));
  const conditions = new Set(document.terms.conditions.map((condition) => condition.conditionId));
  const criteria = new Set(document.terms.successCriteria.map((criterion) => criterion.criterionId));
  const deadlines = new Set(document.terms.deadlines.map((deadline) => deadline.deadlineId));
  const evidenceRequirements = new Set(document.evidencePolicy.evidenceRequirements.map((requirement) => requirement.evidenceRequirementId));
  const sources = new Set(document.evidencePolicy.sourceConstraints.map((source) => source.sourceConstraintId));
  const outcomes = new Set(document.resolutionPolicy.outcomes.map((outcome) => outcome.outcomeId));
  const requireRefs = (refs: string[], target: Set<string>, path: string) => refs.forEach((ref, index) => { if (!target.has(ref)) errors.push(error("REFERENCE_NOT_FOUND", `${path}/${index}`, "Referenced identifier does not exist.", "reference", [ref])); });

  if (!parties.has(document.createdByPartyId)) errors.push(error("REFERENCE_NOT_FOUND", "/createdByPartyId", "Creating party must exist in parties.", "reference", [document.createdByPartyId]));
  document.parties.forEach((party, index) => { requireRefs(party.responsibilityObligationIds, obligations, `/parties/${index}/responsibilityObligationIds`); if (party.economicSideId && !sides.has(party.economicSideId)) errors.push(error("REFERENCE_NOT_FOUND", `/parties/${index}/economicSideId`, "Economic side does not exist.", "reference", [party.economicSideId])); });
  document.economicSides.forEach((side, index) => requireRefs(side.partyIds, parties, `/economicSides/${index}/partyIds`));
  document.terms.obligations.forEach((obligation, index) => { requireRefs(obligation.responsiblePartyIds, parties, `/terms/obligations/${index}/responsiblePartyIds`); requireRefs(obligation.beneficiaryPartyIds, parties, `/terms/obligations/${index}/beneficiaryPartyIds`); requireRefs(obligation.prerequisiteConditionIds, conditions, `/terms/obligations/${index}/prerequisiteConditionIds`); requireRefs(obligation.successCriterionIds, criteria, `/terms/obligations/${index}/successCriterionIds`); requireRefs(obligation.evidenceRequirementIds, evidenceRequirements, `/terms/obligations/${index}/evidenceRequirementIds`); if (obligation.deadlineId && !deadlines.has(obligation.deadlineId)) errors.push(error("REFERENCE_NOT_FOUND", `/terms/obligations/${index}/deadlineId`, "Deadline does not exist.", "reference", [obligation.deadlineId])); });
  document.terms.conditions.forEach((condition, index) => { requireRefs(condition.evidenceRequirementIds, evidenceRequirements, `/terms/conditions/${index}/evidenceRequirementIds`); if ("conditionIds" in condition) requireRefs(condition.conditionIds, conditions, `/terms/conditions/${index}/conditionIds`); if ("conditionIdRef" in condition) requireRefs([condition.conditionIdRef], conditions, `/terms/conditions/${index}/conditionIdRef`); });
  document.terms.successCriteria.forEach((criterion, index) => { if (criterion.obligationId && !obligations.has(criterion.obligationId)) errors.push(error("REFERENCE_NOT_FOUND", `/terms/successCriteria/${index}/obligationId`, "Obligation does not exist.", "reference", [criterion.obligationId])); requireRefs(criterion.conditionIds, conditions, `/terms/successCriteria/${index}/conditionIds`); requireRefs(criterion.evidenceRequirementIds, evidenceRequirements, `/terms/successCriteria/${index}/evidenceRequirementIds`); if (criterion.evaluationMode === "deterministic" && criterion.conditionIds.length === 0) errors.push(error("CRITERION_UNEVALUABLE", `/terms/successCriteria/${index}/conditionIds`, "Deterministic criteria require at least one condition.", "semantic")); if (!criterion.allowedResults.includes("indeterminate")) errors.push(error("INDETERMINATE_RESULT_REQUIRED", `/terms/successCriteria/${index}/allowedResults`, "Criteria must permit an indeterminate result.", "policy")); });
  document.evidencePolicy.evidenceRequirements.forEach((requirement, index) => { requireRefs(requirement.criterionIds, criteria, `/evidencePolicy/evidenceRequirements/${index}/criterionIds`); requireRefs(requirement.submitterPartyIds, parties, `/evidencePolicy/evidenceRequirements/${index}/submitterPartyIds`); requireRefs(requirement.sourceConstraintIds, sources, `/evidencePolicy/evidenceRequirements/${index}/sourceConstraintIds`); if (requirement.minimumDistinctSources < 1) errors.push(error("EVIDENCE_POLICY_INCOMPLETE", `/evidencePolicy/evidenceRequirements/${index}/minimumDistinctSources`, "Evidence requirements need at least one source.", "policy")); });
  requireRefs(document.verificationPolicy.criterionIds, criteria, "/verificationPolicy/criterionIds");
  document.resolutionPolicy.outcomes.forEach((outcome, index) => requireRefs(outcome.prerequisiteCriterionIds, criteria, `/resolutionPolicy/outcomes/${index}/prerequisiteCriterionIds`));
  document.authorizationPolicy.requirements.forEach((requirement, index) => { requireRefs(requirement.eligiblePartyIds, parties, `/authorizationPolicy/requirements/${index}/eligiblePartyIds`); if (requirement.minimumApprovals < 1 || requirement.minimumApprovals > requirement.eligiblePartyIds.length) errors.push(error("AUTHORIZATION_POLICY_INVALID", `/authorizationPolicy/requirements/${index}/minimumApprovals`, "Approval count must be achievable by eligible parties.", "authorization")); });
  if (document.authorizationPolicy.aiMayAuthorize !== false) errors.push(error("AI_AUTHORITY_PROHIBITED", "/authorizationPolicy/aiMayAuthorize", "AI cannot authorize consequential actions.", "authorization"));

  if (document.protectionPolicy.mode !== "none" && document.parties.length < 2) errors.push(error("SOLO_FINANCIAL_TRANSFER_PROHIBITED", "/protectionPolicy", "Solo agreements must be non-financial in the MVP.", "policy"));
  if (document.protectionPolicy.mode !== "none" && document.economicSides.filter((side) => side.partyIds.length > 0 && side.settlementDestinationRef).length < 2) errors.push(error("ECONOMIC_SIDES_REQUIRED", "/economicSides", "Outcome-contingent financial intent requires at least two valid economic sides with fixed destinations.", "policy"));
  if (document.protectionPolicy.mode !== "none") {
    const money = document.protectionPolicy.terms.money;
    if (!Number.isSafeInteger(money.amountMinor) || money.amountMinor <= 0) errors.push(error("MONEY_INVALID", "/protectionPolicy/terms/money/amountMinor", "Money must use positive integer minor units.", "semantic"));
    if (!currencyPattern.test(money.currency)) errors.push(error("CURRENCY_INVALID", "/protectionPolicy/terms/money/currency", "Currency must be a three-letter ISO 4217 code.", "semantic"));
    if (document.protectionPolicy.mode === "protection") { requireRefs(document.protectionPolicy.terms.releaseOutcomeIds, outcomes, "/protectionPolicy/terms/releaseOutcomeIds"); requireRefs(document.protectionPolicy.terms.refundOutcomeIds, outcomes, "/protectionPolicy/terms/refundOutcomeIds"); }
    else requireRefs(document.protectionPolicy.terms.triggerConditionIds, conditions, "/protectionPolicy/terms/triggerConditionIds");
  }
  if (document.versionState === "accepted" && document.parties.filter((party) => party.roles.includes("observer") && party.acceptanceRequired).length) errors.push(error("OBSERVER_ACCEPTANCE_PROHIBITED", "/parties", "Observers cannot be required acceptors.", "policy"));
  return { valid: errors.every((item) => item.severity !== "error"), errors };
}
