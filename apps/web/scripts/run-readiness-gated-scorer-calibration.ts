import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { compareLockedAttempt, canonicalizeCalibration, validateEligibility, validateLockedSubmission, type CalibrationKey, type EligibilityAttestation, type LockedSubmission, type PriorAttempt } from "../server/evaluation/scorer-calibration.ts";
import { scorerCalibrationGate, validateCollectiveReadinessRecord, type CollectiveReadinessRecord } from "../server/evaluation/role-custody-readiness.ts";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const json = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, "utf8")) as T;
const writeNew = (path: string, value: unknown) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });

const parse = (args: string[]) => {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]; const value = args[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error("Arguments must be --name value pairs.");
    values.set(key.slice(2), value);
  }
  const allowed = new Set(["readiness", "submission", "eligibility", "key", "history", "key-revealed-at", "compared-at", "recorded-at", "previous-digest", "out", "mode"]);
  for (const key of values.keys()) if (!allowed.has(key)) throw new Error(`Unsupported argument --${key}; readiness, thresholds, and dispositions cannot be overridden.`);
  return values;
};
const required = (values: Map<string, string>, key: string) => { const value = values.get(key); if (!value) throw new Error(`Missing --${key}.`); return value; };

async function main() {
  const values = parse(process.argv.slice(2)); const mode = values.get("mode") === "test" ? "test" : "release";
  const readiness = await json<CollectiveReadinessRecord>(required(values, "readiness"));
  if (!validateCollectiveReadinessRecord(readiness, mode) || !scorerCalibrationGate(readiness).authorized) throw new Error("collective_readiness_blocked; key not opened");
  const submission = await json<LockedSubmission>(required(values, "submission")); const eligibility = await json<EligibilityAttestation>(required(values, "eligibility"));
  if (!validateEligibility(eligibility, mode) || !validateLockedSubmission(submission, mode)) throw new Error("eligibility_or_locked_submission_invalid; key not opened");
  const priorAttempt = values.has("history") ? await json<PriorAttempt>(required(values, "history")) : undefined; const keyPath = required(values, "key");
  const result = await compareLockedAttempt({ submission, eligibility, priorAttempt, mode, keyRevealedAt: required(values, "key-revealed-at"), comparedAt: required(values, "compared-at"), recordedAt: required(values, "recorded-at"), previousDigest: values.get("previous-digest"), loadKey: async () => { const key = await json<CalibrationKey>(keyPath); return { key, digest: sha256(canonicalizeCalibration(key)) }; } });
  await writeNew(required(values, "out"), result);
  process.stdout.write(`${JSON.stringify({ status: "recorded", readinessDigest: readiness.recordDigest, attemptId: result.attemptId, pass: result.pass, disposition: result.disposition, qualificationEffect: "none", a01ContactAuthorized: false })}\n`);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Readiness-gated scorer calibration failed closed."}\n`); process.exitCode = 1; });
