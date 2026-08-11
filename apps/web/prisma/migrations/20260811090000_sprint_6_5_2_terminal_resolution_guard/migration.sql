CREATE FUNCTION hmm_guard_terminal_resolution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."state" IN ('simulated_executed', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'terminal resolution records are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER proposed_resolutions_terminal_immutable
BEFORE UPDATE OR DELETE ON "proposed_resolutions"
FOR EACH ROW EXECUTE FUNCTION hmm_guard_terminal_resolution();
