export { AGREEMENT_SCHEMA_VERSION } from "./types.ts";
export type { AgreementLanguageDocument } from "./types.ts";

export interface AgreementValidationError {
  code: string;
  path: string;
  message: string;
  category: "shape" | "reference" | "semantic" | "policy" | "authorization" | "compatibility";
  severity: "error" | "warning";
  relatedIds?: string[];
  safeNextAction?: string;
}
export interface AgreementValidationResult { valid: boolean; errors: AgreementValidationError[] }
