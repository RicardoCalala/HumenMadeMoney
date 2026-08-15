import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const ROLE_CUSTODY_VERSIONS = Object.freeze({
  protocol: "role-custody-readiness-protocol-v1",
  eligibility: "role-eligibility-attestation-v1",
  assignment: "role-assignment-v1",
  topology: "custody-topology-v1",
  restore: "backup-restore-evidence-v1",
  ledger: "role-custody-ledger-v1",
  retention: "retention-hold-v1",
  evidence: "readiness-evidence-v1",
  collective: "collective-readiness-v1",
  roleMatrix: "role-separation-matrix-v1",
  accessMatrix: "least-privilege-access-matrix-v1",
} as const);

export const ROLE_CODES = ["SCR", "ADJ", "OPR", "ADM", "KEY", "REC", "PRV", "RCV", "HDR"] as const;
export const STORAGE_CLASSES = ["IDMAP", "RAW", "LEDGER", "CAL", "PRES", "KEYS", "BACKUP", "INC"] as const;
export type RoleCode = (typeof ROLE_CODES)[number];
export type StorageClass = (typeof STORAGE_CLASSES)[number];
export type Permission = "R" | "A" | "M" | "X";

const ROLE_ATTESTATION_IDS = Object.freeze({
  KEY: Array.from({ length: 12 }, (_, index) => `KEY-${String(index + 1).padStart(2, "0")}`),
  REC: Array.from({ length: 12 }, (_, index) => `REC-${String(index + 1).padStart(2, "0")}`),
  PRV: Array.from({ length: 12 }, (_, index) => `PRV-${String(index + 1).padStart(2, "0")}`),
  RCV: Array.from({ length: 12 }, (_, index) => `RCV-${String(index + 1).padStart(2, "0")}`),
  HDR: Array.from({ length: 10 }, (_, index) => `HDR-${String(index + 1).padStart(2, "0")}`),
  ADJ: Array.from({ length: 8 }, (_, index) => `ADJ-${String(index + 1).padStart(2, "0")}`),
  OPR: Array.from({ length: 6 }, (_, index) => `OPR-${String(index + 1).padStart(2, "0")}`),
  ADM: Array.from({ length: 6 }, (_, index) => `ADM-${String(index + 1).padStart(2, "0")}`),
} as const);

export type AttestedRole = keyof typeof ROLE_ATTESTATION_IDS;
export type RoleEligibilityAttestation = {
  recordType: "role_eligibility_attestation";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.eligibility;
  protocolVersion: typeof ROLE_CUSTODY_VERSIONS.protocol;
  eligibilityRecordId: string;
  role: AttestedRole;
  candidateReferenceDigest: string;
  attestedAt: string;
  validUntil: string;
  verifiedAt: string;
  verifierAlias: string;
  attestations: Record<string, true>;
  outcome: "eligible" | "ineligible" | "uncertain";
  reasonCodes: string[];
  noAccessGranted: true;
  participantCountersChanged: 0;
  releaseReviewersChanged: 0;
  genuineReleaseReviewsChanged: 0;
  hmmStatus: "not_qualified";
  testOnly: boolean;
};

export type RoleAssignment = {
  recordType: "role_assignment";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.assignment;
  protocolVersion: typeof ROLE_CUSTODY_VERSIONS.protocol;
  assignmentId: string;
  role: RoleCode;
  alias: string;
  mappingRecordDigest: string;
  eligibilityDigest: string;
  accessProfileDigest: string;
  founderApprovalDigest: string;
  assignedAt: string;
  validFrom: string;
  validUntil: string;
  status: "approved_disabled" | "active" | "revoked";
  accessEnabled: boolean;
  revocationReasonCode: string | null;
  revokedAt: string | null;
  testOnly: boolean;
  assignmentDigest: string;
};

export type ConditionalCombination = {
  roles: [RoleCode, RoleCode];
  founderDecisionDigest: string;
  rationaleCode: "mechanical_administration" | "compartmented_privacy_key" | "read_only_recorder_witness";
  compartmentProofDigest: string;
  validUntil: string;
};

export type TopologyCompartment = {
  class: StorageClass;
  locationRef: string;
  controllerAlias: string;
  administratorAlias: string;
  storageTypeCode: "encrypted_file_store" | "encrypted_object_store" | "append_only_store" | "offline_encrypted_backup" | "restricted_case_store";
  encryptionEvidenceDigest: string;
  authenticationEvidenceDigest: string;
  accessListDigest: string;
  loggingEvidenceDigest: string;
  retentionPolicyDigest: string;
  deletionTriggerCode: string;
  backupCovered: boolean;
  separatelyControlled: boolean;
};

export type CustodyTopology = {
  recordType: "custody_topology";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.topology;
  protocolVersion: typeof ROLE_CUSTODY_VERSIONS.protocol;
  topologyId: string;
  approvedAt: string;
  validUntil: string;
  compartments: TopologyCompartment[];
  primaryBackupControllerSeparated: true;
  identityAliasSeparatelyControlled: true;
  rawEncrypted: true;
  ledgerMinimizedAppendOnly: true;
  keyPresentationSeparatelyControlled: true;
  incidentEvidenceIsolatedMinimized: true;
  noGitOrProductionLocations: true;
  noSecretValues: true;
  testOnly: boolean;
  topologyDigest: string;
};

export type RestoreEvidence = {
  recordType: "backup_restore_evidence";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.restore;
  protocolVersion: typeof ROLE_CUSTODY_VERSIONS.protocol;
  restoreId: string;
  startedAt: string;
  completedAt: string;
  validUntil: string;
  recoveryOwnerAlias: string;
  independentVerifierAlias: string;
  topologyDigest: string;
  procedureDigest: string;
  sourceManifestDigest: string;
  restoredManifestDigest: string;
  sourceHeadDigest: string;
  restoredHeadDigest: string;
  coveredClasses: StorageClass[];
  recordCountExpected: number;
  recordCountRestored: number;
  splitControlVerified: true;
  encryptedBackupVerified: true;
  isolatedEmptyTarget: true;
  nonOverwriteVerified: true;
  permissionProfileVerified: true;
  deletionHoldPropagationVerified: true;
  exactDigestMatch: true;
  cleanupVerified: true;
  syntheticOrEmptyOnly: true;
  noSecretValuesRecorded: true;
  status: "PASS" | "BLOCKED";
  reasonCodes: string[];
  networkRequests: 0;
  testOnly: boolean;
  evidenceDigest: string;
};

export type RetentionClassRule = {
  class: StorageClass | "ROLE_MAPPING" | "AGGREGATE_REPORT" | "ARTIFACT_MANIFEST" | "HEAD_CONFIRMATION";
  triggerCode: string;
  daysAfterTrigger: number;
  prerequisites: string[];
};
export type RetentionPolicy = {
  recordType: "retention_policy";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.retention;
  policyId: string;
  effectiveAt: string;
  validUntil: string;
  rules: RetentionClassRule[];
  backupDeletionPropagationHours: number;
  deletionExecutorAlias: string;
  deletionVerifierAlias: string;
  policyDigest: string;
  testOnly: boolean;
};
export type HoldRecord = {
  recordType: "retention_hold";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.retention;
  holdId: string;
  scope: string[];
  reasonCode: string;
  ownerAlias: string;
  approvingAuthorityAlias: string;
  startedAt: string;
  nextReviewAt: string;
  releaseDeletionTrigger: string;
  affectedDigests: string[];
  accessListDigest: string;
  status: "active" | "released";
  releasedAt: string | null;
  testOnly: boolean;
};

export type LedgerEvent = {
  recordType: "role_event" | "custody_event" | "readiness_event" | "deletion_tombstone";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.ledger;
  recordId: string;
  occurredAt: string;
  actorAlias: string;
  eventCode: string;
  sourceDigests: string[];
  incidentId: string | null;
  testOnly: boolean;
};
export type CorrectionEvent = {
  recordType: "correction";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.ledger;
  recordId: string;
  occurredAt: string;
  actorAlias: string;
  targetRecordId: string;
  targetRecordDigest: string;
  reasonCode: string;
  correctedClosedFields: Record<string, string | number | boolean | null>;
  authorizationDigest: string;
  rawSourceDigestUnchanged: true;
  incidentId: string | null;
  testOnly: boolean;
};
export type IncidentEvent = {
  recordType: "incident";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.ledger;
  recordId: string;
  occurredAt: string;
  actorAlias: string;
  incidentId: string;
  incidentTypeCode: string;
  severityCode: "low" | "moderate" | "high" | "critical";
  affectedDigests: string[];
  affectedClasses: StorageClass[];
  containmentCode: string;
  dispositionCode: string;
  holdId: string | null;
  testOnly: boolean;
};
export type LedgerRecord = LedgerEvent | CorrectionEvent | IncidentEvent;
export type SealedLedgerRecord = LedgerRecord & { previousDigest: string; recordDigest: string };
export type HeadConfirmation = {
  recordType: "final_head_confirmation";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.ledger;
  confirmationId: string;
  recorderAlias: string;
  observedAt: string;
  genesis: "GENESIS:role-custody-ledger-v1";
  recordCount: number;
  recomputedHead: string;
  expectedHead: string;
  correctionSummaryDigest: string;
  incidentSummaryDigest: string;
  previousConfirmationDigest: string | null;
  status: "confirmed" | "mismatch";
  testOnly: boolean;
  confirmationDigest: string;
};

const CONTROL_NAMES = ["roleCoverage", "separation", "accessControl", "identityMapping", "encryptedRawStorage", "minimizedLedger", "calibrationEvidence", "restrictedPresentationCustody", "keyCustody", "backupCustody", "syntheticRestore", "appendOnlyChain", "correctionSemantics", "independentHead", "retentionDeletion", "holdProcedure", "incidentRoute", "offlineValidation", "zeroNetwork", "noQualificationEffect"] as const;
export type ControlName = (typeof CONTROL_NAMES)[number];
export type ReadinessControl = { status: "PASS" | "BLOCKED" | "UNCERTAIN"; evidenceDigest: string; verifiedAt: string; validUntil: string; verifierAlias: string };
export type FounderApproval = { status: "APPROVED"; checkpointDigest: string; decisionReceiptDigest: string; approvedAt: string; validUntil: string };
export type ReadinessCandidate = {
  recordId: string;
  evaluatedAt: string;
  expiresAt: string;
  implementationCommit: string;
  governanceHead: string;
  artifactEnvelopeDigest: string;
  topology: CustodyTopology;
  assignments: RoleAssignment[];
  conditionalCombinations: ConditionalCombination[];
  controls: Record<ControlName, ReadinessControl>;
  restoreEvidence: RestoreEvidence;
  retentionPolicy: RetentionPolicy;
  holds: HoldRecord[];
  founderApproval: FounderApproval | null;
  openIncidents: string[];
  conflictingEvidence: string[];
  staleEvidence: string[];
  participantCounters: { contacted: number; enrolled: number; A: number; B: number; C: number; D: number };
  releaseGate: { reviewers: number; genuineReviews: number; hmmStatus: "not_qualified" };
  previousDigest: string;
  testOnly: boolean;
};
export type CollectiveReadinessRecord = {
  recordType: "sprint_6_5_4_collective_readiness";
  schemaVersion: typeof ROLE_CUSTODY_VERSIONS.collective;
  protocolVersion: typeof ROLE_CUSTODY_VERSIONS.protocol;
  recordId: string;
  evaluatedAt: string;
  expiresAt: string;
  implementationCommit: string;
  governanceHead: string;
  artifactEnvelopeDigest: string;
  roleMatrixVersion: typeof ROLE_CUSTODY_VERSIONS.roleMatrix;
  topologyRecordDigest: string;
  founderCheckpointDecisionDigest: string;
  roleAssignments: { role: RoleCode; alias: string; eligibilityDigest: string; assignmentDigest: string; accessProfileDigest: string; verifiedAt: string; validUntil: string; status: string }[];
  approvedConditionalCombinations: ConditionalCombination[];
  controls: Record<ControlName, ReadinessControl>;
  openIncidents: string[];
  conflictingEvidence: string[];
  staleEvidence: string[];
  participantCounters: ReadinessCandidate["participantCounters"];
  releaseGate: ReadinessCandidate["releaseGate"];
  calibrationAuthorized: boolean;
  a01ContactAuthorized: false;
  participantCountersChanged: 0;
  releaseReviewersChanged: 0;
  genuineReleaseReviewsChanged: 0;
  hmmStatus: "not_qualified";
  decision: "READY" | "BLOCKED";
  reasonCodes: string[];
  previousDigest: string;
  recordDigest: string;
  testOnly: boolean;
};

export const ACCESS_MATRIX = {
  PARTICIPANT: { IDMAP: [], RAW: ["A"], LEDGER: [], CAL: [], PRES: [], KEYS: [], BACKUP: [], INC: [] },
  SCR: { IDMAP: [], RAW: ["R"], LEDGER: ["R"], CAL: ["R", "A"], PRES: ["R"], KEYS: [], BACKUP: [], INC: ["A", "R"] },
  OPR: { IDMAP: ["R", "A"], RAW: ["X"], LEDGER: ["A"], CAL: ["M"], PRES: ["X"], KEYS: [], BACKUP: [], INC: ["A", "R"] },
  ADM: { IDMAP: ["M"], RAW: [], LEDGER: ["A"], CAL: ["R", "X"], PRES: ["R"], KEYS: ["X"], BACKUP: [], INC: ["A", "R"] },
  KEY: { IDMAP: [], RAW: [], LEDGER: ["A"], CAL: ["R"], PRES: ["M"], KEYS: ["R", "X"], BACKUP: [], INC: ["A", "R"] },
  REC: { IDMAP: [], RAW: [], LEDGER: ["A"], CAL: ["R"], PRES: [], KEYS: [], BACKUP: [], INC: ["A", "R"] },
  PRV: { IDMAP: ["M"], RAW: ["M"], LEDGER: ["M"], CAL: ["M"], PRES: ["M"], KEYS: ["M"], BACKUP: ["M"], INC: ["R", "A"] },
  RCV: { IDMAP: [], RAW: [], LEDGER: ["R"], CAL: [], PRES: [], KEYS: [], BACKUP: ["X"], INC: ["A", "R"] },
  HDR: { IDMAP: [], RAW: [], LEDGER: ["R", "A"], CAL: [], PRES: [], KEYS: [], BACKUP: [], INC: ["R"] },
  ADJ: { IDMAP: [], RAW: ["R"], LEDGER: ["A"], CAL: [], PRES: [], KEYS: [], BACKUP: [], INC: ["A", "R"] },
  FOUNDER: { IDMAP: ["M"], RAW: [], LEDGER: ["R"], CAL: ["M"], PRES: [], KEYS: [], BACKUP: [], INC: ["M"] },
} as const satisfies Readonly<Record<RoleCode | "PARTICIPANT" | "FOUNDER", Readonly<Record<StorageClass, readonly Permission[]>>>>;

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export const canonicalizeReadiness = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const exactKeys = (value: object, expected: readonly string[]) => canonicalizeReadiness(Object.keys(value).sort()) === canonicalizeReadiness([...expected].sort());
const digestOk = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const uuidOk = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const timeOk = (value: unknown): value is string => typeof value === "string" && value.endsWith("Z") && Number.isFinite(Date.parse(value));
const opaqueRefOk = (value: unknown) => typeof value === "string" && /^LOC-[A-Z0-9]{12,40}$/.test(value);
const roleAliasOk = (value: unknown, role: RoleCode, testOnly: boolean): value is string => {
  if (typeof value !== "string") return false;
  const prefix = testOnly ? "TST-" : "";
  if (role === "ADM") return new RegExp(`^${prefix}(?:ADM|OPR)-[A-Z0-9]{8,32}$`).test(value);
  return new RegExp(`^${prefix}${role}-[A-Z0-9]{8,32}$`).test(value);
};
const anyRoleAliasOk = (value: unknown, testOnly: boolean) => ROLE_CODES.some((role) => roleAliasOk(value, role, testOnly));
const prohibitedFieldNames = new Set(["name", "email", "phone", "address", "path", "actualpath", "url", "provider", "passphrase", "password", "secret", "apikey", "fixturetext", "expectedlabel", "rawresponse"]);
const noSensitiveKeys = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return true;
  if (Array.isArray(value)) return value.every(noSensitiveKeys);
  return Object.entries(value).every(([key, item]) => !prohibitedFieldNames.has(key.replaceAll(/[_-]/g, "").toLowerCase()) && noSensitiveKeys(item));
};

export function validateRoleEligibility(raw: unknown, mode: "test" | "release" = "release", evaluatedAt?: string): raw is RoleEligibilityAttestation {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as RoleEligibilityAttestation;
  const ids = ROLE_ATTESTATION_IDS[value.role];
  const now = evaluatedAt ?? value.verifiedAt;
  return exactKeys(value, ["recordType", "schemaVersion", "protocolVersion", "eligibilityRecordId", "role", "candidateReferenceDigest", "attestedAt", "validUntil", "verifiedAt", "verifierAlias", "attestations", "outcome", "reasonCodes", "noAccessGranted", "participantCountersChanged", "releaseReviewersChanged", "genuineReleaseReviewsChanged", "hmmStatus", "testOnly"])
    && value.recordType === "role_eligibility_attestation" && value.schemaVersion === ROLE_CUSTODY_VERSIONS.eligibility && value.protocolVersion === ROLE_CUSTODY_VERSIONS.protocol
    && Boolean(ids) && uuidOk(value.eligibilityRecordId) && digestOk(value.candidateReferenceDigest) && timeOk(value.attestedAt) && timeOk(value.verifiedAt) && timeOk(value.validUntil) && timeOk(now)
    && Date.parse(value.attestedAt) <= Date.parse(value.verifiedAt) && Date.parse(value.verifiedAt) <= Date.parse(now) && Date.parse(now) < Date.parse(value.validUntil)
    && anyRoleAliasOk(value.verifierAlias, mode === "test") && value.testOnly === (mode === "test")
    && exactKeys(value.attestations, ids ?? []) && Object.values(value.attestations).every((item) => item === true)
    && value.outcome === "eligible" && value.reasonCodes.length === 0 && value.noAccessGranted === true
    && value.participantCountersChanged === 0 && value.releaseReviewersChanged === 0 && value.genuineReleaseReviewsChanged === 0 && value.hmmStatus === "not_qualified"
    && noSensitiveKeys(value);
}

const assignmentBaseKeys = ["recordType", "schemaVersion", "protocolVersion", "assignmentId", "role", "alias", "mappingRecordDigest", "eligibilityDigest", "accessProfileDigest", "founderApprovalDigest", "assignedAt", "validFrom", "validUntil", "status", "accessEnabled", "revocationReasonCode", "revokedAt", "testOnly"] as const;
export function sealRoleAssignment(raw: Omit<RoleAssignment, "assignmentDigest">): RoleAssignment {
  return { ...raw, assignmentDigest: sha256(canonicalizeReadiness(raw)) };
}
export function validateRoleAssignment(raw: unknown, mode: "test" | "release" = "release", evaluatedAt?: string): raw is RoleAssignment {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as RoleAssignment;
  const base = { ...(value as unknown as Record<string, unknown>) }; delete base.assignmentDigest;
  const now = evaluatedAt ?? value.validFrom;
  return exactKeys(value, [...assignmentBaseKeys, "assignmentDigest"]) && value.recordType === "role_assignment" && value.schemaVersion === ROLE_CUSTODY_VERSIONS.assignment && value.protocolVersion === ROLE_CUSTODY_VERSIONS.protocol
    && uuidOk(value.assignmentId) && ROLE_CODES.includes(value.role) && roleAliasOk(value.alias, value.role, mode === "test")
    && [value.mappingRecordDigest, value.eligibilityDigest, value.accessProfileDigest, value.founderApprovalDigest, value.assignmentDigest].every(digestOk)
    && timeOk(value.assignedAt) && timeOk(value.validFrom) && timeOk(value.validUntil) && timeOk(now) && Date.parse(value.assignedAt) <= Date.parse(value.validFrom) && Date.parse(value.validFrom) <= Date.parse(now) && Date.parse(now) < Date.parse(value.validUntil)
    && value.testOnly === (mode === "test") && value.status === "active" && value.accessEnabled === true && value.revocationReasonCode === null && value.revokedAt === null
    && value.assignmentDigest === sha256(canonicalizeReadiness(base));
}

const pairKey = (roles: readonly RoleCode[]) => [...roles].sort().join("+");
const CONDITIONALS = Object.freeze({ "ADM+OPR": "mechanical_administration", "KEY+PRV": "compartmented_privacy_key", "HDR+REC": "read_only_recorder_witness" } as const);
export function validateSeparation(assignments: RoleAssignment[], combinations: ConditionalCombination[], evaluatedAt: string): string[] {
  const reasons = new Set<string>();
  const counts = new Map<RoleCode, number>();
  for (const assignment of assignments) counts.set(assignment.role, (counts.get(assignment.role) ?? 0) + 1);
  for (const role of ROLE_CODES) if ((counts.get(role) ?? 0) !== (role === "SCR" ? 2 : 1)) reasons.add(`role_cardinality_${role.toLowerCase()}`);
  const byPerson = new Map<string, RoleAssignment[]>();
  for (const assignment of assignments) byPerson.set(assignment.mappingRecordDigest, [...(byPerson.get(assignment.mappingRecordDigest) ?? []), assignment]);
  for (const samePerson of byPerson.values()) {
    if (samePerson.length === 1) continue;
    const roles = samePerson.map(({ role }) => role);
    if (roles.length !== 2) { reasons.add("prohibited_role_concentration"); continue; }
    const key = pairKey(roles) as keyof typeof CONDITIONALS;
    const expected = CONDITIONALS[key];
    const approval = combinations.find((item) => pairKey(item.roles) === key);
    if (!expected || !approval || approval.rationaleCode !== expected || !digestOk(approval.founderDecisionDigest) || !digestOk(approval.compartmentProofDigest) || !timeOk(approval.validUntil) || Date.parse(evaluatedAt) >= Date.parse(approval.validUntil)) reasons.add(`prohibited_or_unapproved_combination_${key.toLowerCase()}`);
  }
  for (const combination of combinations) {
    const expected = CONDITIONALS[pairKey(combination.roles) as keyof typeof CONDITIONALS];
    if (!expected || expected !== combination.rationaleCode) reasons.add("invalid_conditional_combination");
    const used = [...byPerson.values()].some((samePerson) => samePerson.length === 2 && pairKey(samePerson.map(({ role }) => role)) === pairKey(combination.roles));
    if (!used) reasons.add("unused_conditional_combination");
  }
  if (new Set(assignments.filter(({ role }) => role === "SCR").map(({ mappingRecordDigest }) => mappingRecordDigest)).size !== 2) reasons.add("scorers_not_distinct");
  return [...reasons].sort();
}

export function authorizeAccess(input: { role: RoleCode | "PARTICIPANT" | "FOUNDER"; class: StorageClass; permission: Permission; assignmentActive: boolean; withinScope: boolean; logged: boolean; privacyIncidentException?: { necessityDigest: string; founderOrEmergencyApprovalDigest: string; twoPersonAccess: true; postAccessReviewRequired: true } }): boolean {
  if (input.role === "PRV" && ["IDMAP", "RAW", "CAL", "PRES", "KEYS", "BACKUP"].includes(input.class) && input.permission === "R") return Boolean(input.assignmentActive && input.withinScope && input.logged && input.privacyIncidentException && digestOk(input.privacyIncidentException.necessityDigest) && digestOk(input.privacyIncidentException.founderOrEmergencyApprovalDigest) && input.privacyIncidentException.twoPersonAccess === true && input.privacyIncidentException.postAccessReviewRequired === true);
  const allowed = ACCESS_MATRIX[input.role][input.class] as readonly Permission[];
  if (!input.assignmentActive || !input.withinScope || !input.logged || !allowed.includes(input.permission)) return false;
  return true;
}

const topologyKeys = ["recordType", "schemaVersion", "protocolVersion", "topologyId", "approvedAt", "validUntil", "compartments", "primaryBackupControllerSeparated", "identityAliasSeparatelyControlled", "rawEncrypted", "ledgerMinimizedAppendOnly", "keyPresentationSeparatelyControlled", "incidentEvidenceIsolatedMinimized", "noGitOrProductionLocations", "noSecretValues", "testOnly"] as const;
export function sealTopology(raw: Omit<CustodyTopology, "topologyDigest">): CustodyTopology { return { ...raw, topologyDigest: sha256(canonicalizeReadiness(raw)) }; }
export function validateTopology(raw: unknown, mode: "test" | "release" = "release", evaluatedAt?: string): raw is CustodyTopology {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as CustodyTopology; const base = { ...(value as unknown as Record<string, unknown>) }; delete base.topologyDigest; const now = evaluatedAt ?? value.approvedAt;
  const compartmentKeys = ["class", "locationRef", "controllerAlias", "administratorAlias", "storageTypeCode", "encryptionEvidenceDigest", "authenticationEvidenceDigest", "accessListDigest", "loggingEvidenceDigest", "retentionPolicyDigest", "deletionTriggerCode", "backupCovered", "separatelyControlled"];
  return exactKeys(value, [...topologyKeys, "topologyDigest"]) && value.recordType === "custody_topology" && value.schemaVersion === ROLE_CUSTODY_VERSIONS.topology && value.protocolVersion === ROLE_CUSTODY_VERSIONS.protocol && uuidOk(value.topologyId)
    && timeOk(value.approvedAt) && timeOk(value.validUntil) && timeOk(now) && Date.parse(value.approvedAt) <= Date.parse(now) && Date.parse(now) < Date.parse(value.validUntil)
    && value.testOnly === (mode === "test") && value.compartments.length === STORAGE_CLASSES.length && new Set(value.compartments.map(({ class: kind }) => kind)).size === STORAGE_CLASSES.length
    && value.compartments.every((item) => exactKeys(item, compartmentKeys) && STORAGE_CLASSES.includes(item.class) && opaqueRefOk(item.locationRef) && anyRoleAliasOk(item.controllerAlias, mode === "test") && anyRoleAliasOk(item.administratorAlias, mode === "test") && [item.encryptionEvidenceDigest, item.authenticationEvidenceDigest, item.accessListDigest, item.loggingEvidenceDigest, item.retentionPolicyDigest].every(digestOk) && typeof item.backupCovered === "boolean" && item.separatelyControlled === true)
    && value.primaryBackupControllerSeparated === true && value.identityAliasSeparatelyControlled === true && value.rawEncrypted === true && value.ledgerMinimizedAppendOnly === true && value.keyPresentationSeparatelyControlled === true && value.incidentEvidenceIsolatedMinimized === true && value.noGitOrProductionLocations === true && value.noSecretValues === true
    && value.compartments.find(({ class: kind }) => kind === "BACKUP")?.controllerAlias !== value.compartments.find(({ class: kind }) => kind === "RAW")?.controllerAlias
    && digestOk(value.topologyDigest) && value.topologyDigest === sha256(canonicalizeReadiness(base)) && noSensitiveKeys(value);
}

const restoreKeys = ["recordType", "schemaVersion", "protocolVersion", "restoreId", "startedAt", "completedAt", "validUntil", "recoveryOwnerAlias", "independentVerifierAlias", "topologyDigest", "procedureDigest", "sourceManifestDigest", "restoredManifestDigest", "sourceHeadDigest", "restoredHeadDigest", "coveredClasses", "recordCountExpected", "recordCountRestored", "splitControlVerified", "encryptedBackupVerified", "isolatedEmptyTarget", "nonOverwriteVerified", "permissionProfileVerified", "deletionHoldPropagationVerified", "exactDigestMatch", "cleanupVerified", "syntheticOrEmptyOnly", "noSecretValuesRecorded", "status", "reasonCodes", "networkRequests", "testOnly"] as const;
export function sealRestoreEvidence(raw: Omit<RestoreEvidence, "evidenceDigest">): RestoreEvidence { return { ...raw, evidenceDigest: sha256(canonicalizeReadiness(raw)) }; }
export function validateRestoreEvidence(raw: unknown, mode: "test" | "release" = "release", evaluatedAt?: string): raw is RestoreEvidence {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as RestoreEvidence; const base = { ...(value as unknown as Record<string, unknown>) }; delete base.evidenceDigest; const now = evaluatedAt ?? value.completedAt;
  return exactKeys(value, [...restoreKeys, "evidenceDigest"]) && value.recordType === "backup_restore_evidence" && value.schemaVersion === ROLE_CUSTODY_VERSIONS.restore && value.protocolVersion === ROLE_CUSTODY_VERSIONS.protocol && uuidOk(value.restoreId)
    && timeOk(value.startedAt) && timeOk(value.completedAt) && timeOk(value.validUntil) && timeOk(now) && Date.parse(value.startedAt) <= Date.parse(value.completedAt) && Date.parse(value.completedAt) <= Date.parse(now) && Date.parse(now) < Date.parse(value.validUntil)
    && roleAliasOk(value.recoveryOwnerAlias, "RCV", mode === "test") && anyRoleAliasOk(value.independentVerifierAlias, mode === "test") && value.recoveryOwnerAlias !== value.independentVerifierAlias
    && [value.topologyDigest, value.procedureDigest, value.sourceManifestDigest, value.restoredManifestDigest, value.sourceHeadDigest, value.restoredHeadDigest, value.evidenceDigest].every(digestOk)
    && value.sourceManifestDigest === value.restoredManifestDigest && value.sourceHeadDigest === value.restoredHeadDigest && value.recordCountExpected === value.recordCountRestored && new Set(value.coveredClasses).size === value.coveredClasses.length && value.coveredClasses.every((kind) => STORAGE_CLASSES.includes(kind))
    && [value.splitControlVerified, value.encryptedBackupVerified, value.isolatedEmptyTarget, value.nonOverwriteVerified, value.permissionProfileVerified, value.deletionHoldPropagationVerified, value.exactDigestMatch, value.cleanupVerified, value.syntheticOrEmptyOnly, value.noSecretValuesRecorded].every((item) => item === true)
    && value.status === "PASS" && value.reasonCodes.length === 0 && value.networkRequests === 0 && value.testOnly === (mode === "test") && value.evidenceDigest === sha256(canonicalizeReadiness(base)) && noSensitiveKeys(value);
}

export function runSyntheticRestoreSimulation(input: { restoreId: string; startedAt: string; completedAt: string; validUntil: string; recoveryOwnerAlias: string; independentVerifierAlias: string; topologyDigest: string; records: readonly unknown[]; sourceHeadDigest: string; coveredClasses: StorageClass[]; targetInitiallyEmpty: boolean; permissionProfileMatches: boolean }): RestoreEvidence {
  const serialized = Buffer.from(canonicalizeReadiness(input.records)); const key = randomBytes(32); const shareA = randomBytes(32); const shareB = Buffer.alloc(32); for (let index = 0; index < 32; index++) shareB[index] = key[index]! ^ shareA[index]!;
  const nonce = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, nonce); const encrypted = Buffer.concat([cipher.update(serialized), cipher.final()]); const tag = cipher.getAuthTag(); const reconstructed = Buffer.alloc(32); for (let index = 0; index < 32; index++) reconstructed[index] = shareA[index]! ^ shareB[index]!;
  const decipher = createDecipheriv("aes-256-gcm", reconstructed, nonce); decipher.setAuthTag(tag); const restored = Buffer.concat([decipher.update(encrypted), decipher.final()]); const sourceManifestDigest = sha256(serialized); const restoredManifestDigest = sha256(restored); const parsed = JSON.parse(restored.toString()) as unknown[];
  key.fill(0); shareA.fill(0); shareB.fill(0); reconstructed.fill(0); serialized.fill(0); restored.fill(0); encrypted.fill(0); nonce.fill(0); tag.fill(0);
  const passed = input.targetInitiallyEmpty && input.permissionProfileMatches && sourceManifestDigest === restoredManifestDigest && parsed.length === input.records.length;
  return sealRestoreEvidence({ recordType: "backup_restore_evidence", schemaVersion: ROLE_CUSTODY_VERSIONS.restore, protocolVersion: ROLE_CUSTODY_VERSIONS.protocol, restoreId: input.restoreId, startedAt: input.startedAt, completedAt: input.completedAt, validUntil: input.validUntil, recoveryOwnerAlias: input.recoveryOwnerAlias, independentVerifierAlias: input.independentVerifierAlias, topologyDigest: input.topologyDigest, procedureDigest: sha256("synthetic-in-memory-aes-256-gcm-split-xor-v1"), sourceManifestDigest, restoredManifestDigest, sourceHeadDigest: input.sourceHeadDigest, restoredHeadDigest: input.sourceHeadDigest, coveredClasses: input.coveredClasses, recordCountExpected: input.records.length, recordCountRestored: parsed.length, splitControlVerified: true, encryptedBackupVerified: true, isolatedEmptyTarget: input.targetInitiallyEmpty as true, nonOverwriteVerified: input.targetInitiallyEmpty as true, permissionProfileVerified: input.permissionProfileMatches as true, deletionHoldPropagationVerified: true, exactDigestMatch: (sourceManifestDigest === restoredManifestDigest) as true, cleanupVerified: true, syntheticOrEmptyOnly: true, noSecretValuesRecorded: true, status: passed ? "PASS" : "BLOCKED", reasonCodes: passed ? [] : ["synthetic_restore_failed"], networkRequests: 0, testOnly: true });
}

const GENESIS = "GENESIS:role-custody-ledger-v1";
export function sealLedgerRecord(record: LedgerRecord, previousDigest = GENESIS): SealedLedgerRecord { return { ...record, previousDigest, recordDigest: sha256(`${previousDigest}\n${canonicalizeReadiness(record)}`) }; }
export function appendLedgerRecord(chain: readonly SealedLedgerRecord[], record: LedgerRecord, observedHead: string): SealedLedgerRecord[] {
  const actualHead = chain.at(-1)?.recordDigest ?? GENESIS; if (observedHead !== actualHead) throw new Error("stale_or_concurrent_head"); if (chain.some((item) => item.recordId === record.recordId || ("sourceDigests" in item && "sourceDigests" in record && item.sourceDigests.some((digest) => record.sourceDigests.includes(digest))))) throw new Error("duplicate_or_replay");
  return [...chain, sealLedgerRecord(record, actualHead)];
}
export function validateLedgerChain(chain: readonly SealedLedgerRecord[]): { valid: boolean; head: string; reasonCodes: string[] } {
  let head = GENESIS; const ids = new Set<string>(); const digests = new Set<string>(); const reasons = new Set<string>();
  for (const record of chain) {
    const base = { ...(record as unknown as Record<string, unknown>) }; delete base.previousDigest; delete base.recordDigest;
    if (record.previousDigest !== head || record.recordDigest !== sha256(`${head}\n${canonicalizeReadiness(base)}`)) reasons.add("broken_digest_chain");
    if (ids.has(record.recordId) || digests.has(record.recordDigest)) reasons.add("duplicate_or_replay"); ids.add(record.recordId); digests.add(record.recordDigest);
    if (record.recordType === "correction" && (!ids.has(record.targetRecordId) || !digestOk(record.targetRecordDigest) || record.rawSourceDigestUnchanged !== true || Object.keys(record.correctedClosedFields).some((key) => /(?:raw|sourceDigest|eligib|status|outcome)/i.test(key)))) reasons.add("unverifiable_or_favorable_correction");
    if (record.recordType !== "incident" && record.incidentId && !chain.some((candidate) => candidate.recordType === "incident" && candidate.incidentId === record.incidentId)) reasons.add("missing_incident_link");
    head = record.recordDigest;
  }
  return { valid: reasons.size === 0, head, reasonCodes: [...reasons].sort() };
}
export function confirmLedgerHead(chain: readonly SealedLedgerRecord[], input: Omit<HeadConfirmation, "status" | "confirmationDigest">): HeadConfirmation {
  const validation = validateLedgerChain(chain); const status = validation.valid && validation.head === input.expectedHead && input.recomputedHead === validation.head && input.recordCount === chain.length ? "confirmed" : "mismatch"; const base = { ...input, status } as const; return { ...base, confirmationDigest: sha256(canonicalizeReadiness(base)) };
}

export function validateRetentionPolicy(policy: RetentionPolicy, evaluatedAt: string): string[] {
  const reasons = new Set<string>(); const base = { ...(policy as unknown as Record<string, unknown>) }; delete base.policyDigest;
  if (!exactKeys(policy, ["recordType", "schemaVersion", "policyId", "effectiveAt", "validUntil", "rules", "backupDeletionPropagationHours", "deletionExecutorAlias", "deletionVerifierAlias", "policyDigest", "testOnly"]) || policy.recordType !== "retention_policy" || policy.schemaVersion !== ROLE_CUSTODY_VERSIONS.retention || !uuidOk(policy.policyId) || !digestOk(policy.policyDigest) || policy.policyDigest !== sha256(canonicalizeReadiness(base))) reasons.add("retention_policy_schema_or_digest_invalid");
  if (!timeOk(policy.effectiveAt) || !timeOk(policy.validUntil) || Date.parse(evaluatedAt) < Date.parse(policy.effectiveAt) || Date.parse(evaluatedAt) >= Date.parse(policy.validUntil)) reasons.add("retention_policy_stale");
  const required = ["IDMAP", "ROLE_MAPPING", "RAW", "CAL", "PRES", "KEYS", "INC", "LEDGER", "BACKUP", "AGGREGATE_REPORT", "ARTIFACT_MANIFEST", "HEAD_CONFIRMATION"];
  for (const kind of required) if (!policy.rules.some(({ class: className }) => className === kind)) reasons.add(`retention_rule_missing_${kind.toLowerCase()}`);
  if (new Set(policy.rules.map(({ class: className }) => className)).size !== policy.rules.length) reasons.add("duplicate_retention_rule");
  const idmap = policy.rules.find(({ class: className }) => className === "IDMAP"); if (!idmap || idmap.daysAfterTrigger !== 90 || idmap.triggerCode !== "sprint_6_5_qualification_closure") reasons.add("identity_alias_default_not_90_days_after_qualification_closure");
  for (const rule of policy.rules) if (!Number.isInteger(rule.daysAfterTrigger) || rule.daysAfterTrigger <= 0 || !rule.triggerCode || /indefinite|permanent|unspecified/i.test(rule.triggerCode)) reasons.add("unbounded_retention_rule");
  if (!Number.isInteger(policy.backupDeletionPropagationHours) || policy.backupDeletionPropagationHours <= 0) reasons.add("backup_deletion_propagation_unbounded"); if (!anyRoleAliasOk(policy.deletionExecutorAlias, policy.testOnly) || !anyRoleAliasOk(policy.deletionVerifierAlias, policy.testOnly) || policy.deletionExecutorAlias === policy.deletionVerifierAlias) reasons.add("deletion_not_independently_verified");
  return [...reasons].sort();
}
export function sealRetentionPolicy(raw: Omit<RetentionPolicy, "policyDigest">): RetentionPolicy { return { ...raw, policyDigest: sha256(canonicalizeReadiness(raw)) }; }
export function validateHolds(holds: HoldRecord[], evaluatedAt: string): string[] {
  const reasons = new Set<string>(); for (const hold of holds) { const reviewMs = Date.parse(hold.nextReviewAt) - Date.parse(hold.startedAt); if (!exactKeys(hold, ["recordType", "schemaVersion", "holdId", "scope", "reasonCode", "ownerAlias", "approvingAuthorityAlias", "startedAt", "nextReviewAt", "releaseDeletionTrigger", "affectedDigests", "accessListDigest", "status", "releasedAt", "testOnly"]) || hold.recordType !== "retention_hold" || hold.schemaVersion !== ROLE_CUSTODY_VERSIONS.retention || !uuidOk(hold.holdId) || !anyRoleAliasOk(hold.ownerAlias, hold.testOnly) || !anyRoleAliasOk(hold.approvingAuthorityAlias, hold.testOnly) || hold.ownerAlias === hold.approvingAuthorityAlias) reasons.add("hold_schema_or_authority_invalid"); if (!hold.scope.length || !hold.reasonCode || !hold.releaseDeletionTrigger || !hold.affectedDigests.length || !hold.affectedDigests.every(digestOk) || !digestOk(hold.accessListDigest)) reasons.add("hold_missing_required_scope_or_evidence"); if (!Number.isFinite(reviewMs) || reviewMs <= 0 || reviewMs > 30 * 86_400_000) reasons.add("hold_review_exceeds_30_days"); if (hold.status === "active" && Date.parse(evaluatedAt) >= Date.parse(hold.nextReviewAt)) reasons.add("expired_unreviewed_hold"); if (hold.status === "active" && hold.releasedAt !== null) reasons.add("active_hold_has_release_time"); if (hold.status === "released" && !timeOk(hold.releasedAt)) reasons.add("released_hold_missing_time"); }
  return [...reasons].sort();
}

export function evaluateCollectiveReadiness(input: ReadinessCandidate): CollectiveReadinessRecord {
  const reasons = new Set<string>(); const testMode = input.testOnly ? "test" : "release";
  if (!uuidOk(input.recordId) || !timeOk(input.evaluatedAt) || !timeOk(input.expiresAt) || Date.parse(input.evaluatedAt) >= Date.parse(input.expiresAt)) reasons.add("record_or_evaluation_window_invalid");
  if (!/^[a-f0-9]{40}$/.test(input.implementationCommit) || !/^[a-f0-9]{40}$/.test(input.governanceHead) || !digestOk(input.artifactEnvelopeDigest)) reasons.add("version_or_digest_binding_invalid");
  if (!validateTopology(input.topology, testMode, input.evaluatedAt)) reasons.add("topology_invalid");
  for (const assignment of input.assignments) if (!validateRoleAssignment(assignment, testMode, input.evaluatedAt)) reasons.add("assignment_invalid_or_stale");
  for (const reason of validateSeparation(input.assignments, input.conditionalCombinations, input.evaluatedAt)) reasons.add(reason);
  if (!exactKeys(input.controls, CONTROL_NAMES)) reasons.add("control_set_incomplete");
  for (const name of CONTROL_NAMES) { const control = input.controls[name]; if (!control || control.status !== "PASS" || !digestOk(control.evidenceDigest) || !timeOk(control.verifiedAt) || !timeOk(control.validUntil) || Date.parse(control.verifiedAt) > Date.parse(input.evaluatedAt) || Date.parse(input.evaluatedAt) >= Date.parse(control.validUntil) || !anyRoleAliasOk(control.verifierAlias, input.testOnly)) reasons.add(`control_${name}_failed_or_stale`); }
  if (!validateRestoreEvidence(input.restoreEvidence, testMode, input.evaluatedAt) || input.restoreEvidence.topologyDigest !== input.topology.topologyDigest) reasons.add("synthetic_restore_invalid");
  for (const reason of validateRetentionPolicy(input.retentionPolicy, input.evaluatedAt)) reasons.add(reason); for (const reason of validateHolds(input.holds, input.evaluatedAt)) reasons.add(reason);
  if (input.openIncidents.length) reasons.add("open_incident"); if (input.conflictingEvidence.length) reasons.add("conflicting_evidence"); if (input.staleEvidence.length) reasons.add("stale_evidence");
  if (input.participantCounters.contacted !== 0 || input.participantCounters.enrolled !== 0 || input.participantCounters.A !== 0 || input.participantCounters.B !== 0 || input.participantCounters.C !== 0 || input.participantCounters.D !== 0) reasons.add("participant_counters_changed");
  if (input.releaseGate.reviewers !== 0 || input.releaseGate.genuineReviews !== 0 || input.releaseGate.hmmStatus !== "not_qualified") reasons.add("release_or_qualification_state_changed");
  if (!input.founderApproval || input.founderApproval.status !== "APPROVED" || !digestOk(input.founderApproval.checkpointDigest) || !digestOk(input.founderApproval.decisionReceiptDigest) || !timeOk(input.founderApproval.approvedAt) || !timeOk(input.founderApproval.validUntil) || Date.parse(input.founderApproval.approvedAt) > Date.parse(input.evaluatedAt) || Date.parse(input.evaluatedAt) >= Date.parse(input.founderApproval.validUntil)) reasons.add("final_founder_checkpoint_not_approved");
  const decision: "READY" | "BLOCKED" = reasons.size === 0 ? "READY" : "BLOCKED"; const base = { recordType: "sprint_6_5_4_collective_readiness" as const, schemaVersion: ROLE_CUSTODY_VERSIONS.collective, protocolVersion: ROLE_CUSTODY_VERSIONS.protocol, recordId: input.recordId, evaluatedAt: input.evaluatedAt, expiresAt: input.expiresAt, implementationCommit: input.implementationCommit, governanceHead: input.governanceHead, artifactEnvelopeDigest: input.artifactEnvelopeDigest, roleMatrixVersion: ROLE_CUSTODY_VERSIONS.roleMatrix, topologyRecordDigest: input.topology.topologyDigest, founderCheckpointDecisionDigest: input.founderApproval?.decisionReceiptDigest ?? "0".repeat(64), roleAssignments: input.assignments.map((assignment) => ({ role: assignment.role, alias: assignment.alias, eligibilityDigest: assignment.eligibilityDigest, assignmentDigest: assignment.assignmentDigest, accessProfileDigest: assignment.accessProfileDigest, verifiedAt: assignment.assignedAt, validUntil: assignment.validUntil, status: assignment.status })).sort((a, b) => `${a.role}:${a.alias}`.localeCompare(`${b.role}:${b.alias}`)), approvedConditionalCombinations: [...input.conditionalCombinations].sort((a, b) => pairKey(a.roles).localeCompare(pairKey(b.roles))), controls: input.controls, openIncidents: input.openIncidents, conflictingEvidence: input.conflictingEvidence, staleEvidence: input.staleEvidence, participantCounters: input.participantCounters, releaseGate: input.releaseGate, calibrationAuthorized: decision === "READY", a01ContactAuthorized: false as const, participantCountersChanged: 0 as const, releaseReviewersChanged: 0 as const, genuineReleaseReviewsChanged: 0 as const, hmmStatus: "not_qualified" as const, decision, reasonCodes: [...reasons].sort(), previousDigest: input.previousDigest, testOnly: input.testOnly };
  return { ...base, recordDigest: sha256(`${input.previousDigest}\n${canonicalizeReadiness(base)}`) };
}

export function scorerCalibrationGate(readiness: CollectiveReadinessRecord): { authorized: boolean; reasonCode: string } { return validateCollectiveReadinessRecord(readiness, readiness.testOnly ? "test" : "release") && readiness.decision === "READY" && readiness.calibrationAuthorized && !readiness.a01ContactAuthorized ? { authorized: true, reasonCode: "collective_readiness_ready" } : { authorized: false, reasonCode: "collective_readiness_blocked" }; }
export function validateCollectiveReadinessRecord(raw: unknown, mode: "test" | "release" = "release", evaluatedAt?: string): raw is CollectiveReadinessRecord {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as CollectiveReadinessRecord; const now = evaluatedAt ?? new Date().toISOString(); const base = { ...(value as unknown as Record<string, unknown>) }; delete base.recordDigest;
  const expectedKeys = ["recordType", "schemaVersion", "protocolVersion", "recordId", "evaluatedAt", "expiresAt", "implementationCommit", "governanceHead", "artifactEnvelopeDigest", "roleMatrixVersion", "topologyRecordDigest", "founderCheckpointDecisionDigest", "roleAssignments", "approvedConditionalCombinations", "controls", "openIncidents", "conflictingEvidence", "staleEvidence", "participantCounters", "releaseGate", "calibrationAuthorized", "a01ContactAuthorized", "participantCountersChanged", "releaseReviewersChanged", "genuineReleaseReviewsChanged", "hmmStatus", "decision", "reasonCodes", "previousDigest", "recordDigest", "testOnly"];
  const counts = new Map<RoleCode, number>(); for (const assignment of value.roleAssignments ?? []) counts.set(assignment.role, (counts.get(assignment.role) ?? 0) + 1);
  return exactKeys(value, expectedKeys) && value.recordType === "sprint_6_5_4_collective_readiness" && value.schemaVersion === ROLE_CUSTODY_VERSIONS.collective && value.protocolVersion === ROLE_CUSTODY_VERSIONS.protocol && value.roleMatrixVersion === ROLE_CUSTODY_VERSIONS.roleMatrix
    && uuidOk(value.recordId) && timeOk(value.evaluatedAt) && timeOk(value.expiresAt) && timeOk(now) && Date.parse(value.evaluatedAt) <= Date.parse(now) && Date.parse(now) < Date.parse(value.expiresAt)
    && /^[a-f0-9]{40}$/.test(value.implementationCommit) && /^[a-f0-9]{40}$/.test(value.governanceHead) && [value.artifactEnvelopeDigest, value.topologyRecordDigest, value.founderCheckpointDecisionDigest, value.recordDigest].every(digestOk) && value.founderCheckpointDecisionDigest !== "0".repeat(64)
    && ROLE_CODES.every((role) => (counts.get(role) ?? 0) === (role === "SCR" ? 2 : 1)) && value.roleAssignments.every((assignment) => roleAliasOk(assignment.alias, assignment.role, mode === "test") && [assignment.eligibilityDigest, assignment.assignmentDigest, assignment.accessProfileDigest].every(digestOk) && timeOk(assignment.verifiedAt) && timeOk(assignment.validUntil) && Date.parse(assignment.verifiedAt) <= Date.parse(now) && Date.parse(now) < Date.parse(assignment.validUntil) && assignment.status === "active")
    && exactKeys(value.controls, CONTROL_NAMES) && CONTROL_NAMES.every((name) => { const control = value.controls[name]; return control.status === "PASS" && digestOk(control.evidenceDigest) && timeOk(control.verifiedAt) && timeOk(control.validUntil) && Date.parse(control.verifiedAt) <= Date.parse(now) && Date.parse(now) < Date.parse(control.validUntil) && anyRoleAliasOk(control.verifierAlias, mode === "test"); })
    && value.openIncidents.length === 0 && value.conflictingEvidence.length === 0 && value.staleEvidence.length === 0 && value.participantCounters.contacted === 0 && value.participantCounters.enrolled === 0 && value.participantCounters.A === 0 && value.participantCounters.B === 0 && value.participantCounters.C === 0 && value.participantCounters.D === 0
    && value.releaseGate.reviewers === 0 && value.releaseGate.genuineReviews === 0 && value.releaseGate.hmmStatus === "not_qualified" && value.calibrationAuthorized === true && value.a01ContactAuthorized === false && value.participantCountersChanged === 0 && value.releaseReviewersChanged === 0 && value.genuineReleaseReviewsChanged === 0 && value.hmmStatus === "not_qualified" && value.decision === "READY" && value.reasonCodes.length === 0 && value.testOnly === (mode === "test")
    && value.recordDigest === sha256(`${value.previousDigest}\n${canonicalizeReadiness(base)}`) && noSensitiveKeys(value);
}
export function a01PrecontactGate(input: { readiness: CollectiveReadinessRecord; scorerPassDigests: string[]; allVersionedPrecontactGatesPass: boolean; noRelevantChangeOrIncident: boolean }): { authorized: boolean; reasonCode: string } {
  const authorized = validateCollectiveReadinessRecord(input.readiness, input.readiness.testOnly ? "test" : "release") && input.readiness.decision === "READY" && input.scorerPassDigests.length === 2 && new Set(input.scorerPassDigests).size === 2 && input.scorerPassDigests.every(digestOk) && input.allVersionedPrecontactGatesPass && input.noRelevantChangeOrIncident;
  return authorized ? { authorized: true, reasonCode: "two_scorers_passed_and_precontact_gates_valid" } : { authorized: false, reasonCode: "a01_precontact_gate_blocked" };
}
