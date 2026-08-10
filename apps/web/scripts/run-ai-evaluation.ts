import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { markdownReport, runOfflineEvaluation } from "../server/evaluation/offline-runner.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const report = await runOfflineEvaluation(join(root, "tests/fixtures/ai-evaluation/manifest.json"));
const output = join(root, "evaluation-reports");
await mkdir(output, { recursive: true });
await writeFile(join(output, "latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(join(output, "latest.md"), markdownReport(report));
process.stdout.write(`${JSON.stringify({ decision: report.decision, networkRequests: report.networkRequests, failures: report.failures.length })}\n`);
if (report.decision !== "pass") process.exitCode = 1;
