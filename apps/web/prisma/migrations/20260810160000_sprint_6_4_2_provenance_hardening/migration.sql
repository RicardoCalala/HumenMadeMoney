ALTER TABLE "assessments"
  ADD COLUMN "configuration_digest" TEXT,
  ADD COLUMN "provider_run_id" TEXT,
  ADD COLUMN "provider_correlation_id" TEXT,
  ADD COLUMN "browser_authorization_id" TEXT,
  ADD COLUMN "browser_attempt_id" TEXT;

ALTER TABLE "assessments" ADD CONSTRAINT "assessment_live_provenance_bounded" CHECK (
  length(COALESCE("configuration_digest", '')) <= 128 AND
  length(COALESCE("provider_run_id", '')) <= 128 AND
  length(COALESCE("provider_correlation_id", '')) <= 128 AND
  length(COALESCE("browser_authorization_id", '')) <= 128 AND
  length(COALESCE("browser_attempt_id", '')) <= 128
);

CREATE UNIQUE INDEX "assessment_browser_authorization_attempt_unique"
  ON "assessments" ("browser_authorization_id", "browser_attempt_id");
