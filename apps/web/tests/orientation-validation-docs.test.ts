import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "../..");
const read = (path: string) => readFile(resolve(root, path), "utf8");

test("all approved versions and the pending second checkpoint are linked consistently", async () => {
  const protocol = await read("docs/runbooks/sprint-6.5.4-orientation-validation-protocol-v1.md"); const study = await read("docs/orientation-validation-study-v2.md"); const checkpoint = await read("docs/runbooks/sprint-6.5.4-second-founder-checkpoint.md");
  for (const version of ["human-review-orientation-v2", "authority-comprehension-instrument-v1", "orientation-validation-protocol-v1", "authority-comprehension-rubric-v1", "orientation-validation-result-v1", "orientation-validation-report-v1", "hmm-comprehension-study-v2", "authority-comprehension-dataset-v1"]) assert.match(`${protocol}\n${study}`, new RegExp(version));
  assert.match(checkpoint, /PENDING — NO RECRUITMENT/); assert.match(checkpoint, /NOT_QUALIFIED/); assert.match(checkpoint, /0\/2/); assert.match(checkpoint, /0\/30/); assert.doesNotMatch(checkpoint, /Recruitment authorized: \*\*YES/);
});

test("participant-facing v2 material is plain-language and terminology-independent", async () => {
  const orientation = await read("docs/human-review-orientation-v2.md"); const instrument = await read("docs/authority-comprehension-instrument-v1.md");
  const presented = orientation.split("<!-- BEGIN V2 ORIENTATION -->")[1]?.split("<!-- END V2 ORIENTATION -->")[0] ?? "";
  assert.ok(presented.length > 500); assert.doesNotMatch(presented, /Human Made Money|\bHMM\b|MCP|Financial Safety|record_resolution|deterministic|authority category/);
  assert.doesNotMatch(instrument.split("## Frozen administration rules")[0]!, /Human Made Money|\bHMM\b|MCP|Financial Safety|record_resolution/);
  assert.match(instrument, /One attempt only/); assert.match(instrument, /no corrective feedback/i); assert.match(instrument, /four application scenarios|## 3\. Application scenarios/i);
});

test("approved design records four groups and no obsolete two-group threshold", async () => {
  const design = await read("docs/sprints/sprint-6.5.4-comprehension-validation-design.md"); const approvals = await read("docs/runbooks/sprint-6.5.4-founder-approvals.md");
  assert.match(design, /group A: 3/); assert.match(design, /group D: 3/); assert.match(design, /2 of 3/); assert.doesNotMatch(design, /two 6-person profile strata|4 of 6 target enrollments/);
  assert.match(approvals, /11\/11/); assert.match(approvals, /four groups of three/); assert.match(approvals, /second founder checkpoint/i);
});

test("result schema minimizes identity/background and closes record shapes", async () => {
  const schema = JSON.parse(await read("apps/web/tests/fixtures/ai-evaluation/orientation-validation/result-schema.json")) as { $defs: Record<string, { additionalProperties: boolean }>; prohibitedFields: string[] };
  for (const name of ["administration", "score", "adjudication", "operationalCheck"]) assert.equal(schema.$defs[name]!.additionalProperties, false);
  for (const field of ["name", "email", "employer", "jobTitle", "education", "diagnosis", "rawResponse", "apiKey"]) assert.ok(schema.prohibitedFields.includes(field));
});

test("offline evaluator source has no provider, network, environment-secret, or database dependency", async () => {
  const source = await read("apps/web/server/evaluation/orientation-validation.ts");
  assert.doesNotMatch(source, /from ["'](?:openai|@openai|https?:|.*prisma)|process\.env|fetch\(|XMLHttpRequest|WebSocket|DATABASE_URL|OPENAI_API_KEY/);
  assert.match(source, /networkRequests: 0/);
});
