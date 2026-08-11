import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { markdownReport, runOfflineEvaluation } from "../server/evaluation/offline-runner.ts";
import { aggregateHumanReview, humanReviewMarkdown, readLedger, type StudyManifest } from "../server/evaluation/human-review.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const studyManifestPath = join(root, "tests/fixtures/ai-evaluation/human-review/study-manifest.json"); const ledgerPath = join(root, "human-review-results/results.jsonl");
const studyManifest = JSON.parse(await readFile(studyManifestPath, "utf8")) as StudyManifest;
const humanReview = aggregateHumanReview(studyManifest, await readLedger(ledgerPath), "release");
const report = await runOfflineEvaluation(join(root, "tests/fixtures/ai-evaluation/manifest.json"), join(root, "tests/fixtures/ai-evaluation/baselines/sprint-6.5.2-offline-v1.json"), { studyManifestPath, ledgerPath });
const output = join(root, "evaluation-reports");
await mkdir(output, { recursive: true });
await writeFile(join(output, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(output, "latest.md"), markdownReport(report));
await writeFile(join(output, "human-review-latest.json"), `${JSON.stringify(humanReview, null, 2)}\n`);
await writeFile(join(output, "human-review-latest.md"), humanReviewMarkdown(humanReview));
process.stdout.write(`${JSON.stringify({ qualificationStatus: report.qualificationStatus, networkRequests: report.networkRequests, failures: report.failures.length })}\n`);
if (report.qualificationStatus === "fail") process.exitCode = 1;
