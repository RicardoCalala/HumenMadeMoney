import assert from "node:assert/strict";
import test from "node:test";
import type { AgreementResource } from "../server/agreements/application/contracts.ts";
import { toAgreementSummary } from "../server/agreements/presentation.ts";

const resource = {
  agreementId: "agreement-simulated-execution-qa",
  currentVersionId: "version-simulated-execution-qa-v1",
  lifecycleState: "accepted",
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
  document: {
    agreementVersion: 1,
    versionState: "accepted",
    purpose: { title: "SYNTHETIC QA — simulated execution walkthrough", plainLanguageSummary: "Alex and Jordan accepted a synthetic scenario." },
    parties: [{ partyId: "qa-party-alex", displayName: "Alex (synthetic QA)", roles: ["creator"], responsibilityObligationIds: ["qa-obligation"] }],
    terms: { successCriteria: [], deadlines: [] },
    evidencePolicy: { sourceConstraints: [] },
    verificationPolicy: { reviewRoute: "local_test_human_review" },
    protectionPolicy: { mode: "protection", terms: { money: { amountMinor: 2500, currency: "CAD" }, releaseOutcomeIds: ["qa-complete"], refundOutcomeIds: [] } },
  },
  capabilities: { canRead: true, canUpdateDraft: false },
} as unknown as AgreementResource;

test("persisted agreement IDs are preserved for list-card navigation", () => {
  const summary = toAgreementSummary(resource);
  assert.equal(summary.id, "agreement-simulated-execution-qa");
  assert.equal(summary.title, "SYNTHETIC QA — simulated execution walkthrough");
  assert.equal(summary.funding.mode, "protection");
});
