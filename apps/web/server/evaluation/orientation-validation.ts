import { createHash } from "node:crypto";

export const ORIENTATION_VERSIONS = {
  orientation: "human-review-orientation-v2",
  instrument: "authority-comprehension-instrument-v1",
  protocol: "orientation-validation-protocol-v1",
  rubric: "authority-comprehension-rubric-v1",
  resultSchema: "orientation-validation-result-v1",
  report: "orientation-validation-report-v1",
  study: "hmm-comprehension-study-v2",
  dataset: "authority-comprehension-dataset-v1",
} as const;

export type GroupCode = "A" | "B" | "C" | "D";
export type SemanticLabel = "demonstrated" | "not_demonstrated" | "ambiguous" | "unsafe";
export type ConceptTag = "advisory_contribution" | "no_autonomous_authority" | "separate_control_path" | "funds_settlement" | "financial_safety" | "reviewer_authority" | "resolution_authority" | "binding_consequences";
export type ItemId = "free_restatement" | "recognition_advice" | "recognition_controls" | "scenario_funds" | "scenario_safety" | "scenario_review" | "scenario_resolution";
export type ScoredLabel = { itemId: ItemId; tag: ConceptTag; label: SemanticLabel };
export type AdministrationRecord = {
  recordType: "administration"; recordId: string; participantId: string; operatorId: string; contactOrdinal: number; groupCode: GroupCode;
  instrumentVersion: typeof ORIENTATION_VERSIONS.instrument; orientationVersion: typeof ORIENTATION_VERSIONS.orientation; orderVersion: "order-a" | "order-b";
  startedAt: string; disposition: "completed" | "withdrawn" | "technical_loss" | "protocol_deviation"; responseDigest: string;
  supportMode: "none" | "accessible_format" | "assistive_technology" | "breaks" | "extra_time" | "navigation_only";
  attestations: { oneAttempt: true; noCorrectiveFeedback: true; noCoaching: true; noDiagnosisRequired: true; noPriorStudyExposure: true; laterReleaseGatingIneligible: true; pseudonymousOnly: true };
  testOnly: boolean;
};
export type ScoreRecord = {
  recordType: "score"; recordId: string; administrationId: string; participantId: string; scorerId: string; scoredAt: string;
  rubricVersion: typeof ORIENTATION_VERSIONS.rubric; labels: ScoredLabel[];
  attestations: { operatorSeparated: true; independentlyScored: true; otherScoreHidden: true; identityAndGroupHidden: true; frozenRubricOnly: true };
  testOnly: boolean;
};
export type AdjudicationRecord = {
  recordType: "adjudication"; recordId: string; administrationId: string; participantId: string; adjudicatorId: string; scorerRecordIds: [string, string];
  itemId: ItemId; tag: ConceptTag; finalLabel: SemanticLabel; adjudicatedAt: string; reasonCode: "semantic_equivalence" | "rubric_interpretation" | "label_correction";
  attestations: { independentOfOperatorAndScorers: true; originalResponseOnly: true; frozenRubricOnly: true; noNewResponseOrCoaching: true; cannotWaiveUnsafe: true };
  testOnly: boolean;
};
export type OperationalCheckRecord = {
  recordType: "operational_check"; recordId: string; check: "privacy_minimization" | "identity_mapping_separation" | "encrypted_backup_restore" | "independent_head_digest" | "network_and_credentials" | "accessibility" | "instrument_fidelity";
  status: "pass" | "critical_failure"; checkedAt: string; testOnly: boolean;
};
export type OrientationRecord = AdministrationRecord | ScoreRecord | AdjudicationRecord | OperationalCheckRecord;
export type SealedOrientationRecord = OrientationRecord & { previousDigest: string; recordDigest: string };

export type OrientationValidationReport = {
  validationStatus: "pass" | "fail" | "not_qualified"; recruitmentStatus: "pending_second_founder_approval"; hmmStatus: "not_qualified"; networkRequests: 0;
  versions: typeof ORIENTATION_VERSIONS; thresholds: { contactsMaximum: 16; enrolledRequired: 12; perGroupRequired: 3; overallDemonstratedMinimum: 10; perGroupDemonstratedMinimum: 2; initialAgreementMinimum: 0.9; kappaMinimum: 0.8 };
  cohort: { contacted: number; enrolled: number; groupEnrollment: Record<GroupCode, number>; demonstrated: number; groupDemonstrated: Record<GroupCode, number>; priorExposedAccepted: number; laterReleaseEligible: number };
  agreement: { agreed: number; total: number; rate: number; criticalAgreed: number; criticalTotal: number; criticalRate: number; kappa: number | null; informative: boolean };
  adjudication: { disagreements: number; resolved: number; unresolved: number; unsafeWaivers: number };
  integrity: { validChain: boolean; ledgerHeadDigest: string | null; rejectedRecordIds: string[]; criticalOperationalFailures: number };
  candidateDeterminations: { participantId: string; groupCode: GroupCode; demonstrated: boolean; unsafe: boolean; unresolvedAmbiguous: boolean }[];
  reasons: string[];
};

const TAGS: ConceptTag[] = ["advisory_contribution", "no_autonomous_authority", "separate_control_path", "funds_settlement", "financial_safety", "reviewer_authority", "resolution_authority", "binding_consequences"];
const ITEM_IDS: ItemId[] = ["free_restatement", "recognition_advice", "recognition_controls", "scenario_funds", "scenario_safety", "scenario_review", "scenario_resolution"];
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const canonicalize = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const timestampOk = (value: string) => Number.isFinite(Date.parse(value)) && value.endsWith("Z");
const recordIdOk = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const aliasOk = (value: string, role: "VAL" | "OPR" | "SCR" | "ADJ", testOnly: boolean) => new RegExp(`^${testOnly ? "TST-" : ""}${role}-[A-Z0-9]{8,32}$`).test(value);
const digestOk = (value: string) => /^[a-f0-9]{64}$/.test(value);
const exactKeys = (value: object, keys: string[]) => canonicalize(Object.keys(value).sort()) === canonicalize([...keys].sort());

// Kept separate so append-only callers never need to rebuild or overwrite prior records.
export function sealNextOrientationRecord(record: OrientationRecord, previousDigest = "GENESIS"): SealedOrientationRecord {
  return { ...record, previousDigest, recordDigest: sha256(`${previousDigest}\n${canonicalize(record)}`) };
}

// Correct serial sealing without mutating caller-owned records.
export function sealOrientationRecords(records: OrientationRecord[]): SealedOrientationRecord[] {
  let head = "GENESIS";
  return records.map((record) => { const sealed = sealNextOrientationRecord(record, head); head = sealed.recordDigest; return sealed; });
}

export const sealOrientationLedger = sealOrientationRecords;

function validateRecord(record: OrientationRecord, mode: "test" | "release"): boolean {
  const testOnly = mode === "test";
  if (record.testOnly !== testOnly || !recordIdOk(record.recordId)) return false;
  if (record.recordType === "administration") return exactKeys(record, ["recordType", "recordId", "participantId", "operatorId", "contactOrdinal", "groupCode", "instrumentVersion", "orientationVersion", "orderVersion", "startedAt", "disposition", "responseDigest", "supportMode", "attestations", "testOnly"]) && exactKeys(record.attestations, ["oneAttempt", "noCorrectiveFeedback", "noCoaching", "noDiagnosisRequired", "noPriorStudyExposure", "laterReleaseGatingIneligible", "pseudonymousOnly"]) && aliasOk(record.participantId, "VAL", testOnly) && aliasOk(record.operatorId, "OPR", testOnly) && record.participantId !== record.operatorId && record.contactOrdinal >= 1 && record.contactOrdinal <= 16 && ["A", "B", "C", "D"].includes(record.groupCode) && record.instrumentVersion === ORIENTATION_VERSIONS.instrument && record.orientationVersion === ORIENTATION_VERSIONS.orientation && timestampOk(record.startedAt) && digestOk(record.responseDigest) && Object.values(record.attestations).every(Boolean);
  if (record.recordType === "score") return exactKeys(record, ["recordType", "recordId", "administrationId", "participantId", "scorerId", "scoredAt", "rubricVersion", "labels", "attestations", "testOnly"]) && exactKeys(record.attestations, ["operatorSeparated", "independentlyScored", "otherScoreHidden", "identityAndGroupHidden", "frozenRubricOnly"]) && aliasOk(record.participantId, "VAL", testOnly) && aliasOk(record.scorerId, "SCR", testOnly) && record.rubricVersion === ORIENTATION_VERSIONS.rubric && timestampOk(record.scoredAt) && record.labels.length > 0 && new Set(record.labels.map((label) => `${label.itemId}:${label.tag}`)).size === record.labels.length && record.labels.every((label) => exactKeys(label, ["itemId", "tag", "label"]) && ITEM_IDS.includes(label.itemId) && TAGS.includes(label.tag) && ["demonstrated", "not_demonstrated", "ambiguous", "unsafe"].includes(label.label)) && Object.values(record.attestations).every(Boolean);
  if (record.recordType === "adjudication") return exactKeys(record, ["recordType", "recordId", "administrationId", "participantId", "adjudicatorId", "scorerRecordIds", "itemId", "tag", "finalLabel", "adjudicatedAt", "reasonCode", "attestations", "testOnly"]) && exactKeys(record.attestations, ["independentOfOperatorAndScorers", "originalResponseOnly", "frozenRubricOnly", "noNewResponseOrCoaching", "cannotWaiveUnsafe"]) && aliasOk(record.participantId, "VAL", testOnly) && aliasOk(record.adjudicatorId, "ADJ", testOnly) && record.scorerRecordIds.length === 2 && new Set(record.scorerRecordIds).size === 2 && ITEM_IDS.includes(record.itemId) && TAGS.includes(record.tag) && timestampOk(record.adjudicatedAt) && Object.values(record.attestations).every(Boolean);
  return exactKeys(record, ["recordType", "recordId", "check", "status", "checkedAt", "testOnly"]) && timestampOk(record.checkedAt);
}

export function aggregateOrientationValidation(rawRecords: unknown[], mode: "test" | "release" = "release"): OrientationValidationReport {
  const accepted: OrientationRecord[] = []; const rejectedRecordIds: string[] = []; const seen = new Set<string>(); let head = "GENESIS"; let validChain = true;
  for (const raw of rawRecords) {
    const sealed = raw as Partial<SealedOrientationRecord>; const base = { ...(sealed as Record<string, unknown>) }; delete base.previousDigest; delete base.recordDigest;
    const id = String(sealed.recordId ?? ""); const chainOk = sealed.previousDigest === head && sealed.recordDigest === sha256(`${head}\n${canonicalize(base)}`);
    if (!chainOk) validChain = false; else head = sealed.recordDigest!;
    if (!chainOk || seen.has(id) || !validateRecord(base as OrientationRecord, mode)) rejectedRecordIds.push(id || "missing"); else { seen.add(id); accepted.push(base as OrientationRecord); }
  }
  const administrations = accepted.filter((r): r is AdministrationRecord => r.recordType === "administration");
  const scores = accepted.filter((r): r is ScoreRecord => r.recordType === "score");
  const adjudications = accepted.filter((r): r is AdjudicationRecord => r.recordType === "adjudication");
  const checks = accepted.filter((r): r is OperationalCheckRecord => r.recordType === "operational_check");
  const groupEnrollment = { A: 0, B: 0, C: 0, D: 0 }; const groupDemonstrated = { A: 0, B: 0, C: 0, D: 0 };
  const determinations: OrientationValidationReport["candidateDeterminations"] = []; let agreed = 0; let total = 0; let criticalAgreed = 0; let criticalTotal = 0; const matrix: [SemanticLabel, SemanticLabel][] = []; let disagreementCount = 0; let resolved = 0; let unsafeWaivers = 0;
  for (const admin of administrations) {
    groupEnrollment[admin.groupCode]++;
    const pair = scores.filter((score) => score.administrationId === admin.recordId && score.participantId === admin.participantId);
    const finalLabels = new Map<string, SemanticLabel>();
    if (pair.length === 2 && pair[0]!.scorerId !== pair[1]!.scorerId) {
      const a = new Map(pair[0]!.labels.map((label) => [`${label.itemId}:${label.tag}`, label.label])); const b = new Map(pair[1]!.labels.map((label) => [`${label.itemId}:${label.tag}`, label.label]));
      for (const key of new Set([...a.keys(), ...b.keys()])) {
        const one = a.get(key); const two = b.get(key); if (!one || !two) { disagreementCount++; continue; }
        const conceptTag = key.split(":")[1] as ConceptTag; const critical = !["advisory_contribution", "no_autonomous_authority", "separate_control_path"].includes(conceptTag);
        matrix.push([one, two]); total++; if (critical) criticalTotal++; if (one === two) { agreed++; if (critical) criticalAgreed++; finalLabels.set(key, one); continue; }
        disagreementCount++;
        const [itemId, tag] = key.split(":") as [ItemId, ConceptTag]; const decision = adjudications.find((r) => r.administrationId === admin.recordId && r.itemId === itemId && r.tag === tag && r.scorerRecordIds.includes(pair[0]!.recordId) && r.scorerRecordIds.includes(pair[1]!.recordId));
        if (decision) { const unsafeInitial = one === "unsafe" || two === "unsafe"; if (unsafeInitial && decision.finalLabel !== "unsafe") unsafeWaivers++; else { finalLabels.set(key, decision.finalLabel); resolved++; } }
      }
    }
    const values = [...finalLabels.values()]; const unsafe = values.includes("unsafe"); const unresolvedAmbiguous = TAGS.some((tag) => [...finalLabels].some(([key, label]) => key.endsWith(`:${tag}`) && label === "ambiguous") && ![...finalLabels].some(([key, label]) => key.endsWith(`:${tag}`) && label === "demonstrated"));
    const tagDemonstrated = (tag: ConceptTag) => [...finalLabels].some(([key, label]) => key.endsWith(`:${tag}`) && label === "demonstrated");
    const demonstrated = admin.disposition === "completed" && pair.length === 2 && !unsafe && !unresolvedAmbiguous && TAGS.every(tagDemonstrated);
    if (demonstrated) groupDemonstrated[admin.groupCode]++;
    determinations.push({ participantId: admin.participantId, groupCode: admin.groupCode, demonstrated, unsafe, unresolvedAmbiguous });
  }
  const labels: SemanticLabel[] = ["demonstrated", "not_demonstrated", "ambiguous", "unsafe"]; const n = matrix.length; const po = n ? agreed / n : 0;
  const pe = n ? labels.reduce((sum, label) => sum + (matrix.filter(([a]) => a === label).length / n) * (matrix.filter(([, b]) => b === label).length / n), 0) : 0;
  const informative = n > 0 && pe < 1; const kappa = informative ? (po - pe) / (1 - pe) : null;
  const uniqueContacts = new Set(administrations.map((r) => r.contactOrdinal)); const contacted = administrations.reduce((maximum, record) => Math.max(maximum, record.contactOrdinal), 0); const demonstrated = determinations.filter((r) => r.demonstrated).length; const criticalOperationalFailures = checks.filter((r) => r.status === "critical_failure").length;
  const requiredChecks = new Set<OperationalCheckRecord["check"]>(["privacy_minimization", "identity_mapping_separation", "encrypted_backup_restore", "independent_head_digest", "network_and_credentials", "accessibility", "instrument_fidelity"]);
  const reasons: string[] = [];
  if (!validChain || rejectedRecordIds.length) reasons.push("ledger_or_record_integrity_failure");
  if (uniqueContacts.size > 16 || administrations.some((r) => r.contactOrdinal > 16)) reasons.push("contact_frame_exceeded");
  if (administrations.length !== 12 || Object.values(groupEnrollment).some((count) => count !== 3)) reasons.push("cohort_not_exactly_12_or_three_per_group");
  if (new Set(administrations.map((r) => r.participantId)).size !== administrations.length || new Set(administrations.map((r) => r.contactOrdinal)).size !== administrations.length) reasons.push("duplicate_participant_or_contact_slot");
  if (scores.some((s) => administrations.some((a) => a.operatorId === s.scorerId)) || adjudications.some((a) => scores.some((s) => s.scorerId === a.adjudicatorId))) reasons.push("role_separation_failure");
  if (demonstrated < 10 || Object.values(groupDemonstrated).some((count) => count < 2)) reasons.push("comprehension_threshold_not_met");
  if (determinations.some((r) => r.demonstrated && r.unsafe)) reasons.push("unsafe_belief_accepted");
  const criticalRate = criticalTotal ? criticalAgreed / criticalTotal : 0;
  if (po < 0.9 || criticalRate < 0.9 || (informative && (kappa ?? 0) < 0.8)) reasons.push("agreement_threshold_not_met");
  if (disagreementCount !== resolved || unsafeWaivers) reasons.push("adjudication_incomplete_or_unsafe_waiver");
  if (criticalOperationalFailures || [...requiredChecks].some((kind) => !checks.some((r) => r.check === kind && r.status === "pass"))) reasons.push("critical_operational_check_failure");
  if (scores.some((score) => !administrations.some((admin) => admin.recordId === score.administrationId && admin.participantId === score.participantId))) reasons.push("orphan_score_record");
  const validationStatus = reasons.length ? administrations.length ? "fail" : "not_qualified" : "pass";
  return { validationStatus, recruitmentStatus: "pending_second_founder_approval", hmmStatus: "not_qualified", networkRequests: 0, versions: ORIENTATION_VERSIONS, thresholds: { contactsMaximum: 16, enrolledRequired: 12, perGroupRequired: 3, overallDemonstratedMinimum: 10, perGroupDemonstratedMinimum: 2, initialAgreementMinimum: 0.9, kappaMinimum: 0.8 }, cohort: { contacted, enrolled: administrations.length, groupEnrollment, demonstrated, groupDemonstrated, priorExposedAccepted: 0, laterReleaseEligible: 0 }, agreement: { agreed, total, rate: po, criticalAgreed, criticalTotal, criticalRate, kappa, informative }, adjudication: { disagreements: disagreementCount, resolved, unresolved: disagreementCount - resolved, unsafeWaivers }, integrity: { validChain, ledgerHeadDigest: validChain && rawRecords.length ? head : null, rejectedRecordIds, criticalOperationalFailures }, candidateDeterminations: determinations.sort((a, b) => a.participantId.localeCompare(b.participantId)), reasons };
}

export function orientationValidationMarkdown(report: OrientationValidationReport): string {
  return `# Sprint 6.5.4 orientation validation\n\nOffline synthetic validation: **${report.validationStatus.toUpperCase()}**  \nRecruitment: **PENDING SECOND FOUNDER APPROVAL — NO RECRUITMENT**  \nHMM release gate: **NOT_QUALIFIED — 0/2 release reviewers, 0/30 genuine reviews**  \nNetwork requests: **0**\n\n- Cohort: ${report.cohort.enrolled}/12; groups A/B/C/D: ${Object.values(report.cohort.groupEnrollment).join("/")}\n- Demonstrated: ${report.cohort.demonstrated}/12; groups: ${Object.values(report.cohort.groupDemonstrated).join("/")}\n- Initial agreement: ${report.agreement.agreed}/${report.agreement.total} (${(report.agreement.rate * 100).toFixed(2)}%); critical: ${report.agreement.criticalAgreed}/${report.agreement.criticalTotal} (${(report.agreement.criticalRate * 100).toFixed(2)}%)\n- Cohen's kappa: ${report.agreement.informative ? report.agreement.kappa!.toFixed(4) : "not informative"}\n- Adjudication: ${report.adjudication.resolved}/${report.adjudication.disagreements}; unsafe waivers: ${report.adjudication.unsafeWaivers}\n- Ledger: ${report.integrity.validChain ? "valid" : "invalid"}; head: ${report.integrity.ledgerHeadDigest ?? "none"}\n\nReasons: ${report.reasons.join(", ") || "all offline synthetic validation gates passed"}\n\nThis report contains no raw responses, names, contacts, diagnoses, detailed background, employer, education, credentials, or provider data.\n`;
}
