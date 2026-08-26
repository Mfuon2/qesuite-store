-- POS till sessions and append-only cash ledger.
-- Money uses this application's existing integer KES convention.

CREATE TABLE IF NOT EXISTS pos_till_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  business_date TEXT NOT NULL,
  opening_float INTEGER NOT NULL CHECK(opening_float >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL DEFAULT (datetime('now')),
  closed_by TEXT,
  closed_at TEXT,
  counted_cash INTEGER CHECK(counted_cash IS NULL OR counted_cash >= 0),
  expected_cash INTEGER,
  variance INTEGER,
  CHECK(
    (status = 'open' AND closed_at IS NULL AND counted_cash IS NULL AND expected_cash IS NULL AND variance IS NULL)
    OR
    (status = 'closed' AND closed_at IS NOT NULL AND counted_cash IS NOT NULL AND expected_cash IS NOT NULL AND variance IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_till_one_open
  ON pos_till_sessions(tenant_id)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_pos_till_tenant_opened
  ON pos_till_sessions(tenant_id, opened_at DESC);

CREATE TABLE IF NOT EXISTS pos_cash_movements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  till_session_id TEXT NOT NULL REFERENCES pos_till_sessions(id),
  movement_type TEXT NOT NULL CHECK(movement_type IN (
    'opening_float', 'cash_sale', 'cash_void', 'paid_in', 'paid_out', 'correction'
  )),
  amount INTEGER NOT NULL CHECK(amount <> 0),
  reason TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK(
    (movement_type IN ('opening_float', 'cash_sale', 'paid_in') AND amount > 0)
    OR (movement_type IN ('cash_void', 'paid_out') AND amount < 0)
    OR (movement_type = 'correction' AND amount <> 0)
  ),
  UNIQUE(till_session_id, movement_type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_cash_session_time
  ON pos_cash_movements(till_session_id, created_at, id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_tenant_time
  ON pos_cash_movements(tenant_id, created_at DESC);

ALTER TABLE pos_sales ADD COLUMN till_session_id TEXT REFERENCES pos_till_sessions(id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_till ON pos_sales(till_session_id, created_at);

CREATE TRIGGER IF NOT EXISTS prevent_pos_cash_update
BEFORE UPDATE ON pos_cash_movements
BEGIN
  SELECT RAISE(ABORT, 'POS cash movements are immutable');
END;

CREATE TRIGGER IF NOT EXISTS prevent_pos_cash_delete
BEFORE DELETE ON pos_cash_movements
BEGIN
  SELECT RAISE(ABORT, 'POS cash movements are append-only');
END;

CREATE TRIGGER IF NOT EXISTS require_open_pos_till_for_movement
BEFORE INSERT ON pos_cash_movements
WHEN NOT EXISTS (
  SELECT 1 FROM pos_till_sessions
  WHERE id = NEW.till_session_id
    AND tenant_id = NEW.tenant_id
    AND status = 'open'
)
BEGIN
  SELECT RAISE(ABORT, 'POS till is not open');
END;

CREATE TRIGGER IF NOT EXISTS require_open_pos_till_for_sale
BEFORE INSERT ON pos_sales
WHEN NEW.till_session_id IS NULL OR NOT EXISTS (
  SELECT 1 FROM pos_till_sessions
  WHERE id = NEW.till_session_id
    AND tenant_id = NEW.tenant_id
    AND status = 'open'
)
BEGIN
  SELECT RAISE(ABORT, 'POS till is not open');
END;
