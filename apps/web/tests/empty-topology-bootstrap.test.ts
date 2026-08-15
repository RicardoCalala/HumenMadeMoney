import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { BOOTSTRAP_STORAGE_CLASSES, EMPTY_BOOTSTRAP_RETENTION_RULES, containsProhibitedBootstrapFields, evaluateBootstrapCollectiveReadinessV3, runOperationalEmptyBootstrap, validateEmptyBootstrapEvidence, type EmptyBootstrapEvidence } from "../server/evaluation/empty-topology-bootstrap.ts";

const root = resolve(process.cwd(), "../..");
const d = (value: string) => createHash("sha256").update(value).digest("hex");
let evidence: EmptyBootstrapEvidence;
let privateRoot: string;
test.before(async () => {
  privateRoot = await mkdtemp(resolve(root, ".hmm-private-test-"));
  await rm(privateRoot, { recursive: true });
  evidence = await runOperationalEmptyBootstrap({ projectRoot: root, privateRoot, implementationCommit: "a".repeat(40), gitIgnored: true });
});
test.after(async () => { await rm(privateRoot, { recursive: true, force: true }); });

test("operational bootstrap creates eight final-empty restricted compartments and a separate backup boundary", async () => {
  assert.equal(validateEmptyBootstrapEvidence(evidence), true);
  assert.deepEqual(evidence.compartments.map(({ class: kind }) => kind), BOOTSTRAP_STORAGE_CLASSES);
  assert.equal(new Set(evidence.compartments.map(({ locationRef }) => locationRef)).size, 8);
  assert.notEqual(evidence.boundaries.primaryLocationRef, evidence.boundaries.backupLocationRef);
  for (const kind of BOOTSTRAP_STORAGE_CLASSES) {
    const base = kind === "BACKUP" ? "backup-control" : "primary-control";
    const path = resolve(privateRoot, base, kind);
    assert.deepEqual(await readdir(path), []);
    assert.equal((await stat(path)).mode & 0o777, 0o700);
  }
});
test("closed evidence rejects prohibited identity alias contact response key fixture and secret fields", () => {
  for (const key of ["name", "identity", "alias", "contact", "response", "keyMaterial", "fixture", "secret"]) {
    const altered = { ...evidence, [key]: "PROHIBITED" };
    assert.equal(containsProhibitedBootstrapFields(altered), true, key);
    assert.equal(validateEmptyBootstrapEvidence(altered), false, key);
  }
  const nested = structuredClone(evidence) as EmptyBootstrapEvidence & { cryptography: EmptyBootstrapEvidence["cryptography"] & { extra: boolean } };
  nested.cryptography.extra = true;
  assert.equal(validateEmptyBootstrapEvidence(nested), false);
});
test("synthetic controller labels grant no eligibility access counter release or qualification effect", () => {
  assert.ok(evidence.compartments.every(({ controllerLabel, accessDefault, accessGrantCount }) => /^SYN-BSC-/.test(controllerLabel) && accessDefault === "DENY" && accessGrantCount === 0));
  assert.equal(evidence.authority.controllersSyntheticOnly, true);
  assert.equal(evidence.authority.roleEligibilityEffect, false);
  assert.ok(Object.values(evidence.isolation).every(Boolean));
  assert.deepEqual(evidence.participantCounters, { contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 });
  assert.equal(evidence.releaseGate.hmmStatus, "not_qualified");
});
test("AES-256-GCM separation 2-of-2 recovery and secret destruction are evidenced", () => {
  assert.ok(evidence.compartments.every(({ encryptionAlgorithm, protectionEvidenceDigest }) => encryptionAlgorithm === "AES-256-GCM" && /^[a-f0-9]{64}$/.test(protectionEvidenceDigest)));
  assert.equal(new Set(evidence.compartments.map(({ protectionEvidenceDigest }) => protectionEvidenceDigest)).size, 8);
  assert.deepEqual(evidence.cryptography, { algorithm: "AES-256-GCM", keyBytes: 32, nonceBytes: 12, authenticationTagBytes: 16, distinctCompartmentKeys: true, idmapKeysBackupSeparated: true, recoveryScheme: "XOR-2-OF-2", shareAAloneRejected: true, shareBAloneRejected: true, syntheticSecretsPersisted: false, syntheticSecretsDestroyed: true });
});
test("operational backup restore is exact isolated non-overwriting permission checked zero-network and cleaned", () => {
  assert.equal(evidence.restore.status, "PASS");
  assert.equal(evidence.restore.sourceManifestDigest, evidence.restore.restoredManifestDigest);
  assert.equal(evidence.restore.sourceHeadDigest, evidence.restore.restoredHeadDigest);
  assert.equal(evidence.restore.expectedRecordCount, evidence.restore.restoredRecordCount);
  assert.equal(evidence.restore.networkRequests, 0);
  assert.ok(evidence.restore.isolatedTarget && evidence.restore.nonOverwriteVerified && evidence.restore.permissionProfileVerified && evidence.restore.exactDigestMatch && evidence.restore.cleanupVerified);
});
test("ledger correction incident head tamper rejection and cleanup pass", () => {
  assert.deepEqual(evidence.integrity, { ledgerStatus: "PASS", incidentCorrectionStatus: "PASS", chainTamperRejected: true, independentHeadDigest: evidence.restore.sourceHeadDigest, syntheticRecordsRemoved: true });
});
test("retention holds deletion verification cleanup and seven-day backup propagation are exact", () => {
  assert.deepEqual(evidence.retention.rules, EMPTY_BOOTSTRAP_RETENTION_RULES);
  assert.equal(evidence.retention.backupDeletionPropagationMaximumHours, 168);
  assert.equal(evidence.retention.holdReviewMaximumDays, 30);
  assert.equal(evidence.retention.automaticHoldRenewal, false);
  assert.equal(evidence.retention.realDeletionExecutorVerifierDistinctRequired, true);
  assert.equal(evidence.retention.bootstrapArtifactDeletion, "IMMEDIATE_AFTER_REQUIRED_EVIDENCE");
});
test("bootstrap expires at evidence completion and cannot satisfy real handoff", () => {
  assert.equal(evidence.authority.status, "EXPIRED_COMPLETE");
  assert.equal(evidence.handoff.status, "NOT_STARTED");
  assert.equal(evidence.handoff.realPrvQualified, false);
  assert.equal(evidence.handoff.realRcvQualified, false);
  assert.equal(evidence.handoff.topologyMismatchBlocks, true);
  assert.equal(evidence.handoff.bootstrapControllersIneligible, true);
});
test("v3 readiness is deterministic and remains blocked on exact real and governance blockers", () => {
  const input = { implementationCommit: "a".repeat(40), governanceHead: "b".repeat(40), artifactEnvelopeDigest: d("envelope"), bootstrapEvidence: evidence, bootstrapFounderCheckpointApproved: false, randomizedOrderCheckpointApproved: false, realRolesQualified: false, operationalHandoffRestoreVerified: false, allOtherReadinessControlsPass: false };
  const first = evaluateBootstrapCollectiveReadinessV3(input); const second = evaluateBootstrapCollectiveReadinessV3(structuredClone(input));
  assert.deepEqual(first, second);
  assert.equal(first.decision, "BLOCKED");
  assert.deepEqual(first.reasonCodes, ["empty_bootstrap_founder_checkpoint_pending", "other_collective_readiness_controls_blocked", "randomized_order_founder_checkpoint_pending", "real_human_separated_handoff_restore_absent", "real_prv_rcv_and_required_roles_not_qualified"]);
  assert.equal(first.realKeyPrvScreeningAuthorized, false); assert.equal(first.realScorerCalibrationAuthorized, false); assert.equal(first.a01ContactAuthorized, false); assert.equal(first.releaseGate.hmmStatus, "not_qualified");
});
test("bootstrap schemas are closed JSON Schema 2020-12 contracts", async () => {
  for (const name of ["empty-topology-bootstrap-evidence-schema-v1.json", "collective-readiness-schema-v3.json"]) {
    const schema = JSON.parse(await readFile(resolve(process.cwd(), "tests/fixtures/ai-evaluation/role-custody-readiness", name), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.ok(schema.$id);
    assert.equal(schema.additionalProperties, false);
  }
});
test("implementation is offline and provider and database independent", async () => {
  const source = await readFile(resolve(process.cwd(), "server/evaluation/empty-topology-bootstrap.ts"), "utf8");
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|OPENAI|API_KEY|DATABASE_URL|@prisma|from ["']openai/);
});
test("path guard fails before creating an external or declared-off-limits root", async () => {
  const external = resolve(root, "..", ".hmm-private-external");
  await assert.rejects(runOperationalEmptyBootstrap({ projectRoot: root, privateRoot: external, implementationCommit: "a".repeat(40), gitIgnored: true }), /outside_authorized_project/);
  const offLimits = resolve(root, "Documents", ".hmm-private-forbidden");
  await assert.rejects(runOperationalEmptyBootstrap({ projectRoot: root, privateRoot: offLimits, implementationCommit: "a".repeat(40), gitIgnored: true }), /off_limits/);
});
test("prospective documents preserve pending blocked zero-effect and handoff boundaries", async () => {
  const paths = ["docs/sprints/sprint-6.5.4-empty-topology-bootstrap-design-v1.md", "docs/runbooks/sprint-6.5.4-empty-topology-bootstrap-protocol-v1.md", "docs/runbooks/sprint-6.5.4-empty-topology-bootstrap-compatibility-matrix-v1.md", "docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v5.md"];
  const text = (await Promise.all(paths.map((path) => readFile(resolve(root, path), "utf8")))).join("\n");
  for (const phrase of ["EMPTY/SYNTHETIC", "BLOCKED", "NOT_QUALIFIED", "AES-256-GCM", "2-of-2", "168 hours", "real PRV", "real RCV"]) assert.match(text, new RegExp(phrase.replace("/", "\\/"), "i"), phrase);
  assert.match(text, /historical.*immutable/i);
  assert.match(text, /NO REAL KEY\+PRV SCREENING/);
});
