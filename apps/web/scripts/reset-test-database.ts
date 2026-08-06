import { PrismaClient } from "@prisma/client";

const rawUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!rawUrl) throw new Error("TEST_DATABASE_URL is required.");
const url = new URL(rawUrl);
const database = url.pathname.slice(1);
const localHost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
if (!localHost || !/(^|_)(test|local)(_|$)/i.test(database)) throw new Error("Refusing reset: the database must be local and its name must contain test or local as a distinct segment.");
const prisma = new PrismaClient({ datasources: { db: { url: rawUrl } } });
try {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "agreement_acceptances", "audit_records", "idempotency_records", "agreement_memberships", "agreement_version_parties", "agreement_versions", "agreements", "sessions", "local_auth_profiles", "accounts" RESTART IDENTITY CASCADE');
} finally {
  await prisma.$disconnect();
}
