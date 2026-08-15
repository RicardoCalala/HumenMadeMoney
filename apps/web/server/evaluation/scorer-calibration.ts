import { createHash } from "node:crypto";

export const SCORER_CALIBRATION_VERSIONS = Object.freeze({
  protocol: "scorer-calibration-protocol-v1",
  rubric: "authority-comprehension-rubric-v1",
  dataset: "scorer-calibration-dataset-v1",
  primarySubset: "scorer-calibration-primary-v1",
  retrySubset: "scorer-calibration-retry-v1",
  eligibilitySchema: "scorer-calibration-eligibility-v1",
  resultSchema: "scorer-calibration-result-v1",
  comparison: "scorer-calibration-comparison-v1",
} as const);

export const SCORER_CALIBRATION_THRESHOLDS = Object.freeze({
  unsafeCorrectNumeratorEqualsDenominator: true,
  exactAgreementNumeratorMultiplier: 100,
  exactAgreementDenominatorMultiplier: 90,
  criticalBoundaryErrorsMaximum: 0,
  attemptsMaximum: 2,
} as const);

export const SCORER_CALIBRATION_ARTIFACTS = Object.freeze({
  primary: Object.freeze({ subsetDigest: "45291ecb0a454c47bb0b4f4169057fe9a8d6192d2604c4fa98f38f3567c221fa", keyVersion: "scorer-calibration-primary-key-v1", keyDigest: "51096a26db78a185bf1d2bda030ab27cb7bd6c73f24522e105cfd3ce0330070c" }),
  retry: Object.freeze({ subsetDigest: "ad6a038cedfe21f5389b77d5936f9864ea895fdb0bf11273141443522f5e69bb", keyVersion: "scorer-calibration-retry-key-v1", keyDigest: "173b471843263fb4ce8581989eaec7689b37bdee611ee06b803db58cff9d1c3c" }),
  primaryRetryNonOverlapProofDigest: "c8ee7366144ded0436be2bd6a6a2b7bac322e6b31cbbc3b9ae15ee94d3eb48f9",
} as const);

export type CalibrationLabel = "demonstrated" | "not_demonstrated" | "ambiguous" | "unsafe";
export type CalibrationSubset = "primary" | "retry";
export type AttemptDisposition = "pass" | "remediation_required" | "ineligible_replace" | "invalid_fixture_set";

export type EligibilityAttestation = {
  schemaVersion: typeof SCORER_CALIBRATION_VERSIONS.eligibilitySchema;
  eligibilityRecordId: string;
  attestedAt: string;
  administratorAlias: string;
  mappingRecordDigest: string;
  attestations: {
    adultVoluntaryRole: true;
    noAuthorshipImplementationOrTesting: true;
    noPriorRestrictedExposure: true;
    notOperatorAdministratorCustodianAdjudicatorOrOtherScorer: true;
    noRecruitmentAdministrationCaptureAdjudicationOrLedgerRole: true;
    noPressuringRelationshipOrOutcomeConflict: true;
    compensationIndependentOfOutcome: true;
    privateIndependentWorkAndIncidentDisclosure: true;
    restrictedMaterialConfidentiality: true;
    completeLockBeforeKeyReveal: true;
    blindedToIdentityGroupSourcePeerAndOutcome: true;
    noUndisclosedConflictOrExposure: true;
  };
  administratorVerified: true;
  testOnly: boolean;
};

export type SubmissionAnswer = { fixtureId: string; label: CalibrationLabel };
export type LockedSubmission = {
  recordType: "scorer_calibration_locked_submission";
  protocolVersion: typeof SCORER_CALIBRATION_VERSIONS.protocol;
  rubricVersion: typeof SCORER_CALIBRATION_VERSIONS.rubric;
  datasetVersion: typeof SCORER_CALIBRATION_VERSIONS.dataset;
  subset: CalibrationSubset;
  subsetVersion: typeof SCORER_CALIBRATION_VERSIONS.primarySubset | typeof SCORER_CALIBRATION_VERSIONS.retrySubset;
  scorerAlias: string;
  attemptNumber: 1 | 2;
  attemptId: string;
  eligibilityRecordDigest: string;
  custody: { administratorAlias: string; keyCustodianAlias: string; independentRecorderAlias: string };
  artifactDigests: { protocol: string; rubric: string; datasetManifest: string; resultSchema: string; comparison: string };
  subsetDigest: string;
  presentationOrderDigest: string;
  startedAt: string;
  lockedAt: string;
  answers: SubmissionAnswer[];
  attestations: {
    independentWork: true;
    frozenRubricOnly: true;
    noExternalAssistance: true;
    completeBeforeKey: true;
    noEditAfterLock: true;
    noParticipantEvidence: true;
    noQualificationEffect: true;
    otherScorerHidden: true;
    outcomeHidden: true;
  };
  testOnly: boolean;
  submissionDigest: string;
  lockDigest: string;
};

export type CalibrationKey = {
  keyVersion: string;
  protocolVersion: typeof SCORER_CALIBRATION_VERSIONS.protocol;
  datasetVersion: typeof SCORER_CALIBRATION_VERSIONS.dataset;
  subset: CalibrationSubset;
  subsetVersion: typeof SCORER_CALIBRATION_VERSIONS.primarySubset | typeof SCORER_CALIBRATION_VERSIONS.retrySubset;
  subsetDigest: string;
  primaryRetryNonOverlapProofDigest: string;
  fixtures: {
    fixtureId: string;
    expectedLabel: CalibrationLabel;
    criticalRules: ("unsafe_boundary" | "ambiguous_authority_not_demonstrated" | "required_actor" | "consequential_boundary" | "separate_control_path" | "required_negation")[];
    keyRationaleCode: string;
  }[];
};

export type PriorAttempt = {
  resultSchemaVersion: typeof SCORER_CALIBRATION_VERSIONS.resultSchema;
  protocolVersion: typeof SCORER_CALIBRATION_VERSIONS.protocol;
  datasetVersion: typeof SCORER_CALIBRATION_VERSIONS.dataset;
  scorerAlias: string;
  attemptNumber: 1;
  pass: false;
  disposition: "remediation_required";
  attemptId: string;
  subset: "primary";
  lockedSubmissionDigest: string;
  remediationCompletedAt: string;
  remediationType: "rubric_concepts_and_category_counts_only";
  renewedAttestationsAt: string;
  retrySubsetPreviouslyUnexposed: true;
  independentRetryConfirmed: true;
  recordDigest: string;
  testOnly: boolean;
};

export type CalibrationResult = {
  recordType: "scorer_calibration_result";
  resultSchemaVersion: typeof SCORER_CALIBRATION_VERSIONS.resultSchema;
  comparisonVersion: typeof SCORER_CALIBRATION_VERSIONS.comparison;
  protocolVersion: typeof SCORER_CALIBRATION_VERSIONS.protocol;
  rubricVersion: typeof SCORER_CALIBRATION_VERSIONS.rubric;
  datasetVersion: typeof SCORER_CALIBRATION_VERSIONS.dataset;
  subsetVersion: typeof SCORER_CALIBRATION_VERSIONS.primarySubset | typeof SCORER_CALIBRATION_VERSIONS.retrySubset;
  keyVersion: string;
  scorerAlias: string;
  custody: { administratorAlias: string; keyCustodianAlias: string; independentRecorderAlias: string };
  artifactDigests: { protocol: string; rubric: string; datasetManifest: string; resultSchema: string; comparison: string };
  attemptNumber: 1 | 2;
  attemptId: string;
  eligibilityRecordDigest: string;
  subsetDigest: string;
  keyDigest: string;
  presentationOrderDigest: string;
  lockedSubmissionDigest: string;
  primaryRetryNonOverlapProofDigest: string;
  timestamps: { startedAt: string; lockedAt: string; keyRevealedAt: string; comparedAt: string; recordedAt: string };
  counts: { total: number; exactCorrect: number; unsafeBinaryTotal: number; unsafeBinaryCorrect: number; criticalBoundaryErrors: number };
  thresholdComputation: { exactNumeratorTimes100: number; exactDenominatorTimes90: number; unsafePerfect: boolean; criticalPerfect: boolean; completeSubmission: boolean };
  pass: boolean;
  disposition: AttemptDisposition;
  reasonCodes: string[];
  remediation: { indicated: boolean; priorAttemptId: string | null; independentRetryConfirmed: boolean };
  attestations: { lockedBeforeKeyComparison: true; deterministicComparison: true; operatorCannotAlterScore: true; noQualificationEffect: true; noParticipantEvidence: true; blindingMaintained: true; keyCustodyMaintained: true };
  networkRequests: 0;
  participantCountersChanged: 0;
  releaseReviewersChanged: 0;
  genuineReleaseReviewsChanged: 0;
  hmmStatus: "not_qualified";
  testOnly: boolean;
  previousDigest: string;
  recordDigest: string;
};

const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export const canonicalizeCalibration = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const digestOk = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const uuidOk = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const timestampOk = (value: unknown): value is string => typeof value === "string" && value.endsWith("Z") && Number.isFinite(Date.parse(value));
const aliasOk = (value: unknown, role: "SCR" | "OPR" | "ADM" | "KEY" | "REC", testOnly: boolean) => typeof value === "string" && new RegExp(`^${testOnly ? "TST-" : ""}${role}-[A-Z0-9]{8,32}$`).test(value);
const administratorAliasOk = (value: unknown, testOnly: boolean) => aliasOk(value, "ADM", testOnly) || aliasOk(value, "OPR", testOnly);
const exactKeys = (value: object, expected: readonly string[]) => canonicalizeCalibration(Object.keys(value).sort()) === canonicalizeCalibration([...expected].sort());
const allTrue = (value: Record<string, unknown>) => Object.values(value).every((item) => item === true);

const eligibilityKeys = ["adultVoluntaryRole", "noAuthorshipImplementationOrTesting", "noPriorRestrictedExposure", "notOperatorAdministratorCustodianAdjudicatorOrOtherScorer", "noRecruitmentAdministrationCaptureAdjudicationOrLedgerRole", "noPressuringRelationshipOrOutcomeConflict", "compensationIndependentOfOutcome", "privateIndependentWorkAndIncidentDisclosure", "restrictedMaterialConfidentiality", "completeLockBeforeKeyReveal", "blindedToIdentityGroupSourcePeerAndOutcome", "noUndisclosedConflictOrExposure"] as const;

export function validateEligibility(record: unknown, mode: "test" | "release" = "release"): record is EligibilityAttestation {
  if (!record || typeof record !== "object") return false;
  const value = record as EligibilityAttestation;
  return exactKeys(value, ["schemaVersion", "eligibilityRecordId", "attestedAt", "administratorAlias", "mappingRecordDigest", "attestations", "administratorVerified", "testOnly"])
    && value.schemaVersion === SCORER_CALIBRATION_VERSIONS.eligibilitySchema
    && uuidOk(value.eligibilityRecordId) && timestampOk(value.attestedAt)
    && administratorAliasOk(value.administratorAlias, mode === "test") && digestOk(value.mappingRecordDigest)
    && value.testOnly === (mode === "test") && value.administratorVerified === true
    && exactKeys(value.attestations, eligibilityKeys) && allTrue(value.attestations);
}

const submissionBaseKeys = ["recordType", "protocolVersion", "rubricVersion", "datasetVersion", "subset", "subsetVersion", "scorerAlias", "attemptNumber", "attemptId", "eligibilityRecordDigest", "custody", "artifactDigests", "subsetDigest", "presentationOrderDigest", "startedAt", "lockedAt", "answers", "attestations", "testOnly"] as const;
const submissionAttestationKeys = ["independentWork", "frozenRubricOnly", "noExternalAssistance", "completeBeforeKey", "noEditAfterLock", "noParticipantEvidence", "noQualificationEffect", "otherScorerHidden", "outcomeHidden"] as const;

export function lockSubmission(raw: Omit<LockedSubmission, "submissionDigest" | "lockDigest">): LockedSubmission {
  const submissionDigest = sha256(canonicalizeCalibration(raw));
  return { ...raw, submissionDigest, lockDigest: sha256(`scorer-calibration-lock-v1\n${submissionDigest}\n${raw.lockedAt}`) };
}

export function validateLockedSubmission(raw: unknown, mode: "test" | "release" = "release"): raw is LockedSubmission {
  if (!raw || typeof raw !== "object") return false;
  const value = raw as LockedSubmission;
  const base = { ...(value as unknown as Record<string, unknown>) }; delete base.submissionDigest; delete base.lockDigest;
  const expectedSubsetVersion = value.subset === "primary" ? SCORER_CALIBRATION_VERSIONS.primarySubset : SCORER_CALIBRATION_VERSIONS.retrySubset;
  return exactKeys(value, [...submissionBaseKeys, "submissionDigest", "lockDigest"])
    && value.recordType === "scorer_calibration_locked_submission"
    && value.protocolVersion === SCORER_CALIBRATION_VERSIONS.protocol && value.rubricVersion === SCORER_CALIBRATION_VERSIONS.rubric && value.datasetVersion === SCORER_CALIBRATION_VERSIONS.dataset
    && value.subsetVersion === expectedSubsetVersion && ((value.attemptNumber === 1 && value.subset === "primary") || (value.attemptNumber === 2 && value.subset === "retry"))
    && aliasOk(value.scorerAlias, "SCR", mode === "test") && uuidOk(value.attemptId)
    && exactKeys(value.custody, ["administratorAlias", "keyCustodianAlias", "independentRecorderAlias"])
    && administratorAliasOk(value.custody.administratorAlias, mode === "test") && aliasOk(value.custody.keyCustodianAlias, "KEY", mode === "test") && aliasOk(value.custody.independentRecorderAlias, "REC", mode === "test")
    && new Set([value.scorerAlias, ...Object.values(value.custody)]).size === 4
    && exactKeys(value.artifactDigests, ["protocol", "rubric", "datasetManifest", "resultSchema", "comparison"]) && Object.values(value.artifactDigests).every(digestOk)
    && digestOk(value.eligibilityRecordDigest) && digestOk(value.subsetDigest) && digestOk(value.presentationOrderDigest)
    && timestampOk(value.startedAt) && timestampOk(value.lockedAt) && Date.parse(value.startedAt) <= Date.parse(value.lockedAt)
    && Array.isArray(value.answers) && value.answers.length >= 10 && new Set(value.answers.map((answer) => answer.fixtureId)).size === value.answers.length
    && value.answers.every((answer) => exactKeys(answer, ["fixtureId", "label"]) && /^[a-z0-9-]{4,64}$/.test(answer.fixtureId) && ["demonstrated", "not_demonstrated", "ambiguous", "unsafe"].includes(answer.label))
    && exactKeys(value.attestations, submissionAttestationKeys) && allTrue(value.attestations)
    && value.testOnly === (mode === "test") && value.submissionDigest === sha256(canonicalizeCalibration(base))
    && value.lockDigest === sha256(`scorer-calibration-lock-v1\n${value.submissionDigest}\n${value.lockedAt}`);
}

function criticalError(expected: CalibrationKey["fixtures"][number], submitted: CalibrationLabel): boolean {
  const binaryMismatch = (expected.expectedLabel === "unsafe") !== (submitted === "unsafe");
  if (binaryMismatch) return true;
  if (expected.criticalRules.includes("ambiguous_authority_not_demonstrated") && expected.expectedLabel === "ambiguous" && submitted === "demonstrated") return true;
  return expected.criticalRules.some((rule) => ["required_actor", "consequential_boundary", "separate_control_path", "required_negation"].includes(rule)) && submitted === "demonstrated" && expected.expectedLabel !== "demonstrated";
}

export async function compareLockedAttempt(input: {
  submission: unknown;
  eligibility: unknown;
  priorAttempt?: PriorAttempt;
  keyRevealedAt: string;
  comparedAt: string;
  recordedAt: string;
  previousDigest?: string;
  mode?: "test" | "release";
  loadKey: () => Promise<{ key: CalibrationKey; digest: string }>;
}): Promise<CalibrationResult> {
  const mode = input.mode ?? "release";
  if (!validateEligibility(input.eligibility, mode)) throw new Error("eligibility_invalid");
  if (!validateLockedSubmission(input.submission, mode)) throw new Error("locked_submission_invalid");
  const submission = input.submission;
  if (sha256(canonicalizeCalibration(input.eligibility)) !== submission.eligibilityRecordDigest) throw new Error("eligibility_digest_mismatch");
  if (input.eligibility.administratorAlias !== submission.custody.administratorAlias) throw new Error("administrator_custody_mismatch");
  if (!timestampOk(input.keyRevealedAt) || !timestampOk(input.comparedAt) || !timestampOk(input.recordedAt)) throw new Error("comparison_timestamp_invalid");
  if (Date.parse(submission.lockedAt) > Date.parse(input.keyRevealedAt) || Date.parse(input.keyRevealedAt) > Date.parse(input.comparedAt) || Date.parse(input.comparedAt) > Date.parse(input.recordedAt)) throw new Error("key_reveal_before_lock_or_timestamp_order_invalid");
  if (submission.attemptNumber === 1 && input.priorAttempt) throw new Error("primary_cannot_have_prior_attempt");
  if (submission.attemptNumber === 2) {
    const prior = input.priorAttempt;
    if (!prior || prior.resultSchemaVersion !== SCORER_CALIBRATION_VERSIONS.resultSchema || prior.protocolVersion !== SCORER_CALIBRATION_VERSIONS.protocol || prior.datasetVersion !== SCORER_CALIBRATION_VERSIONS.dataset || prior.scorerAlias !== submission.scorerAlias || prior.attemptNumber !== 1 || prior.pass !== false || prior.disposition !== "remediation_required" || prior.subset !== "primary" || prior.attemptId === submission.attemptId || !digestOk(prior.lockedSubmissionDigest) || !digestOk(prior.recordDigest) || prior.testOnly !== submission.testOnly || !timestampOk(prior.remediationCompletedAt) || !timestampOk(prior.renewedAttestationsAt) || prior.remediationType !== "rubric_concepts_and_category_counts_only" || prior.retrySubsetPreviouslyUnexposed !== true || prior.independentRetryConfirmed !== true) throw new Error("retry_prerequisites_invalid");
  }
  const loaded = await input.loadKey();
  const key = loaded.key;
  const artifact = SCORER_CALIBRATION_ARTIFACTS[submission.subset];
  if (!digestOk(loaded.digest) || loaded.digest !== sha256(canonicalizeCalibration(key))) throw new Error("key_digest_invalid");
  if (loaded.digest !== artifact.keyDigest || key.keyVersion !== artifact.keyVersion || submission.subsetDigest !== artifact.subsetDigest || key.protocolVersion !== SCORER_CALIBRATION_VERSIONS.protocol || key.datasetVersion !== SCORER_CALIBRATION_VERSIONS.dataset || key.subset !== submission.subset || key.subsetVersion !== submission.subsetVersion || key.subsetDigest !== submission.subsetDigest || key.primaryRetryNonOverlapProofDigest !== SCORER_CALIBRATION_ARTIFACTS.primaryRetryNonOverlapProofDigest) throw new Error("key_or_subset_mismatch");
  const expectedIds = key.fixtures.map((fixture) => fixture.fixtureId);
  const submittedIds = submission.answers.map((answer) => answer.fixtureId);
  const completeSubmission = expectedIds.length >= 10 && expectedIds.length === submittedIds.length && expectedIds.every((id, index) => submittedIds[index] === id);
  const submitted = new Map(submission.answers.map((answer) => [answer.fixtureId, answer.label]));
  let exactCorrect = 0; let unsafeBinaryCorrect = 0; let criticalBoundaryErrors = 0;
  for (const expected of key.fixtures) {
    const answer = submitted.get(expected.fixtureId);
    if (answer === expected.expectedLabel) exactCorrect++;
    if (answer && ((answer === "unsafe") === (expected.expectedLabel === "unsafe"))) unsafeBinaryCorrect++;
    if (!answer || criticalError(expected, answer)) criticalBoundaryErrors++;
  }
  const total = key.fixtures.length;
  const unsafePerfect = completeSubmission && SCORER_CALIBRATION_THRESHOLDS.unsafeCorrectNumeratorEqualsDenominator && unsafeBinaryCorrect === total;
  const criticalPerfect = completeSubmission && criticalBoundaryErrors <= SCORER_CALIBRATION_THRESHOLDS.criticalBoundaryErrorsMaximum;
  const exactPass = completeSubmission && exactCorrect * SCORER_CALIBRATION_THRESHOLDS.exactAgreementNumeratorMultiplier >= total * SCORER_CALIBRATION_THRESHOLDS.exactAgreementDenominatorMultiplier;
  const pass = unsafePerfect && criticalPerfect && exactPass;
  const disposition: AttemptDisposition = pass ? "pass" : submission.attemptNumber === 1 ? "remediation_required" : "ineligible_replace";
  const reasonCodes = [...(!completeSubmission ? ["incomplete_or_order_mismatch"] : []), ...(!unsafePerfect ? ["unsafe_boundary_error"] : []), ...(!exactPass ? ["exact_agreement_below_90_percent"] : []), ...(!criticalPerfect ? ["critical_boundary_error"] : [])];
  const previousDigest = input.previousDigest ?? "GENESIS";
  if (previousDigest !== "GENESIS" && !digestOk(previousDigest)) throw new Error("previous_digest_invalid");
  const base: Omit<CalibrationResult, "recordDigest"> = {
    recordType: "scorer_calibration_result", resultSchemaVersion: SCORER_CALIBRATION_VERSIONS.resultSchema, comparisonVersion: SCORER_CALIBRATION_VERSIONS.comparison,
    protocolVersion: SCORER_CALIBRATION_VERSIONS.protocol, rubricVersion: SCORER_CALIBRATION_VERSIONS.rubric, datasetVersion: SCORER_CALIBRATION_VERSIONS.dataset, subsetVersion: submission.subsetVersion, keyVersion: key.keyVersion,
    scorerAlias: submission.scorerAlias, custody: submission.custody, artifactDigests: submission.artifactDigests, attemptNumber: submission.attemptNumber, attemptId: submission.attemptId, eligibilityRecordDigest: submission.eligibilityRecordDigest, subsetDigest: submission.subsetDigest, keyDigest: loaded.digest, presentationOrderDigest: submission.presentationOrderDigest, lockedSubmissionDigest: submission.submissionDigest, primaryRetryNonOverlapProofDigest: key.primaryRetryNonOverlapProofDigest,
    timestamps: { startedAt: submission.startedAt, lockedAt: submission.lockedAt, keyRevealedAt: input.keyRevealedAt, comparedAt: input.comparedAt, recordedAt: input.recordedAt },
    counts: { total, exactCorrect, unsafeBinaryTotal: total, unsafeBinaryCorrect, criticalBoundaryErrors },
    thresholdComputation: { exactNumeratorTimes100: exactCorrect * 100, exactDenominatorTimes90: total * 90, unsafePerfect, criticalPerfect, completeSubmission },
    pass, disposition, reasonCodes, remediation: { indicated: submission.attemptNumber === 2, priorAttemptId: input.priorAttempt?.attemptId ?? null, independentRetryConfirmed: input.priorAttempt?.independentRetryConfirmed ?? false },
    attestations: { lockedBeforeKeyComparison: true, deterministicComparison: true, operatorCannotAlterScore: true, noQualificationEffect: true, noParticipantEvidence: true, blindingMaintained: true, keyCustodyMaintained: true },
    networkRequests: 0, participantCountersChanged: 0, releaseReviewersChanged: 0, genuineReleaseReviewsChanged: 0, hmmStatus: "not_qualified", testOnly: submission.testOnly, previousDigest,
  };
  return { ...base, recordDigest: sha256(`${previousDigest}\n${canonicalizeCalibration(base)}`) };
}
