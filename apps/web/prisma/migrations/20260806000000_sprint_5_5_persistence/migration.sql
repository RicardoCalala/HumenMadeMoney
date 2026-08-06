-- CreateEnum
CREATE TYPE "AccountState" AS ENUM ('active', 'suspended', 'disabled');

-- CreateEnum
CREATE TYPE "SessionState" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "AgreementLifecycleState" AS ENUM ('draft', 'in_review', 'accepted');

-- CreateEnum
CREATE TYPE "AgreementVersionState" AS ENUM ('draft', 'proposed', 'accepted', 'superseded', 'withdrawn');

-- CreateEnum
CREATE TYPE "AmendmentKind" AS ENUM ('material', 'cosmetic');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'participant', 'reviewer', 'observer');

-- CreateEnum
CREATE TYPE "MembershipState" AS ENUM ('active', 'pending_invitation', 'revoked');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "state" "AccountState" NOT NULL,
    "display_name" TEXT NOT NULL,
    "primary_email" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_auth_profiles" (
    "profile_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "local_auth_profiles_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "token_digest" TEXT NOT NULL,
    "csrf_digest" TEXT NOT NULL,
    "state" "SessionState" NOT NULL,
    "assurance" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL,
    "idle_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "absolute_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "rotation" INTEGER NOT NULL,
    "replaced_session_id" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" TEXT NOT NULL,
    "current_version_id" TEXT NOT NULL,
    "lifecycle_state" "AgreementLifecycleState" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_actor_id" TEXT NOT NULL,
    "last_changed_by_actor_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_versions" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "agreement_version" INTEGER NOT NULL,
    "previous_version_id" TEXT,
    "schema_version" TEXT NOT NULL,
    "version_state" "AgreementVersionState" NOT NULL,
    "amendment_kind" "AmendmentKind",
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_party_id" TEXT NOT NULL,
    "document" JSONB NOT NULL,
    "protection_mode" TEXT NOT NULL,
    "document_digest" TEXT,

    CONSTRAINT "agreement_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_version_parties" (
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "acceptance_required" BOOLEAN NOT NULL,
    "party_type" TEXT NOT NULL,
    "roles" JSONB NOT NULL,

    CONSTRAINT "agreement_version_parties_pkey" PRIMARY KEY ("agreement_id","version_id","party_id")
);

-- CreateTable
CREATE TABLE "agreement_memberships" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "account_id" TEXT,
    "party_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "state" "MembershipState" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_account_id" TEXT NOT NULL,
    "activated_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "agreement_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_acceptances" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "party_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMPTZ(3) NOT NULL,
    "consent_context" TEXT NOT NULL,
    "assurance_context" TEXT NOT NULL,
    "account_id" TEXT,
    "session_id" TEXT,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "correlation_id" TEXT NOT NULL,

    CONSTRAINT "agreement_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "agreement_scope_id" TEXT,
    "normalized_scope" TEXT NOT NULL,
    "key_digest" TEXT NOT NULL,
    "request_fingerprint" TEXT NOT NULL,
    "agreement_id" TEXT,
    "result_version_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_records" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "version_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "causation_id" TEXT,
    "source_system" TEXT NOT NULL,
    "policy_version" TEXT,
    "related_object_ids" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "audit_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "local_auth_profiles_account_id_key" ON "local_auth_profiles"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_digest_key" ON "sessions"("token_digest");

-- CreateIndex
CREATE INDEX "sessions_account_id_state_idx" ON "sessions"("account_id", "state");

-- CreateIndex
CREATE INDEX "sessions_state_idle_expires_at_absolute_expires_at_idx" ON "sessions"("state", "idle_expires_at", "absolute_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_current_version_id_key" ON "agreements"("current_version_id");

-- CreateIndex
CREATE INDEX "agreements_updated_at_id_idx" ON "agreements"("updated_at" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_id_current_version_id_key" ON "agreements"("id", "current_version_id");

-- CreateIndex
CREATE INDEX "agreement_versions_agreement_id_created_at_idx" ON "agreement_versions"("agreement_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_versions_agreement_id_agreement_version_key" ON "agreement_versions"("agreement_id", "agreement_version");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_versions_agreement_id_id_key" ON "agreement_versions"("agreement_id", "id");

-- CreateIndex
CREATE INDEX "agreement_memberships_account_id_state_agreement_id_idx" ON "agreement_memberships"("account_id", "state", "agreement_id");

-- CreateIndex
CREATE INDEX "agreement_memberships_agreement_id_account_id_state_idx" ON "agreement_memberships"("agreement_id", "account_id", "state");

-- CreateIndex
CREATE INDEX "agreement_acceptances_agreement_id_version_id_idx" ON "agreement_acceptances"("agreement_id", "version_id");

-- CreateIndex
CREATE UNIQUE INDEX "agreement_acceptances_version_id_party_id_key" ON "agreement_acceptances"("version_id", "party_id");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_actor_id_operation_normalized_scope_key_key" ON "idempotency_records"("actor_id", "operation", "normalized_scope", "key_digest");

-- CreateIndex
CREATE INDEX "audit_records_agreement_id_occurred_at_id_idx" ON "audit_records"("agreement_id", "occurred_at", "id");

-- CreateIndex
CREATE INDEX "audit_records_correlation_id_idx" ON "audit_records"("correlation_id");

-- AddForeignKey
ALTER TABLE "local_auth_profiles" ADD CONSTRAINT "local_auth_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_replaced_session_id_fkey" FOREIGN KEY ("replaced_session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_id_current_version_id_fkey" FOREIGN KEY ("id", "current_version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

-- AddForeignKey
ALTER TABLE "agreement_version_parties" ADD CONSTRAINT "agreement_version_parties_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_memberships" ADD CONSTRAINT "agreement_memberships_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_memberships" ADD CONSTRAINT "agreement_memberships_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_memberships" ADD CONSTRAINT "agreement_memberships_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_agreement_id_version_id_party_id_fkey" FOREIGN KEY ("agreement_id", "version_id", "party_id") REFERENCES "agreement_version_parties"("agreement_id", "version_id", "party_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_acceptances" ADD CONSTRAINT "agreement_acceptances_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_records" ADD CONSTRAINT "audit_records_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_records" ADD CONSTRAINT "audit_records_agreement_id_version_id_fkey" FOREIGN KEY ("agreement_id", "version_id") REFERENCES "agreement_versions"("agreement_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "agreement_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION enforce_agreement_version_predecessor() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."agreement_version" = 1 AND NEW."previous_version_id" IS NOT NULL THEN
    RAISE EXCEPTION 'version 1 cannot have a predecessor' USING ERRCODE = '23514';
  END IF;
  IF NEW."agreement_version" > 1 AND NOT EXISTS (
    SELECT 1 FROM "agreement_versions" previous
    WHERE previous."id" = NEW."previous_version_id"
      AND previous."agreement_id" = NEW."agreement_id"
      AND previous."agreement_version" = NEW."agreement_version" - 1
  ) THEN
    RAISE EXCEPTION 'invalid agreement version predecessor' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "agreement_versions_predecessor_check"
AFTER INSERT OR UPDATE OF "agreement_id", "agreement_version", "previous_version_id" ON "agreement_versions"
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_agreement_version_predecessor();

-- Sprint 5.5 integrity constraints and partial uniqueness.
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_rotation_non_negative" CHECK ("rotation" >= 0);
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_expiry_order" CHECK ("idle_expires_at" <= "absolute_expires_at");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_last_seen_order" CHECK ("last_seen_at" >= "created_at");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_revoked_timestamp" CHECK ("state" <> 'revoked' OR "revoked_at" IS NOT NULL);
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_revision_non_negative" CHECK ("revision" >= 0);
ALTER TABLE "agreement_versions" ADD CONSTRAINT "agreement_versions_sequence_positive" CHECK ("agreement_version" > 0);
CREATE UNIQUE INDEX "agreement_memberships_one_active_owner" ON "agreement_memberships" ("agreement_id") WHERE "role" = 'owner' AND "state" = 'active';
CREATE UNIQUE INDEX "agreement_memberships_unique_live_binding" ON "agreement_memberships" ("agreement_id", "account_id", "party_id") WHERE "state" <> 'revoked' AND "account_id" IS NOT NULL;
