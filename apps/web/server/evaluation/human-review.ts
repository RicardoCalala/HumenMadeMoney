import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export type HumanGateStatus = "qualified" | "not_qualified";
type ScoreName = "comprehension" | "citationTraceability" | "actionInterpretation" | "authoritySafety";
export type StudyManifest = {
  studyVersion: string; rubricVersion: string; resultSchemaVersion: string; datasetVersion: string;
  protocolVersion: string; minimumReviewers: number; sampledCaseIds: string[]; requiredPartitions: string[];
  conflictLabelCaseIds: string[]; thresholds: Record<ScoreName, number> & { maximumDisagreementRate: number; minimumCoverage: number };
  cases: { caseId: string; partition: string; expected: { result: string; action: string; citations: string[] } }[];
};
export type ReviewerSubmission = {
  recordType: "reviewer_submission"; schemaVersion: string; studyVersion: string; rubricVersion: string; datasetVersion: string;
  submissionId: string; reviewerId: string; operatorId: string; submittedAt: string; testOnly: boolean;
  eligibility: { adult: true; productFamiliarityAttested: true; noConflictAttested: true; independentWorkAttested: true; noSensitiveDataIncluded: true };
  responses: { caseId: string; result: string; action: string; citations: string[]; authorityBoundary: "advisory_only_no_funds_authority" | "model_may_authorize_settlement" }[];
};
export type Adjudication = {
  recordType: "adjudication"; schemaVersion: string; studyVersion: string; rubricVersion: string; datasetVersion: string;
  adjudicationId: string; adjudicatorId: string; operatorId: string; submittedAt: string; testOnly: boolean;
  reviewerSubmissionIds: [string, string]; caseId: string; resolution: { result: string; action: string; citations: string[] }; rationaleCode: "evidence_key_applied" | "protocol_clarification";
  eligibility: { noConflictAttested: true; independentOfReviewersAttested: true; noSensitiveDataIncluded: true };
};
export type LedgerRecord = (ReviewerSubmission | Adjudication) & { previousDigest: string; recordDigest: string };
export type HumanReviewReport = {
  status: HumanGateStatus; networkRequests: 0; studyVersion: string; protocolVersion: string; rubricVersion: string; datasetVersion: string;
  manifestDigest: string; ledgerHeadDigest: string | null; completion: { eligibleReviewers: number; requiredReviewers: number; submissions: number; requiredCaseReviews: number; completedCaseReviews: number };
  coverage: { sampledCases: number; completedCases: number; requiredPartitions: number; coveredPartitions: number; missingCaseIds: string[]; missingPartitions: string[] };
  independence: { status: HumanGateStatus; reasons: string[] }; disagreement: { count: number; rate: number; unresolvedCaseIds: string[]; adjudicatedCaseIds: string[] };
  thresholds: StudyManifest["thresholds"]; metrics: Record<ScoreName, { numerator: number; denominator: number; value: number; status: "pass" | "fail" | "not_qualified" }>;
  conflictLabels: { required: number; completed: number; status: HumanGateStatus }; criticalFailures: { reviewerId: string; caseId: string }[];
  provenance: { acceptedSubmissionIds: string[]; acceptedAdjudicationIds: string[]; rejectedRecordIds: string[]; tamperEvidentChain: boolean };
  reasons: string[];
};

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const ID = /^(?:REV|OPR|ADJ)-[A-Z0-9]{8,32}$/;
const TEST_ID = /^TST-(?:REV|OPR|ADJ)-[A-Z0-9]{8,32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestampOk = (value: string) => Number.isFinite(Date.parse(value)) && /Z$/.test(value);
const answerSignature = (value: { result: string; action: string; citations: string[] }) => canonical({ result: value.result, action: value.action, citations: [...value.citations].sort() });
const exactKeys = (value: unknown, keys: string[]) => Boolean(value && typeof value === "object" && !Array.isArray(value) && canonical(Object.keys(value).sort()) === canonical([...keys].sort()));
const CITATION_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function sealLedger(records: (ReviewerSubmission | Adjudication)[]): LedgerRecord[] {
  let previousDigest = "GENESIS";
  return records.map((record) => { const recordDigest = sha(`${previousDigest}\n${canonical(record)}`); const sealed = { ...record, previousDigest, recordDigest }; previousDigest = recordDigest; return sealed; });
}

export function sealNextRecord(record: ReviewerSubmission | Adjudication, previousDigest = "GENESIS"): LedgerRecord {
  return { ...record, previousDigest, recordDigest: sha(`${previousDigest}\n${canonical(record)}`) };
}

export async function readLedger(path?: string): Promise<unknown[]> {
  if (!path) return [];
  try { return (await readFile(path, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line)); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}

export function aggregateHumanReview(manifest: StudyManifest, rawRecords: unknown[], mode: "release" | "test" = "release"): HumanReviewReport {
  const manifestDigest = sha(canonical(manifest)); const reasons: string[] = []; const rejected: string[] = [];
  const submissions: ReviewerSubmission[] = []; const adjudications: Adjudication[] = []; const seen = new Set<string>(); let chain = true; let previous = "GENESIS";
  const caseMap = new Map(manifest.cases.map((item) => [item.caseId, item]));
  for (const raw of rawRecords) {
    const record = raw as Partial<LedgerRecord> & Record<string, unknown>; const id = record.recordType === "reviewer_submission" ? String(record.submissionId ?? "") : String(record.adjudicationId ?? "");
    const base = { ...record } as Record<string, unknown>; delete base.previousDigest; delete base.recordDigest;
    const digestOk = record.previousDigest === previous && record.recordDigest === sha(`${previous}\n${canonical(base)}`);
    if (!digestOk) chain = false; else previous = record.recordDigest!;
    const duplicate = !id || seen.has(id); if (id) seen.add(id);
    const versionsOk = record.schemaVersion === manifest.resultSchemaVersion && record.studyVersion === manifest.studyVersion && record.rubricVersion === manifest.rubricVersion && record.datasetVersion === manifest.datasetVersion;
    const testOk = mode === "test" ? record.testOnly === true : record.testOnly === false;
    const actorId = String(record.recordType === "reviewer_submission" ? record.reviewerId : record.adjudicatorId);
    const idsOk = mode === "test" ? TEST_ID.test(actorId) && TEST_ID.test(String(record.operatorId)) : ID.test(actorId) && ID.test(String(record.operatorId));
    if (!digestOk || duplicate || !versionsOk || !testOk || !idsOk || !UUID.test(String(id)) || !timestampOk(String(record.submittedAt))) { if (id) rejected.push(id); continue; }
    if (record.recordType === "reviewer_submission") {
      const item = record as LedgerRecord & ReviewerSubmission;
      const eligible = item.eligibility?.adult && item.eligibility.productFamiliarityAttested && item.eligibility.noConflictAttested && item.eligibility.independentWorkAttested && item.eligibility.noSensitiveDataIncluded;
      const shapeOk = exactKeys(base, ["recordType", "schemaVersion", "studyVersion", "rubricVersion", "datasetVersion", "submissionId", "reviewerId", "operatorId", "submittedAt", "testOnly", "eligibility", "responses"]) && exactKeys(item.eligibility, ["adult", "productFamiliarityAttested", "noConflictAttested", "independentWorkAttested", "noSensitiveDataIncluded"]);
      const responsesOk = Array.isArray(item.responses) && item.responses.length === manifest.sampledCaseIds.length && new Set(item.responses.map((r) => r.caseId)).size === item.responses.length && item.responses.every((r) => exactKeys(r, ["caseId", "result", "action", "citations", "authorityBoundary"]) && manifest.sampledCaseIds.includes(r.caseId) && typeof r.result === "string" && r.result.length <= 32 && typeof r.action === "string" && r.action.length <= 32 && Array.isArray(r.citations) && r.citations.length <= 8 && r.citations.every((id) => CITATION_ID.test(id)) && ["advisory_only_no_funds_authority", "model_may_authorize_settlement"].includes(r.authorityBoundary));
      if (!shapeOk || !eligible || !responsesOk || item.reviewerId === item.operatorId) { rejected.push(item.submissionId); continue; } submissions.push(item);
    } else if (record.recordType === "adjudication") {
      const item = record as LedgerRecord & Adjudication; const eligible = item.eligibility?.noConflictAttested && item.eligibility.independentOfReviewersAttested && item.eligibility.noSensitiveDataIncluded;
      const expected = caseMap.get(item.caseId)?.expected;
      const shapeOk = exactKeys(base, ["recordType", "schemaVersion", "studyVersion", "rubricVersion", "datasetVersion", "adjudicationId", "adjudicatorId", "operatorId", "submittedAt", "testOnly", "reviewerSubmissionIds", "caseId", "resolution", "rationaleCode", "eligibility"]) && exactKeys(item.eligibility, ["noConflictAttested", "independentOfReviewersAttested", "noSensitiveDataIncluded"]) && exactKeys(item.resolution, ["result", "action", "citations"]);
      if (!shapeOk || !eligible || item.adjudicatorId === item.operatorId || !expected || answerSignature(item.resolution) !== answerSignature(expected)) { rejected.push(item.adjudicationId); continue; } adjudications.push(item);
    } else if (id) rejected.push(id);
  }
  if (!chain) reasons.push("ledger_tampering_or_reordering_detected");
  const reviewerIds = new Set(submissions.map((item) => item.reviewerId)); const operatorIds = new Set(submissions.map((item) => item.operatorId));
  const independenceReasons: string[] = [];
  if (reviewerIds.size < manifest.minimumReviewers) independenceReasons.push("insufficient_independent_reviewers");
  if (submissions.length !== reviewerIds.size) independenceReasons.push("duplicate_reviewer_submission");
  if ([...reviewerIds].some((id) => operatorIds.has(id))) independenceReasons.push("reviewer_operator_overlap");
  const byCase = new Map<string, { submission: ReviewerSubmission; response: ReviewerSubmission["responses"][number] }[]>();
  for (const submission of submissions) for (const response of submission.responses) { const list = byCase.get(response.caseId) ?? []; list.push({ submission, response }); byCase.set(response.caseId, list); }
  const completedCaseIds = manifest.sampledCaseIds.filter((id) => (byCase.get(id)?.length ?? 0) >= manifest.minimumReviewers);
  const coveredPartitions = new Set(completedCaseIds.map((id) => caseMap.get(id)!.partition));
  const disagreements: string[] = []; const adjudicated: string[] = [];
  for (const caseId of completedCaseIds) {
    const pair = byCase.get(caseId)!.slice(0, 2); const signatures = pair.map(({ response }) => answerSignature(response));
    if (signatures[0] !== signatures[1]) { disagreements.push(caseId); const match = adjudications.find((a) => a.caseId === caseId && pair.every(({ submission }) => a.reviewerSubmissionIds.includes(submission.submissionId)) && !reviewerIds.has(a.adjudicatorId) && !operatorIds.has(a.adjudicatorId)); if (match) adjudicated.push(caseId); }
  }
  const scored = submissions.flatMap((submission) => submission.responses.map((response) => { const expected = caseMap.get(response.caseId)!.expected; return { reviewerId: submission.reviewerId, caseId: response.caseId, scores: { comprehension: Number(response.result === expected.result) as 0 | 1, citationTraceability: Number(canonical([...response.citations].sort()) === canonical([...expected.citations].sort())) as 0 | 1, actionInterpretation: Number(response.action === expected.action) as 0 | 1, authoritySafety: Number(response.authorityBoundary === "advisory_only_no_funds_authority") as 0 | 1 } }; }));
  const criticalFailures = scored.filter((item) => item.scores.authoritySafety === 0).map(({ reviewerId, caseId }) => ({ reviewerId, caseId }));
  const scoreNames: ScoreName[] = ["comprehension", "citationTraceability", "actionInterpretation", "authoritySafety"];
  const metrics = Object.fromEntries(scoreNames.map((name) => { const values = scored.map((item) => item.scores[name]); const numerator = values.reduce<number>((a, b) => a + b, 0); const value = values.length ? numerator / values.length : 0; return [name, { numerator, denominator: values.length, value, status: values.length ? value >= manifest.thresholds[name] ? "pass" : "fail" : "not_qualified" }]; })) as HumanReviewReport["metrics"];
  const unresolved = disagreements.filter((id) => !adjudicated.includes(id)); const rate = completedCaseIds.length ? disagreements.length / completedCaseIds.length : 0;
  const conflictCompleted = manifest.conflictLabelCaseIds.filter((id) => { const pair = byCase.get(id)?.slice(0, 2) ?? []; const expected = caseMap.get(id)?.expected; return pair.length === 2 && expected && (pair.every(({ response }) => answerSignature(response) === answerSignature(expected)) || adjudicated.includes(id)); }).length;
  const completedReviews = submissions.reduce((total, item) => total + item.responses.length, 0); const requiredReviews = manifest.sampledCaseIds.length * manifest.minimumReviewers;
  if (completedReviews < requiredReviews) reasons.push("minimum_completion_not_met");
  if (completedCaseIds.length / manifest.sampledCaseIds.length < manifest.thresholds.minimumCoverage) reasons.push("case_coverage_incomplete");
  if (coveredPartitions.size < manifest.requiredPartitions.length) reasons.push("partition_coverage_incomplete");
  if (conflictCompleted < manifest.conflictLabelCaseIds.length) reasons.push("two_reviewer_conflict_labels_incomplete");
  if (unresolved.length) reasons.push("unresolved_disagreement");
  if (rate > manifest.thresholds.maximumDisagreementRate) reasons.push("disagreement_threshold_exceeded");
  if (criticalFailures.length) reasons.push("critical_authority_comprehension_failure");
  if (independenceReasons.length) reasons.push("reviewer_independence_invalid");
  if (rejected.length) reasons.push("invalid_or_replayed_records_rejected");
  for (const [name, value] of Object.entries(metrics)) if (value.status !== "pass") reasons.push(`${name}_threshold_not_met`);
  const status = reasons.length ? "not_qualified" : "qualified";
  return { status, networkRequests: 0, studyVersion: manifest.studyVersion, protocolVersion: manifest.protocolVersion, rubricVersion: manifest.rubricVersion, datasetVersion: manifest.datasetVersion, manifestDigest, ledgerHeadDigest: chain && rawRecords.length ? previous : null, completion: { eligibleReviewers: reviewerIds.size, requiredReviewers: manifest.minimumReviewers, submissions: submissions.length, requiredCaseReviews: requiredReviews, completedCaseReviews: completedReviews }, coverage: { sampledCases: manifest.sampledCaseIds.length, completedCases: completedCaseIds.length, requiredPartitions: manifest.requiredPartitions.length, coveredPartitions: coveredPartitions.size, missingCaseIds: manifest.sampledCaseIds.filter((id) => !completedCaseIds.includes(id)), missingPartitions: manifest.requiredPartitions.filter((p) => !coveredPartitions.has(p)) }, independence: { status: independenceReasons.length ? "not_qualified" : "qualified", reasons: independenceReasons }, disagreement: { count: disagreements.length, rate, unresolvedCaseIds: unresolved, adjudicatedCaseIds: adjudicated }, thresholds: manifest.thresholds, metrics, conflictLabels: { required: manifest.conflictLabelCaseIds.length, completed: conflictCompleted, status: conflictCompleted === manifest.conflictLabelCaseIds.length ? "qualified" : "not_qualified" }, criticalFailures, provenance: { acceptedSubmissionIds: submissions.map((s) => s.submissionId), acceptedAdjudicationIds: adjudications.map((a) => a.adjudicationId), rejectedRecordIds: rejected, tamperEvidentChain: chain }, reasons };
}

export function humanReviewMarkdown(report: HumanReviewReport): string {
  const metrics = Object.entries(report.metrics).map(([name, m]) => `| ${name} | ${m.numerator}/${m.denominator} | ${(m.value * 100).toFixed(2)}% | ${(report.thresholds[name as ScoreName] * 100).toFixed(0)}% | ${m.status} |`).join("\n");
  return `# Sprint 6.5.3 human-review qualification\n\nHuman-review gate: **${report.status.toUpperCase()}**  \nNetwork requests: **0**  \nStudy: ${report.studyVersion}  \nProtocol: ${report.protocolVersion}  \nRubric: ${report.rubricVersion}  \nDataset: ${report.datasetVersion}\n\n## Completion and coverage\n\n- Eligible independent reviewers: ${report.completion.eligibleReviewers}/${report.completion.requiredReviewers}\n- Case reviews: ${report.completion.completedCaseReviews}/${report.completion.requiredCaseReviews}\n- Cases completed: ${report.coverage.completedCases}/${report.coverage.sampledCases}\n- Partitions covered: ${report.coverage.coveredPartitions}/${report.coverage.requiredPartitions}\n- Conflict labels completed: ${report.conflictLabels.completed}/${report.conflictLabels.required}\n- Independence: ${report.independence.status}\n- Disagreements: ${report.disagreement.count} (${(report.disagreement.rate * 100).toFixed(2)}%); unresolved: ${report.disagreement.unresolvedCaseIds.join(", ") || "none"}\n- Ledger chain: ${report.provenance.tamperEvidentChain ? "valid" : "invalid"}; head: ${report.ledgerHeadDigest ?? "none"}\n\n## Threshold results\n\n| Measure | Result | Rate | Threshold | Status |\n| --- | ---: | ---: | ---: | --- |\n${metrics}\n\n## Gate reasons\n\n${report.reasons.length ? report.reasons.map((reason) => `- ${reason}`).join("\n") : "- all approved human-review requirements satisfied"}\n\nNo reviewer names, contact details, diagnoses, or free-text personal data are included. Human review is advisory and grants no settlement, funds, reviewer-assignment, or Financial Safety authority.\n`;
}
