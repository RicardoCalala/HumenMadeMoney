-- CreateEnum
CREATE TYPE "EvidenceLifecycle" AS ENUM ('active', 'superseded', 'withdrawn', 'revoked');

-- CreateEnum
CREATE TYPE "EvidenceAvailability" AS ENUM ('available', 'missing', 'inaccessible', 'stale', 'revoked');

-- CreateEnum
CREATE TYPE "EvidenceIntegrity" AS ENUM ('unverified', 'verified', 'failed');

-- CreateEnum
CREATE TYPE "EvidenceValidation" AS ENUM ('pending', 'valid', 'invalid');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('pending', 'completed', 'failed', 'superseded');

-- CreateEnum
CREATE TYPE "HumanReviewState" AS ENUM ('open', 'assigned', 'in_review', 'completed', 'cancelled', 'superseded');

-- AlterTable
ALTER TABLE "idempotency_records" ADD COLUMN     "result_resource_id" TEXT,
ADD COLUMN     "result_resource_type" TEXT;

-- CreateTable
CREATE TABLE "evidence_items" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "evidence_requirement_id" TEXT NOT NULL,
    "current_revision_id" TEXT,
    "lifecycle" "EvidenceLifecycle" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_account_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evidence_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_revisions" (
    "id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "supersedes_revision_id" TEXT,
    "criterion_ids" JSONB NOT NULL,
    "evidence_class" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "submitted_by_party_id" TEXT,
    "submitted_by_account_id" TEXT,
    "source_constraint_id" TEXT NOT NULL,
    "source_ref_kind" TEXT,
    "source_ref" TEXT,
    "source_display_label" TEXT,
    "observed_at" TIMESTAMPTZ(3),
    "captured_at" TIMESTAMPTZ(3) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL,
    "availability" "EvidenceAvailability" NOT NULL,
    "integrity" "EvidenceIntegrity" NOT NULL,
    "validation" "EvidenceValidation" NOT NULL,
    "validation_reasons" JSONB NOT NULL,
    "metadata" JSONB NOT NULL,
    "content_digest" TEXT,

    CONSTRAINT "evidence_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_provenance_events" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "evidence_id" TEXT NOT NULL,
    "evidence_revision_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "causation_id" TEXT,
    "source_system" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "evidence_provenance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_sets" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "canonicalization_version" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_account_id" TEXT NOT NULL,

    CONSTRAINT "evidence_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_set_members" (
    "evidence_set_id" TEXT NOT NULL,
    "evidence_revision_id" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,

    CONSTRAINT "evidence_set_members_pkey" PRIMARY KEY ("evidence_set_id","evidence_revision_id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "evidence_set_id" TEXT NOT NULL,
    "supersedes_assessment_id" TEXT,
    "adapter_kind" TEXT NOT NULL,
    "adapter_version" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL,
    "confidence" JSONB NOT NULL,
    "limitations" JSONB NOT NULL,
    "recommended_next_action" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_findings" (
    "assessment_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "evidence_requirement_ids" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "limitations" JSONB NOT NULL,

    CONSTRAINT "assessment_findings_pkey" PRIMARY KEY ("assessment_id","criterion_id")
);

-- CreateTable
CREATE TABLE "assessment_finding_support" (
    "assessment_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "evidence_revision_id" TEXT NOT NULL,

    CONSTRAINT "assessment_finding_support_pkey" PRIMARY KEY ("assessment_id","criterion_id","evidence_revision_id")
);

-- CreateTable
CREATE TABLE "assessment_finding_conflicts" (
    "assessment_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "evidence_revision_id" TEXT NOT NULL,

    CONSTRAINT "assessment_finding_conflicts_pkey" PRIMARY KEY ("assessment_id","criterion_id","evidence_revision_id")
);

-- CreateTable
CREATE TABLE "human_review_requests" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "assessment_id" TEXT,
    "evidence_set_id" TEXT,
    "reason_codes" JSONB NOT NULL,
    "affected_criterion_ids" JSONB NOT NULL,
    "requested_by_account_id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "state" "HumanReviewState" NOT NULL,
    "assigned_account_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "human_review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_decisions" (
    "id" TEXT NOT NULL,
    "review_request_id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "evidence_set_id" TEXT,
    "reviewer_account_id" TEXT NOT NULL,
    "reviewer_party_id" TEXT NOT NULL,
    "authority_basis" TEXT NOT NULL,
    "decision_type" TEXT NOT NULL,
    "criterion_findings" JSONB NOT NULL,
    "evidence_revision_ids" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "limitations" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "supersedes_decision_id" TEXT,

    CONSTRAINT "reviewer_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviewer_decision_assessments" (
    "reviewer_decision_id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,

    CONSTRAINT "reviewer_decision_assessments_pkey" PRIMARY KEY ("reviewer_decision_id","assessment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evidence_items_current_revision_id_key" ON "evidence_items"("current_revision_id");

-- CreateIndex
CREATE INDEX "evidence_items_agreement_id_version_id_created_at_id_idx" ON "evidence_items"("agreement_id", "version_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "evidence_items_agreement_id_evidence_requirement_id_lifecyc_idx" ON "evidence_items"("agreement_id", "evidence_requirement_id", "lifecycle");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_items_id_agreement_id_version_id_key" ON "evidence_items"("id", "agreement_id", "version_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_items_id_current_revision_id_key" ON "evidence_items"("id", "current_revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_revisions_supersedes_revision_id_key" ON "evidence_revisions"("supersedes_revision_id");

-- CreateIndex
CREATE INDEX "evidence_revisions_evidence_id_received_at_idx" ON "evidence_revisions"("evidence_id", "received_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "evidence_revisions_evidence_id_id_key" ON "evidence_revisions"("evidence_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_revisions_evidence_id_revision_number_key" ON "evidence_revisions"("evidence_id", "revision_number");

-- CreateIndex
CREATE INDEX "evidence_provenance_events_agreement_id_occurred_at_id_idx" ON "evidence_provenance_events"("agreement_id", "occurred_at", "id");

-- CreateIndex
CREATE INDEX "evidence_provenance_events_evidence_id_occurred_at_id_idx" ON "evidence_provenance_events"("evidence_id", "occurred_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_sets_agreement_id_version_id_canonicalization_vers_key" ON "evidence_sets"("agreement_id", "version_id", "canonicalization_version", "digest");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_sets_id_agreement_id_version_id_key" ON "evidence_sets"("id", "agreement_id", "version_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_set_members_evidence_set_id_ordinal_key" ON "evidence_set_members"("evidence_set_id", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_supersedes_assessment_id_key" ON "assessments"("supersedes_assessment_id");

-- CreateIndex
CREATE INDEX "assessments_agreement_id_version_id_occurred_at_id_idx" ON "assessments"("agreement_id", "version_id", "occurred_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "assessments_evidence_set_id_status_idx" ON "assessments"("evidence_set_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_id_agreement_id_version_id_key" ON "assessments"("id", "agreement_id", "version_id");

-- CreateIndex
CREATE INDEX "human_review_requests_state_created_at_id_idx" ON "human_review_requests"("state", "created_at", "id");

-- CreateIndex
CREATE INDEX "human_review_requests_agreement_id_version_id_created_at_id_idx" ON "human_review_requests"("agreement_id", "version_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "human_review_requests_id_agreement_id_version_id_key" ON "human_review_requests"("id", "agreement_id", "version_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviewer_decisions_supersedes_decision_id_key" ON "reviewer_decisions"("supersedes_decision_id");

-- CreateIndex
CREATE INDEX "reviewer_decisions_review_request_id_created_at_id_idx" ON "reviewer_decisions"("review_request_id", "created_at", "id");

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_id_current_revision_id_fkey" FOREIGN KEY ("id", "current_revision_id") REFERENCES "evidence_revisions"("evidence_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_revisions" ADD CONSTRAINT "evidence_revisions_evidence_id_agreement_id_version_id_fkey" FOREIGN KEY ("evidence_id", "agreement_id", "version_id") REFERENCES "evidence_items"("id", "agreement_id", "version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_revisions" ADD CONSTRAINT "evidence_revisions_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_revisions" ADD CONSTRAINT "evidence_revisions_submitted_by_account_id_fkey" FOREIGN KEY ("submitted_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_revisions" ADD CONSTRAINT "evidence_revisions_supersedes_revision_id_fkey" FOREIGN KEY ("supersedes_revision_id") REFERENCES "evidence_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_provenance_events" ADD CONSTRAINT "evidence_provenance_events_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_provenance_events" ADD CONSTRAINT "evidence_provenance_events_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_provenance_events" ADD CONSTRAINT "evidence_provenance_events_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_provenance_events" ADD CONSTRAINT "evidence_provenance_events_evidence_revision_id_fkey" FOREIGN KEY ("evidence_revision_id") REFERENCES "evidence_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_sets" ADD CONSTRAINT "evidence_sets_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_sets" ADD CONSTRAINT "evidence_sets_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_sets" ADD CONSTRAINT "evidence_sets_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_set_members" ADD CONSTRAINT "evidence_set_members_evidence_set_id_fkey" FOREIGN KEY ("evidence_set_id") REFERENCES "evidence_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_set_members" ADD CONSTRAINT "evidence_set_members_evidence_revision_id_fkey" FOREIGN KEY ("evidence_revision_id") REFERENCES "evidence_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_evidence_set_id_agreement_id_version_id_fkey" FOREIGN KEY ("evidence_set_id", "agreement_id", "version_id") REFERENCES "evidence_sets"("id", "agreement_id", "version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_supersedes_assessment_id_fkey" FOREIGN KEY ("supersedes_assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_findings" ADD CONSTRAINT "assessment_findings_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_finding_support" ADD CONSTRAINT "assessment_finding_support_assessment_id_criterion_id_fkey" FOREIGN KEY ("assessment_id", "criterion_id") REFERENCES "assessment_findings"("assessment_id", "criterion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_finding_support" ADD CONSTRAINT "assessment_finding_support_evidence_revision_id_fkey" FOREIGN KEY ("evidence_revision_id") REFERENCES "evidence_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_finding_conflicts" ADD CONSTRAINT "assessment_finding_conflicts_assessment_id_criterion_id_fkey" FOREIGN KEY ("assessment_id", "criterion_id") REFERENCES "assessment_findings"("assessment_id", "criterion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_finding_conflicts" ADD CONSTRAINT "assessment_finding_conflicts_evidence_revision_id_fkey" FOREIGN KEY ("evidence_revision_id") REFERENCES "evidence_revisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_requests" ADD CONSTRAINT "human_review_requests_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_requests" ADD CONSTRAINT "human_review_requests_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_requests" ADD CONSTRAINT "human_review_requests_assessment_id_agreement_id_version_i_fkey" FOREIGN KEY ("assessment_id", "agreement_id", "version_id") REFERENCES "assessments"("id", "agreement_id", "version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_requests" ADD CONSTRAINT "human_review_requests_evidence_set_id_agreement_id_version_fkey" FOREIGN KEY ("evidence_set_id", "agreement_id", "version_id") REFERENCES "evidence_sets"("id", "agreement_id", "version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_requests" ADD CONSTRAINT "human_review_requests_requested_by_account_id_fkey" FOREIGN KEY ("requested_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_review_requests" ADD CONSTRAINT "human_review_requests_assigned_account_id_fkey" FOREIGN KEY ("assigned_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decisions_review_request_id_agreement_id_version__fkey" FOREIGN KEY ("review_request_id", "agreement_id", "version_id") REFERENCES "human_review_requests"("id", "agreement_id", "version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decisions_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decisions_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decisions_evidence_set_id_agreement_id_version_id_fkey" FOREIGN KEY ("evidence_set_id", "agreement_id", "version_id") REFERENCES "evidence_sets"("id", "agreement_id", "version_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decisions_reviewer_account_id_fkey" FOREIGN KEY ("reviewer_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decisions_supersedes_decision_id_fkey" FOREIGN KEY ("supersedes_decision_id") REFERENCES "reviewer_decisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decision_assessments" ADD CONSTRAINT "reviewer_decision_assessments_reviewer_decision_id_fkey" FOREIGN KEY ("reviewer_decision_id") REFERENCES "reviewer_decisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviewer_decision_assessments" ADD CONSTRAINT "reviewer_decision_assessments_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Sprint 5.6 history is append-only. Envelope tables retain their explicit CAS fields.
CREATE FUNCTION hmm_reject_immutable_workflow_row() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'immutable workflow history cannot be changed' USING ERRCODE = '23514';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evidence_revisions_immutable
BEFORE UPDATE OR DELETE ON "evidence_revisions"
FOR EACH ROW EXECUTE FUNCTION hmm_reject_immutable_workflow_row();

CREATE TRIGGER evidence_provenance_events_immutable
BEFORE UPDATE OR DELETE ON "evidence_provenance_events"
FOR EACH ROW EXECUTE FUNCTION hmm_reject_immutable_workflow_row();

CREATE TRIGGER evidence_sets_immutable
BEFORE UPDATE OR DELETE ON "evidence_sets"
FOR EACH ROW EXECUTE FUNCTION hmm_reject_immutable_workflow_row();

CREATE TRIGGER evidence_set_members_immutable
BEFORE UPDATE OR DELETE ON "evidence_set_members"
FOR EACH ROW EXECUTE FUNCTION hmm_reject_immutable_workflow_row();

CREATE TRIGGER reviewer_decisions_immutable
BEFORE UPDATE OR DELETE ON "reviewer_decisions"
FOR EACH ROW EXECUTE FUNCTION hmm_reject_immutable_workflow_row();

CREATE FUNCTION hmm_guard_assessment_update() RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'pending' OR NEW.id <> OLD.id OR NEW.agreement_id <> OLD.agreement_id
     OR NEW.version_id <> OLD.version_id OR NEW.evidence_set_id <> OLD.evidence_set_id
     OR NEW.adapter_kind <> OLD.adapter_kind OR NEW.adapter_version <> OLD.adapter_version
     OR NEW.policy_version <> OLD.policy_version OR NEW.occurred_at <> OLD.occurred_at THEN
    RAISE EXCEPTION 'assessment content is immutable outside pending completion' USING ERRCODE = '23514';
  END IF;
  IF NEW.revision <> OLD.revision + 1 OR NEW.status NOT IN ('completed', 'failed', 'superseded') THEN
    RAISE EXCEPTION 'invalid assessment CAS transition' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assessments_guard_update
BEFORE UPDATE ON "assessments"
FOR EACH ROW EXECUTE FUNCTION hmm_guard_assessment_update();

ALTER TABLE "evidence_revisions" ADD CONSTRAINT "evidence_revision_not_self_superseding"
CHECK ("supersedes_revision_id" IS NULL OR "supersedes_revision_id" <> "id");
ALTER TABLE "assessments" ADD CONSTRAINT "assessment_not_self_superseding"
CHECK ("supersedes_assessment_id" IS NULL OR "supersedes_assessment_id" <> "id");
ALTER TABLE "reviewer_decisions" ADD CONSTRAINT "reviewer_decision_not_self_superseding"
CHECK ("supersedes_decision_id" IS NULL OR "supersedes_decision_id" <> "id");
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_item_revision_positive" CHECK ("revision" > 0);
ALTER TABLE "evidence_revisions" ADD CONSTRAINT "evidence_revision_number_positive" CHECK ("revision_number" > 0);
ALTER TABLE "human_review_requests" ADD CONSTRAINT "review_request_revision_positive" CHECK ("revision" > 0);
