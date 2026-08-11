import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { markdownReport, runOfflineEvaluation } from "../server/evaluation/offline-runner.ts";

const fixture = (...parts: string[]) => join(process.cwd(), "tests/fixtures/ai-evaluation", ...parts);
test("offline release gate is reproducible, drift-free, and performs zero network requests", async () => {
  const report = await runOfflineEvaluation(fixture("manifest.json"), fixture("baselines/sprint-6.5.2-offline-v1.json"));
  assert.equal(report.qualificationStatus, "not_qualified");
  assert.equal(report.networkRequests, 0);
  assert.equal(report.drift.comparable, true);
  assert.deepEqual(report.drift.regressions, []);
  assert.equal(report.gates.qualitySafetyPrivacyProvenance.status, "pass");
  assert.equal(report.gates.datasetReadiness.status, "not_qualified");
  assert.equal(report.labeling.twoReviewerComplete, 0);
  assert.ok(report.labeling.twoReviewerRequired > 0);
});

test("dataset covers every Sprint 6.5.2 partition with pinned minimums", async () => {
  const report = await runOfflineEvaluation(fixture("manifest.json"), fixture("baselines/sprint-6.5.2-offline-v1.json"));
  for (const partition of ["happy_path", "missing_evidence", "conflicting_evidence", "malformed_output", "citation_claim_refs", "prompt_injection", "privacy_redaction", "authority_safety", "stale_context", "fallback_lineage", "provider_failures", "cancellation_replay", "action_semantics", "budget_enforcement"]) {
    assert.ok(report.partitions[partition], partition); assert.ok(report.partitions[partition]!.total >= report.partitions[partition]!.minimum, partition);
  }
  assert.ok(Object.keys(report.partitions).length >= 14);
  assert.ok(report.failureTaxonomy.includes("LATE_RESULT_REJECTED"));
  assert.ok(report.failureTaxonomy.includes("FALLBACK_LINEAGE_INVALID"));
});

test("reports distinguish measured, simulated, and not-measured provider data", async () => {
  const report = await runOfflineEvaluation(fixture("manifest.json"), fixture("baselines/sprint-6.5.2-offline-v1.json"));
  assert.equal(report.measurements.localLatencyMs.status, "measured");
  assert.equal(report.measurements.simulatedProviderLatencyMs.status, "simulated");
  assert.equal(report.measurements.realProviderLatency.status, "not_measured");
  const markdown = markdownReport(report);
  assert.match(markdown, /Qualification: \*\*NOT_QUALIFIED\*\*/);
  assert.match(markdown, /Network requests: \*\*0\*\*/);
  assert.match(markdown, /realProviderCost \| not_measured/);
});
