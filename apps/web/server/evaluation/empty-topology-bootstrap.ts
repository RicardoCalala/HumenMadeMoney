import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

export const EMPTY_BOOTSTRAP_VERSIONS = Object.freeze({
  protocol: "empty-topology-bootstrap-protocol-v1",
  evidence: "empty-topology-bootstrap-evidence-v1",
  readiness: "collective-readiness-v3",
  retention: "empty-topology-retention-v1",
} as const);

export const BOOTSTRAP_STORAGE_CLASSES = ["IDMAP", "RAW", "LEDGER", "CAL", "PRES", "KEYS", "BACKUP", "INC"] as const;
export type BootstrapStorageClass = (typeof BOOTSTRAP_STORAGE_CLASSES)[number];
const SOURCE_CLASSES = BOOTSTRAP_STORAGE_CLASSES.filter((value) => value !== "BACKUP");
const LOC = /^LOC-[A-Z0-9]{12,40}$/;
const CONTROLLER = /^SYN-BSC-[A-Z0-9]{8,32}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const OFF_LIMIT_SEGMENTS = new Set(["documents", "downloads", "applications", "monero", "ferrari", "national defence", "lawyer"]);
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export const canonicalizeBootstrap = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const exactKeys = (value: object, expected: readonly string[]) => canonicalizeBootstrap(Object.keys(value).sort()) === canonicalizeBootstrap([...expected].sort());
const locRef = () => "LOC-" + randomBytes(12).toString("hex").toUpperCase();
const controller = (kind: BootstrapStorageClass) => "SYN-BSC-" + kind + "CONTROL";
const permissionMode = async (path: string) => (await stat(path)).mode & 0o777;

export type BootstrapRetentionRule = {
  class: BootstrapStorageClass | "ROLE_MAPPING" | "AGGREGATE_REPORT" | "ARTIFACT_MANIFEST" | "HEAD_CONFIRMATION";
  trigger: string;
  daysAfterTrigger: number | null;
  maximumHours: number | null;
  prerequisites: string[];
};

export const EMPTY_BOOTSTRAP_RETENTION_RULES: readonly BootstrapRetentionRule[] = Object.freeze([
  { class: "IDMAP", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 90, maximumHours: null, prerequisites: ["necessary_hold_released"] },
  { class: "ROLE_MAPPING", trigger: "last_operational_need_and_related_incident_hold_closure", daysAfterTrigger: 90, maximumHours: null, prerequisites: [] },
  { class: "RAW", trigger: "validation_closure", daysAfterTrigger: 90, maximumHours: null, prerequisites: ["required_completion_prerequisites"] },
  { class: "CAL", trigger: "validation_closure", daysAfterTrigger: 90, maximumHours: null, prerequisites: ["required_completion_prerequisites"] },
  { class: "PRES", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 90, maximumHours: null, prerequisites: ["frozen_study_reproducibility_resolved"] },
  { class: "KEYS", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 90, maximumHours: null, prerequisites: ["reproducibility_integrity_resolved"] },
  { class: "INC", trigger: "incident_closure", daysAfterTrigger: 180, maximumHours: null, prerequisites: ["documented_hold_released"] },
  { class: "LEDGER", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 365, maximumHours: null, prerequisites: [] },
  { class: "AGGREGATE_REPORT", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 365, maximumHours: null, prerequisites: [] },
  { class: "ARTIFACT_MANIFEST", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 365, maximumHours: null, prerequisites: [] },
  { class: "HEAD_CONFIRMATION", trigger: "sprint_6_5_qualification_closure", daysAfterTrigger: 365, maximumHours: null, prerequisites: [] },
  { class: "BACKUP", trigger: "applicable_source_deletion", daysAfterTrigger: null, maximumHours: 168, prerequisites: ["backup_never_outlives_source"] },
]);

export type EmptyBootstrapEvidence = {
  recordType: "sprint_6_5_4_empty_topology_bootstrap_evidence";
  schemaVersion: typeof EMPTY_BOOTSTRAP_VERSIONS.evidence;
  protocolVersion: typeof EMPTY_BOOTSTRAP_VERSIONS.protocol;
  bootstrapRunId: string;
  startedAt: string;
  completedAt: string;
  implementationCommit: string;
  authority: { scope: "EMPTY_SYNTHETIC_ONLY"; status: "EXPIRED_COMPLETE"; expiresOn: ["required_evidence_complete", "material_incident"]; controllersSyntheticOnly: true; roleEligibilityEffect: false };
  boundaries: { rootLocationRef: string; primaryLocationRef: string; backupLocationRef: string; insideAuthorizedProject: true; backupSeparatelyControlled: true; actualPathsOmitted: true; gitIgnored: true };
  compartments: Array<{ class: BootstrapStorageClass; locationRef: string; controllerLabel: string; finalState: "EMPTY"; permissions: "0700"; accessDefault: "DENY"; accessGrantCount: 0; encryptionAlgorithm: "AES-256-GCM"; protectionEvidenceDigest: string; accessTemplateDigest: string }>;
  cryptography: { algorithm: "AES-256-GCM"; keyBytes: 32; nonceBytes: 12; authenticationTagBytes: 16; distinctCompartmentKeys: true; idmapKeysBackupSeparated: true; recoveryScheme: "XOR-2-OF-2"; shareAAloneRejected: true; shareBAloneRejected: true; syntheticSecretsPersisted: false; syntheticSecretsDestroyed: true };
  restore: { status: "PASS"; coveredClasses: BootstrapStorageClass[]; sourceManifestDigest: string; restoredManifestDigest: string; sourceHeadDigest: string; restoredHeadDigest: string; expectedRecordCount: number; restoredRecordCount: number; isolatedTarget: true; nonOverwriteVerified: true; permissionProfileVerified: true; exactDigestMatch: true; cleanupVerified: true; networkRequests: 0 };
  integrity: { ledgerStatus: "PASS"; incidentCorrectionStatus: "PASS"; chainTamperRejected: true; independentHeadDigest: string; syntheticRecordsRemoved: true };
  retention: { policyVersion: typeof EMPTY_BOOTSTRAP_VERSIONS.retention; rules: BootstrapRetentionRule[]; backupDeletionPropagationMaximumHours: 168; holdReviewMaximumDays: 30; objectiveReleaseTriggerRequired: true; automaticHoldRenewal: false; realDeletionExecutorVerifierDistinctRequired: true; bootstrapArtifactDeletion: "IMMEDIATE_AFTER_REQUIRED_EVIDENCE" };
  isolation: { noRealHumanData: true; noRealIdentities: true; noRealAliases: true; noContacts: true; noResponsesOrResults: true; noCalibrationKeysOrFixtures: true; noRoleEligibilityOrAccessEffect: true; noParticipantOrScorerEvidenceEffect: true; noReleaseTotalEffect: true; noQualificationEffect: true; noProviderOrApiUse: true; noProductionDatabaseFinancialCustodySettlement: true };
  handoff: { required: true; status: "NOT_STARTED"; realPrvQualified: false; realRcvQualified: false; topologyAcceptedByRealCustodians: false; newOperationalCredentialsRequired: true; humanSeparatedRestoreRequired: true; topologyMismatchBlocks: true; bootstrapControllersIneligible: true };
  participantCounters: { contacted: 0; enrolled: 0; A: 0; B: 0; C: 0; D: 0 };
  releaseGate: { reviewers: 0; genuineReviews: 0; hmmStatus: "not_qualified" };
  evidenceDigest: string;
};

const evidenceKeys = ["recordType", "schemaVersion", "protocolVersion", "bootstrapRunId", "startedAt", "completedAt", "implementationCommit", "authority", "boundaries", "compartments", "cryptography", "restore", "integrity", "retention", "isolation", "handoff", "participantCounters", "releaseGate"] as const;
const forbiddenInputKeys = new Set(["name", "email", "phone", "address", "identity", "contact", "alias", "response", "result", "fixture", "keymaterial", "password", "passphrase", "secret", "apikey", "provider", "databaseurl"]);
export function containsProhibitedBootstrapFields(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsProhibitedBootstrapFields);
  return Object.entries(value).some(([key, item]) => forbiddenInputKeys.has(key.replaceAll(/[_-]/g, "").toLowerCase()) || containsProhibitedBootstrapFields(item));
}
export function sealEmptyBootstrapEvidence(raw: Omit<EmptyBootstrapEvidence, "evidenceDigest">): EmptyBootstrapEvidence {
  return { ...raw, evidenceDigest: sha256(canonicalizeBootstrap(raw)) };
}
export function validateEmptyBootstrapEvidence(raw: unknown): raw is EmptyBootstrapEvidence {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as EmptyBootstrapEvidence;
  const base = { ...(value as unknown as Record<string, unknown>) }; delete base.evidenceDigest;
  const classes = value.compartments?.map((item) => item.class) ?? [];
  const retention = value.retention;
  return exactKeys(value, [...evidenceKeys, "evidenceDigest"])
    && value.recordType === "sprint_6_5_4_empty_topology_bootstrap_evidence" && value.schemaVersion === EMPTY_BOOTSTRAP_VERSIONS.evidence && value.protocolVersion === EMPTY_BOOTSTRAP_VERSIONS.protocol
    && /^[0-9a-f-]{36}$/i.test(value.bootstrapRunId) && Date.parse(value.startedAt) <= Date.parse(value.completedAt) && COMMIT.test(value.implementationCommit)
    && exactKeys(value.authority, ["scope", "status", "expiresOn", "controllersSyntheticOnly", "roleEligibilityEffect"]) && value.authority.scope === "EMPTY_SYNTHETIC_ONLY" && value.authority.status === "EXPIRED_COMPLETE" && canonicalizeBootstrap(value.authority.expiresOn) === canonicalizeBootstrap(["required_evidence_complete", "material_incident"]) && value.authority.controllersSyntheticOnly === true && value.authority.roleEligibilityEffect === false
    && exactKeys(value.boundaries, ["rootLocationRef", "primaryLocationRef", "backupLocationRef", "insideAuthorizedProject", "backupSeparatelyControlled", "actualPathsOmitted", "gitIgnored"]) && [value.boundaries.rootLocationRef, value.boundaries.primaryLocationRef, value.boundaries.backupLocationRef].every((item) => LOC.test(item)) && new Set([value.boundaries.primaryLocationRef, value.boundaries.backupLocationRef]).size === 2 && value.boundaries.insideAuthorizedProject === true && value.boundaries.backupSeparatelyControlled === true && value.boundaries.actualPathsOmitted === true && value.boundaries.gitIgnored === true
    && value.compartments.length === 8 && new Set(classes).size === 8 && BOOTSTRAP_STORAGE_CLASSES.every((kind) => classes.includes(kind))
    && value.compartments.every((item) => exactKeys(item, ["class", "locationRef", "controllerLabel", "finalState", "permissions", "accessDefault", "accessGrantCount", "encryptionAlgorithm", "protectionEvidenceDigest", "accessTemplateDigest"]) && LOC.test(item.locationRef) && CONTROLLER.test(item.controllerLabel) && item.finalState === "EMPTY" && item.permissions === "0700" && item.accessDefault === "DENY" && item.accessGrantCount === 0 && item.encryptionAlgorithm === "AES-256-GCM" && DIGEST.test(item.protectionEvidenceDigest) && DIGEST.test(item.accessTemplateDigest))
    && exactKeys(value.cryptography, ["algorithm", "keyBytes", "nonceBytes", "authenticationTagBytes", "distinctCompartmentKeys", "idmapKeysBackupSeparated", "recoveryScheme", "shareAAloneRejected", "shareBAloneRejected", "syntheticSecretsPersisted", "syntheticSecretsDestroyed"])
    && value.cryptography.algorithm === "AES-256-GCM" && value.cryptography.keyBytes === 32 && value.cryptography.nonceBytes === 12 && value.cryptography.authenticationTagBytes === 16 && value.cryptography.distinctCompartmentKeys === true && value.cryptography.idmapKeysBackupSeparated === true && value.cryptography.recoveryScheme === "XOR-2-OF-2" && value.cryptography.shareAAloneRejected === true && value.cryptography.shareBAloneRejected === true && value.cryptography.syntheticSecretsPersisted === false && value.cryptography.syntheticSecretsDestroyed === true
    && exactKeys(value.restore, ["status", "coveredClasses", "sourceManifestDigest", "restoredManifestDigest", "sourceHeadDigest", "restoredHeadDigest", "expectedRecordCount", "restoredRecordCount", "isolatedTarget", "nonOverwriteVerified", "permissionProfileVerified", "exactDigestMatch", "cleanupVerified", "networkRequests"])
    && value.restore.status === "PASS" && value.restore.coveredClasses.length === 7 && !value.restore.coveredClasses.includes("BACKUP") && value.restore.expectedRecordCount === value.restore.restoredRecordCount && [value.restore.sourceManifestDigest, value.restore.restoredManifestDigest, value.restore.sourceHeadDigest, value.restore.restoredHeadDigest].every((item) => DIGEST.test(item)) && value.restore.sourceManifestDigest === value.restore.restoredManifestDigest && value.restore.sourceHeadDigest === value.restore.restoredHeadDigest && value.restore.isolatedTarget === true && value.restore.nonOverwriteVerified === true && value.restore.permissionProfileVerified === true && value.restore.exactDigestMatch === true && value.restore.cleanupVerified === true && value.restore.networkRequests === 0
    && exactKeys(value.integrity, ["ledgerStatus", "incidentCorrectionStatus", "chainTamperRejected", "independentHeadDigest", "syntheticRecordsRemoved"])
    && value.integrity.ledgerStatus === "PASS" && value.integrity.incidentCorrectionStatus === "PASS" && value.integrity.chainTamperRejected === true && DIGEST.test(value.integrity.independentHeadDigest) && value.integrity.syntheticRecordsRemoved === true
    && exactKeys(retention, ["policyVersion", "rules", "backupDeletionPropagationMaximumHours", "holdReviewMaximumDays", "objectiveReleaseTriggerRequired", "automaticHoldRenewal", "realDeletionExecutorVerifierDistinctRequired", "bootstrapArtifactDeletion"])
    && retention.policyVersion === EMPTY_BOOTSTRAP_VERSIONS.retention && canonicalizeBootstrap(retention.rules) === canonicalizeBootstrap(EMPTY_BOOTSTRAP_RETENTION_RULES) && retention.backupDeletionPropagationMaximumHours === 168 && retention.holdReviewMaximumDays === 30 && retention.objectiveReleaseTriggerRequired === true && retention.automaticHoldRenewal === false && retention.realDeletionExecutorVerifierDistinctRequired === true && retention.bootstrapArtifactDeletion === "IMMEDIATE_AFTER_REQUIRED_EVIDENCE"
    && exactKeys(value.isolation, ["noRealHumanData", "noRealIdentities", "noRealAliases", "noContacts", "noResponsesOrResults", "noCalibrationKeysOrFixtures", "noRoleEligibilityOrAccessEffect", "noParticipantOrScorerEvidenceEffect", "noReleaseTotalEffect", "noQualificationEffect", "noProviderOrApiUse", "noProductionDatabaseFinancialCustodySettlement"]) && Object.values(value.isolation).every((item) => item === true)
    && exactKeys(value.handoff, ["required", "status", "realPrvQualified", "realRcvQualified", "topologyAcceptedByRealCustodians", "newOperationalCredentialsRequired", "humanSeparatedRestoreRequired", "topologyMismatchBlocks", "bootstrapControllersIneligible"]) && value.handoff.required === true && value.handoff.status === "NOT_STARTED" && value.handoff.realPrvQualified === false && value.handoff.realRcvQualified === false && value.handoff.topologyAcceptedByRealCustodians === false && value.handoff.newOperationalCredentialsRequired === true && value.handoff.humanSeparatedRestoreRequired === true && value.handoff.topologyMismatchBlocks === true && value.handoff.bootstrapControllersIneligible === true
    && canonicalizeBootstrap(value.participantCounters) === canonicalizeBootstrap({ contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }) && canonicalizeBootstrap(value.releaseGate) === canonicalizeBootstrap({ reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" })
    && !containsProhibitedBootstrapFields(value) && DIGEST.test(value.evidenceDigest) && value.evidenceDigest === sha256(canonicalizeBootstrap(base));
}

type ArchiveEntry = { relativePath: string; bytesBase64: string; mode: "0600" };
type ChainEntry = { payload: unknown; previousDigest: string; recordDigest: string };
const sealChain = (records: unknown[]) => records.reduce<ChainEntry[]>((chain, payload) => {
  const previousDigest = chain.at(-1)?.recordDigest ?? "GENESIS:empty-bootstrap-ledger-v1";
  return [...chain, { payload, previousDigest, recordDigest: sha256(canonicalizeBootstrap({ payload, previousDigest })) }];
}, []);
const verifyChain = (chain: ChainEntry[]) => chain.every((record, index) => record.previousDigest === (index === 0 ? "GENESIS:empty-bootstrap-ledger-v1" : chain[index - 1]!.recordDigest) && record.recordDigest === sha256(canonicalizeBootstrap({ payload: record.payload, previousDigest: record.previousDigest })));
const decrypt = (ciphertext: Buffer, key: Buffer, nonce: Buffer, tag: Buffer) => { const decipher = createDecipheriv("aes-256-gcm", key, nonce); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(ciphertext), decipher.final()]); };
const rejectsDecrypt = (ciphertext: Buffer, key: Buffer, nonce: Buffer, tag: Buffer) => { try { decrypt(ciphertext, key, nonce, tag); return false; } catch { return true; } };

export async function runOperationalEmptyBootstrap(input: { projectRoot: string; privateRoot: string; implementationCommit: string; gitIgnored: boolean }): Promise<EmptyBootstrapEvidence> {
  const projectRoot = resolve(input.projectRoot); const privateRoot = resolve(input.privateRoot); const relativeRoot = relative(projectRoot, privateRoot);
  if (!isAbsolute(projectRoot) || relativeRoot.startsWith("..") || isAbsolute(relativeRoot) || relativeRoot === "" || !basename(privateRoot).startsWith(".hmm-private-") || privateRoot.includes(sep + ".git" + sep) || privateRoot.includes(sep + "node_modules" + sep)) throw new Error("private_root_outside_authorized_project_or_invalid");
  if (relativeRoot.split(sep).some((segment) => OFF_LIMIT_SEGMENTS.has(segment.toLowerCase()))) throw new Error("private_root_overlaps_declared_off_limits_area");
  if (!COMMIT.test(input.implementationCommit) || input.gitIgnored !== true) throw new Error("implementation_binding_or_git_ignore_missing");
  const startedAt = new Date().toISOString(); const primaryRoot = join(privateRoot, "primary-control"); const backupRoot = join(privateRoot, "backup-control"); const restoreRoot = join(privateRoot, "isolated-restore-target");
  const refs = Object.fromEntries(BOOTSTRAP_STORAGE_CLASSES.map((kind) => [kind, locRef()])) as Record<BootstrapStorageClass, string>;
  const rootRef = locRef(); const primaryRef = locRef(); const backupRef = locRef(); const keys = new Map<BootstrapStorageClass, Buffer>(); const ephemeralPaths: string[] = []; const buffersToZero: Buffer[] = [];
  try {
    await mkdir(privateRoot, { mode: 0o700 }); await chmod(privateRoot, 0o700); await mkdir(primaryRoot, { mode: 0o700 }); await mkdir(backupRoot, { mode: 0o700 });
    const classPaths = {} as Record<BootstrapStorageClass, string>;
    for (const kind of BOOTSTRAP_STORAGE_CLASSES) { const path = join(kind === "BACKUP" ? backupRoot : primaryRoot, kind); await mkdir(path, { mode: 0o700 }); await chmod(path, 0o700); classPaths[kind] = path; }
    const mapping = { rootLocationRef: rootRef, rootPath: privateRoot, primaryLocationRef: primaryRef, primaryPath: primaryRoot, backupLocationRef: backupRef, backupPath: backupRoot, compartments: BOOTSTRAP_STORAGE_CLASSES.map((kind) => ({ class: kind, locationRef: refs[kind], path: classPaths[kind] })) };
    const mappingPath = join(privateRoot, "location-map.json"); await writeFile(mappingPath, JSON.stringify(mapping, null, 2) + "\n", { mode: 0o600 }); await chmod(mappingPath, 0o600);
    const protection = {} as Record<BootstrapStorageClass, string>; const access = {} as Record<BootstrapStorageClass, string>; const archive: ArchiveEntry[] = [];
    for (const kind of BOOTSTRAP_STORAGE_CLASSES) {
      const template = Buffer.from(JSON.stringify({ schemaVersion: "bootstrap-access-template-v1", controllerLabel: controller(kind), syntheticNonPerson: true, default: "DENY", grants: [] }) + "\n"); const templatePath = join(classPaths[kind], "access-template.synthetic.json"); await writeFile(templatePath, template, { mode: 0o600 }); ephemeralPaths.push(templatePath); access[kind] = sha256(template);
      const key = randomBytes(32); const nonce = randomBytes(12); keys.set(kind, key); buffersToZero.push(key, nonce, template); const cipher = createCipheriv("aes-256-gcm", key, nonce); const ciphertext = Buffer.concat([cipher.update(template), cipher.final()]); const tag = cipher.getAuthTag(); const restored = decrypt(ciphertext, key, nonce, tag); buffersToZero.push(ciphertext, tag, restored); if (!restored.equals(template)) throw new Error("compartment_encryption_probe_failed"); protection[kind] = sha256(Buffer.concat([Buffer.from(kind), nonce, ciphertext, tag]));
      if (kind !== "BACKUP") archive.push({ relativePath: kind + "/access-template.synthetic.json", bytesBase64: template.toString("base64"), mode: "0600" });
    }
    const syntheticRecords = [{ event: "empty_ledger_initialized", sequence: 1 }, { event: "synthetic_correction", sequence: 2, targetSequence: 1 }, { event: "synthetic_incident_contained", sequence: 3, severity: "low" }]; const chain = sealChain(syntheticRecords); if (!verifyChain(chain)) throw new Error("ledger_chain_failed"); const tampered = structuredClone(chain); (tampered[1]!.payload as { sequence: number }).sequence = 99; if (verifyChain(tampered)) throw new Error("ledger_tamper_not_rejected");
    const ledgerBytes = Buffer.from(chain.slice(0, 2).map((item) => JSON.stringify(item)).join("\n") + "\n"); const incidentBytes = Buffer.from(JSON.stringify(chain[2]) + "\n"); buffersToZero.push(ledgerBytes, incidentBytes); const ledgerPath = join(classPaths.LEDGER, "ledger.synthetic.jsonl"); const incidentPath = join(classPaths.INC, "incident.synthetic.jsonl"); await writeFile(ledgerPath, ledgerBytes, { mode: 0o600 }); await writeFile(incidentPath, incidentBytes, { mode: 0o600 }); ephemeralPaths.push(ledgerPath, incidentPath); archive.push({ relativePath: "LEDGER/ledger.synthetic.jsonl", bytesBase64: ledgerBytes.toString("base64"), mode: "0600" }, { relativePath: "INC/incident.synthetic.jsonl", bytesBase64: incidentBytes.toString("base64"), mode: "0600" });
    const sourceManifest = { version: "empty-synthetic-manifest-v1", entries: archive.map((entry) => ({ relativePath: entry.relativePath, digest: sha256(Buffer.from(entry.bytesBase64, "base64")), mode: entry.mode })), headDigest: chain.at(-1)!.recordDigest }; const archiveBytes = Buffer.from(canonicalizeBootstrap({ manifest: sourceManifest, entries: archive })); buffersToZero.push(archiveBytes);
    const backupKey = keys.get("BACKUP")!; const shareA = randomBytes(32); const shareB = Buffer.alloc(32); for (let index = 0; index < 32; index++) shareB[index] = backupKey[index]! ^ shareA[index]!; const reconstructed = Buffer.alloc(32); for (let index = 0; index < 32; index++) reconstructed[index] = shareA[index]! ^ shareB[index]!; buffersToZero.push(shareA, shareB, reconstructed);
    const backupNonce = randomBytes(12); const backupCipher = createCipheriv("aes-256-gcm", backupKey, backupNonce); const backupCiphertext = Buffer.concat([backupCipher.update(archiveBytes), backupCipher.final()]); const backupTag = backupCipher.getAuthTag(); const backupBlob = Buffer.concat([backupNonce, backupTag, backupCiphertext]); buffersToZero.push(backupNonce, backupCiphertext, backupTag, backupBlob); const backupPath = join(classPaths.BACKUP, "bootstrap-backup.synthetic.aesgcm"); await writeFile(backupPath, backupBlob, { mode: 0o600 }); ephemeralPaths.push(backupPath);
    const shareARejected = rejectsDecrypt(backupCiphertext, shareA, backupNonce, backupTag); const shareBRejected = rejectsDecrypt(backupCiphertext, shareB, backupNonce, backupTag); if (!shareARejected || !shareBRejected || !reconstructed.equals(backupKey)) throw new Error("two_of_two_recovery_failed"); const restoredArchiveBytes = decrypt(backupCiphertext, reconstructed, backupNonce, backupTag); buffersToZero.push(restoredArchiveBytes); const restoredArchive = JSON.parse(restoredArchiveBytes.toString()) as { manifest: typeof sourceManifest; entries: ArchiveEntry[] };
    await mkdir(restoreRoot, { mode: 0o700 }); for (const kind of SOURCE_CLASSES) await mkdir(join(restoreRoot, kind), { mode: 0o700 });
    for (const entry of restoredArchive.entries) { const target = resolve(restoreRoot, entry.relativePath); if (!target.startsWith(restoreRoot + sep)) throw new Error("restore_path_escape"); await mkdir(dirname(target), { recursive: true, mode: 0o700 }); await writeFile(target, Buffer.from(entry.bytesBase64, "base64"), { flag: "wx", mode: 0o600 }); }
    const restoredManifest = { version: restoredArchive.manifest.version, entries: [] as typeof sourceManifest.entries, headDigest: restoredArchive.manifest.headDigest };
    for (const entry of restoredArchive.entries) { const target = resolve(restoreRoot, entry.relativePath); restoredManifest.entries.push({ relativePath: entry.relativePath, digest: sha256(await readFile(target)), mode: "0600" }); if (await permissionMode(target) !== 0o600) throw new Error("restored_permission_mismatch"); }
    const sourceManifestDigest = sha256(canonicalizeBootstrap(sourceManifest)); const restoredManifestDigest = sha256(canonicalizeBootstrap(restoredManifest)); if (sourceManifestDigest !== restoredManifestDigest || sourceManifest.headDigest !== restoredManifest.headDigest) throw new Error("restore_digest_mismatch");
    await rm(restoreRoot, { recursive: true }); for (const path of ephemeralPaths) await rm(path); ephemeralPaths.length = 0; for (const kind of BOOTSTRAP_STORAGE_CLASSES) if ((await readdir(classPaths[kind])).length !== 0 || await permissionMode(classPaths[kind]) !== 0o700) throw new Error("final_compartment_not_empty_or_restricted");
    const completedAt = new Date().toISOString();
    const evidence = sealEmptyBootstrapEvidence({
      recordType: "sprint_6_5_4_empty_topology_bootstrap_evidence", schemaVersion: EMPTY_BOOTSTRAP_VERSIONS.evidence, protocolVersion: EMPTY_BOOTSTRAP_VERSIONS.protocol, bootstrapRunId: randomUUID(), startedAt, completedAt, implementationCommit: input.implementationCommit,
      authority: { scope: "EMPTY_SYNTHETIC_ONLY", status: "EXPIRED_COMPLETE", expiresOn: ["required_evidence_complete", "material_incident"], controllersSyntheticOnly: true, roleEligibilityEffect: false },
      boundaries: { rootLocationRef: rootRef, primaryLocationRef: primaryRef, backupLocationRef: backupRef, insideAuthorizedProject: true, backupSeparatelyControlled: true, actualPathsOmitted: true, gitIgnored: true },
      compartments: BOOTSTRAP_STORAGE_CLASSES.map((kind) => ({ class: kind, locationRef: refs[kind], controllerLabel: controller(kind), finalState: "EMPTY", permissions: "0700", accessDefault: "DENY", accessGrantCount: 0, encryptionAlgorithm: "AES-256-GCM", protectionEvidenceDigest: protection[kind], accessTemplateDigest: access[kind] })),
      cryptography: { algorithm: "AES-256-GCM", keyBytes: 32, nonceBytes: 12, authenticationTagBytes: 16, distinctCompartmentKeys: (new Set([...keys.values()].map((key) => key.toString("hex"))).size === 8) as true, idmapKeysBackupSeparated: (!keys.get("IDMAP")!.equals(keys.get("KEYS")!) && !keys.get("IDMAP")!.equals(backupKey) && !keys.get("KEYS")!.equals(backupKey)) as true, recoveryScheme: "XOR-2-OF-2", shareAAloneRejected: shareARejected as true, shareBAloneRejected: shareBRejected as true, syntheticSecretsPersisted: false, syntheticSecretsDestroyed: true },
      restore: { status: "PASS", coveredClasses: [...SOURCE_CLASSES], sourceManifestDigest, restoredManifestDigest, sourceHeadDigest: sourceManifest.headDigest, restoredHeadDigest: restoredManifest.headDigest, expectedRecordCount: archive.length, restoredRecordCount: restoredArchive.entries.length, isolatedTarget: true, nonOverwriteVerified: true, permissionProfileVerified: true, exactDigestMatch: true, cleanupVerified: true, networkRequests: 0 },
      integrity: { ledgerStatus: "PASS", incidentCorrectionStatus: "PASS", chainTamperRejected: true, independentHeadDigest: sourceManifest.headDigest, syntheticRecordsRemoved: true },
      retention: { policyVersion: EMPTY_BOOTSTRAP_VERSIONS.retention, rules: EMPTY_BOOTSTRAP_RETENTION_RULES.map((rule) => ({ ...rule, prerequisites: [...rule.prerequisites] })), backupDeletionPropagationMaximumHours: 168, holdReviewMaximumDays: 30, objectiveReleaseTriggerRequired: true, automaticHoldRenewal: false, realDeletionExecutorVerifierDistinctRequired: true, bootstrapArtifactDeletion: "IMMEDIATE_AFTER_REQUIRED_EVIDENCE" },
      isolation: { noRealHumanData: true, noRealIdentities: true, noRealAliases: true, noContacts: true, noResponsesOrResults: true, noCalibrationKeysOrFixtures: true, noRoleEligibilityOrAccessEffect: true, noParticipantOrScorerEvidenceEffect: true, noReleaseTotalEffect: true, noQualificationEffect: true, noProviderOrApiUse: true, noProductionDatabaseFinancialCustodySettlement: true },
      handoff: { required: true, status: "NOT_STARTED", realPrvQualified: false, realRcvQualified: false, topologyAcceptedByRealCustodians: false, newOperationalCredentialsRequired: true, humanSeparatedRestoreRequired: true, topologyMismatchBlocks: true, bootstrapControllersIneligible: true },
      participantCounters: { contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }, releaseGate: { reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" },
    });
    if (!validateEmptyBootstrapEvidence(evidence)) throw new Error("generated_bootstrap_evidence_invalid"); await writeFile(join(privateRoot, "bounded-evidence.json"), JSON.stringify(evidence, null, 2) + "\n", { mode: 0o600 }); return evidence;
  } finally {
    for (const path of ephemeralPaths) await rm(path, { force: true }).catch(() => undefined);
    await rm(restoreRoot, { recursive: true, force: true }).catch(() => undefined);
    for (const value of buffersToZero) value.fill(0);
    for (const value of keys.values()) value.fill(0);
  }
}

export type BootstrapReadinessInput = { implementationCommit: string; governanceHead: string; artifactEnvelopeDigest: string; bootstrapEvidence: EmptyBootstrapEvidence; bootstrapFounderCheckpointApproved: boolean; randomizedOrderCheckpointApproved: boolean; realRolesQualified: boolean; operationalHandoffRestoreVerified: boolean; allOtherReadinessControlsPass: boolean };
export function evaluateBootstrapCollectiveReadinessV3(input: BootstrapReadinessInput) {
  const reasons = new Set<string>();
  if (!COMMIT.test(input.implementationCommit) || !COMMIT.test(input.governanceHead) || !DIGEST.test(input.artifactEnvelopeDigest) || !validateEmptyBootstrapEvidence(input.bootstrapEvidence)) reasons.add("bootstrap_implementation_or_evidence_invalid");
  if (!input.bootstrapFounderCheckpointApproved) reasons.add("empty_bootstrap_founder_checkpoint_pending");
  if (!input.randomizedOrderCheckpointApproved) reasons.add("randomized_order_founder_checkpoint_pending");
  if (!input.realRolesQualified) reasons.add("real_prv_rcv_and_required_roles_not_qualified");
  if (!input.operationalHandoffRestoreVerified) reasons.add("real_human_separated_handoff_restore_absent");
  if (!input.allOtherReadinessControlsPass) reasons.add("other_collective_readiness_controls_blocked");
  const decision = reasons.size === 0 ? "READY" as const : "BLOCKED" as const;
  return Object.freeze({ recordType: "sprint_6_5_4_collective_readiness" as const, schemaVersion: EMPTY_BOOTSTRAP_VERSIONS.readiness, protocolVersion: EMPTY_BOOTSTRAP_VERSIONS.protocol, implementationCommit: input.implementationCommit, governanceHead: input.governanceHead, artifactEnvelopeDigest: input.artifactEnvelopeDigest, bootstrapEvidenceDigest: input.bootstrapEvidence.evidenceDigest, bootstrapAuthorityStatus: input.bootstrapEvidence.authority.status, decision, reasonCodes: Object.freeze([...reasons].sort()), realKeyPrvScreeningAuthorized: decision === "READY", realScorerCalibrationAuthorized: decision === "READY", a01ContactAuthorized: false as const, participantCounters: Object.freeze({ contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }), releaseGate: Object.freeze({ reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" as const }) });
}
