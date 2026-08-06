import { createHash } from "node:crypto";
import type { AgreementLanguageDocument, AuthorizationAction } from "../../lib/agreement-language/types.ts";

export type ResolutionState = "proposed" | "review_window_open" | "disputed" | "held" | "authorized" | "execution_ready" | "simulated_executed" | "cancelled" | "expired";
export type FinancialSafetyState = "clear" | "review_required" | "held" | "restricted";
export type BlockerCode = "REVIEW_WINDOW_ACTIVE" | "ACTIVE_DISPUTE" | "HUMAN_REVIEW_REQUIRED" | "FINANCIAL_SAFETY_REVIEW_REQUIRED" | "FINANCIAL_SAFETY_HELD" | "FINANCIAL_SAFETY_RESTRICTED" | "AUTHORIZATION_MISSING" | "AUTHORIZATION_REVOKED" | "VERSION_NOT_ACCEPTED" | "SNAPSHOT_MISMATCH" | "ASSESSMENT_NOT_ELIGIBLE" | "PROPOSAL_EXPIRED" | "PROPOSAL_STALE" | "SOLO_FINANCIAL_PROHIBITED" | "ECONOMIC_SIDES_INVALID" | "SIMULATED_DESTINATION_INVALID" | "ALREADY_EXECUTED";
export type SimulatedEffect = { kind: "non_financial"; description: string } | { kind: "simulated_value"; amountMinor: number; currency: string; sourceEconomicSideId: string; destinationEconomicSideId: string; destinationRef: string };
export interface GrantSnapshot { partyId: string; action: AuthorizationAction; consequenceRef: string; grantedAt: string; expiresAt?: string; revokedAt?: string }
export interface ReadinessSnapshot { state: ResolutionState; versionId: string; document: AgreementLanguageDocument; documentDigest: string; expectedDocumentDigest: string; acceptedPartyIds: string[]; outcomeId: string; consequenceRef: string; effect: SimulatedEffect; assessment: { status: string; results: string[]; recommendedNextAction: string }; reviewerDecisionPresent: boolean; reviewWindowEndsAt: string; expiresAt?: string; activeDispute: boolean; financialSafetyState: FinancialSafetyState; grants: GrantSnapshot[]; priorExecution: boolean; createdByPartyId: string }

export const TERMINAL_STATES: ResolutionState[] = ["simulated_executed", "cancelled", "expired"];
export const ALLOWED_TRANSITIONS: Record<ResolutionState, ResolutionState[]> = {
  proposed: ["review_window_open", "cancelled", "expired"], review_window_open: ["disputed", "held", "authorized", "cancelled", "expired"], disputed: ["held", "cancelled"], held: ["authorized", "cancelled", "expired"], authorized: ["held", "execution_ready", "cancelled", "expired"], execution_ready: ["simulated_executed", "cancelled"], simulated_executed: [], cancelled: [], expired: [],
};
export function canTransition(from: ResolutionState, to: ResolutionState) { return ALLOWED_TRANSITIONS[from].includes(to); }
export function consequenceRef(versionId: string, outcomeId: string, effect: SimulatedEffect) { return createHash("sha256").update(JSON.stringify({ versionId, outcomeId, effect })).digest("hex"); }

export function explicitRequirement(document: AgreementLanguageDocument, action: AuthorizationAction) {
  const matches = document.authorizationPolicy.requirements.filter((item) => item.action === action);
  if (matches.length !== 1) return null;
  const requirement = matches[0];
  const validParties = new Set(document.parties.map((party) => party.partyId));
  if (!Number.isSafeInteger(requirement.minimumApprovals) || requirement.minimumApprovals < 1 || requirement.minimumApprovals > new Set(requirement.eligiblePartyIds).size || requirement.eligiblePartyIds.some((partyId) => !validParties.has(partyId))) return null;
  return requirement;
}

export function validateEffect(document: AgreementLanguageDocument, effect: SimulatedEffect): BlockerCode[] {
  if (effect.kind === "non_financial") return [];
  const blockers: BlockerCode[] = [];
  if (document.protectionPolicy.mode === "none" || document.economicSides.length < 2) blockers.push("SOLO_FINANCIAL_PROHIBITED");
  const source = document.economicSides.find((side) => side.economicSideId === effect.sourceEconomicSideId);
  const destination = document.economicSides.find((side) => side.economicSideId === effect.destinationEconomicSideId);
  if (!source || !destination || source === destination || !source.partyIds.length || !destination.partyIds.length || source.partyIds.some((id) => destination.partyIds.includes(id))) blockers.push("ECONOMIC_SIDES_INVALID");
  if (!Number.isSafeInteger(effect.amountMinor) || effect.amountMinor <= 0 || !/^[A-Z]{3}$/.test(effect.currency) || !effect.destinationRef.trim()) blockers.push("SIMULATED_DESTINATION_INVALID");
  if (document.protectionPolicy.mode !== "none" && (document.protectionPolicy.terms.money.amountMinor !== effect.amountMinor || document.protectionPolicy.terms.money.currency !== effect.currency)) blockers.push("SIMULATED_DESTINATION_INVALID");
  return [...new Set(blockers)];
}

export function evaluateResolutionReadiness(snapshot: ReadinessSnapshot, evaluatedAt: Date) {
  const blockers: BlockerCode[] = [];
  if (snapshot.priorExecution || snapshot.state === "simulated_executed") blockers.push("ALREADY_EXECUTED");
  if (snapshot.state === "cancelled") blockers.push("PROPOSAL_STALE");
  if (snapshot.expiresAt && evaluatedAt.getTime() >= Date.parse(snapshot.expiresAt)) blockers.push("PROPOSAL_EXPIRED");
  if (snapshot.document.versionState !== "accepted" || snapshot.document.versionId !== snapshot.versionId) blockers.push("VERSION_NOT_ACCEPTED");
  if (snapshot.documentDigest !== snapshot.expectedDocumentDigest || snapshot.outcomeId && !snapshot.document.resolutionPolicy.outcomes.some((outcome) => outcome.outcomeId === snapshot.outcomeId)) blockers.push("SNAPSHOT_MISMATCH");
  const requiredAcceptances = snapshot.document.parties.filter((party) => party.acceptanceRequired).map((party) => party.partyId);
  if (requiredAcceptances.some((partyId) => !snapshot.acceptedPartyIds.includes(partyId))) blockers.push("VERSION_NOT_ACCEPTED");
  if (snapshot.assessment.status !== "completed" || !snapshot.assessment.results.length || snapshot.assessment.results.some((result) => result !== "satisfied")) blockers.push("ASSESSMENT_NOT_ELIGIBLE");
  if (evaluatedAt.getTime() < Date.parse(snapshot.reviewWindowEndsAt)) blockers.push("REVIEW_WINDOW_ACTIVE");
  if (snapshot.activeDispute) blockers.push("ACTIVE_DISPUTE");
  if (snapshot.financialSafetyState !== "clear") blockers.push(snapshot.financialSafetyState === "restricted" ? "FINANCIAL_SAFETY_RESTRICTED" : snapshot.financialSafetyState === "held" ? "FINANCIAL_SAFETY_HELD" : "FINANCIAL_SAFETY_REVIEW_REQUIRED");
  const requirement = explicitRequirement(snapshot.document, "create_settlement_instruction");
  const active = snapshot.grants.filter((grant) => grant.action === "create_settlement_instruction" && grant.consequenceRef === snapshot.consequenceRef && !grant.revokedAt && (!grant.expiresAt || evaluatedAt.getTime() < Date.parse(grant.expiresAt)));
  const eligible = new Set(active.filter((grant) => requirement?.eligiblePartyIds.includes(grant.partyId) && (!requirement.selfApprovalProhibited || grant.partyId !== snapshot.createdByPartyId)).map((grant) => grant.partyId));
  if (!requirement || eligible.size < requirement.minimumApprovals) blockers.push(snapshot.grants.some((grant) => grant.action === "create_settlement_instruction" && grant.consequenceRef === snapshot.consequenceRef && grant.revokedAt) ? "AUTHORIZATION_REVOKED" : "AUTHORIZATION_MISSING");
  if (requirement?.humanReviewRequired && !snapshot.reviewerDecisionPresent) blockers.push("HUMAN_REVIEW_REQUIRED");
  blockers.push(...validateEffect(snapshot.document, snapshot.effect));
  const ordered = [...new Set(blockers)];
  return { ready: ordered.length === 0, blockers: ordered, evaluatedAt: evaluatedAt.toISOString(), simulation: true as const };
}

export function balancedEntries(effect: SimulatedEffect) {
  if (effect.kind === "non_financial") return [];
  return [{ economicSideId: effect.sourceEconomicSideId, amountMinor: -effect.amountMinor, currency: effect.currency, entryType: "debit" as const }, { economicSideId: effect.destinationEconomicSideId, amountMinor: effect.amountMinor, currency: effect.currency, entryType: "credit" as const }];
}
