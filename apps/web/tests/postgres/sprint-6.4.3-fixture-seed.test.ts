import assert from "node:assert/strict";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { seedSimulatedExecutionQaAgreement } from "../../prisma/seed-simulated-execution-qa.ts";
import { SPRINT_6_4_3_DOCUMENT_DIGEST, verifySprint643Fixture } from "../../scripts/verify-sprint-6.4.3-fixture.ts";

const databaseUrl = process.env.TEST_DATABASE_URL;
const contract = databaseUrl ? test : test.skip;
const prisma = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : null;

contract("the idempotent seed creates the exact accepted Sprint 6.4.3 authorization fixture", async () => {
  const stamp = new Date("2026-08-06T00:00:00.000Z");
  for (const account of [
    { id: "account-alex", profileId: "alex", displayName: "Alex", primaryEmail: "alex@local.invalid" },
    { id: "account-jordan", profileId: "jordan", displayName: "Jordan", primaryEmail: "jordan@local.invalid" },
  ]) {
    await prisma!.account.upsert({ where: { id: account.id }, update: {}, create: { id: account.id, state: "active", displayName: account.displayName, primaryEmail: account.primaryEmail, createdAt: stamp, updatedAt: stamp } });
    await prisma!.localAuthProfile.upsert({ where: { profileId: account.profileId }, update: { accountId: account.id }, create: { profileId: account.profileId, accountId: account.id, createdAt: stamp } });
  }
  await seedSimulatedExecutionQaAgreement(prisma!);
  const first = await verifySprint643Fixture(prisma!);
  await seedSimulatedExecutionQaAgreement(prisma!);
  const second = await verifySprint643Fixture(prisma!);
  assert.deepEqual(second, first);
  assert.equal(first.documentDigest, SPRINT_6_4_3_DOCUMENT_DIGEST);
});

test.after(async () => prisma?.$disconnect());
