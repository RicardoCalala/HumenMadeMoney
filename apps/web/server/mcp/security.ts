import { createHmac, timingSafeEqual } from "node:crypto";
import type { RequestContext } from "../agreements/application/contracts.ts";
import { EvidenceError } from "../evidence/validation.ts";

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");
const equal = (left: string, right: string) => { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); };

export interface ActorClaim { accountId: string; sessionId: string; audience: "hmm-local-mcp"; purpose: "verification"; issuedAt: number; expiresAt: number }
export function issueActorToken(claim: ActorClaim, secret: string) { if (!ID.test(claim.accountId) || !ID.test(claim.sessionId) || claim.expiresAt <= claim.issuedAt || claim.expiresAt - claim.issuedAt > 900) throw new Error("Invalid actor claim"); const payload = encode(claim); return `${payload}.${sign(payload, secret)}`; }
export function actorContext(token: string, secret: string, now: number, requestId: string): RequestContext {
  if (!ID.test(requestId)) throw new EvidenceError("INVALID_REQUEST", "The MCP request identifier is invalid.", 400);
  const [payload, signature, extra] = token.split("."); if (!payload || !signature || extra || !equal(signature, sign(payload, secret))) throw new EvidenceError("AUTHENTICATION_REQUIRED", "Local MCP authentication is required.", 401);
  let claim: ActorClaim; try { claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ActorClaim; } catch { throw new EvidenceError("AUTHENTICATION_REQUIRED", "Local MCP authentication is required.", 401); }
  if (claim.audience !== "hmm-local-mcp" || claim.purpose !== "verification" || !ID.test(claim.accountId) || !ID.test(claim.sessionId) || now < claim.issuedAt || now >= claim.expiresAt || claim.expiresAt - claim.issuedAt > 900) throw new EvidenceError("AUTHENTICATION_REQUIRED", "Local MCP authentication is required.", 401);
  return { principal: { kind: "account", accountId: claim.accountId, sessionId: claim.sessionId, accountState: "active", assurance: "development" }, requestId, correlationId: requestId, source: "mcp" };
}

export interface RetrievalReceipt { receiptId: string; accountId: string; agreementId: string; versionId: string; sourceConstraintId: string; adapterVersion: "fixture-v1"; fixtureId: string; referenceDigest: string; fields: string[]; capturedAt: string; digest: string; correlationId: string; issuedAt: number; expiresAt: number }
export const issueReceipt = (receipt: RetrievalReceipt, secret: string) => { const payload = encode(receipt); return `${payload}.${sign(payload, secret)}`; };
export function verifyReceipt(token: string, secret: string, now: number): RetrievalReceipt { const [payload, signature, extra] = token.split("."); if (!payload || !signature || extra || !equal(signature, sign(payload, secret))) throw new EvidenceError("RECEIPT_INVALID", "The retrieval receipt is invalid or expired.", 400); let receipt: RetrievalReceipt; try { receipt = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as RetrievalReceipt; } catch { throw new EvidenceError("RECEIPT_INVALID", "The retrieval receipt is invalid or expired.", 400); } if (now >= receipt.expiresAt || receipt.expiresAt - receipt.issuedAt > 300) throw new EvidenceError("RECEIPT_INVALID", "The retrieval receipt is invalid or expired.", 400); return receipt; }

export class InvocationGuard {
  private readonly calls = new Map<string, { window: number; count: number }>(); private readonly leases = new Set<string>();
  enter(actorId: string, tool: string, now: number) { const window = Math.floor(now / 60); for (const [key, value] of this.calls) if (value.window < window - 1) this.calls.delete(key); const key = `${actorId}:${window}`; const current = this.calls.get(key) ?? { window, count: 0 }; if (current.count >= 60) throw new EvidenceError("RESOURCE_LIMIT", "The local MCP request limit was reached.", 429); current.count += 1; this.calls.set(key, current); const lease = `${actorId}:${tool}`; if (this.leases.has(lease)) throw new EvidenceError("CONCURRENCY_CONFLICT", "A matching local MCP request is already running.", 409); this.leases.add(lease); return () => this.leases.delete(lease); }
  sizeForTest() { return this.calls.size; }
}
