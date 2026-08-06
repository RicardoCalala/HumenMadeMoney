import assert from "node:assert/strict";
import test from "node:test";
import { DevelopmentAgreementAccessPolicy } from "../server/agreements/application/access-policy.ts";
import type { CreateAgreementContent, RequestContext } from "../server/agreements/application/contracts.ts";
import { AgreementApplicationError } from "../server/agreements/application/errors.ts";
import { AgreementService } from "../server/agreements/application/service.ts";
import { InMemoryAgreementRepository } from "../server/agreements/persistence/in-memory-repository.ts";
import { fingerprint, parseCreateBody, parseListQuery } from "../server/agreements/transport/runtime-validation.ts";
import { errorResponse, parseIfMatch, readJson } from "../server/agreements/transport/http.ts";
import { agreementResourceToSprint51 } from "../lib/agreements/api-adapter.ts";
import { GET as listRoute, POST as createRoute } from "../app/api/v1/agreements/route.ts";
import { GET as readRoute, PATCH as updateRoute } from "../app/api/v1/agreements/[agreementId]/route.ts";

const contentFixture = (): CreateAgreementContent => ({
  schemaVersion: "1.0", economicSides: [],
  purpose: { title: "Share a clear commitment", description: "A development agreement.", plainLanguageSummary: "The participants will review a shared commitment." },
  parties: [{ partyId: "party-demo", partyType: "person", displayName: "Demo Person", roles: ["creator"], responsibilityObligationIds: [], acceptanceRequired: true }],
  terms: { obligations: [], conditions: [], successCriteria: [], deadlines: [] }, evidencePolicy: { evidenceRequirements: [], sourceConstraints: [] },
  verificationPolicy: { criterionIds: [], aggregation: "manual", policyVersion: "verification-1", missingEvidenceResult: "indeterminate", conflictingEvidenceResult: "indeterminate", mandatoryReviewTriggers: ["version_or_authority_unproven"], reviewRoute: "Request review from an authorized human." },
  protectionPolicy: { mode: "none" }, authorizationPolicy: { requirements: [], aiMayAuthorize: false },
  resolutionPolicy: { outcomes: [], reviewWindowSeconds: 86400, cancellation: { beforeAcceptance: "creator_may_withdraw", afterAcceptance: "required_party_consent", eligibleInitiatorPartyIds: ["party-demo"] }, maxAppeals: 1 },
  privacyPolicy: { defaultEvidenceVisibility: "participants_and_authorized_reviewers", privateEvidenceTrainingUse: false },
  financialSafetyPolicy: { initialState: "clear", hooks: [], complianceHoldOverridesTimers: true },
});
const context: RequestContext = { actorId: "demo-actor", requestId: "request-1", correlationId: "correlation-1", source: "test" };
function harness() { let sequence = 0; const repository = new InMemoryAgreementRepository(); const service = new AgreementService(repository, new DevelopmentAgreementAccessPolicy(), () => new Date("2026-08-06T18:00:00Z"), (kind) => `${kind}-${++sequence}`); return { repository, service }; }

test("application service creates, reads, lists, and appends immutable draft versions", async () => {
  const { repository, service } = harness(); const content = contentFixture(); const created = await service.create(context, { content });
  assert.equal(created.resource.document.agreementVersion, 1); assert.equal(created.resource.document.createdByPartyId, "party-demo");
  const read = await service.get(context, created.resource.agreementId); assert.equal(read.currentVersionId, created.resource.currentVersionId);
  const page = await service.list(context, { limit: 20 }); assert.equal(page.data.length, 1); assert.equal(page.page.hasMore, false);
  const nextContent = contentFixture(); nextContent.purpose.title = "A clearer commitment";
  const updated = await service.update(context, { agreementId: created.resource.agreementId, expectedVersionId: created.resource.currentVersionId, content: nextContent });
  assert.equal(updated.resource.document.agreementVersion, 2); assert.equal(updated.resource.document.previousVersionId, created.resource.currentVersionId); assert.equal(repository.getVersionsForTest(created.resource.agreementId).length, 2); assert.equal(created.resource.document.purpose.title, "Share a clear commitment");
});

test("repository mutations combine compare-and-swap, idempotency, and one audit record", async () => {
  const { repository, service } = harness(); const content = contentFixture(); const requestFingerprint = fingerprint("create", content);
  const first = await service.create(context, { content, idempotency: { key: "create-1", requestFingerprint } });
  const replay = await service.create(context, { content, idempotency: { key: "create-1", requestFingerprint } }); assert.equal(replay.replayed, true); assert.equal(replay.resource.agreementId, first.resource.agreementId); assert.equal(repository.getAuditRecordsForTest().length, 1);
  await assert.rejects(() => service.create(context, { content: { ...content, purpose: { ...content.purpose, title: "Different" } }, idempotency: { key: "create-1", requestFingerprint: "different" } }), (error: unknown) => error instanceof AgreementApplicationError && error.code === "IDEMPOTENCY_KEY_REUSED");
  await assert.rejects(() => service.update(context, { agreementId: first.resource.agreementId, expectedVersionId: "stale-version", content }), (error: unknown) => error instanceof AgreementApplicationError && error.code === "VERSION_PRECONDITION_FAILED");
  assert.equal(repository.getVersionsForTest(first.resource.agreementId).length, 1); assert.equal(repository.getAuditRecordsForTest().length, 1);
});

test("repository contract clones values and binds cursors to filters and actor scope", async () => {
  const { service } = harness(); const created = await service.create(context, { content: contentFixture() }); await service.create(context, { content: { ...contentFixture(), purpose: { ...contentFixture().purpose, title: "Second" } } }); created.resource.document.purpose.title = "Mutated outside";
  assert.equal((await service.get(context, created.resource.agreementId)).document.purpose.title, "Share a clear commitment");
  const firstPage = await service.list(context, { limit: 1 }); assert.equal(firstPage.data.length, 1); assert.equal(firstPage.page.hasMore, true); assert.ok(firstPage.page.nextCursor);
  const secondPage = await service.list(context, { limit: 1, cursor: firstPage.page.nextCursor! }); assert.equal(secondPage.data.length, 1); assert.notEqual(secondPage.data[0]!.agreementId, firstPage.data[0]!.agreementId);
  await assert.rejects(() => service.list(context, { limit: 1, cursor: `${firstPage.page.nextCursor}x` }), /cursor/); await assert.rejects(() => service.list(context, { limit: 1, cursor: firstPage.page.nextCursor!, lifecycleState: "accepted" }), /cursor/);
  assert.throws(() => parseListQuery(new URL("https://example.test/api/v1/agreements?limit=101")), /limit/);
  assert.throws(() => parseListQuery(new URL("https://example.test/api/v1/agreements?sort=title")), /unsupported filter/);
});

test("transport rejects malformed bodies and returns non-sensitive structured errors", async () => {
  await assert.rejects(() => readJson(new Request("https://example.test", { method: "POST", body: "{}", headers: { "content-type": "text/plain" } })), (error: unknown) => error instanceof AgreementApplicationError && error.code === "UNSUPPORTED_MEDIA_TYPE");
  assert.throws(() => parseCreateBody({ ...contentFixture(), agreementId: "client-owned" }), /server-owned/); assert.throws(() => parseIfMatch("unquoted"), /quoted/);
  const response = errorResponse(new Error("database secret"), context); const body = await response.json(); assert.equal(response.status, 500); assert.equal(body.error.code, "INTERNAL_ERROR"); assert.doesNotMatch(JSON.stringify(body), /database secret/);
});

test("API resources stay on the one-way canonical-to-Sprint-5.1 compatibility path", async () => {
  const { service } = harness(); const resource = (await service.create(context, { content: contentFixture() })).resource;
  const view = agreementResourceToSprint51(resource, { status: "draft", currentUserPartyId: "party-demo", updatedAt: resource.updatedAt, acceptances: [], evidence: [], audit: [], financialSafetyState: "clear", nextAction: "Review the draft." });
  assert.equal(view.id, resource.agreementId); assert.equal(view.funding.isSimulated, true); assert.match(view.funding.explanation, /non-financial/i);
});

test("route handlers enforce JSON, ETags, preconditions, pagination envelopes, and safe status codes", async () => {
  const createRequest = new Request("https://example.test/api/v1/agreements", { method: "POST", headers: { "content-type": "application/json", "idempotency-key": "route-create-1" }, body: JSON.stringify(contentFixture()) });
  const createdResponse = await createRoute(createRequest); const created = await createdResponse.json(); assert.equal(createdResponse.status, 201); assert.equal(createdResponse.headers.get("etag"), `"${created.currentVersionId}"`);
  const listedResponse = await listRoute(new Request("https://example.test/api/v1/agreements?limit=10")); const listed = await listedResponse.json(); assert.equal(listedResponse.status, 200); assert.ok(Array.isArray(listed.data)); assert.equal(typeof listed.page.hasMore, "boolean");
  const readResponse = await readRoute(new Request(`https://example.test/api/v1/agreements/${created.agreementId}`), { params: Promise.resolve({ agreementId: created.agreementId }) }); assert.equal(readResponse.status, 200); assert.equal(readResponse.headers.get("etag"), `"${created.currentVersionId}"`);
  const missingPrecondition = await updateRoute(new Request(`https://example.test/api/v1/agreements/${created.agreementId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: contentFixture() }) }), { params: Promise.resolve({ agreementId: created.agreementId }) }); assert.equal(missingPrecondition.status, 428);
  const next = contentFixture(); next.purpose.title = "Updated through the API";
  const updatedResponse = await updateRoute(new Request(`https://example.test/api/v1/agreements/${created.agreementId}`, { method: "PATCH", headers: { "content-type": "application/json", "if-match": `"${created.currentVersionId}"`, "idempotency-key": "route-update-1" }, body: JSON.stringify({ content: next }) }), { params: Promise.resolve({ agreementId: created.agreementId }) }); const updated = await updatedResponse.json(); assert.equal(updatedResponse.status, 200); assert.equal(updated.document.agreementVersion, 2);
  const staleResponse = await updateRoute(new Request(`https://example.test/api/v1/agreements/${created.agreementId}`, { method: "PATCH", headers: { "content-type": "application/json", "if-match": `"${created.currentVersionId}"` }, body: JSON.stringify({ content: next }) }), { params: Promise.resolve({ agreementId: created.agreementId }) }); const stale = await staleResponse.json(); assert.equal(staleResponse.status, 412); assert.equal(stale.error.code, "VERSION_PRECONDITION_FAILED");
});
