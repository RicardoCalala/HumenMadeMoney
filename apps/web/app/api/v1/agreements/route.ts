import { agreementService } from "../../../../server/agreements/composition.ts";
import { fingerprint, parseCreateBody, parseIdempotencyKey, parseListQuery } from "../../../../server/agreements/transport/runtime-validation.ts";
import { errorResponse, etag, json, readJson, requestContext } from "../../../../server/agreements/transport/http.ts";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const context = requestContext(request);
  try {
    const content = parseCreateBody(await readJson(request)); const key = parseIdempotencyKey(request.headers.get("idempotency-key"));
    const result = await agreementService.create(context, { content, idempotency: key ? { key, requestFingerprint: fingerprint("create", content) } : undefined });
    return json(result.resource, result.replayed ? 200 : 201, { ETag: etag(result.resource.currentVersionId), "Idempotency-Replayed": String(result.replayed) });
  } catch (error) { return errorResponse(error, context); }
}
export async function GET(request: Request) { const context = requestContext(request); try { return json(await agreementService.list(context, parseListQuery(new URL(request.url)))); } catch (error) { return errorResponse(error, context); } }
