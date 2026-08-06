import { evidenceAssessmentService } from "../../../../../../../../server/evidence/composition.ts";
import { json, requestContext, requireAuthenticatedCsrf } from "../../../../../../../../server/agreements/transport/http.ts";
import { evidenceError, expectedRevision } from "../../../../../../../../server/evidence/transport.ts";

export async function POST(request: Request, { params }: { params: Promise<{ agreementId: string; reviewRequestId: string }> }) {
  const context = await requestContext(request);
  try {
    await requireAuthenticatedCsrf(request);
    const { agreementId, reviewRequestId } = await params;
    const resource = await evidenceAssessmentService.assignReview(context, agreementId, reviewRequestId, expectedRevision(request));
    return json(resource, 200, { ETag: `"revision-${resource.revision}"` });
  } catch (error) { return evidenceError(error, context); }
}
