import type { AgreementLanguageDocument, AgreementId, ISODateTime, PartyId, VersionId } from "../../../lib/agreement-language/types.ts";

export type AgreementLifecycleState = "draft" | "in_review" | "accepted";
export type AgreementAction = "create" | "list" | "read" | "update";

export interface RecordProvenance {
  createdByActorId: string;
  lastChangedByActorId: string;
  correlationId: string;
  source: "api" | "development_seed";
}

export interface AgreementAggregate {
  agreementId: AgreementId;
  currentVersionId: VersionId;
  lifecycleState: AgreementLifecycleState;
  currentDocument: AgreementLanguageDocument;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  provenance: RecordProvenance;
}

export interface RequestContext {
  actorId: string;
  requestId: string;
  correlationId: string;
  source: "api" | "test";
}

export interface AccessDecision { allowed: boolean; partyId?: PartyId; scopeId?: string }
export interface AgreementAccessPolicy {
  authorize(context: RequestContext, action: AgreementAction, resource?: AgreementAggregate): Promise<AccessDecision>;
}

export type CreateAgreementContent = Omit<AgreementLanguageDocument, "agreementId" | "agreementVersion" | "versionId" | "previousVersionId" | "versionState" | "amendmentKind" | "createdAt" | "createdByPartyId">;
export type NextDraftContent = Omit<AgreementLanguageDocument, "agreementId" | "agreementVersion" | "versionId" | "previousVersionId" | "versionState" | "amendmentKind" | "createdAt" | "createdByPartyId">;

export interface AgreementCapabilities { canRead: boolean; canUpdateDraft: boolean }
export interface AgreementResource {
  agreementId: AgreementId;
  currentVersionId: VersionId;
  lifecycleState: AgreementLifecycleState;
  document: AgreementLanguageDocument;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  capabilities: AgreementCapabilities;
}

export interface IdempotencyInput { key: string; requestFingerprint: string }
export interface CreateAgreementCommand { content: CreateAgreementContent; idempotency?: IdempotencyInput }
export interface UpdateAgreementCommand { agreementId: AgreementId; expectedVersionId: VersionId; content: NextDraftContent; idempotency?: IdempotencyInput }
export interface ListAgreementsCommand {
  limit: number;
  cursor?: string;
  lifecycleState?: AgreementLifecycleState;
  versionState?: AgreementLanguageDocument["versionState"];
  protectionMode?: AgreementLanguageDocument["protectionPolicy"]["mode"];
  updatedAfter?: ISODateTime;
}

export interface AgreementPageResult { data: AgreementResource[]; page: { nextCursor: string | null; hasMore: boolean } }
export type Clock = () => Date;
export type IdGenerator = (kind: "agreement" | "version" | "audit") => string;
