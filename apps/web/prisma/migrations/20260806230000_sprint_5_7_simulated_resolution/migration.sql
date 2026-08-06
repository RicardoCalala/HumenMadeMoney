CREATE TYPE "ResolutionState" AS ENUM ('proposed','review_window_open','disputed','held','authorized','execution_ready','simulated_executed','cancelled','expired');
CREATE TYPE "ResolutionProposalSource" AS ENUM ('deterministic_assessment','human_reviewer');
CREATE TYPE "ExecutionMode" AS ENUM ('simulated');
CREATE TYPE "FinancialSafetyState" AS ENUM ('clear','review_required','held','restricted');

CREATE TABLE "proposed_resolutions" ("id" TEXT PRIMARY KEY,"agreement_id" TEXT NOT NULL,"version_id" TEXT NOT NULL,"agreement_document_digest" TEXT NOT NULL,"resolution_outcome_id" TEXT NOT NULL,"consequence_ref" TEXT NOT NULL,"evidence_set_id" TEXT NOT NULL,"assessment_id" TEXT NOT NULL,"reviewer_decision_id" TEXT,"proposal_source" "ResolutionProposalSource" NOT NULL,"simulated_effect" JSONB NOT NULL,"policy_snapshot" JSONB NOT NULL,"review_window_seconds" INTEGER NOT NULL,"proposed_at" TIMESTAMPTZ(3) NOT NULL,"review_window_ends_at" TIMESTAMPTZ(3) NOT NULL,"expires_at" TIMESTAMPTZ(3),"state" "ResolutionState" NOT NULL,"revision" INTEGER NOT NULL DEFAULT 1,"created_by_account_id" TEXT NOT NULL,"created_at" TIMESTAMPTZ(3) NOT NULL,"updated_at" TIMESTAMPTZ(3) NOT NULL,CONSTRAINT "proposal_window_valid" CHECK ("review_window_seconds">=0 AND "review_window_ends_at"="proposed_at"+("review_window_seconds"*INTERVAL '1 second')),CONSTRAINT "proposal_expiry_ordered" CHECK ("expires_at" IS NULL OR "expires_at">"proposed_at"));
CREATE UNIQUE INDEX "proposed_resolutions_id_agreement_id_version_id_key" ON "proposed_resolutions"("id","agreement_id","version_id");
CREATE UNIQUE INDEX "one_active_resolution_outcome" ON "proposed_resolutions"("agreement_id","version_id","resolution_outcome_id") WHERE "state" NOT IN ('simulated_executed','cancelled','expired');
CREATE INDEX "proposed_resolutions_agreement_state_idx" ON "proposed_resolutions"("agreement_id","version_id","state","created_at" DESC);
CREATE INDEX "proposed_resolutions_window_idx" ON "proposed_resolutions"("review_window_ends_at","state");

CREATE TABLE "resolution_disputes" ("id" TEXT PRIMARY KEY,"proposal_id" TEXT NOT NULL,"agreement_id" TEXT NOT NULL,"version_id" TEXT NOT NULL,"opened_by_party_id" TEXT NOT NULL,"opened_by_account_id" TEXT NOT NULL,"status" TEXT NOT NULL,"reason_code" TEXT NOT NULL,"explanation" TEXT NOT NULL,"review_request_id" TEXT,"reviewer_decision_id" TEXT,"root_dispute_id" TEXT NOT NULL,"appeal_ordinal" INTEGER NOT NULL,"revision" INTEGER NOT NULL DEFAULT 1,"opened_at" TIMESTAMPTZ(3) NOT NULL,"resolved_at" TIMESTAMPTZ(3),CONSTRAINT "dispute_status_valid" CHECK ("status" IN ('open','under_review','resolved','appealed')),CONSTRAINT "appeal_ordinal_valid" CHECK ("appeal_ordinal">=0),CONSTRAINT "dispute_resolution_ordered" CHECK ("resolved_at" IS NULL OR "resolved_at">="opened_at"),UNIQUE("root_dispute_id","appeal_ordinal"));
CREATE INDEX "resolution_disputes_proposal_status_idx" ON "resolution_disputes"("proposal_id","status");
CREATE TABLE "resolution_authorization_grants" ("id" TEXT PRIMARY KEY,"proposal_id" TEXT NOT NULL,"agreement_id" TEXT NOT NULL,"version_id" TEXT NOT NULL,"party_id" TEXT NOT NULL,"account_id" TEXT NOT NULL,"action" TEXT NOT NULL,"consequence_ref" TEXT NOT NULL,"session_assurance" TEXT NOT NULL,"granted_at" TIMESTAMPTZ(3) NOT NULL,"expires_at" TIMESTAMPTZ(3),"revoked_at" TIMESTAMPTZ(3),"revision" INTEGER NOT NULL DEFAULT 1,CONSTRAINT "grant_expiry_ordered" CHECK ("expires_at" IS NULL OR "expires_at">"granted_at"),CONSTRAINT "grant_revocation_ordered" CHECK ("revoked_at" IS NULL OR "revoked_at">="granted_at"),UNIQUE("proposal_id","action","party_id","consequence_ref"));
CREATE INDEX "resolution_grants_active_idx" ON "resolution_authorization_grants"("proposal_id","action","revoked_at");
CREATE TABLE "financial_safety_statuses" ("agreement_id" TEXT NOT NULL,"version_id" TEXT NOT NULL,"state" "FinancialSafetyState" NOT NULL,"revision" INTEGER NOT NULL DEFAULT 1,"updated_at" TIMESTAMPTZ(3) NOT NULL,PRIMARY KEY("agreement_id","version_id"));
CREATE TABLE "financial_safety_transitions" ("id" TEXT PRIMARY KEY,"agreement_id" TEXT NOT NULL,"version_id" TEXT NOT NULL,"proposal_id" TEXT,"from_state" "FinancialSafetyState" NOT NULL,"to_state" "FinancialSafetyState" NOT NULL,"reason_code" TEXT NOT NULL,"actor_account_id" TEXT NOT NULL,"authority_basis" TEXT NOT NULL,"correlation_id" TEXT NOT NULL,"occurred_at" TIMESTAMPTZ(3) NOT NULL);
CREATE INDEX "financial_safety_history_idx" ON "financial_safety_transitions"("agreement_id","version_id","occurred_at");

CREATE TABLE "simulated_settlement_executions" ("id" TEXT PRIMARY KEY,"proposal_id" TEXT NOT NULL UNIQUE,"consequence_execution_key" TEXT NOT NULL UNIQUE,"execution_mode" "ExecutionMode" NOT NULL,"executed_by_account_id" TEXT NOT NULL,"executed_at" TIMESTAMPTZ(3) NOT NULL,"correlation_id" TEXT NOT NULL);
CREATE TABLE "simulated_settlement_intents" ("id" TEXT PRIMARY KEY,"execution_id" TEXT NOT NULL UNIQUE,"proposal_id" TEXT NOT NULL UNIQUE,"consequence_ref" TEXT NOT NULL,"execution_mode" "ExecutionMode" NOT NULL,"effect" JSONB NOT NULL,"created_at" TIMESTAMPTZ(3) NOT NULL);
CREATE TABLE "simulated_settlement_events" ("id" TEXT PRIMARY KEY,"execution_id" TEXT NOT NULL,"event_type" TEXT NOT NULL,"execution_mode" "ExecutionMode" NOT NULL,"actor_id" TEXT NOT NULL,"correlation_id" TEXT NOT NULL,"causation_id" TEXT,"occurred_at" TIMESTAMPTZ(3) NOT NULL,CONSTRAINT "simulation_event_type" CHECK ("event_type" IN ('intent_created','simulated_executed','simulation_failed')));
CREATE INDEX "simulated_events_execution_idx" ON "simulated_settlement_events"("execution_id","occurred_at");
CREATE TABLE "simulated_ledger_transactions" ("id" TEXT PRIMARY KEY,"execution_id" TEXT NOT NULL UNIQUE,"currency" TEXT NOT NULL,"created_at" TIMESTAMPTZ(3) NOT NULL,CONSTRAINT "ledger_currency_valid" CHECK ("currency" ~ '^[A-Z]{3}$'));
CREATE TABLE "simulated_ledger_entries" ("id" TEXT PRIMARY KEY,"transaction_id" TEXT NOT NULL,"economic_side_id" TEXT NOT NULL,"amount_minor" INTEGER NOT NULL,"currency" TEXT NOT NULL,"entry_type" TEXT NOT NULL,CONSTRAINT "ledger_nonzero" CHECK ("amount_minor"<>0),CONSTRAINT "ledger_entry_type" CHECK (("entry_type"='debit' AND "amount_minor"<0) OR ("entry_type"='credit' AND "amount_minor">0)),CONSTRAINT "ledger_currency_valid" CHECK ("currency" ~ '^[A-Z]{3}$'));
CREATE INDEX "simulated_ledger_entries_transaction_idx" ON "simulated_ledger_entries"("transaction_id");
CREATE TABLE "resolution_audit_events" ("id" TEXT PRIMARY KEY,"proposal_id" TEXT NOT NULL,"action" TEXT NOT NULL,"actor_id" TEXT NOT NULL,"from_state" "ResolutionState","to_state" "ResolutionState","reason_codes" JSONB NOT NULL,"correlation_id" TEXT NOT NULL,"occurred_at" TIMESTAMPTZ(3) NOT NULL);
CREATE INDEX "resolution_audit_proposal_idx" ON "resolution_audit_events"("proposal_id","occurred_at");
CREATE TABLE "resolution_domain_events" ("id" TEXT PRIMARY KEY,"proposal_id" TEXT NOT NULL,"event_type" TEXT NOT NULL,"payload" JSONB NOT NULL,"correlation_id" TEXT NOT NULL,"occurred_at" TIMESTAMPTZ(3) NOT NULL);
CREATE INDEX "resolution_domain_proposal_idx" ON "resolution_domain_events"("proposal_id","occurred_at");

ALTER TABLE "proposed_resolutions" ADD FOREIGN KEY("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT;
ALTER TABLE "proposed_resolutions" ADD FOREIGN KEY("agreement_id","version_id") REFERENCES "agreement_versions"("agreement_id","id") ON DELETE RESTRICT;
ALTER TABLE "proposed_resolutions" ADD FOREIGN KEY("evidence_set_id","agreement_id","version_id") REFERENCES "evidence_sets"("id","agreement_id","version_id") ON DELETE RESTRICT;
ALTER TABLE "proposed_resolutions" ADD FOREIGN KEY("assessment_id","agreement_id","version_id") REFERENCES "assessments"("id","agreement_id","version_id") ON DELETE RESTRICT;
ALTER TABLE "proposed_resolutions" ADD FOREIGN KEY("reviewer_decision_id") REFERENCES "reviewer_decisions"("id") ON DELETE RESTRICT;
ALTER TABLE "proposed_resolutions" ADD FOREIGN KEY("created_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;
ALTER TABLE "resolution_disputes" ADD FOREIGN KEY("proposal_id","agreement_id","version_id") REFERENCES "proposed_resolutions"("id","agreement_id","version_id") ON DELETE RESTRICT;
ALTER TABLE "resolution_disputes" ADD FOREIGN KEY("opened_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;
ALTER TABLE "resolution_disputes" ADD FOREIGN KEY("review_request_id","agreement_id","version_id") REFERENCES "human_review_requests"("id","agreement_id","version_id") ON DELETE RESTRICT;
ALTER TABLE "resolution_disputes" ADD FOREIGN KEY("reviewer_decision_id") REFERENCES "reviewer_decisions"("id") ON DELETE RESTRICT;
ALTER TABLE "resolution_authorization_grants" ADD FOREIGN KEY("proposal_id","agreement_id","version_id") REFERENCES "proposed_resolutions"("id","agreement_id","version_id") ON DELETE RESTRICT;
ALTER TABLE "resolution_authorization_grants" ADD FOREIGN KEY("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT;
ALTER TABLE "financial_safety_statuses" ADD FOREIGN KEY("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT;
ALTER TABLE "financial_safety_statuses" ADD FOREIGN KEY("agreement_id","version_id") REFERENCES "agreement_versions"("agreement_id","id") ON DELETE RESTRICT;
ALTER TABLE "financial_safety_transitions" ADD FOREIGN KEY("agreement_id","version_id") REFERENCES "financial_safety_statuses"("agreement_id","version_id") ON DELETE RESTRICT;
ALTER TABLE "financial_safety_transitions" ADD FOREIGN KEY("proposal_id") REFERENCES "proposed_resolutions"("id") ON DELETE RESTRICT;
ALTER TABLE "simulated_settlement_executions" ADD FOREIGN KEY("proposal_id") REFERENCES "proposed_resolutions"("id") ON DELETE RESTRICT;
ALTER TABLE "simulated_settlement_intents" ADD FOREIGN KEY("execution_id") REFERENCES "simulated_settlement_executions"("id") ON DELETE RESTRICT;
ALTER TABLE "simulated_settlement_events" ADD FOREIGN KEY("execution_id") REFERENCES "simulated_settlement_executions"("id") ON DELETE RESTRICT;
ALTER TABLE "simulated_ledger_transactions" ADD FOREIGN KEY("execution_id") REFERENCES "simulated_settlement_executions"("id") ON DELETE RESTRICT;
ALTER TABLE "simulated_ledger_entries" ADD FOREIGN KEY("transaction_id") REFERENCES "simulated_ledger_transactions"("id") ON DELETE RESTRICT;
ALTER TABLE "resolution_audit_events" ADD FOREIGN KEY("proposal_id") REFERENCES "proposed_resolutions"("id") ON DELETE RESTRICT;
ALTER TABLE "resolution_domain_events" ADD FOREIGN KEY("proposal_id") REFERENCES "proposed_resolutions"("id") ON DELETE RESTRICT;

CREATE FUNCTION enforce_simulated_ledger_balance() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE tx TEXT; total BIGINT; entries INTEGER; BEGIN tx:=COALESCE(NEW.transaction_id,OLD.transaction_id); SELECT COALESCE(SUM(amount_minor),0),COUNT(*) INTO total,entries FROM simulated_ledger_entries WHERE transaction_id=tx; IF entries<>2 OR total<>0 THEN RAISE EXCEPTION 'simulated ledger transaction must contain exactly two balanced entries'; END IF; RETURN NULL; END $$;
CREATE CONSTRAINT TRIGGER simulated_ledger_balance AFTER INSERT OR UPDATE OR DELETE ON "simulated_ledger_entries" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_simulated_ledger_balance();

CREATE FUNCTION reject_resolution_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Sprint 5.7 history is append-only'; END $$;
CREATE TRIGGER resolution_disputes_append_only BEFORE DELETE ON "resolution_disputes" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
CREATE TRIGGER financial_safety_transitions_append_only BEFORE UPDATE OR DELETE ON "financial_safety_transitions" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
CREATE TRIGGER simulated_settlement_events_append_only BEFORE UPDATE OR DELETE ON "simulated_settlement_events" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
CREATE TRIGGER simulated_ledger_transactions_append_only BEFORE UPDATE OR DELETE ON "simulated_ledger_transactions" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
CREATE TRIGGER simulated_ledger_entries_append_only BEFORE UPDATE OR DELETE ON "simulated_ledger_entries" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
CREATE TRIGGER resolution_audit_events_append_only BEFORE UPDATE OR DELETE ON "resolution_audit_events" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
CREATE TRIGGER resolution_domain_events_append_only BEFORE UPDATE OR DELETE ON "resolution_domain_events" FOR EACH ROW EXECUTE FUNCTION reject_resolution_history_mutation();
