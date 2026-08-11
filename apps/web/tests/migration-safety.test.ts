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

test("Sprint 5.7 migration is additive, simulated-only, and has no proposal-expiry default", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260806230000_sprint_5_7_simulated_resolution/migration.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
  assert.match(sql, /CREATE TYPE "ExecutionMode" AS ENUM \('simulated'\)/);
  assert.match(sql, /one_active_resolution_outcome/);
  assert.match(sql, /simulated_ledger_balance/);
  assert.match(sql, /append_only/);
  assert.match(sql, /"expires_at" TIMESTAMPTZ\(3\),/);
  assert.doesNotMatch(sql, /"expires_at"[^,;]*DEFAULT/i);
  assert.doesNotMatch(sql, /provider|custody|bank_account|payment_token/i);
});

test("Sprint 6.3 migration is additive and bounds durable assessment provenance", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260809180000_sprint_6_3_assessment_product/migration.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /\bDROP\s+(TABLE|COLUMN|TYPE)\b/i);
  for (const column of ["document_digest", "evidence_set_digest", "provider_class", "prompt_version", "schema_version", "action_contract_version", "authority_safe", "requested_at", "completed_at"]) assert.match(sql, new RegExp(`ADD COLUMN "${column}"`));
  assert.match(sql, /assessment_execution_metadata_bounded/);
  assert.match(sql, /assessment_evaluation_envelope_unique/);
  assert.doesNotMatch(sql, /api_key|authorization_header|raw_prompt|raw_response|chain_of_thought/i);
});

test("Sprint 6.4 migration additively preserves requested and resolved model provenance", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260810010000_sprint_6_4_openai_product/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /ADD COLUMN "requested_model_version" TEXT/); assert.match(sql, /ADD COLUMN "resolved_model_version" TEXT/);
  assert.doesNotMatch(sql, /DROP|DELETE|TRUNCATE|ALTER COLUMN/i);
});

test("Sprint 6.4.2 migration additively correlates bounded live provenance while preserving legacy nulls", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260810160000_sprint_6_4_2_provenance_hardening/migration.sql", import.meta.url), "utf8");
  for (const column of ["configuration_digest", "provider_run_id", "provider_correlation_id", "browser_authorization_id", "browser_attempt_id"]) assert.match(sql, new RegExp(`ADD COLUMN "${column}" TEXT`));
  assert.match(sql, /assessment_live_provenance_bounded/); assert.match(sql, /assessment_browser_authorization_attempt_unique/); assert.doesNotMatch(sql, /NOT NULL|DEFAULT|DROP|DELETE|TRUNCATE|api_key|raw_prompt|raw_response/i);
});

test("Sprint 6.5.2 migration additively protects persisted terminal resolutions", async () => {
  const sql = await readFile(new URL("../prisma/migrations/20260811090000_sprint_6_5_2_terminal_resolution_guard/migration.sql", import.meta.url), "utf8");
  assert.match(sql, /simulated_executed[\s\S]*cancelled[\s\S]*expired/);
  assert.match(sql, /proposed_resolutions_terminal_immutable/);
  assert.doesNotMatch(sql, /\bDROP\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i);
});
