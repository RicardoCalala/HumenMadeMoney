import { MembershipAgreementAccessPolicy } from "./application/access-policy.ts";
import { creatorPartyByAccount } from "../auth/composition.ts";
import { AgreementService } from "./application/service.ts";
import { InMemoryAgreementRepository } from "./persistence/in-memory-repository.ts";
import { PrismaAgreementRepository } from "./persistence/prisma-repository.ts";
import { getPrismaClient, selectPersistenceAdapter } from "../persistence/prisma-client.ts";

const ids = (kind: "agreement" | "version" | "audit") => `${kind}-${crypto.randomUUID()}`;
function createDevelopmentAgreements() {
  const persistence = selectPersistenceAdapter();
  const repository = persistence === "prisma" ? new PrismaAgreementRepository(getPrismaClient()) : new InMemoryAgreementRepository();
  return { repository, agreementService: new AgreementService(repository, new MembershipAgreementAccessPolicy(repository, creatorPartyByAccount), () => new Date(), ids) };
}
const globalAgreements = globalThis as typeof globalThis & { __hmmDevelopmentAgreements?: ReturnType<typeof createDevelopmentAgreements> };
const developmentAgreements = globalAgreements.__hmmDevelopmentAgreements ??= createDevelopmentAgreements();
/** Development-only process-local composition. Data is disposable and does not coordinate across workers. */
export const { repository: agreementRepository, agreementService } = developmentAgreements;
