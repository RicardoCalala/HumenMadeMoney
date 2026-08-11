import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { aggregateHumanReview, humanReviewMarkdown, sealLedger, type Adjudication, type ReviewerSubmission, type StudyManifest } from "../server/evaluation/human-review.ts";

const path = join(process.cwd(), "tests/fixtures/ai-evaluation/human-review/study-manifest.json");
const manifest = JSON.parse(await readFile(path, "utf8")) as StudyManifest;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const submission = (number: number, reviewerId = `TST-REV-REVIEWER${number}`, changes: Partial<ReviewerSubmission> = {}): ReviewerSubmission => ({
  recordType: "reviewer_submission", schemaVersion: manifest.resultSchemaVersion, studyVersion: manifest.studyVersion, rubricVersion: manifest.rubricVersion, datasetVersion: manifest.datasetVersion,
  submissionId: uuid(number), reviewerId, operatorId: "TST-OPR-OPERATOR1", submittedAt: `2026-08-10T12:0${number}:00.000Z`, testOnly: true,
  eligibility: { adult: true, productFamiliarityAttested: true, noConflictAttested: true, independentWorkAttested: true, noSensitiveDataIncluded: true },
  responses: manifest.sampledCaseIds.map((caseId) => { const expected = manifest.cases.find((item) => item.caseId === caseId)!.expected; return { caseId, ...expected, authorityBoundary: "advisory_only_no_funds_authority" as const }; }), ...changes
});
const adjudication = (a: ReviewerSubmission, b: ReviewerSubmission, caseId: string): Adjudication => ({
  recordType: "adjudication", schemaVersion: manifest.resultSchemaVersion, studyVersion: manifest.studyVersion, rubricVersion: manifest.rubricVersion, datasetVersion: manifest.datasetVersion,
  adjudicationId: uuid(90), adjudicatorId: "TST-ADJ-ADJUDCTR1", operatorId: "TST-OPR-OPERATOR1", submittedAt: "2026-08-10T13:00:00.000Z", testOnly: true,
  reviewerSubmissionIds: [a.submissionId, b.submissionId], caseId, resolution: manifest.cases.find((item) => item.caseId === caseId)!.expected, rationaleCode: "evidence_key_applied",
  eligibility: { noConflictAttested: true, independentOfReviewersAttested: true, noSensitiveDataIncluded: true }
});

test("missing and partial human evidence fail closed", () => {
  assert.equal(aggregateHumanReview(manifest, [], "release").status, "not_qualified");
  const partial = aggregateHumanReview(manifest, sealLedger([submission(1)]), "test");
  assert.equal(partial.status, "not_qualified"); assert.ok(partial.reasons.includes("minimum_completion_not_met"));
});

test("test-only records can never qualify the release path", () => {
  const report = aggregateHumanReview(manifest, sealLedger([submission(1), submission(2)]), "release");
  assert.equal(report.status, "not_qualified"); assert.equal(report.completion.eligibleReviewers, 0); assert.equal(report.provenance.rejectedRecordIds.length, 2);
});

test("duplicate replay and ledger tampering are rejected", () => {
  const sealed = sealLedger([submission(1), submission(2)]);
  const replay = aggregateHumanReview(manifest, [sealed[0], sealed[0]], "test"); assert.equal(replay.status, "not_qualified"); assert.equal(replay.provenance.tamperEvidentChain, false);
  const tampered = structuredClone(sealed); (tampered[0] as typeof sealed[0] & { reviewerId: string }).reviewerId = "TST-REV-TAMPERED1";
  assert.equal(aggregateHumanReview(manifest, tampered, "test").provenance.tamperEvidentChain, false);
});

test("invalid identity, non-independent pairing, and operator overlap fail", () => {
  assert.equal(aggregateHumanReview(manifest, sealLedger([submission(1, "bad"), submission(2)]), "test").status, "not_qualified");
  assert.ok(aggregateHumanReview(manifest, sealLedger([submission(1), submission(2, "TST-REV-REVIEWER1")]), "test").independence.reasons.includes("duplicate_reviewer_submission"));
  const overlap = submission(1, "TST-REV-REVIEWER1", { operatorId: "TST-REV-REVIEWER1" });
  assert.equal(aggregateHumanReview(manifest, sealLedger([overlap, submission(2)]), "test").status, "not_qualified");
});

test("wrong manifest, rubric, dataset, and schema versions are rejected", () => {
  for (const change of [{ studyVersion: "wrong" }, { rubricVersion: "wrong" }, { datasetVersion: "wrong" }, { schemaVersion: "wrong" }]) {
    assert.equal(aggregateHumanReview(manifest, sealLedger([submission(1, undefined, change), submission(2)]), "test").status, "not_qualified");
  }
});

test("unnecessary personal or free-text fields are rejected by the bounded release shape", () => {
  const extra = submission(1) as ReviewerSubmission & { reviewerName: string }; extra.reviewerName = "must-not-be-stored";
  const report = aggregateHumanReview(manifest, sealLedger([extra, submission(2)]), "test");
  assert.equal(report.status, "not_qualified"); assert.ok(report.provenance.rejectedRecordIds.includes(extra.submissionId));
});

test("unresolved disagreement blocks; eligible adjudication preserves and resolves it", () => {
  const a = submission(1); const b = submission(2); b.responses[0]!.action = "wait";
  const blocked = aggregateHumanReview(manifest, sealLedger([a, b]), "test"); assert.deepEqual(blocked.disagreement.unresolvedCaseIds, [manifest.sampledCaseIds[0]]); assert.equal(blocked.status, "not_qualified");
  const resolved = aggregateHumanReview(manifest, sealLedger([a, b, adjudication(a, b, manifest.sampledCaseIds[0]!)]), "test");
  assert.equal(resolved.status, "qualified"); assert.equal(resolved.provenance.acceptedSubmissionIds.length, 2); assert.deepEqual(resolved.disagreement.adjudicatedCaseIds, [manifest.sampledCaseIds[0]]);
});

test("critical authority misunderstanding always blocks qualification", () => {
  const bad = submission(2); bad.responses[0]!.authorityBoundary = "model_may_authorize_settlement";
  const report = aggregateHumanReview(manifest, sealLedger([submission(1), bad]), "test");
  assert.equal(report.status, "not_qualified"); assert.equal(report.metrics.authoritySafety.status, "fail"); assert.equal(report.criticalFailures.length, 1);
});

test("two reviewers agreeing on an incorrect conflict label cannot complete it", () => {
  const a = submission(1); const b = submission(2); const conflictId = manifest.conflictLabelCaseIds[0]!;
  a.responses.find((r) => r.caseId === conflictId)!.action = "wait"; b.responses.find((r) => r.caseId === conflictId)!.action = "wait";
  const report = aggregateHumanReview(manifest, sealLedger([a, b]), "test");
  assert.equal(report.status, "not_qualified"); assert.equal(report.conflictLabels.completed, 1); assert.ok(report.reasons.includes("two_reviewer_conflict_labels_incomplete"));
});

test("threshold boundary passes at 90 percent and fails below it", () => {
  const atBoundary = [submission(1), submission(2)];
  for (let i = 0; i < 3; i++) atBoundary[1]!.responses[i]!.result = "wrong";
  const adjudicated = atBoundary.map((s) => s);
  const records: (ReviewerSubmission | Adjudication)[] = [...adjudicated];
  for (let i = 0; i < 3; i++) records.push({ ...adjudication(atBoundary[0]!, atBoundary[1]!, manifest.sampledCaseIds[i]!), adjudicationId: uuid(91 + i) });
  const boundaryManifest = { ...manifest, thresholds: { ...manifest.thresholds, maximumDisagreementRate: 0.2 } };
  assert.equal(aggregateHumanReview(boundaryManifest, sealLedger(records), "test").metrics.comprehension.value, 0.9);
  atBoundary[1]!.responses[3]!.result = "wrong";
  assert.equal(aggregateHumanReview(manifest, sealLedger(atBoundary), "test").metrics.comprehension.status, "fail");
});

test("complete valid synthetic harness qualifies only test mode and renders deterministic redacted reports", () => {
  const records = sealLedger([submission(1), submission(2)]); const first = aggregateHumanReview(manifest, records, "test"); const second = aggregateHumanReview(manifest, records, "test");
  assert.deepEqual(first, second); assert.equal(first.status, "qualified"); assert.equal(first.coverage.coveredPartitions, 14); assert.equal(first.conflictLabels.completed, 2); assert.equal(first.networkRequests, 0);
  const markdown = humanReviewMarkdown(first); assert.match(markdown, /QUALIFIED/); assert.doesNotMatch(markdown, /REVIEWER1/);
});
