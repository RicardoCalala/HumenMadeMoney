import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "../..");
const read = (path: string) => readFile(resolve(root, path), "utf8");
const sha256 = async (path: string) => createHash("sha256").update(await readFile(resolve(root, path))).digest("hex");

test("all 18 historical Sprint 6.5.4 artifact bytes remain at approved digests", async () => {
  const approved: Record<string, string> = {
    "docs/sprints/sprint-6.5.4-comprehension-validation-design.md": "57e70b3f7c2872d7318f7f989a9dbe6243d2dca15f540596efe672a1de83667c",
    "docs/human-review-orientation-v2.md": "ee871584098a3de66c560daea8f412003f206cf871d873e7a4fcc77688367179",
    "docs/authority-comprehension-instrument-v1.md": "0b6c7225c14f137498881ddc0bf0ee5c2b5656d3f3571d64052b5153c15bb7d5",
    "docs/authority-comprehension-rubric-v1.md": "36764c70bd926c55d65c9f813b77b33460abb1cdec3cd58093e828004b21ca10",
    "docs/orientation-validation-study-v2.md": "0b0fb4ada24461f35271c1e902923cc85573a299c592f02b98875379e072b9c9",
    "docs/runbooks/sprint-6.5.4-orientation-validation-protocol-v1.md": "2ab8d00a657e1f78615c04565731d6ff0607196f87a58f147f6695f342f59d0f",
    "docs/runbooks/sprint-6.5.4-founder-approvals.md": "bf6416d06d9a524bfac8004f40b7ad75754c129019072c5ed1024f224d33135f",
    "docs/runbooks/sprint-6.5.4-second-founder-checkpoint.md": "14b66255d8d1ee0668e40f3d21114a11e095f6933d4735b1cdc1cfbdce45480c",
    "apps/web/tests/fixtures/ai-evaluation/orientation-validation/protocol-manifest.json": "02ac0548ad1d0b70ef186b920c832b15a57262bc5a8ec7c455748a3a8d5482fc",
    "apps/web/tests/fixtures/ai-evaluation/orientation-validation/instrument.json": "068db391cd9fdc1a6d6a72f8605d6386a39e28e7bb624e0b5a57ae5efc42779d",
    "apps/web/tests/fixtures/ai-evaluation/orientation-validation/result-schema.json": "aea0ce1a48a011815456c97d3762e71e16a4303b8fd972cc5130c4347bb02c87",
    "apps/web/tests/fixtures/ai-evaluation/orientation-validation/report-schema.json": "b77241195ac250f49f10ac6e4f96de91dd123326dcea6a103acd54bbdfac4c58",
    "apps/web/tests/fixtures/ai-evaluation/orientation-validation/semantic-fixtures.json": "91d505a405cdeccfc0abea9f8f92c10a70f31123a5560e2de4b0d6ea84e4754f",
    "apps/web/server/evaluation/orientation-validation.ts": "bb3203b4af34dcfba4e792cd08aff5108eed9b16cb5563875b11417dc6cb4e89",
    "apps/web/tests/orientation-validation.test.ts": "9e8bbdc01a9ac379b3358f461935091d8d6260bcc5d3c5bb39f4670b61c80a7e",
    "apps/web/tests/orientation-validation-docs.test.ts": "a7ba81559dc59c18306ac37ff01f47da9cb4b10876a985e10b3052857080f674",
    "package.json": "b96e0c5fe4f630cd9f646c940f3174610bc7b059410619bda24fa6e5b16ad6cc",
    "apps/web/package.json": "a8ad63ca2c1d45ff9d7413aef85236e8dfbf497f06b880efb7dd4b869e115706",
  };
  for (const [path, expected] of Object.entries(approved)) assert.equal(await sha256(path), expected, path);
});

test("expanded scorer-calibration digest envelope matches exact artifact bytes", async () => {
  const manifest = await read("docs/runbooks/sprint-6.5.4-scorer-calibration-artifact-digests.md");
  const rows = [...manifest.matchAll(/\| [^\n|]+ \| `([^`]+)` \| [^\n|]+ \| `([a-f0-9]{64})` \|/g)];
  assert.equal(rows.length, 17);
  for (const row of rows) assert.equal(await sha256(row[1]!), row[2], row[1]);
});

test("versioned governance keeps both real-scorer calibration and first contact closed", async () => {
  const protocol = await read("docs/runbooks/sprint-6.5.4-scorer-calibration-protocol-v1.md");
  const checklist = await read("docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v2.md");
  const checkpoint = await read("docs/runbooks/sprint-6.5.4-scorer-calibration-founder-checkpoint.md");
  for (const text of [protocol, checklist, checkpoint]) { assert.match(text, /NO (?:REAL SCORER CALIBRATION|REAL SCORER ACCESS)/); assert.match(text, /NO A-01 CONTACT/); assert.match(text, /NOT_QUALIFIED/); assert.match(text, /0\/2/); assert.match(text, /0\/30/); }
  assert.match(checkpoint, /Founder decision: \*\*PENDING\*\*/); assert.doesNotMatch(checkpoint, /authorized: \*\*YES/);
});

test("construct separation excludes computer proficiency and preserves frozen participant bytes", async () => {
  const method = await read("docs/runbooks/sprint-6.5.4-construct-separation-methodology-v1.md");
  for (const phrase of ["typing speed", "spelling", "grammar", "writing style", "choose all that apply", "interaction/access observation", "instrument observation"]) assert.match(method, new RegExp(phrase, "i"));
  assert.match(method, /participant-facing.*unchanged/i);
  assert.match(method, /Allowed methods/); assert.match(method, /Prohibited assistance/); assert.match(method, /same frozen instrument.*groups A\/B\/C\/D/i);
});

test("ordinary governance documents contain no restricted fixture text or expected labels", async () => {
  const docs = `${await read("docs/runbooks/sprint-6.5.4-scorer-calibration-protocol-v1.md")}\n${await read("docs/runbooks/sprint-6.5.4-construct-separation-methodology-v1.md")}\n${await read("docs/runbooks/sprint-6.5.4-recruitment-execution-checklist-v2.md")}\n${await read("docs/runbooks/sprint-6.5.4-scorer-calibration-founder-checkpoint.md")}`;
  for (const canary of ["p-release-funds", "r-refund-direct", "autonomous_funds_release", "conditional_reviewer_appointment_unclear"]) assert.doesNotMatch(docs, new RegExp(canary));
});
