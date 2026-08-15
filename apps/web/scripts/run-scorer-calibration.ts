import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { compareLockedAttempt, canonicalizeCalibration, lockSubmission, validateEligibility, validateLockedSubmission, type CalibrationKey, type EligibilityAttestation, type LockedSubmission, type PriorAttempt } from "../server/evaluation/scorer-calibration.ts";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const parse = (args: string[]) => {
  const [operation, ...rest] = args;
  const values = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]; const value = rest[index + 1];
    if (!key?.startsWith("--") || !value) throw new Error("Arguments must be --name value pairs.");
    values.set(key.slice(2), value);
  }
  return { operation, values };
};
const required = (values: Map<string, string>, key: string) => { const value = values.get(key); if (!value) throw new Error(`Missing --${key}.`); return value; };
const json = async <T>(path: string): Promise<T> => JSON.parse(await readFile(path, "utf8")) as T;
const writeNew = (path: string, value: unknown) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });

async function main() {
  const { operation, values } = parse(process.argv.slice(2));
  const allowed = operation === "lock" ? new Set(["draft", "out", "mode"]) : new Set(["submission", "eligibility", "key", "history", "key-revealed-at", "compared-at", "recorded-at", "previous-digest", "out", "mode"]);
  for (const key of values.keys()) if (!allowed.has(key)) throw new Error(`Unsupported argument --${key}; scoring thresholds and dispositions cannot be overridden.`);
  const mode = values.get("mode") === "test" ? "test" : "release";

  if (operation === "lock") {
    const draft = await json<Omit<LockedSubmission, "submissionDigest" | "lockDigest">>(required(values, "draft"));
    const locked = lockSubmission(draft);
    if (!validateLockedSubmission(locked, mode)) throw new Error("Draft is incomplete or invalid; nothing was locked.");
    await writeNew(required(values, "out"), locked);
    process.stdout.write(`${JSON.stringify({ status: "locked", attemptId: locked.attemptId, submissionDigest: locked.submissionDigest, lockDigest: locked.lockDigest })}\n`);
    return;
  }

  if (operation !== "compare") throw new Error("Use either lock or compare.");
  const submission = await json<LockedSubmission>(required(values, "submission"));
  const eligibility = await json<EligibilityAttestation>(required(values, "eligibility"));
  if (!validateEligibility(eligibility, mode)) throw new Error("Eligibility is invalid; the key was not opened.");
  if (!validateLockedSubmission(submission, mode)) throw new Error("Submission is not validly locked; the key was not opened.");
  const priorAttempt = values.has("history") ? await json<PriorAttempt>(required(values, "history")) : undefined;
  const keyPath = required(values, "key");
  const result = await compareLockedAttempt({
    submission, eligibility, priorAttempt, mode,
    keyRevealedAt: required(values, "key-revealed-at"), comparedAt: required(values, "compared-at"), recordedAt: required(values, "recorded-at"), previousDigest: values.get("previous-digest"),
    loadKey: async () => { const key = await json<CalibrationKey>(keyPath); return { key, digest: sha256(canonicalizeCalibration(key)) }; },
  });
  await writeNew(required(values, "out"), result);
  process.stdout.write(`${JSON.stringify({ status: "recorded", attemptId: result.attemptId, pass: result.pass, disposition: result.disposition, exact: `${result.counts.exactCorrect}/${result.counts.total}`, unsafe: `${result.counts.unsafeBinaryCorrect}/${result.counts.unsafeBinaryTotal}`, criticalBoundaryErrors: result.counts.criticalBoundaryErrors, recordDigest: result.recordDigest, qualificationEffect: "none" })}\n`);
}

main().catch((error: unknown) => { process.stderr.write(`${error instanceof Error ? error.message : "Scorer calibration failed closed."}\n`); process.exitCode = 1; });
