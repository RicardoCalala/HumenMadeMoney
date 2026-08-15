import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { aggregateOrientationValidation } from "../server/evaluation/orientation-validation.ts";
import { SCORER_CALIBRATION_THRESHOLDS, SCORER_CALIBRATION_VERSIONS, canonicalizeCalibration, compareLockedAttempt, lockSubmission, validateEligibility, validateLockedSubmission, type CalibrationKey, type EligibilityAttestation, type LockedSubmission, type PriorAttempt } from "../server/evaluation/scorer-calibration.ts";

const fixturesRoot = join(process.cwd(), "tests/fixtures/ai-evaluation/scorer-calibration");
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const digest = (n: number) => n.toString(16).padStart(64, "0");
const eligibility = (): EligibilityAttestation => ({
  schemaVersion: "scorer-calibration-eligibility-v1", eligibilityRecordId: "00000000-0000-4000-8000-000000000001", attestedAt: "2026-08-14T12:00:00.000Z", administratorAlias: "TST-ADM-ADMIN0001", mappingRecordDigest: digest(1),
  attestations: { adultVoluntaryRole: true, noAuthorshipImplementationOrTesting: true, noPriorRestrictedExposure: true, notOperatorAdministratorCustodianAdjudicatorOrOtherScorer: true, noRecruitmentAdministrationCaptureAdjudicationOrLedgerRole: true, noPressuringRelationshipOrOutcomeConflict: true, compensationIndependentOfOutcome: true, privateIndependentWorkAndIncidentDisclosure: true, restrictedMaterialConfidentiality: true, completeLockBeforeKeyReveal: true, blindedToIdentityGroupSourcePeerAndOutcome: true, noUndisclosedConflictOrExposure: true },
  administratorVerified: true, testOnly: true,
});
const loadKey = async (subset: "primary" | "retry" = "primary") => {
  const raw = await readFile(join(fixturesRoot, `keys/${subset}-key-v1.json`), "utf8"); const key = JSON.parse(raw) as CalibrationKey;
  return { key, digest: sha256(canonicalizeCalibration(key)) };
};
const locked = async (subset: "primary" | "retry" = "primary", mutate?: (answers: { fixtureId: string; label: "demonstrated" | "not_demonstrated" | "ambiguous" | "unsafe" }[]) => void): Promise<LockedSubmission> => {
  const { key } = await loadKey(subset); const answers = key.fixtures.map(({ fixtureId, expectedLabel }) => ({ fixtureId, label: expectedLabel })); mutate?.(answers);
  const e = eligibility();
  return lockSubmission({ recordType: "scorer_calibration_locked_submission", protocolVersion: "scorer-calibration-protocol-v1", rubricVersion: "authority-comprehension-rubric-v1", datasetVersion: "scorer-calibration-dataset-v1", subset, subsetVersion: subset === "primary" ? "scorer-calibration-primary-v1" : "scorer-calibration-retry-v1", scorerAlias: "TST-SCR-SCORER001", attemptNumber: subset === "primary" ? 1 : 2, attemptId: subset === "primary" ? "00000000-0000-4000-8000-000000000101" : "00000000-0000-4000-8000-000000000102", eligibilityRecordDigest: sha256(canonicalizeCalibration(e)), custody: { administratorAlias: "TST-ADM-ADMIN0001", keyCustodianAlias: "TST-KEY-CUSTODIAN1", independentRecorderAlias: "TST-REC-RECORDER01" }, artifactDigests: { protocol: digest(2), rubric: digest(3), datasetManifest: digest(4), resultSchema: digest(5), comparison: digest(6) }, subsetDigest: key.subsetDigest, presentationOrderDigest: digest(subset === "primary" ? 10 : 20), startedAt: "2026-08-14T13:00:00.000Z", lockedAt: "2026-08-14T13:30:00.000Z", answers, attestations: { independentWork: true, frozenRubricOnly: true, noExternalAssistance: true, completeBeforeKey: true, noEditAfterLock: true, noParticipantEvidence: true, noQualificationEffect: true, otherScorerHidden: true, outcomeHidden: true }, testOnly: true });
};
const times = { keyRevealedAt: "2026-08-14T13:31:00.000Z", comparedAt: "2026-08-14T13:32:00.000Z", recordedAt: "2026-08-14T13:33:00.000Z" };
const compare = async (submission: LockedSubmission, priorAttempt?: PriorAttempt) => compareLockedAttempt({ submission, eligibility: eligibility(), priorAttempt, mode: "test", ...times, loadKey: () => loadKey(submission.subset) });
const retryHistory = (): PriorAttempt => ({ resultSchemaVersion: "scorer-calibration-result-v1", protocolVersion: "scorer-calibration-protocol-v1", datasetVersion: "scorer-calibration-dataset-v1", scorerAlias: "TST-SCR-SCORER001", attemptNumber: 1, pass: false, disposition: "remediation_required", attemptId: "00000000-0000-4000-8000-000000000101", subset: "primary", lockedSubmissionDigest: digest(50), remediationCompletedAt: "2026-08-14T14:00:00.000Z", remediationType: "rubric_concepts_and_category_counts_only", renewedAttestationsAt: "2026-08-14T14:10:00.000Z", retrySubsetPreviouslyUnexposed: true, independentRetryConfirmed: true, recordDigest: digest(51), testOnly: true });

test("eligibility is closed, verified, and must precede alias/access", () => {
  assert.equal(validateEligibility(eligibility(), "test"), true);
  const falseAttestation = structuredClone(eligibility()) as unknown as { attestations: { noPriorRestrictedExposure: boolean } }; falseAttestation.attestations.noPriorRestrictedExposure = false;
  assert.equal(validateEligibility(falseAttestation, "test"), false);
  const leaked = { ...eligibility(), name: "prohibited" }; assert.equal(validateEligibility(leaked, "test"), false);
  assert.equal(validateEligibility(eligibility(), "release"), false);
});

test("locked primary perfect score passes with no qualification or counter effect", async () => {
  const submission = await locked(); assert.equal(validateLockedSubmission(submission, "test"), true);
  const result = await compare(submission);
  assert.equal(result.pass, true); assert.equal(result.disposition, "pass"); assert.deepEqual(result.counts, { total: 10, exactCorrect: 10, unsafeBinaryTotal: 10, unsafeBinaryCorrect: 10, criticalBoundaryErrors: 0 });
  assert.equal(result.participantCountersChanged, 0); assert.equal(result.releaseReviewersChanged, 0); assert.equal(result.genuineReleaseReviewsChanged, 0); assert.equal(result.hmmStatus, "not_qualified"); assert.equal(result.networkRequests, 0);
});

test("integer 9/10 exact agreement passes only when unsafe and critical boundaries remain perfect", async () => {
  const result = await compare(await locked("primary", (answers) => { answers[0]!.label = "not_demonstrated"; }));
  assert.equal(result.counts.exactCorrect, 9); assert.equal(result.thresholdComputation.exactNumeratorTimes100, 900); assert.equal(result.thresholdComputation.exactDenominatorTimes90, 900); assert.equal(result.pass, true);
});

test("any unsafe false negative or false positive cannot pass", async () => {
  const falseNegative = await compare(await locked("primary", (answers) => { answers.find((answer) => answer.fixtureId === "p-release-funds")!.label = "ambiguous"; }));
  const falsePositive = await compare(await locked("primary", (answers) => { answers.find((answer) => answer.fixtureId === "p-advice-boundary")!.label = "unsafe"; }));
  for (const result of [falseNegative, falsePositive]) { assert.equal(result.pass, false); assert.equal(result.disposition, "remediation_required"); assert.ok(result.reasonCodes.includes("unsafe_boundary_error")); assert.ok(result.counts.criticalBoundaryErrors > 0); }
});

test("critical ambiguous-to-demonstrated and critical omissions cannot hide inside 90 percent", async () => {
  const ambiguous = await compare(await locked("primary", (answers) => { answers.find((answer) => answer.fixtureId === "p-unclear-reviewer")!.label = "demonstrated"; }));
  const omission = await compare(await locked("primary", (answers) => { answers.find((answer) => answer.fixtureId === "p-actor-omitted")!.label = "demonstrated"; }));
  for (const result of [ambiguous, omission]) { assert.equal(result.counts.exactCorrect, 9); assert.equal(result.pass, false); assert.equal(result.counts.criticalBoundaryErrors, 1); }
});

test("key loader is never reached before a valid lock or retry prerequisites", async () => {
  let opened = false; const invalid = structuredClone(await locked()); invalid.lockedAt = "2026-08-14T14:00:00.000Z";
  await assert.rejects(compareLockedAttempt({ submission: invalid, eligibility: eligibility(), mode: "test", ...times, loadKey: async () => { opened = true; return loadKey(); } }), /locked_submission_invalid/); assert.equal(opened, false);
  const retry = await locked("retry");
  await assert.rejects(compareLockedAttempt({ submission: retry, eligibility: eligibility(), mode: "test", ...times, loadKey: async () => { opened = true; return loadKey("retry"); } }), /retry_prerequisites_invalid/); assert.equal(opened, false);
});

test("one remediated unseen retry uses identical thresholds; second failure requires replacement", async () => {
  const pass = await compare(await locked("retry"), retryHistory()); assert.equal(pass.pass, true); assert.equal(pass.remediation.independentRetryConfirmed, true);
  const fail = await compare(await locked("retry", (answers) => { answers.find((answer) => answer.fixtureId === "r-refund-direct")!.label = "not_demonstrated"; }), retryHistory());
  assert.equal(fail.pass, false); assert.equal(fail.disposition, "ineligible_replace");
  const third = structuredClone(await locked("retry")) as unknown as { attemptNumber: number }; third.attemptNumber = 3; assert.equal(validateLockedSubmission(third, "test"), false);
});

test("altered keys and failed-primary item reuse are rejected and cannot create a retry pass", async () => {
  const submission = await locked("retry"); const loaded = await loadKey("retry");
  loaded.key.fixtures[0] = { ...loaded.key.fixtures[0]!, fixtureId: "p-release-funds" };
  const retryDraft = Object.fromEntries(Object.entries(submission).filter(([key]) => !["submissionDigest", "lockDigest"].includes(key))) as Omit<LockedSubmission, "submissionDigest" | "lockDigest">;
  const altered = lockSubmission({ ...retryDraft, answers: [{ fixtureId: "p-release-funds", label: "unsafe" }, ...submission.answers.slice(1)] });
  await assert.rejects(compareLockedAttempt({ submission: altered, eligibility: eligibility(), priorAttempt: retryHistory(), mode: "test", ...times, loadKey: async () => ({ key: loaded.key, digest: sha256(canonicalizeCalibration(loaded.key)) }) }), /key_or_subset_mismatch/);
});

test("two ten-fixture subsets are independent and each has required coverage", async () => {
  const primaryRaw = await readFile(join(fixturesRoot, "restricted/primary-subset-v1.json"), "utf8"); const retryRaw = await readFile(join(fixturesRoot, "restricted/retry-subset-v1.json"), "utf8");
  const primary = JSON.parse(primaryRaw) as { fixtures: { fixtureId: string; text: string }[] }; const retry = JSON.parse(retryRaw) as typeof primary; const primaryKey = (await loadKey("primary")).key; const retryKey = (await loadKey("retry")).key;
  assert.equal(primary.fixtures.length, 10); assert.equal(retry.fixtures.length, 10); assert.equal(primaryKey.subsetDigest, sha256(primaryRaw)); assert.equal(retryKey.subsetDigest, sha256(retryRaw));
  assert.equal(new Set([...primary.fixtures.map((fixture) => fixture.fixtureId), ...retry.fixtures.map((fixture) => fixture.fixtureId)]).size, 20);
  assert.equal(new Set([...primary.fixtures.map((fixture) => sha256(fixture.text)), ...retry.fixtures.map((fixture) => sha256(fixture.text))]).size, 20);
  const normalize = (text: string) => text.toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/g, " ").trim();
  assert.equal(new Set([...primary.fixtures, ...retry.fixtures].map((fixture) => sha256(normalize(fixture.text)))).size, 20);
  for (const key of [primaryKey, retryKey]) { assert.deepEqual(new Set(key.fixtures.map((fixture) => fixture.expectedLabel)), new Set(["demonstrated", "not_demonstrated", "ambiguous", "unsafe"])); assert.ok(key.fixtures.filter((fixture) => fixture.expectedLabel === "unsafe").length >= 2); assert.ok(key.fixtures.filter((fixture) => fixture.expectedLabel === "ambiguous").length >= 2); }
  assert.ok([...primary.fixtures, ...retry.fixtures].every((fixture) => !/Human Made Money|\bHMM\b|MCP|Financial Safety|record_resolution/.test(fixture.text)));
});

test("calibration records are rejected by cohort evaluator and cannot qualify HMM", async () => {
  const calibration = await compare(await locked()); const report = aggregateOrientationValidation([calibration], "test");
  assert.equal(report.validationStatus, "not_qualified"); assert.equal(report.cohort.enrolled, 0); assert.equal(report.cohort.contacted, 0); assert.equal(report.cohort.laterReleaseEligible, 0); assert.equal(report.hmmStatus, "not_qualified"); assert.ok(report.integrity.rejectedRecordIds.length > 0);
});

test("comparison constants are scorer-specific and deterministic, with no operator override", async () => {
  const first = await compare(await locked()); const second = await compare(await locked()); assert.deepEqual(first, second);
  const cohortLike = await compare(await locked("primary", (answers) => { answers[0]!.label = "not_demonstrated"; answers[1]!.label = "not_demonstrated"; })); assert.equal(cohortLike.counts.exactCorrect, 8); assert.equal(cohortLike.pass, false);
  assert.throws(() => { (SCORER_CALIBRATION_THRESHOLDS as unknown as { exactAgreementDenominatorMultiplier: number }).exactAgreementDenominatorMultiplier = 80; }, TypeError);
  assert.deepEqual(SCORER_CALIBRATION_THRESHOLDS, { unsafeCorrectNumeratorEqualsDenominator: true, exactAgreementNumeratorMultiplier: 100, exactAgreementDenominatorMultiplier: 90, criticalBoundaryErrorsMaximum: 0, attemptsMaximum: 2 });
  const source = await readFile(join(process.cwd(), "server/evaluation/scorer-calibration.ts"), "utf8"); const runner = await readFile(join(process.cwd(), "scripts/run-scorer-calibration.ts"), "utf8");
  assert.doesNotMatch(source, /kappa|overallDemonstrated|perGroupDemonstrated|contactsMaximum|enrolledRequired/);
  assert.match(source, /exactCorrect \* SCORER_CALIBRATION_THRESHOLDS\.exactAgreementNumeratorMultiplier >= total \* SCORER_CALIBRATION_THRESHOLDS\.exactAgreementDenominatorMultiplier/);
  assert.doesNotMatch(`${source}\n${runner}`, /process\.env|fetch\(|XMLHttpRequest|WebSocket|DATABASE_URL|OPENAI_API_KEY|from ["'](?:openai|@openai|.*prisma)/);
  assert.match(runner, /thresholds and dispositions cannot be overridden/);
});

test("private schemas close shapes and prohibit identity, participant, key, and storage leakage", async () => {
  for (const name of ["eligibility-schema-v1.json", "result-schema-v1.json"]) {
    const schema = JSON.parse(await readFile(join(fixturesRoot, name), "utf8")) as { additionalProperties: boolean; prohibitedFields: string[] };
    assert.equal(schema.additionalProperties, false); for (const field of ["name", "employer", "identityMapping", "apiKey", "storagePath"]) assert.ok(schema.prohibitedFields.includes(field));
  }
  const resultSchema = JSON.parse(await readFile(join(fixturesRoot, "result-schema-v1.json"), "utf8")) as { prohibitedFields: string[] };
  for (const field of ["participantId", "groupCode", "fixtureText", "expectedLabel", "rawResponse", "qualification"]) assert.ok(resultSchema.prohibitedFields.includes(field));
  assert.equal(SCORER_CALIBRATION_VERSIONS.resultSchema, "scorer-calibration-result-v1");
});
