import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { markdownReport, runOfflineEvaluation } from "../server/evaluation/offline-runner.ts";

const manifest = join(process.cwd(), "tests/fixtures/ai-evaluation/manifest.json");
test("offline evaluation passes deterministic and provider-shaped synthetic gates without network", async () => { const report = await runOfflineEvaluation(manifest); assert.equal(report.decision, "pass"); assert.equal(report.networkRequests, 0); assert.equal(report.metrics.authoritySafety.value, 1); assert.equal(report.metrics.privacyRedaction.value, 1); assert.match(markdownReport(report), /Network requests: \*\*0\*\*/); });
test("manifest includes required safety and failure partitions", async () => { const report = await runOfflineEvaluation(manifest); for (const partition of ["core_semantics", "evidence_sufficiency", "ambiguity_disagreement", "adversarial_safety", "privacy_redaction", "operational_failure"]) assert.ok(report.partitions[partition], partition); assert.ok(report.failureTaxonomy.includes("NETWORK_ATTEMPTED")); });
