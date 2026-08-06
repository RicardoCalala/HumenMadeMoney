import { getPrismaClient } from "../persistence/prisma-client.ts";
import { ResolutionService } from "./service.ts";
const state = globalThis as typeof globalThis & { __hmmResolutionService?: ResolutionService };
export const resolutionService = state.__hmmResolutionService ??= new ResolutionService(getPrismaClient());
