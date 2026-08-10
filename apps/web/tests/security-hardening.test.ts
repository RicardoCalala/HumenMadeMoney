import assert from "node:assert/strict";
import test from "node:test";
import { requestContext } from "../server/agreements/transport/http.ts";
import { actorContext, InvocationGuard, issueActorToken } from "../server/mcp/security.ts";

test("unsafe request and correlation identifiers fall back to server identifiers", async () => { const context = await requestContext(new Request("http://localhost/api", { headers: { "x-request-id": "unsafe id", "x-correlation-id": "bad/value" } })); assert.doesNotMatch(context.requestId, /\s/); assert.equal(context.correlationId, context.requestId); });
test("MCP IDs are conservative and expired rate windows are evicted", () => { const secret = "s".repeat(32); const token = issueActorToken({ accountId: "account", sessionId: "session", audience: "hmm-local-mcp", purpose: "verification", issuedAt: 1, expiresAt: 300 }, secret); assert.throws(() => actorContext(token, secret, 2, "bad id"), /identifier is invalid/i); const guard = new InvocationGuard(); guard.enter("first", "tool", 0)(); guard.enter("second", "tool", 180)(); assert.equal(guard.sizeForTest(), 1); });
