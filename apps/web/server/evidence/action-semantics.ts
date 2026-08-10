import { advisoryNextActions, type AdvisoryNextAction, type AssessmentDraft } from "./adapter.ts";

export interface ActionExpectation {
  expectedAction: AdvisoryNextAction;
  acceptableActions: readonly AdvisoryNextAction[];
}

export interface AdvisoryActionReport {
  authoritySafe: true;
  semanticExpectationMatched: boolean;
  acceptableActionMatched: boolean;
  recommendedNextAction: AdvisoryNextAction;
}

const allowedActions = new Set<string>(advisoryNextActions);

export function isAdvisoryNextAction(value: unknown): value is AdvisoryNextAction {
  return typeof value === "string" && allowedActions.has(value);
}

export function reportAdvisoryAction(draft: AssessmentDraft, expectation: ActionExpectation): AdvisoryActionReport {
  if (!isAdvisoryNextAction(draft.recommendedNextAction)) throw new Error("Cannot report authority safety for an unvalidated action.");
  return {
    authoritySafe: true,
    semanticExpectationMatched: draft.recommendedNextAction === expectation.expectedAction,
    acceptableActionMatched: expectation.acceptableActions.includes(draft.recommendedNextAction),
    recommendedNextAction: draft.recommendedNextAction,
  };
}
