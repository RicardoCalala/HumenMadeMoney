import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { parseAiProviderConfig } from "../server/evidence/ai-config.ts";
import { evidenceSetDigest, requirementState } from "../server/evidence/domain.ts";
import { PrismaWorkflowRepository } from "../server/evidence/prisma-repository.ts";
import { buildSmokeAuthorizationSnapshot, createSmokeAuthorization } from "../server/evidence/smoke-authorization.ts";

const argument = (name: string) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; };
if (!process.argv.includes("--synthetic-only")) throw new Error("The explicit --synthetic-only argument is required.");
const inspectOnly = process.argv.includes("--inspect-only");
const path = argument("--record"); const projectLabel = argument("--project-label"); const expiresAt = argument("--expires-at"); const agreementId = argument("--agreement-id"); const versionId = argument("--version-id"); const fixtureId = argument("--fixture-id");
if (!path || !projectLabel || (!inspectOnly && !expiresAt) || !agreementId || !versionId || !fixtureId) throw new Error("--record, --project-label, --agreement-id, --version-id, and --fixture-id are required; creation also requires --expires-at.");
if (process.env.HMM_AI_BROWSER_AUTHORIZATION_RECORD !== path || process.env.HMM_AI_NON_SECRET_PROJECT_LABEL !== projectLabel || process.env.HMM_AI_BROWSER_FIXTURE_ID !== fixtureId) throw new Error("Authorization arguments must exactly match the server-side browser authorization environment.");

const prisma = new PrismaClient();
try {
  const repository = new PrismaWorkflowRepository(prisma); const agreement = await repository.agreement(agreementId, versionId);
  if (!agreement || agreement.document.versionState !== "accepted") throw new Error("The exact accepted fixture version was not found.");
  const items = (await repository.listEvidence(agreementId, versionId)).filter((item) => item.lifecycle === "active"); const evidence = items.map((item) => item.currentRevision);
  if (!evidence.length || evidence.some((item) => item.sourceRefKind !== "fixture" || item.availability !== "available" || item.validation !== "valid")) throw new Error("Every active evidence revision must be a valid, available fixture.");
  if (agreement.document.evidencePolicy.evidenceRequirements.some((item) => item.sensitivity !== "standard")) throw new Error("Every evidence requirement must be standard sensitivity.");
  const canonical = evidenceSetDigest(agreementId, versionId, evidence.map((item) => item.evidenceRevisionId));
  const states = new Map(agreement.document.evidencePolicy.evidenceRequirements.map((requirement) => [requirement.evidenceRequirementId, requirementState(items.filter((item) => item.evidenceRequirementId === requirement.evidenceRequirementId).map((item) => item.currentRevision), requirement.minimumDistinctSources, requirement.independentSourcesRequired).state]));
  const input = { document: agreement.document, documentDigest: createHash("sha256").update(JSON.stringify(agreement.document)).digest("hex"), evidenceSetId: "browser-authorization-preview", evidenceSetDigest: canonical.digest, evidenceCanonicalizationVersion: "evidence-set-v1" as const, evidence, requirementStates: states };
  const config = parseAiProviderConfig(process.env); const productEnvelope = { input, uiEnabled: process.env.HMM_AI_ASSESSMENT_UI_ENABLED, credentialEnvironment: process.env.HMM_AI_CREDENTIAL_ENVIRONMENT, dataClassification: process.env.HMM_AI_DATA_CLASSIFICATION };
  const snapshot = buildSmokeAuthorizationSnapshot(config, projectLabel, fixtureId, productEnvelope);
  if (inspectOnly) console.log(JSON.stringify({ mode: "inspect-only", agreementId, versionId, documentDigest: input.documentDigest, evidenceSetDigest: input.evidenceSetDigest, configDigest: snapshot.configDigest, fixtureDigest: snapshot.fixtureDigest, recordPath: path }));
  else { const record = await createSmokeAuthorization(path, snapshot, expiresAt!); console.log(JSON.stringify({ authorizationId: record.authorizationId, attemptId: record.attemptId, status: record.status, authorizedAt: record.authorizedAt, expiresAt: record.expiresAt, recordVersion: record.recordVersion, agreementId, versionId, documentDigest: input.documentDigest, evidenceSetDigest: input.evidenceSetDigest, configDigest: record.configDigest, fixtureDigest: record.fixtureDigest, recordPath: path })); }
} finally { await prisma.$disconnect(); }
