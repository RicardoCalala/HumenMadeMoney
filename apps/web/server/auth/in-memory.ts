import type { Account, AccountRepository, SessionRecord, SessionRepository } from "./contracts.ts";
const clone = <T>(value: T): T => structuredClone(value);
export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts: Account[]; private readonly profiles: ReadonlyMap<string, string>;
  constructor(accounts: Account[], profiles: ReadonlyMap<string, string>) { this.accounts = accounts; this.profiles = profiles; }
  async find(accountId: string) { const value = this.accounts.find((account) => account.accountId === accountId); return value ? clone(value) : null; }
  async findByLocalProfile(profileId: string) { const accountId = this.profiles.get(profileId); return accountId ? this.find(accountId) : null; }
}
export class InMemorySessionRepository implements SessionRepository {
  private readonly records = new Map<string, SessionRecord>();
  async create(record: SessionRecord) { this.records.set(record.sessionId, clone(record)); }
  async findByDigest(digest: string) { const value = [...this.records.values()].find((record) => record.tokenDigest === digest); return value ? clone(value) : null; }
  async replace(previousId: string | undefined, record: SessionRecord) { if (previousId) { const prior = this.records.get(previousId); if (prior) this.records.set(previousId, { ...prior, state: "revoked", revokedAt: record.createdAt }); } this.records.set(record.sessionId, clone(record)); }
  async revoke(sessionId: string, at: string) { const prior = this.records.get(sessionId); if (prior) this.records.set(sessionId, { ...prior, state: "revoked", revokedAt: at }); }
  async update(record: SessionRecord) { this.records.set(record.sessionId, clone(record)); }
  recordsForTest() { return clone([...this.records.values()]); }
}
