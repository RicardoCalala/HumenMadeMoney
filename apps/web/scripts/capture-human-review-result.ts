import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { aggregateHumanReview, readLedger, sealNextRecord, type Adjudication, type ReviewerSubmission, type StudyManifest } from "../server/evaluation/human-review.ts";

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Usage: pnpm human-review:capture -- /absolute/path/to/bounded-result.json");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(join(root, "tests/fixtures/ai-evaluation/human-review/study-manifest.json"), "utf8")) as StudyManifest;
const input = JSON.parse(await readFile(inputPath, "utf8")) as ReviewerSubmission | Adjudication;
if (input.testOnly !== false) throw new Error("RELEASE_CAPTURE_REJECTS_TEST_ONLY_RECORD");
const ledgerPath = join(root, "human-review-results/results.jsonl"); const existing = await readLedger(ledgerPath);
const previousDigest = existing.length ? String((existing.at(-1) as { recordDigest?: string }).recordDigest) : "GENESIS";
const sealed = sealNextRecord(input, previousDigest); const candidate = [...existing, sealed];
const report = aggregateHumanReview(manifest, candidate, "release"); const id = input.recordType === "reviewer_submission" ? input.submissionId : input.adjudicationId;
if (report.provenance.rejectedRecordIds.includes(id) || !report.provenance.tamperEvidentChain) throw new Error("RESULT_REJECTED");
await mkdir(dirname(ledgerPath), { recursive: true }); await appendFile(ledgerPath, `${JSON.stringify(sealed)}\n`, { encoding: "utf8", flag: "a" });
process.stdout.write(`${JSON.stringify({ captured: id, humanReviewStatus: report.status, networkRequests: 0 })}\n`);
