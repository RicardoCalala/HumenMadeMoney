import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Sprint 5.5 migration is forward-only and contains reviewed integrity controls", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260806000000_sprint_5_5_persistence/migration.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
  assert.match(sql, /DEFERRABLE INITIALLY DEFERRED/);
  assert.match(sql, /agreement_memberships_one_active_owner/);
  assert.match(sql, /agreement_memberships_unique_live_binding/);
  assert.match(sql, /agreement_versions_predecessor_check/);
  assert.match(sql, /sessions_revoked_timestamp/);
});

test("Sprint 5.6 migration is additive and protects workflow history", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260806190000_sprint_5_6_evidence_workflow/migration.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
  for (const table of ["evidence_items", "evidence_revisions", "evidence_sets", "evidence_set_members", "assessments", "human_review_requests", "reviewer_decisions"]) assert.match(sql, new RegExp(`CREATE TABLE "${table}"`));
  assert.match(sql, /evidence_revisions_immutable/); assert.match(sql, /reviewer_decisions_immutable/); assert.match(sql, /hmm_guard_assessment_update/);
  assert.match(sql, /evidence_items_id_current_revision_id_fkey/); assert.match(sql, /assessments_evidence_set_id_agreement_id_version_id_fkey/);
  assert.match(sql, /result_resource_type/); assert.match(sql, /result_resource_id/);
});
