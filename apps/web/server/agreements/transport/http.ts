import { AgreementApplicationError } from "../application/errors.ts";
import type { RequestContext } from "../application/contracts.ts";
import type { ApiErrorResponseV1 } from "./api-contracts.ts";
import { authenticationService } from "../../auth/composition.ts";

const MAX_BODY_BYTES = 256 * 1024;
const statusByCode: Record<string, number> = { AUTHENTICATION_REQUIRED: 401, ACCOUNT_SUSPENDED: 403, ACCOUNT_DISABLED: 403, CSRF_REJECTED: 403, INVALID_REQUEST: 400, AGREEMENT_VALIDATION_FAILED: 422, RESOURCE_NOT_FOUND: 404, PERMISSION_DENIED: 404, PRECONDITION_REQUIRED: 428, VERSION_PRECONDITION_FAILED: 412, IDEMPOTENCY_KEY_REUSED: 409, UNSUPPORTED_MEDIA_TYPE: 415, REQUEST_TOO_LARGE: 413, INTERNAL_ERROR: 500 };
export const SESSION_COOKIE = "hmm_development_session";
export function cookieValue(request: Request, name: string) { const entry = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined; }
export async function requestContext(request: Request): Promise<RequestContext> { const resolved = await authenticationService.resolve(cookieValue(request, SESSION_COOKIE)); const requestId = request.headers.get("x-request-id")?.slice(0, 128) || resolved.context.requestId; return { ...resolved.context, requestId, correlationId: request.headers.get("x-correlation-id")?.slice(0, 128) || requestId }; }
export function requireExactOrigin(request: Request) { const origin = request.headers.get("origin"); const expected = process.env.HMM_APP_ORIGIN ?? new URL(request.url).origin; if (!origin || origin !== expected) throw new AgreementApplicationError("CSRF_REJECTED", "The request origin could not be verified."); }
export async function requireAuthenticatedCsrf(request: Request) { requireExactOrigin(request); const resolved = await authenticationService.resolve(cookieValue(request, SESSION_COOKIE)); if (resolved.context.principal.kind !== "account") throw new AgreementApplicationError("AUTHENTICATION_REQUIRED", "Sign in to continue."); if (!authenticationService.verifySessionCsrf(request.headers.get("x-csrf-token") ?? undefined, resolved.csrfDigest)) throw new AgreementApplicationError("CSRF_REJECTED", "The request could not be verified."); }
export async function readJson(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json") throw new AgreementApplicationError("UNSUPPORTED_MEDIA_TYPE", "Use application/json for this request.");
  const length = Number(request.headers.get("content-length")); if (Number.isFinite(length) && length > MAX_BODY_BYTES) throw new AgreementApplicationError("REQUEST_TOO_LARGE", "The request body is too large.");
  const text = await request.text(); if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new AgreementApplicationError("REQUEST_TOO_LARGE", "The request body is too large.");
  try { return JSON.parse(text); } catch { throw new AgreementApplicationError("INVALID_REQUEST", "The request body is not valid JSON."); }
}
export const etag = (versionId: string) => `"${versionId}"`;
export function parseIfMatch(value: string | null): string | undefined { if (!value) return undefined; const match = /^"([A-Za-z0-9._:-]{1,128})"$/.exec(value.trim()); if (!match) throw new AgreementApplicationError("INVALID_REQUEST", "If-Match must contain one quoted version identifier."); return match[1]; }
export function json(value: unknown, status = 200, headers: HeadersInit = {}) { return Response.json(value, { status, headers: { "Cache-Control": "no-store", ...headers } }); }
export function errorResponse(error: unknown, context: RequestContext): Response {
  const applicationError = error instanceof AgreementApplicationError ? error : new AgreementApplicationError("INTERNAL_ERROR", "The request could not be completed.", { retryable: true });
  const body: ApiErrorResponseV1 = { error: { code: applicationError.code === "PERMISSION_DENIED" ? "RESOURCE_NOT_FOUND" : applicationError.code, message: applicationError.message, requestId: context.requestId, retryable: applicationError.options.retryable ?? false } };
  if (applicationError.options.fieldErrors) body.error.fieldErrors = applicationError.options.fieldErrors.map(({ code, path, message, category }) => ({ code, path, message, category }));
  if (applicationError.options.expectedVersionId || applicationError.options.currentVersionId) body.error.conflict = { expectedVersionId: applicationError.options.expectedVersionId, currentVersionId: applicationError.options.currentVersionId };
  const status = statusByCode[applicationError.code] ?? 500; return json(body, status, status === 401 ? { "WWW-Authenticate": "Session" } : {});
}
