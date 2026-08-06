import type { AuditRecord, AgreementId, AgreementLanguageDocument, VersionId } from "../../../lib/agreement-language/types.ts";
import type { AgreementAggregate, AgreementLifecycleState, AgreementMembership } from "../application/contracts.ts";

export interface AgreementAuthorizationScope { scopeId: string; accountId: string; agreementIds: string[] }
export interface AgreementListQuery {
  scope: AgreementAuthorizationScope;
  limit: number;
  cursor?: string;
  lifecycleState?: AgreementLifecycleState;
  versionState?: AgreementLanguageDocument["versionState"];
  protectionMode?: AgreementLanguageDocument["protectionPolicy"]["mode"];
  updatedAfter?: string;
  now: string;
}
export interface AgreementPage { items: AgreementAggregate[]; nextCursor: string | null; hasMore: boolean }
export interface AgreementMutationMetadata {
  idempotency?: { scope: { actorId: string; operation: "create" | "update"; agreementId?: AgreementId }; key: string; requestFingerprint: string };
  audit: AuditRecord;
  ownerMembership?: AgreementMembership;
}
export interface AgreementMembershipRepository {
  findActive(agreementId: AgreementId, accountId: string): Promise<AgreementMembership | null>;
  listActiveAgreementIds(accountId: string): Promise<string[]>;
  listForAgreement(agreementId: AgreementId): Promise<AgreementMembership[]>;
}
export type CreateRepositoryResult = { kind: "created" | "replayed"; aggregate: AgreementAggregate } | { kind: "idempotency_conflict" } | { kind: "duplicate" };
export type SaveRepositoryResult = { kind: "saved" | "replayed"; aggregate: AgreementAggregate } | { kind: "idempotency_conflict" } | { kind: "not_found" } | { kind: "version_conflict"; currentVersionId: VersionId };

export interface AgreementRepository extends AgreementMembershipRepository {
  create(aggregate: AgreementAggregate, mutation: AgreementMutationMetadata): Promise<CreateRepositoryResult>;
  getById(agreementId: AgreementId): Promise<AgreementAggregate | null>;
  list(query: AgreementListQuery): Promise<AgreementPage>;
  saveNextVersion(agreementId: AgreementId, next: AgreementLanguageDocument, precondition: { expectedCurrentVersionId: VersionId }, mutation: AgreementMutationMetadata): Promise<SaveRepositoryResult>;
}
