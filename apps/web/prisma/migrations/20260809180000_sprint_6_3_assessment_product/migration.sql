ALTER TABLE "assessments"
  ADD COLUMN "document_digest" TEXT,
  ADD COLUMN "evidence_set_digest" TEXT,
  ADD COLUMN "evidence_canonicalization_version" TEXT,
  ADD COLUMN "provider_class" TEXT,
  ADD COLUMN "provider_name" TEXT,
  ADD COLUMN "model_version" TEXT,
  ADD COLUMN "prompt_version" TEXT,
  ADD COLUMN "schema_version" TEXT,
  ADD COLUMN "claim_reference_contract_version" TEXT,
  ADD COLUMN "action_contract_version" TEXT,
  ADD COLUMN "authority_safe" BOOLEAN,
  ADD COLUMN "semantic_expectation_matched" TEXT,
  ADD COLUMN "acceptable_action_matched" TEXT,
  ADD COLUMN "requested_by_account_id" TEXT,
  ADD COLUMN "requested_by_party_id" TEXT,
  ADD COLUMN "requested_by_role" TEXT,
  ADD COLUMN "requested_at" TIMESTAMPTZ(3),
  ADD COLUMN "completed_at" TIMESTAMPTZ(3),
  ADD COLUMN "fallback_reason" TEXT,
  ADD COLUMN "fallback_from_provider" TEXT,
  ADD COLUMN "failure_code" TEXT;

ALTER TABLE "assessments" ADD CONSTRAINT "assessment_execution_metadata_bounded" CHECK (
  length(COALESCE("document_digest", '')) <= 128 AND
  length(COALESCE("evidence_set_digest", '')) <= 128 AND
  length(COALESCE("provider_name", '')) <= 256 AND
  length(COALESCE("fallback_reason", '')) <= 128 AND
  length(COALESCE("failure_code", '')) <= 128
);

CREATE UNIQUE INDEX "assessment_evaluation_envelope_unique" ON "assessments" (
  "agreement_id", "version_id", "document_digest", "evidence_set_digest", "adapter_version",
  "policy_version", "prompt_version", "schema_version", "action_contract_version"
);
