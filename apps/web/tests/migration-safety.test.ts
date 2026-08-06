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
