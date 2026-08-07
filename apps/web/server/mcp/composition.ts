import { evidenceAssessmentService, evidenceWorkflowRepository } from "../evidence/composition.ts";
import { VerificationFacade } from "./facade.ts";
import { ToolRegistry } from "./registry.ts";
import { LocalMcpServer } from "./server.ts";

export function localMcpServer() { const secret = process.env.HMM_MCP_LOCAL_SECRET; if (!secret || secret.length < 32 || process.env.NODE_ENV === "production") throw new Error("The local MCP server requires a non-production HMM_MCP_LOCAL_SECRET of at least 32 characters."); const facade = new VerificationFacade(evidenceWorkflowRepository, evidenceAssessmentService, secret); return new LocalMcpServer(new ToolRegistry(facade), secret); }
