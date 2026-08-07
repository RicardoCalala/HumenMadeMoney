import type { RequestContext } from "../agreements/application/contracts.ts";
import { EvidenceError } from "../evidence/validation.ts";
import type { VerificationFacade } from "./facade.ts";

export const TOOL_NAMES = ["hmm_get_agreement_terms", "hmm_get_evidence_requirements", "hmm_list_evidence_metadata", "hmm_get_assessment", "hmm_retrieve_approved_source", "hmm_submit_source_observation", "hmm_request_assessment", "hmm_request_human_review"] as const;
export type ToolName = typeof TOOL_NAMES[number];
const descriptions: Record<ToolName, string> = {
  hmm_get_agreement_terms: "Read a minimized projection of one exact accepted agreement version.",
  hmm_get_evidence_requirements: "Read authorized evidence requirements and derived states.",
  hmm_list_evidence_metadata: "List bounded, privacy-filtered evidence metadata.",
  hmm_get_assessment: "Read one authorized advisory assessment.",
  hmm_retrieve_approved_source: "Read a checked-in synthetic fixture by opaque allowlisted reference.",
  hmm_submit_source_observation: "Append an observation bound to a valid controlled-retrieval receipt.",
  hmm_request_assessment: "Request the server-selected deterministic advisory adapter.",
  hmm_request_human_review: "Request review without assigning a reviewer or recording a decision.",
};
export const listedTools = TOOL_NAMES.map((name) => ({ name, description: descriptions[name], inputSchema: { type: "object", additionalProperties: false, required: ["contractVersion", "agreementId"], properties: { contractVersion: { const: "2026-08-06" }, agreementId: { type: "string", maxLength: 128 } } } }));
export class ToolRegistry {
  private readonly facade: VerificationFacade; constructor(facade: VerificationFacade) { this.facade = facade; }
  async invoke(name: string, context: RequestContext, input: unknown) {
    const handlers: Record<ToolName, (context: RequestContext, input: unknown) => Promise<unknown>> = {
      hmm_get_agreement_terms: this.facade.getTerms.bind(this.facade), hmm_get_evidence_requirements: this.facade.getRequirements.bind(this.facade), hmm_list_evidence_metadata: this.facade.listEvidence.bind(this.facade), hmm_get_assessment: this.facade.getAssessment.bind(this.facade), hmm_retrieve_approved_source: this.facade.retrieve.bind(this.facade), hmm_submit_source_observation: this.facade.submitObservation.bind(this.facade), hmm_request_assessment: this.facade.requestAssessment.bind(this.facade), hmm_request_human_review: this.facade.requestReview.bind(this.facade),
    };
    if (!TOOL_NAMES.includes(name as ToolName)) throw new EvidenceError("TOOL_NOT_ALLOWED", "The requested MCP capability is not available.", 404);
    return handlers[name as ToolName](context, input);
  }
}
