import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const docs = resolve(process.cwd(), "../..", "docs");
const orientationPath = resolve(docs, "human-review-orientation-v1.md");
const orientation = readFileSync(orientationPath, "utf8");
const protocol = readFileSync(resolve(docs, "ai-evaluation-labeling-protocol.md"), "utf8");
const recruitment = readFileSync(resolve(docs, "runbooks/sprint-6.5.3-reviewer-recruitment-and-eligibility.md"), "utf8");

const begin = "<!-- BEGIN VERBATIM ORIENTATION -->";
const end = "<!-- END VERBATIM ORIENTATION -->";
const presentation = orientation.split(begin)[1]?.split(end)[0]?.trim();

test("the frozen reviewer orientation exists and is referenced consistently", () => {
  assert.match(orientation, /Version: `human-review-orientation-v1`/);
  assert.match(orientation, /APPROVED AND FROZEN FOR VERBATIM PRESENTATION/);
  assert.ok(presentation);
  assert.match(protocol, /`human-review-orientation-v1`/);
  assert.match(protocol, /\(human-review-orientation-v1\.md\)/);
  assert.match(recruitment, /`human-review-orientation-v1`/);
  assert.match(recruitment, /\(\.\.\/human-review-orientation-v1\.md\)/);
});

test("the verbatim presentation text stays frozen and contains no restricted study material", () => {
  assert.equal(
    createHash("sha256").update(presentation!).digest("hex"),
    "bface7525806673814bda0040fa8dacff54ca2949e17a80d61f505076e95b800",
  );
  assert.doesNotMatch(presentation!, /answer key|expected (?:case )?answer|scor(?:e|ing)|threshold|orderA|orderB|caseId|reviewer-packet|another reviewer/i);
  assert.doesNotMatch(presentation!, /\b(?:8[0-9]|9[0-9]|100)%\b/);
});

test("the same neutral restatement question is frozen in the artifact and operator runbook", () => {
  const question = "Please restate in your own words: what role may an automated assessment play in Human Made Money, and what authority does it not have?";
  assert.match(orientation, new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(recruitment, new RegExp(question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
