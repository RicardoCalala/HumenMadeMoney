import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { aggregateOrientationValidation } from "../server/evaluation/orientation-validation.ts";
import {
  ACCESS_MATRIX,
  ROLE_CODES,
  ROLE_CUSTODY_VERSIONS,
  STORAGE_CLASSES,
  a01PrecontactGate,
  appendLedgerRecord,
  authorizeAccess,
  canonicalizeReadiness,
  confirmLedgerHead,
  evaluateCollectiveReadiness,
  runSyntheticRestoreSimulation,
  scorerCalibrationGate,
  sealLedgerRecord,
  sealRoleAssignment,
  sealRetentionPolicy,
  sealTopology,
  validateHolds,
  validateCollectiveReadinessRecord,
  validateLedgerChain,
  validateRestoreEvidence,
  validateRetentionPolicy,
  validateRoleAssignment,
  validateRoleEligibility,
  validateSeparation,
  validateTopology,
  type ConditionalCombination,
  type CustodyTopology,
  type HoldRecord,
  type LedgerEvent,
  type Permission,
  type ReadinessCandidate,
  type RetentionPolicy,
  type RoleAssignment,
  type RoleCode,
  type RoleEligibilityAttestation,
  type StorageClass,
} from "../server/evaluation/role-custody-readiness.ts";

const digest = (value: unknown) => createHash("sha256").update(typeof value === "string" ? value : canonicalizeReadiness(value)).digest("hex");
const uuid = (number: number) => `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`;
const evaluatedAt = "2026-08-14T12:00:00.000Z";
const validUntil = "2026-09-14T12:00:00.000Z";
const roleAliases: Record<RoleCode, string[]> = {
  SCR: ["TST-SCR-SCORER001", "TST-SCR-SCORER002"], ADJ: ["TST-ADJ-ADJUDCTR1"], OPR: ["TST-OPR-HMM00001"], ADM: ["TST-ADM-ADMIN0001"], KEY: ["TST-KEY-CUSTODIAN1"], REC: ["TST-REC-RECORDER01"], PRV: ["TST-PRV-PRIVACY001"], RCV: ["TST-RCV-RECOVERY01"], HDR: ["TST-HDR-HEADREC001"],
};
const attestations = (role: Exclude<RoleCode, "SCR">) => Object.fromEntries(Array.from({ length: ({ KEY: 12, REC: 12, PRV: 12, RCV: 12, HDR: 10, ADJ: 8, OPR: 6, ADM: 6 } as const)[role] }, (_, index) => [`${role}-${String(index + 1).padStart(2, "0")}`, true])) as Record<string, true>;

const eligibility = (role: Exclude<RoleCode, "SCR">): RoleEligibilityAttestation => ({
  recordType: "role_eligibility_attestation", schemaVersion: ROLE_CUSTODY_VERSIONS.eligibility, protocolVersion: ROLE_CUSTODY_VERSIONS.protocol, eligibilityRecordId: uuid(100 + ROLE_CODES.indexOf(role)), role, candidateReferenceDigest: digest(`candidate-${role}`), attestedAt: "2026-08-14T09:00:00.000Z", validUntil, verifiedAt: "2026-08-14T10:00:00.000Z", verifierAlias: "TST-ADM-ADMIN0001", attestations: attestations(role), outcome: "eligible", reasonCodes: [], noAccessGranted: true, participantCountersChanged: 0, releaseReviewersChanged: 0, genuineReleaseReviewsChanged: 0, hmmStatus: "not_qualified", testOnly: true,
});

const assignments = (): RoleAssignment[] => {
  let number = 1;
  return ROLE_CODES.flatMap((role) => roleAliases[role].map((alias) => { const current = number++; return sealRoleAssignment({ recordType: "role_assignment", schemaVersion: ROLE_CUSTODY_VERSIONS.assignment, protocolVersion: ROLE_CUSTODY_VERSIONS.protocol, assignmentId: uuid(current), role, alias, mappingRecordDigest: digest(`person-${current}`), eligibilityDigest: digest(`eligibility-${current}`), accessProfileDigest: digest(`access-${current}`), founderApprovalDigest: digest(`approval-${current}`), assignedAt: "2026-08-14T10:00:00.000Z", validFrom: "2026-08-14T11:00:00.000Z", validUntil, status: "active", accessEnabled: true, revocationReasonCode: null, revokedAt: null, testOnly: true }); }));
};

const topology = (): CustodyTopology => {
  const controller: Record<StorageClass, string> = { IDMAP: "TST-PRV-PRIVACY001", RAW: "TST-PRV-PRIVACY001", LEDGER: "TST-ADM-ADMIN0001", CAL: "TST-ADM-ADMIN0001", PRES: "TST-ADM-ADMIN0001", KEYS: "TST-KEY-CUSTODIAN1", BACKUP: "TST-RCV-RECOVERY01", INC: "TST-PRV-PRIVACY001" };
  return sealTopology({ recordType: "custody_topology", schemaVersion: ROLE_CUSTODY_VERSIONS.topology, protocolVersion: ROLE_CUSTODY_VERSIONS.protocol, topologyId: uuid(200), approvedAt: "2026-08-14T10:00:00.000Z", validUntil, compartments: STORAGE_CLASSES.map((kind, index) => ({ class: kind, locationRef: `LOC-TST${String(index).padStart(12, "0")}`, controllerAlias: controller[kind], administratorAlias: controller[kind], storageTypeCode: kind === "LEDGER" ? "append_only_store" : kind === "BACKUP" ? "offline_encrypted_backup" : kind === "INC" ? "restricted_case_store" : "encrypted_file_store", encryptionEvidenceDigest: digest(`${kind}-encryption`), authenticationEvidenceDigest: digest(`${kind}-auth`), accessListDigest: digest(`${kind}-access`), loggingEvidenceDigest: digest(`${kind}-logging`), retentionPolicyDigest: digest(`${kind}-retention`), deletionTriggerCode: "bounded_policy_trigger", backupCovered: kind !== "BACKUP", separatelyControlled: true })), primaryBackupControllerSeparated: true, identityAliasSeparatelyControlled: true, rawEncrypted: true, ledgerMinimizedAppendOnly: true, keyPresentationSeparatelyControlled: true, incidentEvidenceIsolatedMinimized: true, noGitOrProductionLocations: true, noSecretValues: true, testOnly: true });
};

const retention = (): RetentionPolicy => sealRetentionPolicy({
  recordType: "retention_policy", schemaVersion: ROLE_CUSTODY_VERSIONS.retention, policyId: uuid(300), effectiveAt: "2026-08-14T10:00:00.000Z", validUntil,
  rules: [
    { class: "IDMAP", triggerCode: "sprint_6_5_qualification_closure", daysAfterTrigger: 90, prerequisites: ["incident_closed"] },
    { class: "ROLE_MAPPING", triggerCode: "last_operational_need", daysAfterTrigger: 90, prerequisites: ["incident_closed"] },
    { class: "RAW", triggerCode: "validation_closure", daysAfterTrigger: 90, prerequisites: ["scoring_complete"] },
    { class: "CAL", triggerCode: "validation_closure", daysAfterTrigger: 90, prerequisites: ["calibration_complete"] },
    { class: "PRES", triggerCode: "calibration_closure", daysAfterTrigger: 90, prerequisites: ["calibration_complete"] },
    { class: "KEYS", triggerCode: "calibration_closure", daysAfterTrigger: 90, prerequisites: ["calibration_complete"] },
    { class: "INC", triggerCode: "incident_closure", daysAfterTrigger: 180, prerequisites: ["disposition_complete"] },
    { class: "LEDGER", triggerCode: "study_closure", daysAfterTrigger: 365, prerequisites: ["head_confirmed"] },
    { class: "BACKUP", triggerCode: "earliest_source_trigger", daysAfterTrigger: 1, prerequisites: ["deletion_verified"] },
    { class: "AGGREGATE_REPORT", triggerCode: "study_closure", daysAfterTrigger: 365, prerequisites: ["head_confirmed"] },
    { class: "ARTIFACT_MANIFEST", triggerCode: "study_closure", daysAfterTrigger: 365, prerequisites: ["head_confirmed"] },
    { class: "HEAD_CONFIRMATION", triggerCode: "study_closure", daysAfterTrigger: 365, prerequisites: ["head_confirmed"] },
  ], backupDeletionPropagationHours: 24, deletionExecutorAlias: "TST-RCV-RECOVERY01", deletionVerifierAlias: "TST-PRV-PRIVACY001", testOnly: true,
});

const candidate = (): ReadinessCandidate => {
  const approvedTopology = topology();
  const restoreEvidence = runSyntheticRestoreSimulation({ restoreId: uuid(400), startedAt: "2026-08-14T10:30:00.000Z", completedAt: "2026-08-14T10:31:00.000Z", validUntil, recoveryOwnerAlias: "TST-RCV-RECOVERY01", independentVerifierAlias: "TST-HDR-HEADREC001", topologyDigest: approvedTopology.topologyDigest, records: [{ recordType: "synthetic", alias: "TST-OPR-HMM00001" }], sourceHeadDigest: digest("synthetic-head"), coveredClasses: ["IDMAP", "RAW", "LEDGER", "CAL", "PRES", "KEYS", "INC"], targetInitiallyEmpty: true, permissionProfileMatches: true });
  const controls = Object.fromEntries(["roleCoverage", "separation", "accessControl", "identityMapping", "encryptedRawStorage", "minimizedLedger", "calibrationEvidence", "restrictedPresentationCustody", "keyCustody", "backupCustody", "syntheticRestore", "appendOnlyChain", "correctionSemantics", "independentHead", "retentionDeletion", "holdProcedure", "incidentRoute", "offlineValidation", "zeroNetwork", "noQualificationEffect"].map((name) => [name, { status: "PASS", evidenceDigest: digest(name), verifiedAt: "2026-08-14T11:00:00.000Z", validUntil, verifierAlias: "TST-HDR-HEADREC001" }])) as ReadinessCandidate["controls"];
  return { recordId: uuid(500), evaluatedAt, expiresAt: validUntil, implementationCommit: "a".repeat(40), governanceHead: "b".repeat(40), artifactEnvelopeDigest: digest("envelope"), topology: approvedTopology, assignments: assignments(), conditionalCombinations: [], controls, restoreEvidence, retentionPolicy: retention(), holds: [], founderApproval: { status: "APPROVED", checkpointDigest: digest("checkpoint"), decisionReceiptDigest: digest("decision"), approvedAt: "2026-08-14T11:30:00.000Z", validUntil }, openIncidents: [], conflictingEvidence: [], staleEvidence: [], participantCounters: { contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }, releaseGate: { reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" }, previousDigest: "GENESIS:role-custody-readiness-v1", testOnly: true };
};

test("role eligibility profiles are exact, closed, current, and do not grant access", () => {
  for (const role of ["KEY", "REC", "PRV", "RCV", "HDR", "ADJ", "OPR", "ADM"] as const) assert.equal(validateRoleEligibility(eligibility(role), "test", evaluatedAt), true, role);
  const missing = structuredClone(eligibility("KEY")); delete missing.attestations["KEY-12"]; assert.equal(validateRoleEligibility(missing, "test", evaluatedAt), false);
  const falseItem = structuredClone(eligibility("REC")) as unknown as { attestations: Record<string, boolean> }; falseItem.attestations["REC-01"] = false; assert.equal(validateRoleEligibility(falseItem, "test", evaluatedAt), false);
  const leaked = { ...eligibility("PRV"), name: "not admitted" }; assert.equal(validateRoleEligibility(leaked, "test", evaluatedAt), false);
  assert.equal(validateRoleEligibility({ ...eligibility("RCV"), validUntil: evaluatedAt }, "test", evaluatedAt), false);
  assert.equal(validateRoleEligibility({ ...eligibility("HDR"), outcome: "uncertain" }, "test", evaluatedAt), false);
});

test("aliases are role-scoped and assigned only in valid, active assignment records", () => {
  for (const assignment of assignments()) assert.equal(validateRoleAssignment(assignment, "test", evaluatedAt), true, assignment.role);
  const wrong = assignments()[0]!; const changed = { ...wrong, alias: "TST-KEY-CUSTODIAN1" }; assert.equal(validateRoleAssignment(changed, "test", evaluatedAt), false);
  const disabled = sealRoleAssignment({ ...Object.fromEntries(Object.entries(wrong).filter(([key]) => key !== "assignmentDigest")) as Omit<RoleAssignment, "assignmentDigest">, status: "approved_disabled", accessEnabled: false }); assert.equal(validateRoleAssignment(disabled, "test", evaluatedAt), false);
});

test("the complete separation matrix rejects every unapproved overlap and admits only C1, C2, and C4 with proof", () => {
  const base = assignments(); assert.deepEqual(validateSeparation(base, [], evaluatedAt), []);
  const allowed: Record<string, ConditionalCombination["rationaleCode"]> = { "ADM+OPR": "mechanical_administration", "KEY+PRV": "compartmented_privacy_key", "HDR+REC": "read_only_recorder_witness" };
  for (let left = 0; left < ROLE_CODES.length; left++) for (let right = left + 1; right < ROLE_CODES.length; right++) {
    const a = ROLE_CODES[left]!; const b = ROLE_CODES[right]!; const modified = assignments(); const first = modified.find((item) => item.role === a)!; const secondIndex = modified.findIndex((item) => item.role === b); modified[secondIndex] = sealRoleAssignment({ ...Object.fromEntries(Object.entries(modified[secondIndex]!).filter(([key]) => key !== "assignmentDigest")) as Omit<RoleAssignment, "assignmentDigest">, mappingRecordDigest: first.mappingRecordDigest });
    const key = [a, b].sort().join("+"); const rationaleCode = allowed[key]; const combination = rationaleCode ? [{ roles: [a, b] as [RoleCode, RoleCode], founderDecisionDigest: digest("founder"), rationaleCode, compartmentProofDigest: digest("proof"), validUntil }] : [];
    assert.equal(validateSeparation(modified, combination, evaluatedAt).length === 0, Boolean(rationaleCode), key);
  }
  const concentrated = assignments(); concentrated[1] = sealRoleAssignment({ ...Object.fromEntries(Object.entries(concentrated[1]!).filter(([key]) => key !== "assignmentDigest")) as Omit<RoleAssignment, "assignmentDigest">, mappingRecordDigest: concentrated[0]!.mappingRecordDigest }); assert.ok(validateSeparation(concentrated, [], evaluatedAt).includes("scorers_not_distinct"));
});

test("least-privilege access denies every unlisted cell, stale scope, missing log, and unproved privacy content access", () => {
  for (const role of [...ROLE_CODES, "PARTICIPANT", "FOUNDER"] as const) for (const kind of STORAGE_CLASSES) for (const permission of ["R", "A", "M", "X"] as Permission[]) {
    const expected = (ACCESS_MATRIX[role][kind] as readonly Permission[]).includes(permission);
    assert.equal(authorizeAccess({ role, class: kind, permission, assignmentActive: true, withinScope: true, logged: true }), expected, `${role}:${kind}:${permission}`);
  }
  assert.equal(authorizeAccess({ role: "KEY", class: "KEYS", permission: "R", assignmentActive: false, withinScope: true, logged: true }), false);
  assert.equal(authorizeAccess({ role: "PRV", class: "RAW", permission: "R", assignmentActive: true, withinScope: true, logged: true }), false);
  assert.equal(authorizeAccess({ role: "PRV", class: "RAW", permission: "R", assignmentActive: true, withinScope: true, logged: true, privacyIncidentException: { necessityDigest: digest("necessity"), founderOrEmergencyApprovalDigest: digest("approval"), twoPersonAccess: true, postAccessReviewRequired: true } }), true);
});

test("opaque topology validates exact compartments and rejects real paths, controller concentration, or missing class", () => {
  assert.equal(validateTopology(topology(), "test", evaluatedAt), true);
  const path = structuredClone(topology()) as unknown as { compartments: { locationRef: string }[] }; path.compartments[0]!.locationRef = "/private/study"; assert.equal(validateTopology(path, "test", evaluatedAt), false);
  const missing = structuredClone(topology()); missing.compartments.pop(); assert.equal(validateTopology(missing, "test", evaluatedAt), false);
  const same = structuredClone(topology()); same.compartments.find((item) => item.class === "BACKUP")!.controllerAlias = same.compartments.find((item) => item.class === "RAW")!.controllerAlias; assert.equal(validateTopology(same, "test", evaluatedAt), false);
});

test("synthetic encrypted split-control restore is exact, isolated, non-overwriting, and cleaned up", () => {
  const good = candidate().restoreEvidence; assert.equal(validateRestoreEvidence(good, "test", evaluatedAt), true); assert.equal(good.networkRequests, 0); assert.equal(good.syntheticOrEmptyOnly, true);
  const bad = runSyntheticRestoreSimulation({ restoreId: uuid(401), startedAt: "2026-08-14T10:30:00.000Z", completedAt: "2026-08-14T10:31:00.000Z", validUntil, recoveryOwnerAlias: "TST-RCV-RECOVERY01", independentVerifierAlias: "TST-HDR-HEADREC001", topologyDigest: digest("topology"), records: [], sourceHeadDigest: digest("head"), coveredClasses: [], targetInitiallyEmpty: false, permissionProfileMatches: true }); assert.equal(bad.status, "BLOCKED"); assert.equal(validateRestoreEvidence(bad, "test", evaluatedAt), false);
});

test("append-only chain rejects stale append/replay/tamper and supports linked non-overwriting corrections", () => {
  const event: LedgerEvent = { recordType: "role_event", schemaVersion: ROLE_CUSTODY_VERSIONS.ledger, recordId: uuid(600), occurredAt: evaluatedAt, actorAlias: "TST-REC-RECORDER01", eventCode: "role_verified", sourceDigests: [digest("source")], incidentId: null, testOnly: true };
  const first = sealLedgerRecord(event); const correction = { recordType: "correction" as const, schemaVersion: ROLE_CUSTODY_VERSIONS.ledger, recordId: uuid(601), occurredAt: evaluatedAt, actorAlias: "TST-REC-RECORDER01", targetRecordId: first.recordId, targetRecordDigest: first.recordDigest, reasonCode: "closed_field_error", correctedClosedFields: { eventCode: "role_reverified" }, authorizationDigest: digest("authorization"), rawSourceDigestUnchanged: true as const, incidentId: null, testOnly: true };
  const chain = appendLedgerRecord([first], correction, first.recordDigest); assert.deepEqual(validateLedgerChain(chain), { valid: true, head: chain[1]!.recordDigest, reasonCodes: [] }); assert.equal(chain[0], first);
  assert.throws(() => appendLedgerRecord(chain, { ...event, recordId: uuid(602) }, first.recordDigest), /stale_or_concurrent_head/); assert.throws(() => appendLedgerRecord(chain, event, chain[1]!.recordDigest), /duplicate_or_replay/);
  const tampered = structuredClone(chain); (tampered[0] as LedgerEvent & { recordDigest: string }).eventCode = "silently_changed"; assert.equal(validateLedgerChain(tampered).valid, false);
  const favorable = appendLedgerRecord([first], { ...correction, recordId: uuid(603), correctedClosedFields: { outcome: "eligible" } }, first.recordDigest); assert.ok(validateLedgerChain(favorable).reasonCodes.includes("unverifiable_or_favorable_correction"));
  const confirmation = confirmLedgerHead(chain, { recordType: "final_head_confirmation", schemaVersion: ROLE_CUSTODY_VERSIONS.ledger, confirmationId: uuid(604), recorderAlias: "TST-HDR-HEADREC001", observedAt: evaluatedAt, genesis: "GENESIS:role-custody-ledger-v1", recordCount: chain.length, recomputedHead: chain[1]!.recordDigest, expectedHead: chain[1]!.recordDigest, correctionSummaryDigest: digest("corrections"), incidentSummaryDigest: digest("incidents"), previousConfirmationDigest: null, testOnly: true }); assert.equal(confirmation.status, "confirmed");
});

test("retention is bounded, identity mapping defaults to 90 days after qualification closure, and holds cannot silently expire", () => {
  assert.deepEqual(validateRetentionPolicy(retention(), evaluatedAt), []);
  const unbounded = structuredClone(retention()); unbounded.rules.find((rule) => rule.class === "LEDGER")!.triggerCode = "indefinite"; assert.ok(validateRetentionPolicy(unbounded, evaluatedAt).includes("unbounded_retention_rule"));
  const wrongIdentity = structuredClone(retention()); wrongIdentity.rules.find((rule) => rule.class === "IDMAP")!.daysAfterTrigger = 91; assert.ok(validateRetentionPolicy(wrongIdentity, evaluatedAt).includes("identity_alias_default_not_90_days_after_qualification_closure"));
  const hold: HoldRecord = { recordType: "retention_hold", schemaVersion: ROLE_CUSTODY_VERSIONS.retention, holdId: uuid(700), scope: ["IDMAP"], reasonCode: "documented_necessity", ownerAlias: "TST-PRV-PRIVACY001", approvingAuthorityAlias: "TST-OPR-HMM00001", startedAt: "2026-08-01T00:00:00.000Z", nextReviewAt: "2026-08-20T00:00:00.000Z", releaseDeletionTrigger: "matter_resolved", affectedDigests: [digest("affected")], accessListDigest: digest("hold-access"), status: "active", releasedAt: null, testOnly: true }; assert.deepEqual(validateHolds([hold], evaluatedAt), []); assert.ok(validateHolds([{ ...hold, nextReviewAt: "2026-08-10T00:00:00.000Z" }], evaluatedAt).includes("expired_unreviewed_hold"));
});

test("collective readiness is deterministic, binary, founder-gated, expiring, and incident-sensitive", () => {
  const allPass = candidate(); const first = evaluateCollectiveReadiness(allPass); const second = evaluateCollectiveReadiness(structuredClone(allPass)); assert.deepEqual(first, second); assert.equal(first.decision, "READY"); assert.equal(validateCollectiveReadinessRecord(first, "test", evaluatedAt), true); assert.equal(first.calibrationAuthorized, true); assert.equal(first.a01ContactAuthorized, false); assert.equal(first.hmmStatus, "not_qualified");
  const noApproval = candidate(); noApproval.founderApproval = null; const blocked = evaluateCollectiveReadiness(noApproval); assert.equal(blocked.decision, "BLOCKED"); assert.ok(blocked.reasonCodes.includes("final_founder_checkpoint_not_approved")); assert.equal(scorerCalibrationGate(blocked).authorized, false);
  for (const name of Object.keys(allPass.controls) as (keyof typeof allPass.controls)[]) { const failed = candidate(); failed.controls[name] = { ...failed.controls[name], status: "UNCERTAIN" }; assert.equal(evaluateCollectiveReadiness(failed).decision, "BLOCKED", name); }
  const incident = candidate(); incident.previousDigest = first.recordDigest; incident.recordId = uuid(501); incident.openIncidents = ["INC-TST-001"]; const postReady = evaluateCollectiveReadiness(incident); assert.equal(postReady.decision, "BLOCKED"); assert.equal(postReady.previousDigest, first.recordDigest);
});

test("READY opens scorer calibration only; A-01 still requires two distinct scorer passes and every pre-contact gate", () => {
  const ready = evaluateCollectiveReadiness(candidate()); assert.equal(scorerCalibrationGate(ready).authorized, true); assert.equal(ready.a01ContactAuthorized, false);
  assert.equal(a01PrecontactGate({ readiness: ready, scorerPassDigests: [digest("scr-1")], allVersionedPrecontactGatesPass: true, noRelevantChangeOrIncident: true }).authorized, false);
  assert.equal(a01PrecontactGate({ readiness: ready, scorerPassDigests: [digest("scr-1"), digest("scr-2")], allVersionedPrecontactGatesPass: true, noRelevantChangeOrIncident: true }).authorized, true);
});

test("role, custody, restore, and readiness evidence is structurally excluded from HMM qualification", () => {
  const readiness = evaluateCollectiveReadiness(candidate()); const report = aggregateOrientationValidation([readiness, eligibility("KEY"), candidate().restoreEvidence], "test"); assert.equal(report.validationStatus, "not_qualified"); assert.equal(report.cohort.contacted, 0); assert.equal(report.cohort.enrolled, 0); assert.equal(report.hmmStatus, "not_qualified"); assert.equal(report.integrity.rejectedRecordIds.length, 3);
});

test("all versioned JSON contracts are closed, parseable, and prohibit sensitive operational fields", async () => {
  const root = resolve(process.cwd(), "tests/fixtures/ai-evaluation/role-custody-readiness"); const names = ["role-eligibility-schema-v1.json", "role-assignment-schema-v1.json", "custody-topology-schema-v1.json", "backup-restore-evidence-schema-v1.json", "ledger-record-schema-v1.json", "retention-hold-schema-v1.json", "readiness-evidence-schema-v1.json", "collective-readiness-schema-v1.json"];
  for (const name of names) { const schema = JSON.parse(await readFile(resolve(root, name), "utf8")) as Record<string, unknown>; assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema"); assert.ok(schema.$id); assert.match(JSON.stringify(schema), /additionalProperties/); }
  const source = await readFile(resolve(process.cwd(), "server/evaluation/role-custody-readiness.ts"), "utf8"); assert.doesNotMatch(source, /process\.env|fetch\(|XMLHttpRequest|WebSocket|DATABASE_URL|OPENAI_API_KEY|from ["'](?:openai|@openai|.*prisma)/); assert.match(source, /networkRequests: 0/);
});
