import assert from "node:assert/strict";
import test, { after } from "node:test";
import { PrismaClient } from "@prisma/client";
import { seedSimulatedExecutionQaAgreement, SIMULATED_EXECUTION_QA_AGREEMENT_ID, SIMULATED_EXECUTION_QA_VERSION_ID } from "../../prisma/seed-simulated-execution-qa.ts";
import { ResolutionError, ResolutionService } from "../../server/resolution/service.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const contract = databaseUrl ? test : test.skip;
const prisma = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : null;
after(async () => { await prisma?.$disconnect(); });

contract("persisted terminal resolution rejects orchestration and direct mutations while its ledger remains balanced", async () => {
  await prisma!.$executeRawUnsafe('TRUNCATE TABLE "accounts", "agreements" RESTART IDENTITY CASCADE');
  const stamp = new Date("2026-08-06T00:00:00.000Z");
  for (const id of ["account-alex", "account-jordan"]) await prisma!.account.create({ data: { id, state: "active", displayName: id, primaryEmail: `${id}@local.invalid`, createdAt: stamp, updatedAt: stamp } });
  await seedSimulatedExecutionQaAgreement(prisma!);
  const context = { principal: { kind: "account" as const, accountId: "account-alex", sessionId: "terminal-regression", accountState: "active" as const, assurance: "development" as const }, requestId: "terminal-regression", correlationId: "terminal-regression", source: "test" as const };
  const service = new ResolutionService(prisma!, () => stamp);
  const proposed = await service.propose(context, SIMULATED_EXECUTION_QA_AGREEMENT_ID, { versionId: SIMULATED_EXECUTION_QA_VERSION_ID, resolutionOutcomeId: "qa-complete", evidenceSetId: "evidence-set-simulated-qa", assessmentId: "assessment-simulated-qa", proposalSource: "deterministic_assessment", simulatedEffect: { kind: "simulated_value", amountMinor: 2500, currency: "CAD", sourceEconomicSideId: "qa-side-jordan", destinationEconomicSideId: "qa-side-alex", destinationRef: "simulated-destination-alex" } }, { key: "terminal-propose", fingerprint: "terminal-propose" });
  const granted = await service.grant(context, SIMULATED_EXECUTION_QA_AGREEMENT_ID, proposed.resource.id, { key: "terminal-grant", fingerprint: "terminal-grant", expectedRevision: proposed.resource.revision });
  const executed = await service.execute(context, SIMULATED_EXECUTION_QA_AGREEMENT_ID, proposed.resource.id, { key: "terminal-execute", fingerprint: "terminal-execute", expectedRevision: granted.resource.revision });
  assert.equal(executed.resource.state, "simulated_executed");
  const before = { revision: executed.resource.revision, audits: await prisma!.resolutionAuditEvent.count({ where: { proposalId: proposed.resource.id } }), entries: await prisma!.simulatedLedgerEntry.findMany({ where: { transaction: { execution: { proposalId: proposed.resource.id } } }, orderBy: { id: "asc" } }) };
  await assert.rejects(() => service.cancel(context, SIMULATED_EXECUTION_QA_AGREEMENT_ID, proposed.resource.id, { key: "terminal-cancel", fingerprint: "terminal-cancel", expectedRevision: before.revision }), (error: unknown) => error instanceof ResolutionError && error.code === "PROPOSAL_TERMINAL");
  await assert.rejects(() => prisma!.proposedResolution.update({ where: { id: proposed.resource.id }, data: { revision: { increment: 1 } } }), /terminal resolution records are immutable/i);
  await assert.rejects(() => prisma!.simulatedLedgerEntry.update({ where: { id: before.entries[0]!.id }, data: { amountMinor: -1 } }), /append-only/i);
  const afterRecord = await prisma!.proposedResolution.findUniqueOrThrow({ where: { id: proposed.resource.id } }); const afterEntries = await prisma!.simulatedLedgerEntry.findMany({ where: { transaction: { execution: { proposalId: proposed.resource.id } } }, orderBy: { id: "asc" } });
  assert.equal(afterRecord.state, "simulated_executed"); assert.equal(afterRecord.revision, before.revision); assert.equal(await prisma!.resolutionAuditEvent.count({ where: { proposalId: proposed.resource.id } }), before.audits); assert.deepEqual(afterEntries, before.entries); assert.equal(afterEntries.reduce((sum, entry) => sum + entry.amountMinor, 0), 0);
});
