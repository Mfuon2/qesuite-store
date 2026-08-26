-- Link optional till cash-outs to the expense they created.
-- Cash transfers, bank deposits, and owner withdrawals remain cash-only records.

ALTER TABLE expenses ADD COLUMN cash_movement_id TEXT REFERENCES pos_cash_movements(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_cash_movement
  ON expenses(cash_movement_id)
  WHERE cash_movement_id IS NOT NULL;
