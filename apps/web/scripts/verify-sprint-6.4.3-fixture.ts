import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { SIMULATED_EXECUTION_QA_AGREEMENT_ID, SIMULATED_EXECUTION_QA_EVIDENCE_REVISION_ID, SIMULATED_EXECUTION_QA_EVIDENCE_SET_DIGEST, SIMULATED_EXECUTION_QA_VERSION_ID } from "../prisma/seed-simulated-execution-qa.ts";
import { evidenceSetDigest, requirementState } from "../server/evidence/domain.ts";
import { PrismaWorkflowRepository } from "../server/evidence/prisma-repository.ts";

export const SPRINT_6_4_3_DOCUMENT_DIGEST = "f26350692fd589e6fae693a161278d7708c778f93b64a54a1aba20355b7720cf";

export async function verifySprint643Fixture(prisma: PrismaClient) {
  const persisted = await prisma.agreement.findUnique({ where: { id: SIMULATED_EXECUTION_QA_AGREEMENT_ID }, include: { acceptances: true, evidenceSets: { include: { members: true } } } });
  assert.ok(persisted, "Sprint 6.4.3 agreement is missing; run pnpm db:seed (not pnpm prisma db seed).");
  assert.equal(persisted.currentVersionId, SIMULATED_EXECUTION_QA_VERSION_ID);
  assert.equal(persisted.lifecycleState, "accepted");
  assert.deepEqual(persisted.acceptances.filter((item) => item.versionId === SIMULATED_EXECUTION_QA_VERSION_ID).map((item) => item.partyId).sort(), ["qa-party-alex", "qa-party-jordan"]);

  const repository = new PrismaWorkflowRepository(prisma);
  const agreement = await repository.agreement(SIMULATED_EXECUTION_QA_AGREEMENT_ID, SIMULATED_EXECUTION_QA_VERSION_ID);
  assert.ok(agreement);
  assert.equal(agreement.document.versionState, "accepted");
  const documentDigest = createHash("sha256").update(JSON.stringify(agreement.document)).digest("hex");
  assert.equal(documentDigest, SPRINT_6_4_3_DOCUMENT_DIGEST);

  const items = (await repository.listEvidence(SIMULATED_EXECUTION_QA_AGREEMENT_ID, SIMULATED_EXECUTION_QA_VERSION_ID)).filter((item) => item.lifecycle === "active");
  assert.equal(items.length, 1);
  const revisions = items.map((item) => item.currentRevision);
  assert.deepEqual(revisions.map((item) => item.evidenceRevisionId), [SIMULATED_EXECUTION_QA_EVIDENCE_REVISION_ID]);
  assert.ok(revisions.every((item) => item.sourceRefKind === "fixture" && item.availability === "available" && item.validation === "valid"));
  assert.ok(agreement.document.evidencePolicy.evidenceRequirements.every((item) => item.sensitivity === "standard"));
  for (const requirement of agreement.document.evidencePolicy.evidenceRequirements) {
    assert.equal(requirementState(items.filter((item) => item.evidenceRequirementId === requirement.evidenceRequirementId).map((item) => item.currentRevision), requirement.minimumDistinctSources, requirement.independentSourcesRequired).state, "satisfied_for_assessment");
  }
  const canonical = evidenceSetDigest(SIMULATED_EXECUTION_QA_AGREEMENT_ID, SIMULATED_EXECUTION_QA_VERSION_ID, revisions.map((item) => item.evidenceRevisionId));
  assert.equal(canonical.digest, SIMULATED_EXECUTION_QA_EVIDENCE_SET_DIGEST);
  const frozenSet = persisted.evidenceSets.find((item) => item.id === "evidence-set-simulated-qa");
  assert.ok(frozenSet);
  assert.equal(frozenSet.canonicalizationVersion, "evidence-set-v1");
  assert.equal(frozenSet.digest, SIMULATED_EXECUTION_QA_EVIDENCE_SET_DIGEST);
  assert.deepEqual(frozenSet.members.map((item) => item.evidenceRevisionId), [SIMULATED_EXECUTION_QA_EVIDENCE_REVISION_ID]);
  return { agreementId: SIMULATED_EXECUTION_QA_AGREEMENT_ID, versionId: SIMULATED_EXECUTION_QA_VERSION_ID, documentDigest, evidenceSetDigest: canonical.digest, acceptanceCount: 2, evidenceRevisionIds: canonical.ordered };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prisma = new PrismaClient();
  try { console.log(JSON.stringify(await verifySprint643Fixture(prisma))); }
  finally { await prisma.$disconnect(); }
}
