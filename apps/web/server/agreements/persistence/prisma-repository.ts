import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import type { AuditRecord, AgreementLanguageDocument } from "../../../lib/agreement-language/types.ts";
import type { AgreementAggregate, AgreementMembership } from "../application/contracts.ts";
import { assertAggregateConsistency, lifecycleForVersionState } from "../domain/versioning.ts";
import type { AgreementListQuery, AgreementMutationMetadata, AgreementPage, AgreementRepository, CreateRepositoryResult, SaveRepositoryResult } from "./repository.ts";

type AggregateRow = Prisma.AgreementGetPayload<{ include: { currentVersion: true } }>;
type CursorPayload = { v: 1; updatedAt: string; agreementId: string; query: string; scope: string; expiresAt: string };
const CREATE_SCOPE = "__create__";
const json = (value: unknown) => value as Prisma.InputJsonValue;
const digest = (domain: string, value: string) => createHash("sha256").update(`hmm:${domain}:${value}`).digest("base64url");
const iso = (value: Date) => value.toISOString();
const retentionHours = () => { const value = Number(process.env.HMM_IDEMPOTENCY_RETENTION_HOURS ?? "168"); return Number.isFinite(value) && value >= 1 && value <= 24 * 365 ? value : 168; };
const queryBinding = (query: AgreementListQuery) => JSON.stringify({ lifecycleState: query.lifecycleState ?? null, versionState: query.versionState ?? null, protectionMode: query.protectionMode ?? null, updatedAfter: query.updatedAfter ?? null });
const scopeKey = (scope: AgreementListQuery["scope"]) => digest("cursor-scope", `${scope.accountId}:${scope.scopeId}:${[...scope.agreementIds].sort().join(",")}`);
const signingSecret = () => { const secret = process.env.HMM_CURSOR_SIGNING_SECRET; if (!secret) throw new Error("HMM_CURSOR_SIGNING_SECRET is required when HMM_PERSISTENCE_ADAPTER=prisma."); return secret; };
const encodeCursor = (payload: CursorPayload) => { const body = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${body}.${createHmac("sha256", signingSecret()).update(body).digest("base64url")}`; };
const decodeCursor = (cursor: string) => {
  const [body, signature, extra] = cursor.split("."); if (!body || !signature || extra) throw new Error("INVALID_CURSOR");
  const expected = createHmac("sha256", signingSecret()).update(body).digest(); const received = Buffer.from(signature, "base64url"); if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error("INVALID_CURSOR");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CursorPayload; if (payload.v !== 1 || !payload.updatedAt || !payload.agreementId || !payload.query || !payload.scope || !payload.expiresAt) throw new Error("INVALID_CURSOR"); return payload;
};
const aggregate = (row: AggregateRow): AgreementAggregate => ({ agreementId: row.id, currentVersionId: row.currentVersionId, lifecycleState: row.lifecycleState, currentDocument: structuredClone(row.currentVersion.document) as unknown as AgreementLanguageDocument, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt), provenance: { createdByActorId: row.createdByActorId, lastChangedByActorId: row.lastChangedByActorId, correlationId: row.correlationId, source: row.source as "api" | "development_seed" } });
const membership = (row: { agreementId: string; accountId: string | null; partyId: string; role: "owner" | "participant" | "reviewer" | "observer"; state: "active" | "pending_invitation" | "revoked"; createdAt: Date; createdByAccountId: string; activatedAt: Date | null; revokedAt: Date | null }): AgreementMembership => ({ agreementId: row.agreementId, ...(row.accountId ? { accountId: row.accountId } : {}), partyId: row.partyId, role: row.role, state: row.state, createdAt: iso(row.createdAt), createdByAccountId: row.createdByAccountId, ...(row.activatedAt ? { activatedAt: iso(row.activatedAt) } : {}), ...(row.revokedAt ? { revokedAt: iso(row.revokedAt) } : {}) });
const versionData = (document: AgreementLanguageDocument) => ({ id: document.versionId, agreementId: document.agreementId, agreementVersion: document.agreementVersion, previousVersionId: document.previousVersionId ?? null, schemaVersion: document.schemaVersion, versionState: document.versionState, amendmentKind: document.amendmentKind ?? null, createdAt: new Date(document.createdAt), createdByPartyId: document.createdByPartyId, document: json(document), protectionMode: document.protectionPolicy.mode, documentDigest: digest("agreement-document", JSON.stringify(document)) });
const partyData = (document: AgreementLanguageDocument) => document.parties.map((party) => ({ agreementId: document.agreementId, versionId: document.versionId, partyId: party.partyId, acceptanceRequired: party.acceptanceRequired, partyType: party.partyType, roles: json(party.roles) }));
const auditData = (record: AuditRecord) => ({ id: record.eventId, agreementId: record.agreementId, versionId: record.versionId, actorType: record.actorType, actorId: record.actorId, action: record.action, occurredAt: new Date(record.occurredAt), recordedAt: new Date(record.recordedAt), correlationId: record.correlationId, causationId: record.causationId ?? null, sourceSystem: record.sourceSystem, policyVersion: record.policyVersion ?? null, relatedObjectIds: json(record.relatedObjectIds), explanation: record.explanation });

export class PrismaAgreementRepository implements AgreementRepository {
  private readonly prisma: PrismaClient;
  constructor(prisma: PrismaClient) { this.prisma = prisma; }
  private async idempotencyResult(metadata: AgreementMutationMetadata) {
    if (!metadata.idempotency) return null; const scope = metadata.idempotency.scope; const normalizedScope = scope.agreementId ?? CREATE_SCOPE;
    const row = await this.prisma.idempotencyRecord.findUnique({ where: { actorId_operation_normalizedScope_keyDigest: { actorId: scope.actorId, operation: scope.operation, normalizedScope, keyDigest: digest("idempotency-key", metadata.idempotency.key) } } });
    if (!row) return null; if (row.requestFingerprint !== metadata.idempotency.requestFingerprint) return { kind: "idempotency_conflict" as const }; if (!row.agreementId) return null;
    const existing = await this.getById(row.agreementId); return existing ? { kind: "replayed" as const, aggregate: existing } : null;
  }
  private idempotencyData(metadata: AgreementMutationMetadata, now: Date) {
    if (!metadata.idempotency) return undefined; const scope = metadata.idempotency.scope; return { id: crypto.randomUUID(), actorId: scope.actorId, operation: scope.operation, agreementScopeId: scope.agreementId ?? null, normalizedScope: scope.agreementId ?? CREATE_SCOPE, keyDigest: digest("idempotency-key", metadata.idempotency.key), requestFingerprint: metadata.idempotency.requestFingerprint, createdAt: now, expiresAt: new Date(now.getTime() + retentionHours() * 60 * 60_000) };
  }
  async create(value: AgreementAggregate, metadata: AgreementMutationMetadata): Promise<CreateRepositoryResult> {
    const replay = await this.idempotencyResult(metadata); if (replay) return replay; assertAggregateConsistency(value.lifecycleState, value.currentDocument, value.currentVersionId); const owner = metadata.ownerMembership;
    if (!owner || owner.role !== "owner" || owner.state !== "active" || !owner.accountId || owner.agreementId !== value.agreementId || !value.currentDocument.parties.some((party) => party.partyId === owner.partyId)) return { kind: "duplicate" };
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const now = new Date(value.createdAt); const idem = this.idempotencyData(metadata, now); if (idem) await tx.idempotencyRecord.create({ data: idem });
        await tx.$executeRaw`INSERT INTO "agreements" ("id", "current_version_id", "lifecycle_state", "created_at", "updated_at", "created_by_actor_id", "last_changed_by_actor_id", "correlation_id", "source", "revision") VALUES (${value.agreementId}, ${value.currentVersionId}, ${value.lifecycleState}::"AgreementLifecycleState", ${new Date(value.createdAt)}, ${new Date(value.updatedAt)}, ${value.provenance.createdByActorId}, ${value.provenance.lastChangedByActorId}, ${value.provenance.correlationId}, ${value.provenance.source}, 0)`;
        await tx.agreementVersion.create({ data: versionData(value.currentDocument) });
        await tx.agreementVersionParty.createMany({ data: partyData(value.currentDocument) });
        await tx.agreementMembership.create({ data: { id: crypto.randomUUID(), agreementId: owner.agreementId, accountId: owner.accountId, partyId: owner.partyId, role: owner.role, state: owner.state, createdAt: new Date(owner.createdAt), createdByAccountId: owner.createdByAccountId, activatedAt: owner.activatedAt ? new Date(owner.activatedAt) : null, revokedAt: null } });
        await tx.auditRecord.create({ data: auditData(metadata.audit) }); if (idem) await tx.idempotencyRecord.update({ where: { id: idem.id }, data: { agreementId: value.agreementId, resultVersionId: value.currentVersionId } });
        return tx.agreement.findUniqueOrThrow({ where: { id: value.agreementId }, include: { currentVersion: true } });
      }); return { kind: "created", aggregate: aggregate(created) };
    } catch (error) {
      const prior = await this.idempotencyResult(metadata); if (prior) return prior;
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2003"].includes(error.code)) return { kind: "duplicate" }; throw error;
    }
  }
  async getById(agreementId: string) { const row = await this.prisma.agreement.findUnique({ where: { id: agreementId }, include: { currentVersion: true } }); return row ? aggregate(row) : null; }
  async list(query: AgreementListQuery): Promise<AgreementPage> {
    const binding = queryBinding(query); const scope = scopeKey(query.scope); let boundary: CursorPayload | undefined;
    if (query.cursor) { boundary = decodeCursor(query.cursor); if (boundary.query !== binding || boundary.scope !== scope || boundary.expiresAt <= query.now) throw new Error("INVALID_CURSOR"); }
    const rows = await this.prisma.agreement.findMany({ where: { id: { in: query.scope.agreementIds }, ...(query.lifecycleState ? { lifecycleState: query.lifecycleState } : {}), ...(query.updatedAfter ? { updatedAt: { gt: new Date(query.updatedAfter) } } : {}), ...(query.versionState || query.protectionMode ? { currentVersion: { ...(query.versionState ? { versionState: query.versionState } : {}), ...(query.protectionMode ? { protectionMode: query.protectionMode } : {}) } } : {}), ...(boundary ? { OR: [{ updatedAt: { lt: new Date(boundary.updatedAt) } }, { updatedAt: new Date(boundary.updatedAt), id: { gt: boundary.agreementId } }] } : {}) }, include: { currentVersion: true }, orderBy: [{ updatedAt: "desc" }, { id: "asc" }], take: query.limit + 1 });
    const hasMore = rows.length > query.limit; const pageRows = rows.slice(0, query.limit); const last = pageRows.at(-1); const expiresAt = new Date(new Date(query.now).getTime() + 15 * 60_000).toISOString();
    return { items: pageRows.map(aggregate), hasMore, nextCursor: hasMore && last ? encodeCursor({ v: 1, updatedAt: iso(last.updatedAt), agreementId: last.id, query: binding, scope, expiresAt }) : null };
  }
  async saveNextVersion(agreementId: string, next: AgreementLanguageDocument, precondition: { expectedCurrentVersionId: string }, metadata: AgreementMutationMetadata): Promise<SaveRepositoryResult> {
    const replay = await this.idempotencyResult(metadata); if (replay) return replay;
    try {
      return await this.prisma.$transaction(async (tx): Promise<SaveRepositoryResult> => {
        const claimed = await tx.agreement.updateMany({ where: { id: agreementId, currentVersionId: precondition.expectedCurrentVersionId }, data: { revision: { increment: 1 } } });
        if (!claimed.count) { const current = await tx.agreement.findUnique({ where: { id: agreementId }, select: { currentVersionId: true } }); if (!current) return { kind: "not_found" }; return { kind: "version_conflict", currentVersionId: current.currentVersionId }; }
        const idem = this.idempotencyData(metadata, new Date(next.createdAt)); if (idem) await tx.idempotencyRecord.create({ data: idem });
        const current = await tx.agreement.findUniqueOrThrow({ where: { id: agreementId }, include: { currentVersion: true, memberships: { where: { state: { not: "revoked" } }, select: { partyId: true } } } });
        const currentDocument = current.currentVersion.document as unknown as AgreementLanguageDocument; const nextPartyIds = new Set(next.parties.map((party) => party.partyId));
        if (current.memberships.some((item) => !nextPartyIds.has(item.partyId))) throw new Error("BOUND_PARTY_REMOVED");
        if (next.agreementId !== agreementId || next.previousVersionId !== current.currentVersionId || next.agreementVersion !== currentDocument.agreementVersion + 1) throw new Error("INVALID_NEXT_VERSION");
        await tx.agreementVersion.create({ data: versionData(next) }); await tx.agreementVersionParty.createMany({ data: partyData(next) }); await tx.agreement.update({ where: { id: agreementId }, data: { currentVersionId: next.versionId, lifecycleState: lifecycleForVersionState(next.versionState), updatedAt: new Date(next.createdAt), lastChangedByActorId: metadata.audit.actorId, correlationId: metadata.audit.correlationId } });
        await tx.auditRecord.create({ data: auditData(metadata.audit) }); if (idem) await tx.idempotencyRecord.update({ where: { id: idem.id }, data: { agreementId, resultVersionId: next.versionId } });
        const saved = await tx.agreement.findUniqueOrThrow({ where: { id: agreementId }, include: { currentVersion: true } }); return { kind: "saved", aggregate: aggregate(saved) };
      });
    } catch (error) { const prior = await this.idempotencyResult(metadata); if (prior) return prior; if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { const current = await this.getById(agreementId); return current ? { kind: "version_conflict", currentVersionId: current.currentVersionId } : { kind: "not_found" }; } throw error; }
  }
  async findActive(agreementId: string, accountId: string) { const row = await this.prisma.agreementMembership.findFirst({ where: { agreementId, accountId, state: "active", role: { not: "observer" } } }); return row ? membership(row) : null; }
  async listActiveAgreementIds(accountId: string) { const rows = await this.prisma.agreementMembership.findMany({ where: { accountId, state: "active", role: { not: "observer" } }, distinct: ["agreementId"], select: { agreementId: true } }); return rows.map((row) => row.agreementId); }
  async listForAgreement(agreementId: string) { const rows = await this.prisma.agreementMembership.findMany({ where: { agreementId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] }); return rows.map(membership); }
  async cleanupExpiredIdempotency(now: string, batchSize: number) { const bounded = Math.max(1, Math.min(batchSize, 1_000)); return this.prisma.$executeRaw`DELETE FROM "idempotency_records" WHERE "id" IN (SELECT "id" FROM "idempotency_records" WHERE "expires_at" <= ${new Date(now)} ORDER BY "expires_at" LIMIT ${bounded})`; }
}
