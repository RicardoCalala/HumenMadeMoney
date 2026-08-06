import { evidenceAssessmentService } from "../../../../../../../server/evidence/composition.ts";
import { json, requestContext } from "../../../../../../../server/agreements/transport/http.ts";
import { evidenceError, version } from "../../../../../../../server/evidence/transport.ts";

export async function GET(request: Request, { params }: { params: Promise<{ agreementId: string }> }) {
  const context = await requestContext(request);
  try {
    const { agreementId } = await params;
    return json({ data: await evidenceAssessmentService.listReviewerDecisions(context, agreementId, version(request.url)), page: { nextCursor: null, hasMore: false } });
  } catch (error) { return evidenceError(error, context); }
}
