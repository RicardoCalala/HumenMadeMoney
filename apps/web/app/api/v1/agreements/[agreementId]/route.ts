import { AgreementApplicationError } from "../../../../../server/agreements/application/errors.ts";
import { agreementService } from "../../../../../server/agreements/composition.ts";
import { fingerprint, parseIdempotencyKey, parseUpdateBody } from "../../../../../server/agreements/transport/runtime-validation.ts";
import { errorResponse, etag, json, parseIfMatch, readJson, requestContext } from "../../../../../server/agreements/transport/http.ts";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ agreementId: string }> };
export async function GET(request: Request, route: Context) { const context = requestContext(request); try { const { agreementId } = await route.params; const resource = await agreementService.get(context, agreementId); return json(resource, 200, { ETag: etag(resource.currentVersionId) }); } catch (error) { return errorResponse(error, context); } }
export async function PATCH(request: Request, route: Context) {
  const context = requestContext(request);
  try {
    const { agreementId } = await route.params; const body = parseUpdateBody(await readJson(request)); const headerVersion = parseIfMatch(request.headers.get("if-match"));
    if (headerVersion && body.expectedVersionId && headerVersion !== body.expectedVersionId) throw new AgreementApplicationError("INVALID_REQUEST", "If-Match and expectedVersionId must agree.");
    const expectedVersionId = headerVersion ?? body.expectedVersionId; if (!expectedVersionId) throw new AgreementApplicationError("PRECONDITION_REQUIRED", "Supply the current version with If-Match or expectedVersionId.");
    const key = parseIdempotencyKey(request.headers.get("idempotency-key")); const fingerprintInput = { agreementId, expectedVersionId, content: body.content };
    const result = await agreementService.update(context, { agreementId, expectedVersionId, content: body.content, idempotency: key ? { key, requestFingerprint: fingerprint("update", fingerprintInput) } : undefined });
    return json(result.resource, 200, { ETag: etag(result.resource.currentVersionId), "Idempotency-Replayed": String(result.replayed) });
  } catch (error) { return errorResponse(error, context); }
}
