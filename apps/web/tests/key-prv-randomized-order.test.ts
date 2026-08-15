import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
  KEY_PRV_CANONICAL_IDS,
  KEY_PRV_INSTRUMENT,
  KEY_PRV_MANIFEST,
  KEY_PRV_MANIFEST_DIGEST,
  KEY_PRV_STATEMENT_BYTES_DIGEST,
  KeyPrvAdministrationLedger,
  evaluateCombinedEligibility,
  evaluateKeyPrvCollectiveReadinessV2,
  orderDigest,
  replayKeyPrvOrder,
  sampleBoundedUint64,
  verifyAdministrationIntegrity,
  type KeyPrvAdministration,
} from "../server/evaluation/key-prv-randomized-order.ts";

const root = resolve(process.cwd(), "../..");
const read = (path: string) => readFile(resolve(root, path), "utf8");
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const d = (label: string) => digest(label);
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const t0 = "2026-08-15T16:00:00.000Z";
const t1 = "2026-08-15T16:01:00.000Z";
const t2 = "2026-08-15T16:02:00.000Z";

test("exact v2 manifest contains every stable ID once and exact frozen v1 statement bytes", async () => {
  assert.equal(KEY_PRV_INSTRUMENT.length, 24);
  assert.equal(new Set(KEY_PRV_CANONICAL_IDS).size, 24);
  assert.deepEqual(KEY_PRV_CANONICAL_IDS, [
    ...Array.from({ length: 12 }, (_, index) => `KEY-${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 12 }, (_, index) => `PRV-${String(index + 1).padStart(2, "0")}`),
  ]);
  const protocol = await read("docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v1.md");
  const sourceItems = [...protocol.matchAll(/^- `(KEY|PRV)-(\d{2})`: (.+)$/gm)].map((match) => [`${match[1]}-${match[2]}`, match[3]]);
  assert.deepEqual(sourceItems, KEY_PRV_INSTRUMENT.map(([id, statement]) => [id, statement]));
  const manifestFile = JSON.parse(await read("apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/key-prv-instrument-manifest-v2.json"));
  assert.deepEqual(manifestFile.items, KEY_PRV_MANIFEST);
  assert.equal(KEY_PRV_STATEMENT_BYTES_DIGEST, digest(JSON.stringify(sourceItems.map(([, statement]) => statement))));
  assert.equal(KEY_PRV_MANIFEST_DIGEST, digest(JSON.stringify(KEY_PRV_MANIFEST)));
});

test("published seed vector replays exactly and order digest is independently reproducible", () => {
  const replay = replayKeyPrvOrder("00".repeat(32));
  assert.deepEqual(replay.order, ["KEY-03","PRV-08","KEY-06","PRV-12","PRV-01","KEY-07","KEY-05","PRV-09","PRV-03","KEY-02","KEY-10","KEY-11","PRV-05","PRV-04","KEY-01","KEY-09","PRV-07","KEY-08","PRV-11","PRV-02","KEY-04","PRV-10","PRV-06","KEY-12"]);
  assert.equal(replay.orderDigest, "bc13668042b57ac7f0b5a3d47e4fc8e9e8aece14729b999cec51b4590e84c03f");
  assert.equal(replay.orderDigest, digest(JSON.stringify(replay.order)));
  assert.deepEqual(replayKeyPrvOrder(Buffer.alloc(32)).order, replay.order);
});

test("many synthetic seeds produce complete deterministic permutations with no duplicates or omissions", () => {
  for (let index = 0; index < 512; index += 1) {
    const seed = createHash("sha256").update(`TST-SEED-${index}`).digest();
    const first = replayKeyPrvOrder(seed);
    const second = replayKeyPrvOrder(seed);
    assert.deepEqual(second, first);
    assert.equal(first.order.length, 24);
    assert.equal(new Set(first.order).size, 24);
    assert.deepEqual([...first.order].sort(), [...KEY_PRV_CANONICAL_IDS].sort());
    assert.equal(first.orderDigest, orderDigest(first.order));
  }
});

test("rejection sampling discards out-of-range uint64 values at every Fisher-Yates bound", () => {
  const max = (BigInt(1) << BigInt(64)) - BigInt(1);
  for (let bound = 2; bound <= 24; bound += 1) {
    let reads = 0;
    const result = sampleBoundedUint64(() => { reads += 1; return reads === 1 ? max : BigInt(bound - 1); }, bound);
    const limit = ((BigInt(1) << BigInt(64)) / BigInt(bound)) * BigInt(bound);
    assert.equal(reads, max >= limit ? 2 : 1);
    assert.equal(result, Number((max >= limit ? BigInt(bound - 1) : max) % BigInt(bound)));
  }
});

function completeAll(ledger: KeyPrvAdministrationLedger, request: string, answer: (id: string) => boolean = () => true): KeyPrvAdministration {
  const locked = ledger.lock({ administrationId: uuid(1), administrationRequestDigest: request, mode: "randomized", at: t0 });
  ledger.startPresentation(request, t1);
  for (const itemId of locked.itemIdSequence) ledger.recordResponse(request, itemId, answer(itemId));
  return ledger.complete(request, t2);
}

test("lock precedes presentation, response mapping follows stable IDs, and all-True semantics are permutation invariant", () => {
  for (let run = 0; run < 32; run += 1) {
    const ledger = new KeyPrvAdministrationLedger();
    const record = completeAll(ledger, d(`request-${run}`));
    assert.equal(record.status, "completed");
    assert.equal(record.responses.length, 24);
    assert.ok(record.responses.every(({ ordinal, itemId }, index) => ordinal === index + 1 && itemId === record.itemIdSequence[index]));
    assert.deepEqual(verifyAdministrationIntegrity(record), []);
    const [key, prv] = evaluateCombinedEligibility(record);
    assert.equal(key.outcome, "eligible"); assert.equal(prv.outcome, "eligible");
    assert.equal(key.combinedAllTrue, true); assert.equal(prv.combinedAllTrue, true);
    assert.equal(Object.keys(key.attestations).length, 12); assert.equal(Object.keys(prv.attestations).length, 12);
    assert.equal(key.administrationDigest, prv.administrationDigest);
  }
});

test("any False fails both roles and missing, malformed, uncertain, or out-of-order capture fails closed", () => {
  const falseLedger = new KeyPrvAdministrationLedger();
  const failed = completeAll(falseLedger, d("false-request"), (id) => id !== "KEY-07");
  for (const result of evaluateCombinedEligibility(failed)) { assert.equal(result.outcome, "ineligible"); assert.equal(result.combinedAllTrue, false); assert.ok(result.reasonCodes.includes("one_or_more_false")); }

  const incompleteLedger = new KeyPrvAdministrationLedger();
  const locked = incompleteLedger.lock({ administrationId: uuid(2), administrationRequestDigest: d("missing-request"), mode: "randomized", at: t0 });
  incompleteLedger.startPresentation(d("missing-request"), t1);
  incompleteLedger.recordResponse(d("missing-request"), locked.itemIdSequence[0], true);
  for (const result of evaluateCombinedEligibility(incompleteLedger.current(d("missing-request"))!)) assert.equal(result.outcome, "uncertain");
  assert.throws(() => incompleteLedger.recordResponse(d("missing-request"), locked.itemIdSequence[2], true), /not_next_locked_id/);
  assert.throws(() => incompleteLedger.recordResponse(d("missing-request"), locked.itemIdSequence[1], "uncertain" as unknown as boolean), /not_allowed/);
  assert.throws(() => incompleteLedger.complete(d("missing-request"), t2), /all_24/);
});

test("order generation has no answer input or influence", () => {
  const seed = d("answer-independent-seed");
  const before = replayKeyPrvOrder(seed);
  const syntheticAnswers = Object.fromEntries(KEY_PRV_CANONICAL_IDS.map((id, index) => [id, index % 2 === 0]));
  assert.equal(Object.keys(syntheticAnswers).length, 24);
  assert.deepEqual(replayKeyPrvOrder(seed), before);
});

test("reroll and silent restart are rejected before and after presentation", () => {
  const ledger = new KeyPrvAdministrationLedger(); const request = d("reroll-request");
  ledger.lock({ administrationId: uuid(3), administrationRequestDigest: request, mode: "randomized", at: t0 });
  assert.throws(() => ledger.lock({ administrationId: uuid(3), administrationRequestDigest: request, mode: "randomized", at: t0 }), /no_reroll/);
  ledger.startPresentation(request, t1);
  assert.throws(() => ledger.lock({ administrationId: uuid(3), administrationRequestDigest: request, mode: "fixed_accessibility", accommodationCode: "fixed_order_requested", at: t1 }), /no_reroll/);
  assert.equal(ledger.history(request).length, 2);
  assert.equal(Object.isFrozen(ledger.current(request)), true);
});

test("concurrent lock attempts admit exactly one immutable order", async () => {
  const ledger = new KeyPrvAdministrationLedger(); const request = d("concurrent-request");
  const attempts = await Promise.allSettled(Array.from({ length: 32 }, (_, index) => Promise.resolve().then(() => ledger.lock({ administrationId: uuid(100 + index), administrationRequestDigest: request, mode: "randomized", at: t0 }))));
  assert.equal(attempts.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(attempts.filter(({ status }) => status === "rejected").length, 31);
  assert.equal(ledger.history(request).length, 1);
});

test("abort preserves evidence; resume preserves order; incident restart requires linked authorization and a new request", () => {
  const ledger = new KeyPrvAdministrationLedger(); const request = d("abort-request");
  const locked = ledger.lock({ administrationId: uuid(4), administrationRequestDigest: request, mode: "randomized", at: t0 });
  ledger.startPresentation(request, t1); ledger.recordResponse(request, locked.itemIdSequence[0], true);
  const aborted = ledger.abort(request, t2, "approved_pause");
  assert.equal(aborted.responses.length, 1); assert.equal(aborted.seedHex, locked.seedHex); assert.deepEqual(aborted.itemIdSequence, locked.itemIdSequence);
  const resumed = ledger.resume(request, "2026-08-15T16:03:00.000Z", d("resume-authorization"));
  assert.deepEqual(resumed.itemIdSequence, locked.itemIdSequence); assert.deepEqual(resumed.responses, aborted.responses);
  assert.throws(() => ledger.lock({ administrationId: uuid(4), administrationRequestDigest: request, mode: "randomized", at: t2 }), /no_reroll/);

  const incidentRequest = d("incident-request");
  ledger.lock({ administrationId: uuid(5), administrationRequestDigest: incidentRequest, mode: "randomized", at: t0 });
  const voided = ledger.abort(incidentRequest, t1, "statement_integrity_uncertain", d("incident"));
  assert.throws(() => ledger.resume(incidentRequest, t2, d("bad-resume")), /integrity_uncertain/);
  const replacement = d("replacement-request");
  assert.throws(() => ledger.authorizeReplacement({ priorRequestDigest: incidentRequest, newRequestDigest: replacement, priorAdministrationDigest: d("wrong"), authorizationDigest: d("authorization"), incidentDigest: d("incident") }), /not_authorized/);
  ledger.authorizeReplacement({ priorRequestDigest: incidentRequest, newRequestDigest: replacement, priorAdministrationDigest: voided.administrationDigest, authorizationDigest: d("authorization"), incidentDigest: d("incident") });
  const replacementLock = ledger.lock({ administrationId: uuid(6), administrationRequestDigest: replacement, mode: "randomized", at: t2 });
  assert.equal(replacementLock.priorAdministrationDigest, voided.administrationDigest);
  assert.equal(replacementLock.responses.length, 0);
});

test("fixed_accessibility is pre-lock, canonical, seedless, neutral-code-only, and eligibility-equivalent", () => {
  const ledger = new KeyPrvAdministrationLedger(); const request = d("fixed-request");
  assert.throws(() => ledger.lock({ administrationId: uuid(7), administrationRequestDigest: request, mode: "fixed_accessibility", at: t0 }), /selected_pre_lock/);
  const locked = ledger.lock({ administrationId: uuid(7), administrationRequestDigest: request, mode: "fixed_accessibility", accommodationCode: "fixed_order_requested", at: t0 });
  assert.deepEqual(locked.itemIdSequence, KEY_PRV_CANONICAL_IDS); assert.equal(locked.seedHex, null); assert.equal(locked.accommodationCode, "fixed_order_requested");
  ledger.startPresentation(request, t1); for (const itemId of locked.itemIdSequence) ledger.recordResponse(request, itemId, true);
  for (const result of evaluateCombinedEligibility(ledger.complete(request, t2))) assert.equal(result.outcome, "eligible");
  assert.throws(() => ledger.lock({ administrationId: uuid(8), administrationRequestDigest: d("bad-fixed"), mode: "fixed_accessibility", accommodationCode: "diagnosis" as "fixed_order_requested", at: t0 }), /selected_pre_lock/);
});

test("v2 schemas are closed 2020-12 contracts and collective readiness is structurally blocked", async () => {
  const names = ["key-prv-administration-schema-v1.json","role-eligibility-schema-v2.json","role-assignment-schema-v2.json","readiness-evidence-schema-v2.json","collective-readiness-schema-v2.json"];
  for (const name of names) {
    const schema = JSON.parse(await read(`apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/${name}`));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema"); assert.ok(schema.$id); assert.equal(schema.additionalProperties, false);
  }
  const collective = JSON.parse(await read("apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/collective-readiness-schema-v2.json"));
  assert.deepEqual(collective.properties.decision, { enum: ["READY", "BLOCKED"] });
  assert.deepEqual(collective.properties.a01ContactAuthorized, { const: false });
  assert.deepEqual(collective.properties.participantCounters.const, { contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 });
  assert.deepEqual(collective.properties.releaseGate.const, { reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" });
});

test("collective readiness v2 is founder-gated and currently BLOCKED with every counter unchanged", () => {
  const record = evaluateKeyPrvCollectiveReadinessV2({ implementationCommit: "a".repeat(40), governanceHead: "b".repeat(40), artifactEnvelopeDigest: d("envelope"), v1CustodyCompatibilityDigest: d("compatibility"), keyPrvReadinessEvidenceDigest: d("v2-readiness"), founderCheckpointDecisionDigest: null, allV1ReadinessControlsPass: true, allV2AmendmentControlsPass: true, noOpenIncidentOrChange: true });
  assert.equal(record.decision, "BLOCKED"); assert.ok(record.reasonCodes.includes("randomized_order_founder_checkpoint_pending"));
  assert.equal(record.realKeyPrvScreeningAuthorized, false); assert.equal(record.realScorerCalibrationAuthorized, false); assert.equal(record.a01ContactAuthorized, false);
  assert.deepEqual(record.participantCounters, { contacted: 0, enrolled: 0, A: 0, B: 0, C: 0, D: 0 }); assert.deepEqual(record.releaseGate, { reviewers: 0, genuineReviews: 0, hmmStatus: "not_qualified" });
});

test("compatibility is explicit, v1 historical bytes regress, and cross-version upgrades are prohibited", async () => {
  const expected: Record<string, string> = {
    "apps/web/server/evaluation/role-custody-readiness.ts": "c843300af11e194a1427d748e781972f111db05b496c36c2b3af9a0bbef67151",
    "apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/backup-restore-evidence-schema-v1.json": "d1e38d45383a346104cc083b08f8f9daaf7f08937166492eb873ed5b9324b5bc",
    "apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/ledger-record-schema-v1.json": "200180cdb515a3f9eff8c7d487ea335a227c63353391eef924b75b900cff769c",
    "apps/web/tests/fixtures/ai-evaluation/role-custody-readiness/retention-hold-schema-v1.json": "fd6ea7a6293f103d65b491e224df11bb0cd62fcf3205f35aeb375747566bc334",
    "docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v1.md": "f5d916dd8bddff82b2666ad21b9eba051e3352ed07350bcb57f60ee7bea0aecd",
    "docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v3.md": "c4dfda3e16d6415fd822e4f647bfc5542fc551d7a782c78bc15e715309bfad4f",
    "docs/runbooks/sprint-6.5.4-role-custody-readiness-artifact-digests.md": "a205acc1a00c94b702d47ef6adf5a5d4fd5933e7b37f62f26267dda8a30ab3bc",
  };
  for (const [path, expectedDigest] of Object.entries(expected)) assert.equal(digest(await read(path)), expectedDigest, path);
  const matrix = await read("docs/runbooks/sprint-6.5.4-key-prv-v2-compatibility-matrix.md");
  for (const contract of ["custody-topology-v1","backup-restore-evidence-v1","role-custody-ledger-v1","retention-hold-v1"]) assert.match(matrix, new RegExp(`${contract}.*Reused byte-identically`));
  assert.match(matrix, /no import, remap, subset reuse, or upgrade/i);
});

test("implementation is offline, minimized, and structurally unable to change counters or qualification", async () => {
  const source = await read("apps/web/server/evaluation/key-prv-randomized-order.ts");
  const instrumentStart = source.indexOf("export const KEY_PRV_INSTRUMENT");
  const instrumentEnd = source.indexOf("export const KEY_PRV_CANONICAL_IDS");
  const executableWithoutFrozenStatements = `${source.slice(0, instrumentStart)}${source.slice(instrumentEnd)}`;
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|OPENAI|API_KEY|DATABASE_URL|@prisma|from ["']openai/);
  assert.doesNotMatch(source, /Math\.random|function\s+(?:score|threshold)|participantCounter(?:s)?\s*[+\-]=|genuineReleaseReviewsChanged:\s*[1-9]|releaseReviewersChanged:\s*[1-9]/);
  for (const forbidden of ["name","email","phone","address","diagnosis","employer","biography","freeText","provider","credential","secret","desiredOutcome"]) assert.doesNotMatch(executableWithoutFrozenStatements, new RegExp(`\\b${forbidden}\\b`, "i"), forbidden);
  assert.match(source, /participantCountersChanged: 0/); assert.match(source, /releaseReviewersChanged: 0/); assert.match(source, /genuineReleaseReviewsChanged: 0/); assert.match(source, /hmmStatus: "not_qualified"/);
});

test("protocol and checklist represent accessibility assistance boundaries and every gate remains pending", async () => {
  const protocol = await read("docs/runbooks/sprint-6.5.4-role-custody-readiness-protocol-v2.md");
  const checklist = await read("docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v4.md");
  for (const text of [protocol, checklist]) {
    assert.match(text, /PENDING/); assert.match(text, /BLOCKED/); assert.match(text, /NO REAL KEY\+PRV SCREENING/); assert.match(text, /NO REAL SCORER CALIBRATION/); assert.match(text, /NO A-01 CONTACT/);
    assert.match(text, /0\/16/); assert.match(text, /0\/12/); assert.match(text, /0\/2/); assert.match(text, /0\/30/); assert.match(text, /NOT_QUALIFIED/);
    assert.match(text, /physical selection/i); assert.match(text, /repeat/i); assert.match(text, /paraphrase/i); assert.match(text, /ambigu/i);
  }
});
