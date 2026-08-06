import type { AcceptanceRecord, AgreementLanguageDocument, AmendmentEvaluation, AssessmentRecord, SettlementGuardContext } from "./types.ts";
import type { AgreementValidationError, AgreementValidationResult } from "./validation-types.ts";

const fail = (code: string, path: string, message: string, category: AgreementValidationError["category"] = "policy"): AgreementValidationError => ({ code, path, message, category, severity: "error" });

export function validateUnanimousAcceptance(document: AgreementLanguageDocument, acceptances: AcceptanceRecord[]): AgreementValidationResult {
  const required = document.parties.filter((party) => party.acceptanceRequired && !party.roles.includes("observer"));
  const accepted = new Set(acceptances.filter((record) => record.agreementId === document.agreementId && record.versionId === document.versionId).map((record) => record.partyId));
  const errors = required.filter((party) => !accepted.has(party.partyId)).map(() => fail("ACCEPTANCE_MISSING", "/acceptances", "Every required party must accept the exact agreement version.", "authorization"));
  return { valid: errors.length === 0, errors };
}

export function evaluateAmendment(previous: AgreementLanguageDocument, next: AgreementLanguageDocument): AmendmentEvaluation {
  const reasons: string[] = [];
  const compare = (label: string, left: unknown, right: unknown) => { if (JSON.stringify(left) !== JSON.stringify(right)) reasons.push(label); };
  compare("parties", previous.parties, next.parties); compare("economic sides", previous.economicSides, next.economicSides); compare("obligations, criteria, or deadlines", previous.terms, next.terms);
  compare("evidence policy", previous.evidencePolicy, next.evidencePolicy); compare("verification policy", previous.verificationPolicy, next.verificationPolicy); compare("protection or funding intent", previous.protectionPolicy, next.protectionPolicy);
  compare("authorization policy", previous.authorizationPolicy, next.authorizationPolicy); compare("privacy policy", previous.privacyPolicy, next.privacyPolicy); compare("resolution policy", previous.resolutionPolicy, next.resolutionPolicy);
  const material = reasons.length > 0;
  return { material, renewedAcceptanceRequired: material, reasons };
}

export function requiresHumanReview(assessment: AssessmentRecord): boolean {
  return assessment.actorType === "ai" || assessment.criterionResults.some((result) => result.result === "indeterminate" || result.conflictingEvidenceIds.length > 0) || assessment.confidence.level === "low" || assessment.confidence.level === "not_assessed";
}

export function guardSettlementExecution(context: SettlementGuardContext): AgreementValidationResult {
  const errors: AgreementValidationError[] = [];
  const { document } = context;
  if (document.versionState !== "accepted") errors.push(fail("VERSION_NOT_ACCEPTED", "/document/versionState", "Settlement requires the exact accepted agreement version."));
  if (context.assessmentResult === "indeterminate") errors.push(fail("EVIDENCE_INDETERMINATE", "/assessmentResult", "Indeterminate evidence cannot support execution."));
  if (context.assessmentResult !== "satisfied") errors.push(fail("OUTCOME_NOT_SATISFIED", "/assessmentResult", "Only a satisfied authorized outcome may proceed."));
  if (context.dispute && ["open", "under_review", "appealed"].includes(context.dispute.status)) errors.push(fail("ACTIVE_DISPUTE", "/dispute/status", "An active dispute freezes execution."));
  if (context.financialSafetyState !== "clear") errors.push(fail(context.financialSafetyState === "held" ? "FINANCIAL_SAFETY_HELD" : context.financialSafetyState === "restricted" ? "FINANCIAL_SAFETY_RESTRICTED" : "FINANCIAL_SAFETY_REVIEW_REQUIRED", "/financialSafetyState", "Financial Safety must be clear immediately before execution."));
  const elapsedSeconds = (Date.parse(context.evaluatedAt) - Date.parse(context.proposedAt)) / 1000;
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < document.resolutionPolicy.reviewWindowSeconds) errors.push(fail("REVIEW_WINDOW_ACTIVE", "/evaluatedAt", "The configured dispute and review window is still active."));
  const requirement = document.authorizationPolicy.requirements.find((item) => item.action === "create_settlement_instruction");
  const grants = context.authorizationGrants.filter((grant) => grant.agreementId === document.agreementId && grant.versionId === document.versionId && grant.action === "create_settlement_instruction" && grant.consequenceRef === context.consequenceRef && !grant.revokedAt && (!grant.expiresAt || Date.parse(grant.expiresAt) > Date.parse(context.evaluatedAt)));
  const distinctEligible = new Set(grants.filter((grant) => requirement?.eligiblePartyIds.includes(grant.partyId)).map((grant) => grant.partyId));
  if (!requirement || distinctEligible.size < requirement.minimumApprovals) errors.push(fail("AUTHORITY_MISSING", "/authorizationGrants", "Required action-, version-, and consequence-specific authorization is missing.", "authorization"));
  return { valid: errors.length === 0, errors };
}
