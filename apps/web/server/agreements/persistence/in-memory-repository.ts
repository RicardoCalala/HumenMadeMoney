import type { AuditRecord, AgreementLanguageDocument } from "../../../lib/agreement-language/types.ts";
import type { AgreementAggregate } from "../application/contracts.ts";
import { assertAggregateConsistency } from "../domain/versioning.ts";
import type { AgreementListQuery, AgreementMutationMetadata, AgreementPage, AgreementRepository, CreateRepositoryResult, SaveRepositoryResult } from "./repository.ts";

type IdempotencyRecord = { fingerprint: string; agreementId: string };
type CursorPayload = { v: 1; updatedAt: string; agreementId: string; query: string; scope: string; expiresAt: string };
const clone = <T>(value: T): T => structuredClone(value);
const MAX_IDEMPOTENCY_RECORDS = 1_000;
const cursorSecret = "hmm-development-cursor-v1";
const checksum = (value: string) => { let hash = 2166136261; for (const character of `${cursorSecret}:${value}`) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(36); };
const encode = (payload: CursorPayload) => { const body = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${body}.${checksum(body)}`; };
const decode = (cursor: string): CursorPayload => {
  const [body, signature, extra] = cursor.split(".");
  if (!body || !signature || extra || checksum(body) !== signature) throw new Error("INVALID_CURSOR");
  const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CursorPayload;
  if (value.v !== 1 || !value.updatedAt || !value.agreementId || !value.query || !value.scope || !value.expiresAt) throw new Error("INVALID_CURSOR");
  return value;
};
const queryBinding = (query: AgreementListQuery) => JSON.stringify({ lifecycleState: query.lifecycleState ?? null, versionState: query.versionState ?? null, protectionMode: query.protectionMode ?? null, updatedAfter: query.updatedAfter ?? null });
const scopeKey = (scope: { actorId: string; scopeId: string }) => `${scope.actorId}:${scope.scopeId}`;
const idemKey = (metadata: AgreementMutationMetadata) => metadata.idempotency ? JSON.stringify(metadata.idempotency.scope) + ":" + metadata.idempotency.key : null;

/** Development-only process-local repository. It is disposable and is not production persistence. */
export class InMemoryAgreementRepository implements AgreementRepository {
  private readonly aggregates = new Map<string, AgreementAggregate>();
  private readonly versions = new Map<string, AgreementLanguageDocument[]>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly auditRecords: AuditRecord[] = [];
  constructor(seed: AgreementAggregate[] = []) { for (const aggregate of seed) this.insertSeed(aggregate); }

  private insertSeed(aggregate: AgreementAggregate) { assertAggregateConsistency(aggregate.lifecycleState, aggregate.currentDocument, aggregate.currentVersionId); this.aggregates.set(aggregate.agreementId, clone(aggregate)); this.versions.set(aggregate.agreementId, [clone(aggregate.currentDocument)]); }
  private recordIdempotency(key: string, record: IdempotencyRecord) { if (!this.idempotency.has(key) && this.idempotency.size >= MAX_IDEMPOTENCY_RECORDS) this.idempotency.delete(this.idempotency.keys().next().value!); this.idempotency.set(key, record); }
  async create(aggregate: AgreementAggregate, mutation: AgreementMutationMetadata): Promise<CreateRepositoryResult> {
    const key = idemKey(mutation); const prior = key ? this.idempotency.get(key) : undefined;
    if (prior) return prior.fingerprint === mutation.idempotency?.requestFingerprint ? { kind: "replayed", aggregate: clone(this.aggregates.get(prior.agreementId)!) } : { kind: "idempotency_conflict" };
    if (this.aggregates.has(aggregate.agreementId) || [...this.aggregates.values()].some((item) => item.currentVersionId === aggregate.currentVersionId)) return { kind: "duplicate" };
    assertAggregateConsistency(aggregate.lifecycleState, aggregate.currentDocument, aggregate.currentVersionId);
    this.aggregates.set(aggregate.agreementId, clone(aggregate)); this.versions.set(aggregate.agreementId, [clone(aggregate.currentDocument)]); this.auditRecords.push(clone(mutation.audit));
    if (key && mutation.idempotency) this.recordIdempotency(key, { fingerprint: mutation.idempotency.requestFingerprint, agreementId: aggregate.agreementId });
    return { kind: "created", aggregate: clone(aggregate) };
  }
  async getById(agreementId: string) { const value = this.aggregates.get(agreementId); return value ? clone(value) : null; }
  async list(query: AgreementListQuery): Promise<AgreementPage> {
    const binding = queryBinding(query); const scope = scopeKey(query.scope); let boundary: CursorPayload | undefined;
    if (query.cursor) { try { boundary = decode(query.cursor); } catch { throw new Error("INVALID_CURSOR"); } if (boundary.query !== binding || boundary.scope !== scope || boundary.expiresAt <= query.now) throw new Error("INVALID_CURSOR"); }
    const items = [...this.aggregates.values()].filter((item) => item.provenance.createdByActorId === query.scope.actorId)
      .filter((item) => !query.lifecycleState || item.lifecycleState === query.lifecycleState)
      .filter((item) => !query.versionState || item.currentDocument.versionState === query.versionState)
      .filter((item) => !query.protectionMode || item.currentDocument.protectionPolicy.mode === query.protectionMode)
      .filter((item) => !query.updatedAfter || item.updatedAt > query.updatedAfter)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.agreementId.localeCompare(b.agreementId))
      .filter((item) => !boundary || item.updatedAt < boundary.updatedAt || (item.updatedAt === boundary.updatedAt && item.agreementId > boundary.agreementId));
    const pageItems = items.slice(0, query.limit); const hasMore = items.length > query.limit; const last = pageItems.at(-1);
    const expiresAt = new Date(new Date(query.now).getTime() + 15 * 60_000).toISOString();
    return { items: clone(pageItems), hasMore, nextCursor: hasMore && last ? encode({ v: 1, updatedAt: last.updatedAt, agreementId: last.agreementId, query: binding, scope, expiresAt }) : null };
  }
  async saveNextVersion(agreementId: string, next: AgreementLanguageDocument, precondition: { expectedCurrentVersionId: string }, mutation: AgreementMutationMetadata): Promise<SaveRepositoryResult> {
    const key = idemKey(mutation); const prior = key ? this.idempotency.get(key) : undefined;
    if (prior) return prior.fingerprint === mutation.idempotency?.requestFingerprint ? { kind: "replayed", aggregate: clone(this.aggregates.get(prior.agreementId)!) } : { kind: "idempotency_conflict" };
    const current = this.aggregates.get(agreementId); if (!current) return { kind: "not_found" };
    if (current.currentVersionId !== precondition.expectedCurrentVersionId) return { kind: "version_conflict", currentVersionId: current.currentVersionId };
    const history = this.versions.get(agreementId)!;
    if (next.agreementId !== agreementId || next.previousVersionId !== current.currentVersionId || next.agreementVersion !== current.currentDocument.agreementVersion + 1 || history.some((item) => item.versionId === next.versionId)) throw new Error("INVALID_NEXT_VERSION");
    const updated: AgreementAggregate = { ...current, currentVersionId: next.versionId, lifecycleState: next.versionState === "proposed" ? "in_review" : "draft", currentDocument: clone(next), updatedAt: next.createdAt, provenance: { ...current.provenance, lastChangedByActorId: mutation.audit.actorId, correlationId: mutation.audit.correlationId } };
    this.aggregates.set(agreementId, clone(updated)); history.push(clone(next)); this.auditRecords.push(clone(mutation.audit));
    if (key && mutation.idempotency) this.recordIdempotency(key, { fingerprint: mutation.idempotency.requestFingerprint, agreementId });
    return { kind: "saved", aggregate: clone(updated) };
  }
  getAuditRecordsForTest() { return clone(this.auditRecords); }
  getVersionsForTest(agreementId: string) { return clone(this.versions.get(agreementId) ?? []); }
}
