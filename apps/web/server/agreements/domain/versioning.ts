import type { AgreementLanguageDocument } from "../../../lib/agreement-language/types.ts";
import type { AgreementLifecycleState } from "../application/contracts.ts";
import { AgreementApplicationError } from "../application/errors.ts";

export function lifecycleForVersionState(state: AgreementLanguageDocument["versionState"]): AgreementLifecycleState {
  if (state === "draft") return "draft";
  if (state === "proposed") return "in_review";
  if (state === "accepted") return "accepted";
  throw new AgreementApplicationError("INVALID_REQUEST", "This content state cannot be persisted as a current agreement version.");
}

export function assertAggregateConsistency(lifecycle: AgreementLifecycleState, document: AgreementLanguageDocument, currentVersionId: string): void {
  if (lifecycleForVersionState(document.versionState) !== lifecycle || document.versionId !== currentVersionId) {
    throw new AgreementApplicationError("INTERNAL_ERROR", "Agreement state is inconsistent.");
  }
}
