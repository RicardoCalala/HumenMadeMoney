import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { AccountRepository, CurrentUser, SessionRecord, SessionRepository, TokenPair } from "./contracts.ts";
import type { RequestContext } from "../agreements/application/contracts.ts";
const digest = (domain: string, value: string) => createHash("sha256").update(`hmm:${domain}:${value}`).digest("base64url");
const safeEqual = (left: string, right: string) => { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); };
export interface AuthenticationOptions { idleMs: number; absoluteMs: number; renewalWindowMs: number }
export class AuthenticationService {
  private readonly accounts: AccountRepository; private readonly sessions: SessionRepository; private readonly now: () => Date; private readonly token: () => string; private readonly id: () => string; private readonly options: AuthenticationOptions;
  constructor(accounts: AccountRepository, sessions: SessionRepository, now: () => Date = () => new Date(), token: () => string = () => randomBytes(32).toString("base64url"), id: () => string = () => crypto.randomUUID(), options: AuthenticationOptions = { idleMs: 30 * 60_000, absoluteMs: 8 * 60 * 60_000, renewalWindowMs: 10 * 60_000 }) { this.accounts = accounts; this.sessions = sessions; this.now = now; this.token = token; this.id = id; this.options = options; }
  issuePreAuthenticationCsrf(): TokenPair { const raw = this.token(); return { raw, digest: digest("preauth-csrf", raw) }; }
  verifyPreAuthenticationCsrf(raw: string, expectedDigest: string) { return raw.length <= 256 && safeEqual(digest("preauth-csrf", raw), expectedDigest); }
  private pair(domain: string): TokenPair { const raw = this.token(); return { raw, digest: digest(domain, raw) }; }
  async signInDevelopment(profileId: string, previousToken?: string) {
    const account = await this.accounts.findByLocalProfile(profileId); if (!account || account.state !== "active") throw new Error("SIGN_IN_FAILED");
    let previousId: string | undefined; if (previousToken) previousId = (await this.sessions.findByDigest(digest("session", previousToken)))?.sessionId;
    const sessionToken = this.pair("session"); const csrf = this.pair("csrf"); const createdAt = this.now();
    const record: SessionRecord = { sessionId: this.id(), accountId: account.accountId, tokenDigest: sessionToken.digest, csrfDigest: csrf.digest, state: "active", assurance: "development", createdAt: createdAt.toISOString(), lastSeenAt: createdAt.toISOString(), idleExpiresAt: new Date(createdAt.getTime() + this.options.idleMs).toISOString(), absoluteExpiresAt: new Date(createdAt.getTime() + this.options.absoluteMs).toISOString(), rotation: previousId ? 1 : 0 };
    await this.sessions.replace(previousId, record); return { token: sessionToken.raw, csrfToken: csrf.raw, record, account };
  }
  async resolve(token: string | undefined, source: RequestContext["source"] = "api"): Promise<{ context: RequestContext; user?: CurrentUser; csrfDigest?: string }> {
    const requestId = crypto.randomUUID(); const anonymous = { context: { principal: { kind: "anonymous" } as const, requestId, correlationId: requestId, source } };
    if (!token || token.length > 256) return anonymous; const record = await this.sessions.findByDigest(digest("session", token)); if (!record || record.state !== "active") return anonymous;
    const now = this.now(); if (record.idleExpiresAt <= now.toISOString() || record.absoluteExpiresAt <= now.toISOString()) { await this.sessions.update({ ...record, state: "expired" }); return anonymous; }
    const account = await this.accounts.find(record.accountId); if (!account || account.state !== "active") { if (account?.state === "disabled") await this.sessions.revoke(record.sessionId, now.toISOString()); return account ? { context: { principal: { kind: "account", accountId: account.accountId, sessionId: record.sessionId, accountState: account.state, assurance: "development" }, requestId, correlationId: requestId, source } } : anonymous; }
    if (new Date(record.idleExpiresAt).getTime() - now.getTime() < this.options.renewalWindowMs) { const renewed = new Date(Math.min(now.getTime() + this.options.idleMs, new Date(record.absoluteExpiresAt).getTime())).toISOString(); await this.sessions.update({ ...record, lastSeenAt: now.toISOString(), idleExpiresAt: renewed }); record.idleExpiresAt = renewed; }
    return { context: { principal: { kind: "account", accountId: account.accountId, sessionId: record.sessionId, accountState: account.state, assurance: "development" }, requestId, correlationId: requestId, source }, user: { accountId: account.accountId, displayName: account.displayName, state: account.state, sessionExpiresAt: record.idleExpiresAt, assurance: "development" }, csrfDigest: record.csrfDigest };
  }
  verifySessionCsrf(raw: string | undefined, expectedDigest: string | undefined) { return !!raw && !!expectedDigest && raw.length <= 256 && safeEqual(digest("csrf", raw), expectedDigest); }
  async signOut(token: string | undefined) { if (!token) return; const record = await this.sessions.findByDigest(digest("session", token)); if (record) await this.sessions.revoke(record.sessionId, this.now().toISOString()); }
}
