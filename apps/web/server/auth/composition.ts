import { InMemoryAccountRepository, InMemorySessionRepository } from "./in-memory.ts";
import { PrismaAccountRepository, PrismaSessionRepository } from "./prisma.ts";
import { getPrismaClient, selectPersistenceAdapter } from "../persistence/prisma-client.ts";
import { AuthenticationService } from "./service.ts";
const mode = process.env.HMM_AUTH_MODE ?? (process.env.NODE_ENV === "production" ? "disabled" : "local_development");
const persistence = selectPersistenceAdapter();
export function assertAuthModeAllowed(environment: string | undefined, selectedMode: string) { if (selectedMode === "local_development" && environment === "production") throw new Error("Local development authentication cannot run in production."); }
assertAuthModeAllowed(process.env.NODE_ENV, mode);
const stamp = "2026-08-06T00:00:00.000Z";
export const developmentProfiles = mode === "local_development" ? [{ profileId: "alex", displayName: "Alex (local profile)" }, { profileId: "jordan", displayName: "Jordan (local profile)" }] : [];
function createDevelopmentAuthentication() {
  const memoryAccounts = new InMemoryAccountRepository([
    { accountId: "account-alex", state: "active", displayName: "Alex", primaryEmail: "alex@local.invalid", createdAt: stamp, updatedAt: stamp },
    { accountId: "account-jordan", state: "active", displayName: "Jordan", primaryEmail: "jordan@local.invalid", createdAt: stamp, updatedAt: stamp },
  ], new Map([["alex", "account-alex"], ["jordan", "account-jordan"]]));
  const client = persistence === "prisma" ? getPrismaClient() : undefined;
  const accountRepository = client ? new PrismaAccountRepository(client) : memoryAccounts;
  const sessionRepository = client ? new PrismaSessionRepository(client) : new InMemorySessionRepository();
  return { accountRepository, sessionRepository, authenticationService: new AuthenticationService(accountRepository, sessionRepository) };
}
const globalAuthentication = globalThis as typeof globalThis & { __hmmDevelopmentAuthentication?: ReturnType<typeof createDevelopmentAuthentication> };
const developmentAuthentication = globalAuthentication.__hmmDevelopmentAuthentication ??= createDevelopmentAuthentication();
export const { accountRepository, sessionRepository, authenticationService } = developmentAuthentication;
export const creatorPartyByAccount = new Map([["account-alex", "party-demo"], ["account-jordan", "party-jordan"]]);
export const localAuthenticationEnabled = mode === "local_development";
