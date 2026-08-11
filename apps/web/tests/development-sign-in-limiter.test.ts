import assert from "node:assert/strict";
import test from "node:test";
import { DevelopmentSignInLimiter } from "../server/auth/development-sign-in-limiter.ts";

test("development limiter scopes attempts by profile and origin", () => {
  const limiter = new DevelopmentSignInLimiter({ windowMs: 1_000, maximum: 2, maximumBuckets: 10 });
  assert.equal(limiter.check(["origin:a", "profile:alex"], 0).allowed, true);
  assert.equal(limiter.check(["origin:a", "profile:alex"], 1).allowed, true);
  assert.equal(limiter.check(["origin:a", "profile:alex"], 2).allowed, false);
  assert.equal(limiter.check(["origin:b", "profile:blair"], 2).allowed, true);
});

test("development limiter expires attempts and bounds stored buckets", () => {
  const limiter = new DevelopmentSignInLimiter({ windowMs: 100, maximum: 1, maximumBuckets: 3 });
  for (let index = 0; index < 8; index++) limiter.check([`profile:${index}`], index);
  assert.equal(limiter.sizeForTest(), 3);
  assert.equal(limiter.check(["profile:7"], 200).allowed, true);
  assert.equal(limiter.sizeForTest(), 1);
});
