import { randomUUID } from "node:crypto";
import { EvidenceError } from "../evidence/validation.ts";
import { actorContext, InvocationGuard } from "./security.ts";
import { listedTools, ToolRegistry } from "./registry.ts";

type JsonRpc = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };
export class LocalMcpServer {
  private readonly guard = new InvocationGuard();
  private readonly registry: ToolRegistry; private readonly secret: string; private readonly now: () => Date;
  constructor(registry: ToolRegistry, secret: string, now: () => Date = () => new Date()) { this.registry = registry; this.secret = secret; this.now = now; }
  async handle(raw: unknown) {
    const request = raw as JsonRpc; const id = request?.id ?? null;
    try {
      if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") throw new EvidenceError("INVALID_REQUEST", "The MCP request is invalid.", 400);
      if (request.method === "initialize") return { jsonrpc: "2.0", id, result: { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "hmm-local-verification", version: "1.0.0" } } };
      if (request.method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: listedTools } };
      if (request.method !== "tools/call") throw new EvidenceError("METHOD_NOT_FOUND", "The MCP method is not available.", 404);
      const params = request.params as { name?: unknown; arguments?: unknown; actorToken?: unknown }; if (!params || typeof params.name !== "string" || typeof params.actorToken !== "string") throw new EvidenceError("INVALID_REQUEST", "The MCP request is invalid.", 400);
      const requestId = `mcp-${randomUUID()}`; const context = actorContext(params.actorToken, this.secret, Math.floor(this.now().getTime() / 1000), requestId); const actorId = context.principal.kind === "account" ? context.principal.accountId : "anonymous"; const release = this.guard.enter(actorId, params.name, Math.floor(this.now().getTime() / 1000));
      try { const value = await this.registry.invoke(params.name, context, params.arguments ?? {}); return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(value) }], structuredContent: value, isError: false } }; } finally { release(); }
    } catch (error) { const safe = error instanceof EvidenceError ? error : new EvidenceError("INTERNAL_ERROR", "The request could not be completed.", 500); return { jsonrpc: "2.0", id, error: { code: safe.status === 404 ? -32601 : safe.status === 400 ? -32602 : -32000, message: safe.message, data: { code: safe.code, retryable: safe.status >= 500 } } }; }
  }
}
