import type { EvidenceRequirement, SourceConstraint } from "../../lib/agreement-language/types.ts";
import type { SourceRefKind } from "./domain.ts";

export class EvidenceError extends Error { readonly code: string; readonly status: number; constructor(code: string, message: string, status = 422) { super(message); this.code = code; this.status = status; } }
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
export const assertId = (value: string, name: string) => { if (!ID.test(value)) throw new EvidenceError("EVIDENCE_INVALID", `${name} is invalid.`, 400); };
const boundedString = (value: unknown, max: number) => typeof value === "string" && value.length > 0 && value.length <= max;

export function validateSource(kind: SourceRefKind | undefined, ref: string | undefined) {
  if (!kind && !ref) return;
  if (!kind || !ref || ref.length > 2048 || /[\u0000-\u001f]/.test(ref)) throw new EvidenceError("EVIDENCE_INVALID", "The source reference is invalid.");
  if (kind === "https_url") { let url: URL; try { url = new URL(ref); } catch { throw new EvidenceError("SOURCE_NOT_ALLOWED", "The source URL is not allowed."); } if (url.protocol !== "https:" || url.username || url.password || url.hash || (url.port && url.port !== "443")) throw new EvidenceError("SOURCE_NOT_ALLOWED", "The source URL is not allowed."); }
  else if (!ID.test(ref)) throw new EvidenceError("SOURCE_NOT_ALLOWED", "The source reference is not allowed.");
}

export function validateMetadata(metadata: unknown, source: SourceConstraint) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new EvidenceError("EVIDENCE_INVALID", "Evidence metadata must be an object.");
  const entries = Object.entries(metadata); if (entries.length > 20) throw new EvidenceError("EVIDENCE_INVALID", "Evidence metadata has too many fields.");
  const output: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of entries) { if (!source.permittedFields.includes(key)) throw new EvidenceError("METADATA_FIELD_NOT_PERMITTED", "An evidence metadata field is not permitted."); if (!ID.test(key) || (typeof value === "string" && !boundedString(value, 512)) || (value !== null && !["string", "number", "boolean"].includes(typeof value)) || (typeof value === "number" && !Number.isFinite(value))) throw new EvidenceError("EVIDENCE_INVALID", "An evidence metadata value is invalid."); output[key] = value as never; }
  return output;
}

export function resolvePolicy(requirementId: string, sourceConstraintId: string, document: { evidencePolicy: { evidenceRequirements: EvidenceRequirement[]; sourceConstraints: SourceConstraint[] } }) {
  const requirement = document.evidencePolicy.evidenceRequirements.find((item) => item.evidenceRequirementId === requirementId); if (!requirement) throw new EvidenceError("EVIDENCE_NOT_ALLOWED", "Evidence is not allowed for this agreement version.");
  if (!requirement.sourceConstraintIds.includes(sourceConstraintId)) throw new EvidenceError("SOURCE_NOT_ALLOWED", "The evidence source is not allowed.");
  const source = document.evidencePolicy.sourceConstraints.find((item) => item.sourceConstraintId === sourceConstraintId); if (!source) throw new EvidenceError("SOURCE_NOT_ALLOWED", "The evidence source is not allowed.");
  return { requirement, source };
}
