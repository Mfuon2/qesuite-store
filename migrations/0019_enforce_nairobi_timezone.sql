-- Global application timezone policy.
--
-- Timestamp columns remain UTC instants (`datetime('now')`) so ordering,
-- expiry checks, and existing rows stay unambiguous. Calendar dates used by
-- the business are projected with SQLite's `+3 hours` modifier, which is
-- equivalent to Africa/Nairobi (EAT has no daylight-saving transitions).

ALTER TABLE tenants
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi'
  CHECK (timezone = 'Africa/Nairobi');

CREATE TABLE IF NOT EXISTS app_runtime_config (
  key TEXT PRIMARY KEY CHECK (key = 'time_zone'),
  value TEXT NOT NULL CHECK (value = 'Africa/Nairobi')
);

INSERT OR REPLACE INTO app_runtime_config (key, value)
VALUES ('time_zone', 'Africa/Nairobi');

-- A POS till can only be opened for the current Nairobi business day. This
-- protects the ledger even if a client sends a UTC or browser-local date.
CREATE TRIGGER IF NOT EXISTS enforce_pos_till_nairobi_business_date
BEFORE INSERT ON pos_till_sessions
WHEN NEW.business_date <> date(COALESCE(NEW.opened_at, datetime('now')), '+3 hours')
BEGIN
  SELECT RAISE(ABORT, 'POS business_date must use Africa/Nairobi');
END;
