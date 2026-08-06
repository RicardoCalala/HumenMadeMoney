import type { AgreementValidationError } from "../../../lib/agreement-language/validation-types.ts";

export type AgreementErrorCode = "INVALID_REQUEST" | "AGREEMENT_VALIDATION_FAILED" | "RESOURCE_NOT_FOUND" | "PRECONDITION_REQUIRED" | "VERSION_PRECONDITION_FAILED" | "IDEMPOTENCY_KEY_REUSED" | "PERMISSION_DENIED" | "UNSUPPORTED_MEDIA_TYPE" | "REQUEST_TOO_LARGE" | "INTERNAL_ERROR";

export class AgreementApplicationError extends Error {
  readonly code: AgreementErrorCode;
  readonly options: { retryable?: boolean; fieldErrors?: AgreementValidationError[]; expectedVersionId?: string; currentVersionId?: string };
  constructor(
    code: AgreementErrorCode,
    message: string,
    options: { retryable?: boolean; fieldErrors?: AgreementValidationError[]; expectedVersionId?: string; currentVersionId?: string } = {},
  ) { super(message); this.name = "AgreementApplicationError"; this.code = code; this.options = options; }
}

export const invalidRequest = (message = "The request is invalid.") => new AgreementApplicationError("INVALID_REQUEST", message);
