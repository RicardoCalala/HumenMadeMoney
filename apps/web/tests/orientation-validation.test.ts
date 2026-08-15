import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { aggregateOrientationValidation, orientationValidationMarkdown, sealOrientationLedger, type AdministrationRecord, type AdjudicationRecord, type ConceptTag, type OperationalCheckRecord, type OrientationRecord, type ScoreRecord, type ScoredLabel } from "../server/evaluation/orientation-validation.ts";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const digest = (n: number) => n.toString(16).padStart(64, "0");
const tags: ConceptTag[] = ["advisory_contribution", "no_autonomous_authority", "separate_control_path", "funds_settlement", "financial_safety", "reviewer_authority", "resolution_authority", "binding_consequences"];
const labels = (variant = 0): ScoredLabel[] => [
  { itemId: "free_restatement", tag: "advisory_contribution", label: "demonstrated" },
  { itemId: "free_restatement", tag: "no_autonomous_authority", label: "demonstrated" },
  { itemId: "free_restatement", tag: "separate_control_path", label: "demonstrated" },
  { itemId: "recognition_advice", tag: "advisory_contribution", label: variant % 3 === 0 ? "not_demonstrated" : "demonstrated" },
  { itemId: "recognition_controls", tag: "separate_control_path", label: "demonstrated" },
  { itemId: "scenario_funds", tag: "funds_settlement", label: "demonstrated" },
  { itemId: "scenario_safety", tag: "financial_safety", label: "demonstrated" },
  { itemId: "scenario_review", tag: "reviewer_authority", label: "demonstrated" },
  { itemId: "scenario_resolution", tag: "resolution_authority", label: "demonstrated" },
  { itemId: "scenario_resolution", tag: "binding_consequences", label: "demonstrated" },
];
const admin = (n: number, changes: Partial<AdministrationRecord> = {}): AdministrationRecord => ({
  recordType: "administration", recordId: uuid(n), participantId: `TST-VAL-PARTICIPANT${String(n).padStart(2, "0")}`, operatorId: "TST-OPR-OPERATOR01", contactOrdinal: n,
  groupCode: (["A", "B", "C", "D"] as const)[Math.floor((n - 1) / 3)]!, instrumentVersion: "authority-comprehension-instrument-v1", orientationVersion: "human-review-orientation-v2", orderVersion: n % 2 ? "order-a" : "order-b",
  startedAt: `2026-08-14T12:${String(n).padStart(2, "0")}:00.000Z`, disposition: "completed", responseDigest: digest(n), supportMode: "none",
  attestations: { oneAttempt: true, noCorrectiveFeedback: true, noCoaching: true, noDiagnosisRequired: true, noPriorStudyExposure: true, laterReleaseGatingIneligible: true, pseudonymousOnly: true }, testOnly: true, ...changes,
});
const score = (a: AdministrationRecord, scorer: 1 | 2, number: number, changes: Partial<ScoreRecord> = {}): ScoreRecord => ({
  recordType: "score", recordId: uuid(number), administrationId: a.recordId, participantId: a.participantId, scorerId: `TST-SCR-SCORER000${scorer}`, scoredAt: `2026-08-14T14:${String(a.contactOrdinal).padStart(2, "0")}:00.000Z`, rubricVersion: "authority-comprehension-rubric-v1", labels: labels(a.contactOrdinal),
  attestations: { operatorSeparated: true, independentlyScored: true, otherScoreHidden: true, identityAndGroupHidden: true, frozenRubricOnly: true }, testOnly: true, ...changes,
});
const checks = (): OperationalCheckRecord[] => (["privacy_minimization", "identity_mapping_separation", "encrypted_backup_restore", "independent_head_digest", "network_and_credentials", "accessibility", "instrument_fidelity"] as const).map((check, index) => ({ recordType: "operational_check", recordId: uuid(800 + index), check, status: "pass", checkedAt: `2026-08-14T16:0${index}:00.000Z`, testOnly: true }));
const complete = (): OrientationRecord[] => {
  const records: OrientationRecord[] = [];
  for (let n = 1; n <= 12; n++) { const a = admin(n); records.push(a, score(a, 1, 100 + n), score(a, 2, 200 + n)); }
  return [...records, ...checks()];
};

test("complete four-group synthetic cohort passes validation mechanics but cannot qualify HMM or authorize recruitment", () => {
  const report = aggregateOrientationValidation(sealOrientationLedger(complete()), "test");
  assert.equal(report.validationStatus, "pass"); assert.equal(report.recruitmentStatus, "pending_second_founder_approval"); assert.equal(report.hmmStatus, "not_qualified"); assert.equal(report.networkRequests, 0);
  assert.deepEqual(report.cohort.groupEnrollment, { A: 3, B: 3, C: 3, D: 3 }); assert.deepEqual(report.cohort.groupDemonstrated, { A: 3, B: 3, C: 3, D: 3 });
  assert.equal(report.agreement.rate, 1); assert.equal(report.agreement.kappa, 1); assert.equal(report.cohort.laterReleaseEligible, 0); assert.equal(report.cohort.priorExposedAccepted, 0);
  assert.match(orientationValidationMarkdown(report), /PENDING SECOND FOUNDER APPROVAL — NO RECRUITMENT/); assert.match(orientationValidationMarkdown(report), /0\/2 release reviewers, 0\/30 genuine reviews/);
});

test("combined predeclared evidence can demonstrate comprehension without exhaustive free enumeration", () => {
  const records = complete(); const firstAdmin = records.find((r): r is AdministrationRecord => r.recordType === "administration")!;
  for (const r of records.filter((r): r is ScoreRecord => r.recordType === "score" && r.administrationId === firstAdmin.recordId)) {
    r.labels = r.labels.filter((label) => label.itemId !== "free_restatement" || ["advisory_contribution", "no_autonomous_authority"].includes(label.tag));
  }
  const report = aggregateOrientationValidation(sealOrientationLedger(records), "test");
  assert.equal(report.candidateDeterminations[0]!.demonstrated, true); assert.equal(report.validationStatus, "pass");
});

test("ordinary wording and umbrella fixtures are terminology-independent", async () => {
  const fixtures = JSON.parse(await readFile(join(process.cwd(), "tests/fixtures/ai-evaluation/orientation-validation/semantic-fixtures.json"), "utf8")) as { id: string; text: string; expected: string }[];
  assert.ok(fixtures.some((f) => f.id === "umbrella-ordinary-language" && f.expected === "demonstrated" && /only give advice/i.test(f.text)));
  assert.ok(fixtures.some((f) => f.id === "semantic-equivalent" && f.expected === "demonstrated"));
  assert.ok(fixtures.every((f) => !/Human Made Money|HMM|Financial Safety|record_resolution|MCP/.test(f.text)));
  assert.deepEqual(new Set(fixtures.map((f) => f.expected)), new Set(["demonstrated", "not_demonstrated", "ambiguous", "unsafe"]));
});

test("not demonstrated is insufficient evidence while ambiguous and autonomous authority fail closed", () => {
  for (const unsafeLabel of ["unsafe", "ambiguous"] as const) {
    const records = complete(); const target = records.find((r): r is ScoreRecord => r.recordType === "score")!;
    const peer = records.find((r): r is ScoreRecord => r.recordType === "score" && r.administrationId === target.administrationId && r.recordId !== target.recordId)!;
    target.labels.find((l) => l.tag === "funds_settlement")!.label = unsafeLabel; peer.labels.find((l) => l.tag === "funds_settlement")!.label = unsafeLabel;
    const report = aggregateOrientationValidation(sealOrientationLedger(records), "test"); assert.equal(report.candidateDeterminations[0]!.demonstrated, false); assert.equal(report.candidateDeterminations[0]![unsafeLabel === "unsafe" ? "unsafe" : "unresolvedAmbiguous"], true);
  }
  const records = complete(); const target = records.find((r): r is ScoreRecord => r.recordType === "score")!; const peer = records.find((r): r is ScoreRecord => r.recordType === "score" && r.administrationId === target.administrationId && r.recordId !== target.recordId)!;
  target.labels.find((l) => l.itemId === "recognition_advice")!.label = "not_demonstrated"; peer.labels.find((l) => l.itemId === "recognition_advice")!.label = "not_demonstrated";
  assert.equal(aggregateOrientationValidation(sealOrientationLedger(records), "test").candidateDeterminations[0]!.demonstrated, true);
});

test("ambiguity can be resolved only by another predeclared neutral item", () => {
  const records = complete(); const targetAdmin = records.find((r): r is AdministrationRecord => r.recordType === "administration")!;
  for (const scorer of records.filter((r): r is ScoreRecord => r.recordType === "score" && r.administrationId === targetAdmin.recordId)) {
    scorer.labels.find((label) => label.itemId === "free_restatement" && label.tag === "no_autonomous_authority")!.label = "ambiguous";
    scorer.labels.push({ itemId: "scenario_resolution", tag: "no_autonomous_authority", label: "demonstrated" });
  }
  const report = aggregateOrientationValidation(sealOrientationLedger(records), "test"); assert.equal(report.candidateDeterminations[0]!.unresolvedAmbiguous, false); assert.equal(report.candidateDeterminations[0]!.demonstrated, true);
});

test("adjudication is bounded and cannot waive either scorer's unsafe finding", () => {
  const records = complete(); const a = records.find((r): r is ScoreRecord => r.recordType === "score")!; const b = records.find((r): r is ScoreRecord => r.recordType === "score" && r.administrationId === a.administrationId && r.recordId !== a.recordId)!;
  a.labels.find((l) => l.tag === "funds_settlement")!.label = "unsafe";
  const adjudication: AdjudicationRecord = { recordType: "adjudication", recordId: uuid(700), administrationId: a.administrationId, participantId: a.participantId, adjudicatorId: "TST-ADJ-ADJUDCTR01", scorerRecordIds: [a.recordId, b.recordId], itemId: "scenario_funds", tag: "funds_settlement", finalLabel: "demonstrated", adjudicatedAt: "2026-08-14T17:00:00.000Z", reasonCode: "rubric_interpretation", attestations: { independentOfOperatorAndScorers: true, originalResponseOnly: true, frozenRubricOnly: true, noNewResponseOrCoaching: true, cannotWaiveUnsafe: true }, testOnly: true };
  const report = aggregateOrientationValidation(sealOrientationLedger([...records, adjudication]), "test"); assert.equal(report.validationStatus, "fail"); assert.equal(report.adjudication.unsafeWaivers, 1); assert.ok(report.reasons.includes("adjudication_incomplete_or_unsafe_waiver"));
});

test("cohort and threshold controls reject frame, count, group, overall, and per-group violations", () => {
  const missing = complete().filter((r) => !(r.recordType !== "operational_check" && "participantId" in r && r.participantId.endsWith("12")));
  assert.ok(aggregateOrientationValidation(sealOrientationLedger(missing), "test").reasons.includes("cohort_not_exactly_12_or_three_per_group"));
  const wrongGroup = complete(); (wrongGroup.find((r): r is AdministrationRecord => r.recordType === "administration" && r.participantId.endsWith("12"))!).groupCode = "A";
  assert.ok(aggregateOrientationValidation(sealOrientationLedger(wrongGroup), "test").reasons.includes("cohort_not_exactly_12_or_three_per_group"));
  const lowGroup = complete(); for (const r of lowGroup.filter((r): r is ScoreRecord => r.recordType === "score" && ["TST-VAL-PARTICIPANT01", "TST-VAL-PARTICIPANT02"].includes(r.participantId))) r.labels.find((l) => l.tag === "funds_settlement")!.label = "unsafe";
  assert.ok(aggregateOrientationValidation(sealOrientationLedger(lowGroup), "test").reasons.includes("comprehension_threshold_not_met"));
  const boundary = complete(); for (const r of boundary.filter((r): r is ScoreRecord => r.recordType === "score" && ["TST-VAL-PARTICIPANT01", "TST-VAL-PARTICIPANT04"].includes(r.participantId))) r.labels.find((l) => l.tag === "funds_settlement")!.label = "unsafe";
  const boundaryReport = aggregateOrientationValidation(sealOrientationLedger(boundary), "test"); assert.equal(boundaryReport.cohort.demonstrated, 10); assert.deepEqual(boundaryReport.cohort.groupDemonstrated, { A: 2, B: 2, C: 3, D: 3 }); assert.equal(boundaryReport.validationStatus, "pass");
  const expanded = complete(); (expanded.find((r): r is AdministrationRecord => r.recordType === "administration" && r.contactOrdinal === 12))!.contactOrdinal = 17;
  assert.equal(aggregateOrientationValidation(sealOrientationLedger(expanded), "test").validationStatus, "fail");
});

test("privacy, exact shape, test/release separation, tamper evidence, and deterministic reporting fail closed", () => {
  const records = complete(); const leaked = records[0] as AdministrationRecord & { name: string }; leaked.name = "must-not-be-stored";
  const sealed = sealOrientationLedger(records); const first = aggregateOrientationValidation(sealed, "test"); const second = aggregateOrientationValidation(sealed, "test"); assert.deepEqual(first, second); assert.ok(first.integrity.rejectedRecordIds.length > 0);
  const tampered = structuredClone(sealOrientationLedger(complete())); (tampered[0] as AdministrationRecord).contactOrdinal = 16; assert.equal(aggregateOrientationValidation(tampered, "test").integrity.validChain, false);
  assert.equal(aggregateOrientationValidation(sealOrientationLedger(complete()), "release").validationStatus, "not_qualified");
});

test("all critical offline operational checks are mandatory and one-attempt/no-coaching attestations are closed", () => {
  const missingCheck = complete().filter((r) => r.recordType !== "operational_check" || r.check !== "network_and_credentials"); assert.ok(aggregateOrientationValidation(sealOrientationLedger(missingCheck), "test").reasons.includes("critical_operational_check_failure"));
  const extra = admin(1) as AdministrationRecord & { retryAllowed: boolean }; extra.retryAllowed = true; assert.equal(aggregateOrientationValidation(sealOrientationLedger([extra]), "test").integrity.rejectedRecordIds.length, 1);
  assert.deepEqual(tags.length, 8);
});
