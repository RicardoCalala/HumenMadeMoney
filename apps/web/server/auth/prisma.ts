import type { PrismaClient } from "@prisma/client";
import type { Account, AccountRepository, SessionRecord, SessionRepository } from "./contracts.ts";

const iso = (value: Date) => value.toISOString();
const accountRecord = (row: { id: string; state: "active" | "suspended" | "disabled"; displayName: string; primaryEmail: string | null; createdAt: Date; updatedAt: Date }): Account => ({
  accountId: row.id, state: row.state, displayName: row.displayName, ...(row.primaryEmail ? { primaryEmail: row.primaryEmail } : {}), createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt),
});
const sessionRecord = (row: { id: string; accountId: string; tokenDigest: string; csrfDigest: string; state: "active" | "revoked" | "expired"; assurance: string; createdAt: Date; lastSeenAt: Date; idleExpiresAt: Date; absoluteExpiresAt: Date; revokedAt: Date | null; rotation: number }): SessionRecord => ({
  sessionId: row.id, accountId: row.accountId, tokenDigest: row.tokenDigest, csrfDigest: row.csrfDigest, state: row.state, assurance: "development", createdAt: iso(row.createdAt), lastSeenAt: iso(row.lastSeenAt), idleExpiresAt: iso(row.idleExpiresAt), absoluteExpiresAt: iso(row.absoluteExpiresAt), ...(row.revokedAt ? { revokedAt: iso(row.revokedAt) } : {}), rotation: row.rotation,
});
const sessionData = (record: SessionRecord) => ({ id: record.sessionId, accountId: record.accountId, tokenDigest: record.tokenDigest, csrfDigest: record.csrfDigest, state: record.state, assurance: record.assurance, createdAt: new Date(record.createdAt), lastSeenAt: new Date(record.lastSeenAt), idleExpiresAt: new Date(record.idleExpiresAt), absoluteExpiresAt: new Date(record.absoluteExpiresAt), revokedAt: record.revokedAt ? new Date(record.revokedAt) : null, rotation: record.rotation });

export class PrismaAccountRepository implements AccountRepository {
  private readonly prisma: PrismaClient;
  constructor(prisma: PrismaClient) { this.prisma = prisma; }
  async find(accountId: string) { const row = await this.prisma.account.findUnique({ where: { id: accountId } }); return row ? accountRecord(row) : null; }
  async findByLocalProfile(profileId: string) { const row = await this.prisma.localAuthProfile.findUnique({ where: { profileId }, include: { account: true } }); return row ? accountRecord(row.account) : null; }
}

export class PrismaSessionRepository implements SessionRepository {
  private readonly prisma: PrismaClient;
  constructor(prisma: PrismaClient) { this.prisma = prisma; }
  async create(record: SessionRecord) { await this.prisma.session.create({ data: sessionData(record) }); }
  async findByDigest(digest: string) { const row = await this.prisma.session.findUnique({ where: { tokenDigest: digest } }); return row ? sessionRecord(row) : null; }
  async replace(previousId: string | undefined, record: SessionRecord) {
    await this.prisma.$transaction(async (tx) => {
      if (previousId) await tx.session.updateMany({ where: { id: previousId, state: "active" }, data: { state: "revoked", revokedAt: new Date(record.createdAt) } });
      await tx.session.create({ data: { ...sessionData(record), replacedSessionId: previousId } });
    });
  }
  async revoke(sessionId: string, at: string) { await this.prisma.session.updateMany({ where: { id: sessionId, state: "active" }, data: { state: "revoked", revokedAt: new Date(at) } }); }
  async update(record: SessionRecord) {
    await this.prisma.session.updateMany({ where: { id: record.sessionId, state: "active", rotation: record.rotation }, data: { state: record.state, lastSeenAt: new Date(record.lastSeenAt), idleExpiresAt: new Date(record.idleExpiresAt), absoluteExpiresAt: new Date(record.absoluteExpiresAt), revokedAt: record.revokedAt ? new Date(record.revokedAt) : null } });
  }
  async cleanupExpired(now: string, batchSize: number) {
    const bounded = Math.max(1, Math.min(batchSize, 1_000));
    return this.prisma.$executeRaw`UPDATE "sessions" SET "state" = 'expired' WHERE "id" IN (SELECT "id" FROM "sessions" WHERE "state" = 'active' AND ("idle_expires_at" <= ${new Date(now)} OR "absolute_expires_at" <= ${new Date(now)}) ORDER BY "idle_expires_at" LIMIT ${bounded})`;
  }
}
