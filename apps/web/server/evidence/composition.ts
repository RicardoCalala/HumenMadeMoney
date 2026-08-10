import { selectPersistenceAdapter, getPrismaClient } from "../persistence/prisma-client.ts";
import { EvidenceAssessmentService } from "./service.ts";
import { InMemoryWorkflowRepository } from "./in-memory-repository.ts";
import { PrismaWorkflowRepository } from "./prisma-repository.ts";
import { DevelopmentAssessmentProviderSelector } from "./development-provider.ts";
const create = () => { const repository = selectPersistenceAdapter() === "prisma" ? new PrismaWorkflowRepository(getPrismaClient()) : new InMemoryWorkflowRepository(); return { repository, service: new EvidenceAssessmentService(repository, () => new Date(), (kind) => `${kind}-${crypto.randomUUID()}`, new DevelopmentAssessmentProviderSelector()) }; };
const state = globalThis as typeof globalThis & { __hmmEvidenceWorkflow?: ReturnType<typeof create> };
export const { repository: evidenceWorkflowRepository, service: evidenceAssessmentService } = state.__hmmEvidenceWorkflow ??= create();
