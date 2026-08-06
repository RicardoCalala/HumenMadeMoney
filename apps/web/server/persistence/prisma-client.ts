import { PrismaClient } from "@prisma/client";

const globalPrisma = globalThis as typeof globalThis & { __hmmPrisma?: PrismaClient };

export function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required when HMM_PERSISTENCE_ADAPTER=prisma.");
}

export function selectPersistenceAdapter(environment = process.env.NODE_ENV, configured = process.env.HMM_PERSISTENCE_ADAPTER) {
  const selected = configured ?? (environment === "production" ? "unset" : "in_memory");
  if (environment === "production" && selected !== "prisma") throw new Error("Production requires an approved durable persistence adapter.");
  if (selected !== "in_memory" && selected !== "prisma") throw new Error("HMM_PERSISTENCE_ADAPTER must be in_memory or prisma.");
  return selected;
}

export function getPrismaClient() {
  requireDatabaseUrl();
  return globalPrisma.__hmmPrisma ??= new PrismaClient();
}
