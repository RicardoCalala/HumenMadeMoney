import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { markdownReport, runOfflineEvaluation } from "../server/evaluation/offline-runner.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const report = await runOfflineEvaluation(join(root, "tests/fixtures/ai-evaluation/manifest.json"), join(root, "tests/fixtures/ai-evaluation/baselines/sprint-6.5.2-offline-v1.json"));
const output = join(root, "evaluation-reports");
await mkdir(output, { recursive: true });
await writeFile(join(output, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(output, "latest.md"), markdownReport(report));
process.stdout.write(`${JSON.stringify({ qualificationStatus: report.qualificationStatus, networkRequests: report.networkRequests, failures: report.failures.length })}\n`);
if (report.qualificationStatus === "fail") process.exitCode = 1;
