import { DevelopmentAgreementAccessPolicy } from "./application/access-policy.ts";
import { AgreementService } from "./application/service.ts";
import { InMemoryAgreementRepository } from "./persistence/in-memory-repository.ts";

const repository = new InMemoryAgreementRepository();
const ids = (kind: "agreement" | "version" | "audit") => `${kind}-${crypto.randomUUID()}`;
/** Development-only process-local composition. Data is disposable and does not coordinate across workers. */
export const agreementService = new AgreementService(repository, new DevelopmentAgreementAccessPolicy(), () => new Date(), ids);
