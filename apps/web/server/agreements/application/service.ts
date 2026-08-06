import { evaluateAmendment } from "../../../lib/agreement-language/policy.ts";
import { validateAgreementDocument } from "../../../lib/agreement-language/validation.ts";
import type { AgreementLanguageDocument, AuditRecord } from "../../../lib/agreement-language/types.ts";
import type { AgreementRepository, AgreementMutationMetadata } from "../persistence/repository.ts";
import { AgreementApplicationError } from "./errors.ts";
import type { AgreementAccessPolicy, AgreementAggregate, AgreementPageResult, AgreementResource, Clock, CreateAgreementCommand, IdGenerator, ListAgreementsCommand, RequestContext, UpdateAgreementCommand } from "./contracts.ts";

export interface AgreementObservabilitySink { mutationCommitted(event: { action: "create" | "update"; agreementId: string; requestId: string }): void | Promise<void> }

export class AgreementService {
  private readonly repository: AgreementRepository; private readonly access: AgreementAccessPolicy; private readonly clock: Clock; private readonly ids: IdGenerator; private readonly observability?: AgreementObservabilitySink;
  constructor(repository: AgreementRepository, access: AgreementAccessPolicy, clock: Clock, ids: IdGenerator, observability?: AgreementObservabilitySink) { this.repository = repository; this.access = access; this.clock = clock; this.ids = ids; this.observability = observability; }
  private async require(context: RequestContext, action: "create" | "list" | "read" | "update", resource?: AgreementAggregate) {
    if (context.principal.kind !== "account") throw new AgreementApplicationError("AUTHENTICATION_REQUIRED", "Sign in to continue.");
    if (context.principal.accountState === "suspended") throw new AgreementApplicationError("ACCOUNT_SUSPENDED", "This account is unavailable.");
    if (context.principal.accountState === "disabled") throw new AgreementApplicationError("ACCOUNT_DISABLED", "This account is unavailable.");
    const decision = await this.access.authorize(context, action, resource);
    if (!decision.allowed) throw new AgreementApplicationError("PERMISSION_DENIED", "The requested resource was not found.");
    return decision;
  }
  private resource(aggregate: AgreementAggregate, canUpdate: boolean): AgreementResource { return { agreementId: aggregate.agreementId, currentVersionId: aggregate.currentVersionId, lifecycleState: aggregate.lifecycleState, document: structuredClone(aggregate.currentDocument), createdAt: aggregate.createdAt, updatedAt: aggregate.updatedAt, capabilities: { canRead: true, canUpdateDraft: canUpdate && aggregate.lifecycleState !== "accepted" } }; }
  private audit(context: RequestContext, action: string, agreementId: string, versionId: string, previousVersionId: string | undefined, occurredAt: string, explanation: string): AuditRecord {
    if (context.principal.kind !== "account") throw new AgreementApplicationError("AUTHENTICATION_REQUIRED", "Sign in to continue.");
    return { eventId: this.ids("audit"), agreementId, versionId, actorType: "participant", actorId: context.principal.accountId, action, occurredAt, recordedAt: occurredAt, correlationId: context.correlationId, causationId: context.requestId, sourceSystem: "agreement-api-v1", relatedObjectIds: previousVersionId ? [previousVersionId, versionId] : [versionId], explanation };
  }
  private metadata(context: RequestContext, operation: "create" | "update", audit: AuditRecord, command: { idempotency?: { key: string; requestFingerprint: string } }, agreementId?: string): AgreementMutationMetadata { if (context.principal.kind !== "account") throw new AgreementApplicationError("AUTHENTICATION_REQUIRED", "Sign in to continue."); return { audit, idempotency: command.idempotency ? { scope: { actorId: context.principal.accountId, operation, agreementId }, key: command.idempotency.key, requestFingerprint: command.idempotency.requestFingerprint } : undefined }; }
  private validate(document: AgreementLanguageDocument) { try { const result = validateAgreementDocument(document); if (!result.valid) throw new AgreementApplicationError("AGREEMENT_VALIDATION_FAILED", "The agreement terms need correction before they can be saved.", { fieldErrors: result.errors }); } catch (error) { if (error instanceof AgreementApplicationError) throw error; throw new AgreementApplicationError("INVALID_REQUEST", "The agreement content shape is malformed."); } }

  async create(context: RequestContext, command: CreateAgreementCommand): Promise<{ resource: AgreementResource; replayed: boolean }> {
    const decision = await this.require(context, "create"); if (!decision.partyId) throw new AgreementApplicationError("PERMISSION_DENIED", "A creator party binding is required.");
    const now = this.clock().toISOString(); const agreementId = this.ids("agreement"); const versionId = this.ids("version");
    const document: AgreementLanguageDocument = { ...structuredClone(command.content), agreementId, agreementVersion: 1, versionId, versionState: "draft", createdAt: now, createdByPartyId: decision.partyId };
    this.validate(document);
    if (context.principal.kind !== "account") throw new AgreementApplicationError("AUTHENTICATION_REQUIRED", "Sign in to continue.");
    const aggregate: AgreementAggregate = { agreementId, currentVersionId: versionId, lifecycleState: "draft", currentDocument: document, createdAt: now, updatedAt: now, provenance: { createdByActorId: context.principal.accountId, lastChangedByActorId: context.principal.accountId, correlationId: context.correlationId, source: "api" } };
    const metadata = this.metadata(context, "create", this.audit(context, "agreement.created", agreementId, versionId, undefined, now, "Created agreement draft version 1."), command);
    metadata.ownerMembership = { agreementId, accountId: context.principal.accountId, partyId: decision.partyId, role: "owner", state: "active", createdAt: now, createdByAccountId: context.principal.accountId, activatedAt: now };
    const result = await this.repository.create(aggregate, metadata);
    if (result.kind === "idempotency_conflict") throw new AgreementApplicationError("IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used for a different request.");
    if (result.kind === "duplicate") throw new AgreementApplicationError("INTERNAL_ERROR", "The agreement could not be created.", { retryable: true });
    if (result.kind === "created") await this.observability?.mutationCommitted({ action: "create", agreementId: result.aggregate.agreementId, requestId: context.requestId });
    return { resource: this.resource(result.aggregate, true), replayed: result.kind === "replayed" };
  }
  async get(context: RequestContext, agreementId: string): Promise<AgreementResource> {
    await this.require(context, "read"); const aggregate = await this.repository.getById(agreementId);
    if (!aggregate) throw new AgreementApplicationError("RESOURCE_NOT_FOUND", "The requested resource was not found.");
    const decision = await this.access.authorize(context, "read", aggregate); if (!decision.allowed) throw new AgreementApplicationError("RESOURCE_NOT_FOUND", "The requested resource was not found.");
    const update = await this.access.authorize(context, "update", aggregate); return this.resource(aggregate, update.allowed);
  }
  async list(context: RequestContext, command: ListAgreementsCommand): Promise<AgreementPageResult> {
    const decision = await this.require(context, "list"); if (!decision.scopeId) throw new AgreementApplicationError("PERMISSION_DENIED", "Agreement scope is unavailable.");
    if (context.principal.kind !== "account") throw new AgreementApplicationError("AUTHENTICATION_REQUIRED", "Sign in to continue.");
    const agreementIds = await this.repository.listActiveAgreementIds(context.principal.accountId);
    let page; try { page = await this.repository.list({ ...command, scope: { accountId: context.principal.accountId, scopeId: decision.scopeId, agreementIds }, now: this.clock().toISOString() }); } catch { throw new AgreementApplicationError("INVALID_REQUEST", "The pagination cursor is invalid or expired."); }
    const data = await Promise.all(page.items.map(async (item) => this.resource(item, (await this.access.authorize(context, "update", item)).allowed)));
    return { data, page: { nextCursor: page.nextCursor, hasMore: page.hasMore } };
  }
  async update(context: RequestContext, command: UpdateAgreementCommand): Promise<{ resource: AgreementResource; replayed: boolean }> {
    await this.require(context, "update"); const current = await this.repository.getById(command.agreementId);
    if (!current) throw new AgreementApplicationError("RESOURCE_NOT_FOUND", "The requested resource was not found.");
    const decision = await this.access.authorize(context, "update", current); if (!decision.allowed) throw new AgreementApplicationError("RESOURCE_NOT_FOUND", "The requested resource was not found.");
    if (current.lifecycleState === "accepted" || !["draft", "proposed"].includes(current.currentDocument.versionState)) throw new AgreementApplicationError("INVALID_REQUEST", "Accepted or closed agreement terms cannot be changed through this draft endpoint.");
    const now = this.clock().toISOString(); const versionId = this.ids("version");
    const next: AgreementLanguageDocument = { ...structuredClone(command.content), agreementId: current.agreementId, agreementVersion: current.currentDocument.agreementVersion + 1, versionId, previousVersionId: current.currentVersionId, versionState: current.currentDocument.versionState, createdAt: now, createdByPartyId: current.currentDocument.createdByPartyId };
    const amendment = evaluateAmendment(current.currentDocument, next); next.amendmentKind = amendment.material ? "material" : "cosmetic"; this.validate(next);
    const audit = this.audit(context, "agreement.version.created", current.agreementId, versionId, current.currentVersionId, now, amendment.material ? "Created a material draft version; renewed acceptance would be required." : "Created a non-material draft version.");
    const result = await this.repository.saveNextVersion(current.agreementId, next, { expectedCurrentVersionId: command.expectedVersionId }, this.metadata(context, "update", audit, command, current.agreementId));
    if (result.kind === "not_found") throw new AgreementApplicationError("RESOURCE_NOT_FOUND", "The requested resource was not found.");
    if (result.kind === "idempotency_conflict") throw new AgreementApplicationError("IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used for a different request.");
    if (result.kind === "version_conflict") throw new AgreementApplicationError("VERSION_PRECONDITION_FAILED", "The agreement changed before this update was saved. Fetch the current version and review the differences.", { expectedVersionId: command.expectedVersionId, currentVersionId: result.currentVersionId });
    if (result.kind === "saved") await this.observability?.mutationCommitted({ action: "update", agreementId: result.aggregate.agreementId, requestId: context.requestId });
    return { resource: this.resource(result.aggregate, true), replayed: result.kind === "replayed" };
  }
}
