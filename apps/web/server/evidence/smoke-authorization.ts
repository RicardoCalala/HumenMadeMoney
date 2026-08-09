import { createHash, randomUUID } from "node:crypto";
import { open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { AiProviderConfig } from "./ai-config.ts";

export const SMOKE_AUTHORIZATION_VERSION = "hmm-smoke-authorization-v1";
export type SmokeAuthorizationStatus = "authorized" | "consumed" | "completed" | "failed";

export interface SmokeAuthorizationSnapshot {
  environment: string;
  projectLabel: string;
  model: string;
  fixture: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxEstimatedCostMinor: number;
  maxAttempts: number;
  timeoutMs: number;
  maxLatencyMs: number;
  maxConcurrent: number;
  maxRequestsPerMinute: number;
  promptVersion: string;
  schemaVersion: string;
  policyVersion: string;
  configDigest: string;
  fixtureDigest: string;
}

export interface SmokeAuthorizationRecord extends SmokeAuthorizationSnapshot {
  recordVersion: typeof SMOKE_AUTHORIZATION_VERSION;
  authorizationId: string;
  attemptId: string;
  authorizedAt: string;
  expiresAt: string;
  consumedAt: string | null;
  completedAt: string | null;
  status: SmokeAuthorizationStatus;
  result: { outcome: "completed" | "failed"; failureCode?: string } | null;
}

export class SmokeAuthorizationError extends Error {
  readonly code: "INVALID" | "EXPIRED" | "MISMATCH" | "CONSUMED";
  constructor(code: SmokeAuthorizationError["code"], message: string) { super(message); this.code = code; }
}

const canonical = (value: unknown): string => JSON.stringify(value, (_key, item) => item instanceof Map ? Object.fromEntries([...item.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)))) : item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
export const smokeDigest = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");

export function buildSmokeAuthorizationSnapshot(config: AiProviderConfig, projectLabel: string, fixture: string, fixtureValue: unknown): SmokeAuthorizationSnapshot {
  if (!projectLabel.trim() || projectLabel.length > 128) throw new SmokeAuthorizationError("INVALID", "A bounded non-secret project label is required.");
  if (config.environment !== "development" || !config.model) throw new SmokeAuthorizationError("INVALID", "Smoke authorization requires a configured development model.");
  if (!config.enabled || config.provider !== "openai" || !config.openAiEnabled || !config.modelEnabled || config.globalKillSwitch || config.environmentKillSwitch || config.openAiKillSwitch || config.modelKillSwitch) throw new SmokeAuthorizationError("INVALID", "Smoke authorization requires the exact ready-preflight gate state.");
  const configuration = {
    environment: config.environment, model: config.model, fixture,
    modelAllowlist: config.modelAllowlist, inputCostMinorPerMillion: config.inputCostMinorPerMillion, outputCostMinorPerMillion: config.outputCostMinorPerMillion,
    maxInputTokens: config.maxInputTokens, maxOutputTokens: config.maxOutputTokens,
    maxEstimatedCostMinor: config.maxEstimatedCostMinor, maxAttempts: config.maxAttempts,
    timeoutMs: config.timeoutMs, maxLatencyMs: config.maxLatencyMs,
    maxConcurrent: config.maxConcurrent, maxRequestsPerMinute: config.maxRequestsPerMinute,
    promptVersion: config.promptVersion, schemaVersion: config.schemaVersion, policyVersion: config.policyVersion,
  };
  return { ...configuration, projectLabel: projectLabel.trim(), configDigest: smokeDigest(configuration), fixtureDigest: smokeDigest(fixtureValue) };
}

export async function createSmokeAuthorization(path: string, snapshot: SmokeAuthorizationSnapshot, expiresAt: string, now = new Date()): Promise<SmokeAuthorizationRecord> {
  const expiration = new Date(expiresAt);
  if (!Number.isFinite(expiration.getTime()) || expiration.getTime() <= now.getTime()) throw new SmokeAuthorizationError("INVALID", "Authorization expiry must be a future timestamp.");
  const record: SmokeAuthorizationRecord = { recordVersion: SMOKE_AUTHORIZATION_VERSION, authorizationId: randomUUID(), attemptId: randomUUID(), authorizedAt: now.toISOString(), expiresAt: expiration.toISOString(), consumedAt: null, completedAt: null, status: "authorized", result: null, ...snapshot };
  const handle = await open(resolve(path), "wx", 0o600);
  try { await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, "utf8"); } finally { await handle.close(); }
  return record;
}

function assertRecord(value: unknown): asserts value is SmokeAuthorizationRecord {
  const record = value as SmokeAuthorizationRecord;
  if (!value || typeof value !== "object" || record.recordVersion !== SMOKE_AUTHORIZATION_VERSION || typeof record.authorizationId !== "string" || typeof record.attemptId !== "string" || !["authorized", "consumed", "completed", "failed"].includes(record.status) || !Number.isFinite(Date.parse(record.authorizedAt)) || !Number.isFinite(Date.parse(record.expiresAt))) throw new SmokeAuthorizationError("INVALID", "Authorization record is malformed or has an unsupported version.");
}

export async function readSmokeAuthorization(path: string): Promise<SmokeAuthorizationRecord> {
  let value: unknown;
  try { value = JSON.parse(await readFile(resolve(path), "utf8")); } catch { throw new SmokeAuthorizationError("INVALID", "Authorization record cannot be read."); }
  assertRecord(value); return value;
}

function assertSnapshotMatches(record: SmokeAuthorizationRecord, expected: SmokeAuthorizationSnapshot) {
  const fields: Array<keyof SmokeAuthorizationSnapshot> = ["environment", "projectLabel", "model", "fixture", "maxInputTokens", "maxOutputTokens", "maxEstimatedCostMinor", "maxAttempts", "timeoutMs", "maxLatencyMs", "maxConcurrent", "maxRequestsPerMinute", "promptVersion", "schemaVersion", "policyVersion", "configDigest", "fixtureDigest"];
  if (fields.some((field) => record[field] !== expected[field])) throw new SmokeAuthorizationError("MISMATCH", "Authorization record does not match the current preflight envelope.");
}

export async function consumeSmokeAuthorization(path: string, expected: SmokeAuthorizationSnapshot, now = new Date()): Promise<SmokeAuthorizationRecord> {
  const absolute = resolve(path); const lockPath = `${absolute}.consumed`;
  let lock;
  try { lock = await open(lockPath, "wx", 0o600); } catch { throw new SmokeAuthorizationError("CONSUMED", "Authorization has already been consumed or consumption is in progress."); }
  try {
    const record = await readSmokeAuthorization(absolute);
    if (record.status !== "authorized" || record.consumedAt) throw new SmokeAuthorizationError("CONSUMED", "Authorization has already been consumed.");
    if (Date.parse(record.expiresAt) <= now.getTime()) throw new SmokeAuthorizationError("EXPIRED", "Authorization has expired.");
    assertSnapshotMatches(record, expected);
    const consumed = { ...record, consumedAt: now.toISOString(), status: "consumed" as const };
    await replaceRecord(absolute, consumed);
    await lock.writeFile(`${record.authorizationId}\n`, "utf8");
    return consumed;
  } catch (error) {
    await lock.close();
    try { await unlink(lockPath); } catch {}
    throw error;
  } finally { try { await lock.close(); } catch {} }
}

export async function finalizeSmokeAuthorization(path: string, outcome: "completed" | "failed", failureCode?: string, now = new Date()): Promise<SmokeAuthorizationRecord> {
  const absolute = resolve(path); const record = await readSmokeAuthorization(absolute);
  if (record.status !== "consumed") throw new SmokeAuthorizationError("INVALID", "Only a consumed authorization can be finalized.");
  const finalized: SmokeAuthorizationRecord = { ...record, completedAt: now.toISOString(), status: outcome, result: { outcome, ...(failureCode ? { failureCode } : {}) } };
  await replaceRecord(absolute, finalized); return finalized;
}

async function replaceRecord(path: string, record: SmokeAuthorizationRecord) {
  const temporary = resolve(dirname(path), `.${record.authorizationId}.${randomUUID()}.tmp`);
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path);
}
