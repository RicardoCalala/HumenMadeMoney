import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { AiProviderConfig } from "../server/evidence/ai-config.ts";
import { buildSmokeAuthorizationSnapshot, consumeSmokeAuthorization, createSmokeAuthorization, finalizeSmokeAuthorization, SmokeAuthorizationError } from "../server/evidence/smoke-authorization.ts";
import { smokeFixtureId, smokeInput } from "./fixtures/openai-smoke-fixture.ts";

const config: AiProviderConfig = { environment: "development", enabled: true, provider: "openai", openAiEnabled: true, modelEnabled: true, apiKeyPresent: true, model: "approved-test-model", modelAllowlist: ["approved-test-model"], promptVersion: "prompt-v1", schemaVersion: "schema-v1", policyVersion: "policy-v1", timeoutMs: 15_000, maxAttempts: 1, maxConcurrent: 1, maxRequestsPerMinute: 1, maxInputTokens: 1_500, maxOutputTokens: 800, maxLatencyMs: 15_000, maxEstimatedCostMinor: 1, inputCostMinorPerMillion: 1, outputCostMinorPerMillion: 1, globalKillSwitch: false, environmentKillSwitch: false, openAiKillSwitch: false, modelKillSwitch: false };
const now = new Date("2026-08-09T20:00:00.000Z");
const later = new Date("2026-08-09T20:01:00.000Z");
const expiry = "2026-08-09T20:05:00.000Z";

async function withRecord(run: (path: string) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), "hmm-smoke-authorization-"));
  try { await run(join(directory, "authorization.json")); } finally { await rm(directory, { recursive: true, force: true }); }
}

test("authorization creation records only the bounded non-secret envelope and digests", () => withRecord(async (path) => {
  const snapshot = buildSmokeAuthorizationSnapshot(config, "Human Made Money", smokeFixtureId, smokeInput);
  const record = await createSmokeAuthorization(path, snapshot, expiry, now);
  assert.equal(record.status, "authorized"); assert.equal(record.consumedAt, null); assert.equal(record.projectLabel, "Human Made Money");
  const serialized = await readFile(path, "utf8"); assert.doesNotMatch(serialized, /api.?key|billing|credential/i); assert.equal(record.configDigest.length, 64); assert.equal(record.fixtureDigest.length, 64);
  await assert.rejects(() => createSmokeAuthorization(path, snapshot, expiry, now));
}));

test("authorization validation rejects expiry and configuration, model, fixture, and project mismatches without consuming", () => withRecord(async (path) => {
  const snapshot = buildSmokeAuthorizationSnapshot(config, "Human Made Money", smokeFixtureId, smokeInput);
  await createSmokeAuthorization(path, snapshot, expiry, now);
  for (const changed of [{ ...snapshot, model: "other-model" }, { ...snapshot, fixture: "other-fixture" }, { ...snapshot, projectLabel: "Other project" }, { ...snapshot, maxOutputTokens: 799 }]) {
    await assert.rejects(() => consumeSmokeAuthorization(path, changed, later), (error: unknown) => error instanceof SmokeAuthorizationError && error.code === "MISMATCH");
  }
  await assert.rejects(() => consumeSmokeAuthorization(path, snapshot, new Date(expiry)), (error: unknown) => error instanceof SmokeAuthorizationError && error.code === "EXPIRED");
  const consumed = await consumeSmokeAuthorization(path, snapshot, later); assert.equal(consumed.status, "consumed");
}));

test("authorization is atomically consumed once, exact reuse is rejected, and result is audited", () => withRecord(async (path) => {
  const snapshot = buildSmokeAuthorizationSnapshot(config, "Human Made Money", smokeFixtureId, smokeInput);
  await createSmokeAuthorization(path, snapshot, expiry, now);
  const [first, second] = await Promise.allSettled([consumeSmokeAuthorization(path, snapshot, later), consumeSmokeAuthorization(path, snapshot, later)]);
  assert.equal([first, second].filter((result) => result.status === "fulfilled").length, 1);
  assert.equal([first, second].filter((result) => result.status === "rejected" && result.reason instanceof SmokeAuthorizationError && result.reason.code === "CONSUMED").length, 1);
  const finalized = await finalizeSmokeAuthorization(path, "failed", "CLAIM_SUPPORT", new Date("2026-08-09T20:02:00.000Z"));
  assert.equal(finalized.status, "failed"); assert.deepEqual(finalized.result, { outcome: "failed", failureCode: "CLAIM_SUPPORT" });
  await assert.rejects(() => consumeSmokeAuthorization(path, snapshot, later), (error: unknown) => error instanceof SmokeAuthorizationError && error.code === "CONSUMED");
}));
