import { createHash } from "node:crypto";
import type { CreateAgreementContent, ListAgreementsCommand, NextDraftContent } from "../application/contracts.ts";
import { AgreementApplicationError } from "../application/errors.ts";

const CONTENT_KEYS = ["schemaVersion", "economicSides", "purpose", "parties", "terms", "evidencePolicy", "verificationPolicy", "protectionPolicy", "authorizationPolicy", "resolutionPolicy", "privacyPolicy", "financialSafetyPolicy", "effectiveAt"] as const;
const forbiddenServerKeys = ["agreementId", "agreementVersion", "versionId", "previousVersionId", "versionState", "amendmentKind", "createdAt", "createdByPartyId"];
const forbiddenAuthorityKeys = new Set(["actorId", "requestId", "correlationId", "lifecycleState", "capabilities", "provenance"]);
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const stable = (value: unknown): string => Array.isArray(value) ? `[${value.map(stable).join(",")}]` : isObject(value) ? `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}` : JSON.stringify(value);
export const fingerprint = (operation: "create" | "update", value: unknown) => createHash("sha256").update(`agreement-api-v1:${operation}:${stable(value)}`).digest("base64url");
export function parseIdempotencyKey(value: string | null): string | undefined { if (value === null) return undefined; if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value)) throw new AgreementApplicationError("INVALID_REQUEST", "Idempotency-Key must be 1-128 safe opaque characters."); return value; }
function parseContent(value: unknown): CreateAgreementContent {
  if (!isObject(value)) throw new AgreementApplicationError("INVALID_REQUEST", "The JSON body must be an object.");
  const unknown = Object.keys(value).filter((key) => !CONTENT_KEYS.includes(key as typeof CONTENT_KEYS[number]));
  if (unknown.length || forbiddenServerKeys.some((key) => key in value)) throw new AgreementApplicationError("INVALID_REQUEST", "The request contains unknown or server-owned fields.");
  const containsAuthorityField = (candidate: unknown): boolean => Array.isArray(candidate) ? candidate.some(containsAuthorityField) : isObject(candidate) ? Object.entries(candidate).some(([key, nested]) => forbiddenAuthorityKeys.has(key) || containsAuthorityField(nested)) : false;
  if (containsAuthorityField(value)) throw new AgreementApplicationError("INVALID_REQUEST", "The request contains server-owned authority fields.");
  const requiredObjects = ["purpose", "terms", "evidencePolicy", "verificationPolicy", "protectionPolicy", "authorizationPolicy", "resolutionPolicy", "privacyPolicy", "financialSafetyPolicy"];
  const requiredArrays = ["economicSides", "parties"];
  if (value.schemaVersion !== "1.0" || requiredObjects.some((key) => !isObject(value[key])) || requiredArrays.some((key) => !Array.isArray(value[key]))) throw new AgreementApplicationError("INVALID_REQUEST", "The agreement content shape is incomplete or malformed.");
  const nestedArrays = [[value.terms, ["obligations", "conditions", "successCriteria", "deadlines"]], [value.evidencePolicy, ["evidenceRequirements", "sourceConstraints"]], [value.authorizationPolicy, ["requirements"]], [value.resolutionPolicy, ["outcomes"]]] as Array<[Record<string, unknown>, string[]]>;
  if (nestedArrays.some(([object, keys]) => keys.some((key) => !Array.isArray(object[key])))) throw new AgreementApplicationError("INVALID_REQUEST", "The agreement content contains malformed nested collections.");
  return structuredClone(value) as unknown as CreateAgreementContent;
}
export function parseCreateBody(value: unknown) { return parseContent(value); }
export function parseUpdateBody(value: unknown): { expectedVersionId?: string; content: NextDraftContent } {
  if (!isObject(value) || Object.keys(value).some((key) => !["expectedVersionId", "content"].includes(key)) || !("content" in value)) throw new AgreementApplicationError("INVALID_REQUEST", "The update body must contain complete content and an optional expectedVersionId.");
  if (value.expectedVersionId !== undefined && (typeof value.expectedVersionId !== "string" || !value.expectedVersionId)) throw new AgreementApplicationError("INVALID_REQUEST", "expectedVersionId must be an opaque identifier.");
  return { expectedVersionId: value.expectedVersionId as string | undefined, content: parseContent(value.content) };
}
export function parseListQuery(url: URL): ListAgreementsCommand {
  const allowed = new Set(["limit", "cursor", "lifecycleState", "versionState", "protectionMode", "updatedAfter"]); for (const key of url.searchParams.keys()) if (!allowed.has(key)) throw new AgreementApplicationError("INVALID_REQUEST", "The query contains an unsupported filter.");
  const limitText = url.searchParams.get("limit"); const limit = limitText === null ? 20 : Number(limitText); if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AgreementApplicationError("INVALID_REQUEST", "limit must be an integer from 1 to 100.");
  const exact = <T extends string>(key: string, values: readonly T[]): T | undefined => { const value = url.searchParams.get(key); if (value === null) return undefined; if (!values.includes(value as T)) throw new AgreementApplicationError("INVALID_REQUEST", `${key} is invalid.`); return value as T; };
  const updatedAfter = url.searchParams.get("updatedAfter") ?? undefined; if (updatedAfter && (!Number.isFinite(Date.parse(updatedAfter)) || !updatedAfter.endsWith("Z"))) throw new AgreementApplicationError("INVALID_REQUEST", "updatedAfter must be a UTC instant.");
  return { limit, cursor: url.searchParams.get("cursor") ?? undefined, lifecycleState: exact("lifecycleState", ["draft", "in_review", "accepted"]), versionState: exact("versionState", ["draft", "proposed", "accepted", "superseded", "withdrawn"]), protectionMode: exact("protectionMode", ["none", "protection", "conditional_intent"]), updatedAfter };
}
