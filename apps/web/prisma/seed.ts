import { PrismaClient } from "@prisma/client";
import { seedSimulatedExecutionQaAgreement } from "./seed-simulated-execution-qa.ts";

const prisma = new PrismaClient();
const stamp = new Date("2026-08-06T00:00:00.000Z");
const accounts = [
  { id: "account-alex", profileId: "alex", displayName: "Alex", primaryEmail: "alex@local.invalid" },
  { id: "account-jordan", profileId: "jordan", displayName: "Jordan", primaryEmail: "jordan@local.invalid" },
];

try {
  for (const account of accounts) {
    await prisma.account.upsert({ where: { id: account.id }, update: { state: "active", displayName: account.displayName, primaryEmail: account.primaryEmail, updatedAt: stamp }, create: { id: account.id, state: "active", displayName: account.displayName, primaryEmail: account.primaryEmail, createdAt: stamp, updatedAt: stamp } });
    await prisma.localAuthProfile.upsert({ where: { profileId: account.profileId }, update: { accountId: account.id }, create: { profileId: account.profileId, accountId: account.id, createdAt: stamp } });
  }
  await seedSimulatedExecutionQaAgreement(prisma);
} finally {
  await prisma.$disconnect();
}
