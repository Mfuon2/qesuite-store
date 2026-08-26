-- Permit the superadmin store purge transaction to remove an otherwise
-- append-only POS cash ledger without weakening normal ledger immutability.
-- Rows in this table are transaction-scoped by application convention: the
-- admin purge batch inserts and removes its authorization atomically.
CREATE TABLE IF NOT EXISTS tenant_purge_context (
  tenant_id TEXT PRIMARY KEY,
  authorized_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

DROP TRIGGER IF EXISTS prevent_pos_cash_delete;

CREATE TRIGGER prevent_pos_cash_delete
BEFORE DELETE ON pos_cash_movements
WHEN NOT EXISTS (
  SELECT 1
  FROM tenant_purge_context
  WHERE tenant_id = OLD.tenant_id
)
BEGIN
  SELECT RAISE(ABORT, 'POS cash movements are append-only');
END;
