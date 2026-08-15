import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "../..");
const read = (path: string) => readFile(resolve(root, path), "utf8");

test("the implemented protocol contains exact aliases, instruments, matrices, custody, recovery, retention, and binary gating", async () => {
  const protocol = await read("docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v1.md");
  for (const version of ["role-custody-readiness-protocol-v1", "role-eligibility-attestation-v1", "role-assignment-v1", "custody-topology-v1", "collective-readiness-v1", "scorer-calibration-eligibility-v1"]) assert.match(protocol, new RegExp(version));
  for (const alias of ["SCR-", "ADJ-", "OPR-HMM00001", "ADM-", "KEY-", "REC-", "PRV-", "RCV-", "HDR-"]) assert.match(protocol, new RegExp(alias));
  for (const item of ["KEY-01", "KEY-12", "REC-01", "REC-12", "PRV-01", "PRV-12", "RCV-01", "RCV-12", "HDR-01", "HDR-10", "ADJ-01", "ADJ-08", "OPR-01", "OPR-06", "ADM-01", "ADM-06"]) assert.match(protocol, new RegExp(item));
  for (const combination of ["C1", "C2", "C4", "OPR-HMM00001 + ADM", "PRV + KEY", "REC + HDR"]) assert.ok(protocol.includes(combination), combination);
  for (const kind of ["IDMAP", "RAW", "LEDGER", "CAL", "PRES", "KEYS", "BACKUP", "INC"]) assert.match(protocol, new RegExp(`\\b${kind}\\b`));
  for (const phrase of ["90 days after Sprint 6.5 qualification closure", "review within 30 days", "READY", "BLOCKED", "never authorizes `A-01`", "NOT_QUALIFIED"]) assert.match(protocol, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
});

test("v3 preserves historical pending records and keeps every real-world gate closed", async () => {
  const checklist = await read("docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v3.md");
  const checkpoint = await read("docs/runbooks/sprint-6.5.4-role-custody-readiness-founder-checkpoint.md");
  const historicalOne = await read("docs/runbooks/sprint-6.5.4-scorer-calibration-founder-checkpoint.md");
  const historicalTwo = await read("docs/runbooks/sprint-6.5.4-second-founder-checkpoint.md");
  for (const text of [checklist, checkpoint]) { assert.match(text, /PENDING/); assert.match(text, /BLOCKED/); assert.match(text, /NO REAL SCORER CALIBRATION/); assert.match(text, /NO A-01 CONTACT|`A-01` contact authorized: \*\*NO/); assert.match(text, /0\/16/); assert.match(text, /0\/12/); assert.match(text, /0\/2/); assert.match(text, /0\/30/); assert.match(text, /NOT_QUALIFIED/); }
  assert.match(checkpoint, /No receipt exists/); assert.match(checkpoint, /No prior.*retrofitted/i);
  for (const historical of [historicalOne, historicalTwo]) assert.match(historical, /PENDING/);
});

test("the readiness-gated calibration entry point checks collective readiness before key loading and has no provider path", async () => {
  const runner = await read("apps/web/scripts/run-readiness-gated-scorer-calibration.ts");
  assert.ok(runner.indexOf("validateCollectiveReadinessRecord") < runner.indexOf("keyPath ="));
  assert.ok(runner.indexOf("scorerCalibrationGate") < runner.indexOf("keyPath ="));
  assert.match(runner, /collective_readiness_blocked; key not opened/);
  assert.match(runner, /a01ContactAuthorized: false/);
  assert.doesNotMatch(runner, /process\.env|fetch\(|XMLHttpRequest|WebSocket|DATABASE_URL|OPENAI_API_KEY|from ["'](?:openai|@openai|.*prisma)/);
});

test("ordinary role/custody governance contains no restricted scorer fixture canaries", async () => {
  const docs = `${await read("docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v1.md")}\n${await read("docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v3.md")}\n${await read("docs/runbooks/sprint-6.5.4-role-custody-readiness-founder-checkpoint.md")}`;
  for (const canary of ["p-release-funds", "r-refund-direct", "autonomous_funds_release", "conditional_reviewer_appointment_unclear"]) assert.doesNotMatch(docs, new RegExp(canary));
});
