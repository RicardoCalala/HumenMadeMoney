import { evidenceAssessmentService } from "../../../../../../server/evidence/composition.ts";
import { json, requestContext } from "../../../../../../server/agreements/transport/http.ts";
import { evidenceError, version } from "../../../../../../server/evidence/transport.ts";

export async function GET(request: Request, { params }: { params: Promise<{ agreementId: string }> }) {
  const context = await requestContext(request);
  try { const { agreementId } = await params; return json(await evidenceAssessmentService.getAssessmentCapability(context, agreementId, version(request.url)), 200, { "Cache-Control": "no-store" }); }
  catch (error) { return evidenceError(error, context); }
}
