import assert from "node:assert/strict";
import test, { after, beforeEach } from "node:test";
import { PrismaClient } from "@prisma/client";
import type { AgreementLanguageDocument, AuditRecord } from "../../lib/agreement-language/types.ts";
import type { AgreementAggregate, AgreementMembership } from "../../server/agreements/application/contracts.ts";
import { PrismaAgreementRepository } from "../../server/agreements/persistence/prisma-repository.ts";
import { PrismaAccountRepository, PrismaSessionRepository } from "../../server/auth/prisma.ts";
import { DeterministicAssessmentAdapter } from "../../server/evidence/adapter.ts";
import { PrismaWorkflowRepository } from "../../server/evidence/prisma-repository.ts";
import { EvidenceAssessmentService } from "../../server/evidence/service.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const contract = databaseUrl ? test : test.skip;
const prisma = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : null;
process.env.HMM_CURSOR_SIGNING_SECRET ??= "postgres-contract-test-signing-secret-only";
const stamp = "2026-08-06T18:00:00.000Z";

const document = (agreementId = "agreement-1", versionId = "version-1", agreementVersion = 1, previousVersionId?: string): AgreementLanguageDocument => ({
  schemaVersion: "1.0", agreementId, agreementVersion, versionId, ...(previousVersionId ? { previousVersionId } : {}), versionState: "draft", ...(agreementVersion > 1 ? { amendmentKind: "cosmetic" as const } : {}), createdAt: new Date(new Date(stamp).getTime() + agreementVersion - 1).toISOString(), createdByPartyId: "party-alex",
  purpose: { title: `Agreement ${agreementVersion}`, description: "Synthetic persistence contract fixture.", plainLanguageSummary: "Alex will review this synthetic local agreement." },
  parties: [{ partyId: "party-alex", partyType: "person", displayName: "Alex", roles: ["creator"], responsibilityObligationIds: [], acceptanceRequired: true }],
  economicSides: [], terms: { obligations: [], conditions: [], successCriteria: [], deadlines: [] }, evidencePolicy: { evidenceRequirements: [], sourceConstraints: [] },
  verificationPolicy: { criterionIds: [], aggregation: "manual", policyVersion: "verification-1", missingEvidenceResult: "indeterminate", conflictingEvidenceResult: "indeterminate", mandatoryReviewTriggers: ["version_or_authority_unproven"], reviewRoute: "Request review from an authorized human." },
  protectionPolicy: { mode: "none" }, authorizationPolicy: { requirements: [], aiMayAuthorize: false }, resolutionPolicy: { outcomes: [], reviewWindowSeconds: 86400, cancellation: { beforeAcceptance: "creator_may_withdraw", afterAcceptance: "required_party_consent", eligibleInitiatorPartyIds: ["party-alex"] }, maxAppeals: 1 }, privacyPolicy: { defaultEvidenceVisibility: "participants_and_authorized_reviewers", privateEvidenceTrainingUse: false }, financialSafetyPolicy: { initialState: "clear", hooks: [], complianceHoldOverridesTimers: true },
});
const aggregate = (): AgreementAggregate => ({ agreementId: "agreement-1", currentVersionId: "version-1", lifecycleState: "draft", currentDocument: document(), createdAt: stamp, updatedAt: stamp, provenance: { createdByActorId: "account-alex", lastChangedByActorId: "account-alex", correlationId: "correlation-1", source: "api" } });
const owner: AgreementMembership = { agreementId: "agreement-1", accountId: "account-alex", partyId: "party-alex", role: "owner", state: "active", createdAt: stamp, createdByAccountId: "account-alex", activatedAt: stamp };
const audit = (eventId: string, versionId: string): AuditRecord => ({ eventId, agreementId: "agreement-1", versionId, actorType: "participant", actorId: "account-alex", action: "agreement.version.created", occurredAt: stamp, recordedAt: stamp, correlationId: "correlation-1", sourceSystem: "postgres-contract-test", relatedObjectIds: [versionId], explanation: "Synthetic contract event." });
const metadata = (operation: "create" | "update", key: string, fingerprint: string, versionId: string) => ({ idempotency: { scope: { actorId: "account-alex", operation, ...(operation === "update" ? { agreementId: "agreement-1" } : {}) }, key, requestFingerprint: fingerprint }, audit: audit(`audit-${key}`, versionId), ...(operation === "create" ? { ownerMembership: owner } : {}) });

beforeEach(async () => {
  if (!prisma) return;
  await prisma!.$executeRawUnsafe('TRUNCATE TABLE "agreement_acceptances", "audit_records", "idempotency_records", "agreement_memberships", "agreement_version_parties", "agreement_versions", "agreements", "sessions", "local_auth_profiles", "accounts" RESTART IDENTITY CASCADE');
  await prisma!.account.create({ data: { id: "account-alex", state: "active", displayName: "Alex", primaryEmail: "alex@local.invalid", createdAt: new Date(stamp), updatedAt: new Date(stamp), localProfiles: { create: { profileId: "alex", createdAt: new Date(stamp) } } } });
});
after(async () => { await prisma?.$disconnect(); });

contract("agreement transaction survives a new client and replays a digested idempotency key", async () => {
  const repository = new PrismaAgreementRepository(prisma!); const created = await repository.create(aggregate(), metadata("create", "raw-secret-key", "fingerprint-1", "version-1")); assert.equal(created.kind, "created");
  assert.equal(await prisma!.agreementVersion.count(), 1); assert.equal(await prisma!.agreementMembership.count({ where: { role: "owner", state: "active" } }), 1); assert.equal(await prisma!.auditRecord.count(), 1);
  const stored = await prisma!.idempotencyRecord.findFirstOrThrow(); assert.notEqual(stored.keyDigest, "raw-secret-key"); assert.doesNotMatch(JSON.stringify(stored), /raw-secret-key/);
  const restartedClient = new PrismaClient({ datasources: { db: { url: databaseUrl! } } }); const restarted = new PrismaAgreementRepository(restartedClient); const replay = await restarted.create(aggregate(), metadata("create", "raw-secret-key", "fingerprint-1", "version-1")); assert.equal(replay.kind, "replayed"); await restartedClient.$disconnect();
  const conflict = await repository.create(aggregate(), metadata("create", "raw-secret-key", "different", "version-1")); assert.equal(conflict.kind, "idempotency_conflict");
});

contract("compare-and-swap permits one concurrent successor and preserves keyset ordering", async () => {
  const repository = new PrismaAgreementRepository(prisma!); await repository.create(aggregate(), metadata("create", "create-cas", "create", "version-1"));
  const [left, right] = await Promise.all([repository.saveNextVersion("agreement-1", document("agreement-1", "version-2a", 2, "version-1"), { expectedCurrentVersionId: "version-1" }, metadata("update", "update-a", "a", "version-2a")), repository.saveNextVersion("agreement-1", document("agreement-1", "version-2b", 2, "version-1"), { expectedCurrentVersionId: "version-1" }, metadata("update", "update-b", "b", "version-2b"))]);
  assert.deepEqual([left.kind, right.kind].sort(), ["saved", "version_conflict"]); assert.equal(await prisma!.agreementVersion.count(), 2); assert.equal(await prisma!.auditRecord.count(), 2); assert.equal(await prisma!.idempotencyRecord.count(), 2);
  const page = await repository.list({ scope: { accountId: "account-alex", scopeId: "scope", agreementIds: ["agreement-1"] }, limit: 1, now: stamp, protectionMode: "none" }); assert.equal(page.items.length, 1); assert.equal(page.items[0]!.currentDocument.protectionPolicy.mode, "none");
});

contract("account and digest-only session adapters preserve terminal session state", async () => {
  const accounts = new PrismaAccountRepository(prisma!); assert.equal((await accounts.findByLocalProfile("alex"))?.accountId, "account-alex");
  const sessions = new PrismaSessionRepository(prisma!); const session = { sessionId: "session-1", accountId: "account-alex", tokenDigest: "digest-only", csrfDigest: "csrf-digest-only", state: "active" as const, assurance: "development" as const, createdAt: stamp, lastSeenAt: stamp, idleExpiresAt: "2026-08-06T18:30:00.000Z", absoluteExpiresAt: "2026-08-07T02:00:00.000Z", rotation: 0 };
  await sessions.create(session); assert.equal((await sessions.findByDigest("digest-only"))?.state, "active"); await sessions.revoke("session-1", "2026-08-06T18:01:00.000Z"); await sessions.update({ ...session, idleExpiresAt: "2026-08-06T19:00:00.000Z" }); assert.equal((await sessions.findByDigest("digest-only"))?.state, "revoked");
});

contract("evidence workflow persists exact snapshots, CAS revisions, and immutable history", async () => {
  const agreementRepository = new PrismaAgreementRepository(prisma!); await agreementRepository.create(aggregate(), metadata("create", "workflow-create", "workflow-create", "version-1"));
  const accepted = document(); accepted.versionState = "accepted"; accepted.evidencePolicy = { sourceConstraints: [{ sourceConstraintId: "fixture-source", category: "synthetic", retrievalMethod: "participant_submission", permittedFields: ["result"], participantConfirmationRequired: true }], evidenceRequirements: [{ evidenceRequirementId: "requirement-1", criterionIds: ["criterion-1"], importance: "required", evidenceClass: "participant_claim", submitterPartyIds: ["party-alex"], sourceConstraintIds: ["fixture-source"], minimumDistinctSources: 1, independentSourcesRequired: false, visibility: "participants", sensitivity: "standard", onMissing: "request_evidence", onConflict: "request_human_review" }] }; accepted.terms.successCriteria = [{ criterionId: "criterion-1", statement: "Synthetic result is true.", evaluationMode: "deterministic", conditionIds: [], evidenceRequirementIds: ["requirement-1"], allowedResults: ["satisfied", "not_satisfied", "indeterminate"] }]; accepted.verificationPolicy = { ...accepted.verificationPolicy, criterionIds: ["criterion-1"], aggregation: "all_required" };
  await prisma!.agreementVersion.update({ where: { id: "version-1" }, data: { versionState: "accepted", document: accepted as never } }); await prisma!.agreement.update({ where: { id: "agreement-1" }, data: { lifecycleState: "accepted" } }); await prisma!.agreementAcceptance.create({ data: { id: "acceptance-1", agreementId: "agreement-1", versionId: "version-1", partyId: "party-alex", acceptedAt: new Date(stamp), consentContext: "synthetic", assuranceContext: "development", accountId: "account-alex", recordedAt: new Date(stamp), correlationId: "correlation-acceptance" } });
  let sequence = 0; const workflow = new PrismaWorkflowRepository(prisma!); const service = new EvidenceAssessmentService(workflow, () => new Date(stamp), (kind) => `${kind}-pg-${++sequence}`); const context = { principal: { kind: "account" as const, accountId: "account-alex", sessionId: "session-test", accountState: "active" as const, assurance: "development" as const }, requestId: "request", correlationId: "correlation", source: "test" as const };
  const input = { agreementId: "agreement-1", versionId: "version-1", evidenceRequirementId: "requirement-1", criterionIds: ["criterion-1"], sourceConstraintId: "fixture-source", sourceRefKind: "fixture" as const, sourceRef: "fixture-result", capturedAt: stamp, evidenceClass: "participant_claim" as const, origin: "participant" as const, integrity: "verified" as const, metadata: { result: true } };
  const submitted = await service.submitEvidence(context, input, "submit-key", "submit-fingerprint"); const replay = await service.submitEvidence(context, input, "submit-key", "submit-fingerprint"); assert.equal(replay.kind, "replayed"); assert.notEqual((await prisma!.idempotencyRecord.findFirstOrThrow({ where: { operation: "submit_evidence" } })).keyDigest, "submit-key");
  const corrected = await service.correctEvidence(context, "agreement-1", submitted.resource.evidenceId, 1, { ...input, criterionIds: ["criterion-1"], sourceRef: "fixture-correction", metadata: { result: true } }, "correct-key", "correct-fingerprint"); assert.equal(corrected.resource.revision, 2); assert.equal(await prisma!.evidenceRevision.count(), 2);
  const assessment = await service.requestAssessment(context, "agreement-1", "version-1", new DeterministicAssessmentAdapter(), "assessment-key", "assessment-fingerprint"); assert.equal(assessment.resource.criterionFindings[0]?.result, "satisfied"); assert.equal(await prisma!.evidenceSetMember.count(), 1);
  await assert.rejects(() => prisma!.evidenceRevision.update({ where: { id: submitted.resource.currentRevisionId }, data: { sourceDisplayLabel: "mutated" } }), /immutable workflow history/i);
});
