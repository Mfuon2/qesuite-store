-- Lets a POS sale be rung up "on credit" against a registered customer's
-- account instead of being settled cash/mpesa/card at the till, with a
-- per-customer credit limit enforced before the sale completes. A credit
-- sale books to accounts receivable as a real, already-sent invoice (see
-- apps/worker-api/src/lib/posSale.ts) so the existing AR aging report,
-- payment recording, write-off, and credit-note machinery all work on it
-- unchanged — there is no separate/parallel credit ledger.
--
-- Two CHECK constraints need widening, and SQLite can't ALTER a CHECK in
-- place, so both tables are recreated (same proven pattern as migration
-- 0030). pos_sale_items.sale_id carries a live FK to pos_sales, so it must
-- be redirected to the new pos_sales table before the old one is dropped —
-- see 0030's own comment for why. approval_requests has no live FK
-- dependents, so it recreates directly.

ALTER TABLE customers ADD COLUMN credit_limit INTEGER NOT NULL DEFAULT 0;

-- Lets voiding a credit sale (POST /api/pos/:id/void) find and reverse the
-- invoice it auto-booked to accounts receivable, rather than string-matching
-- on the invoice's notes field.
ALTER TABLE invoices ADD COLUMN pos_sale_id TEXT REFERENCES pos_sales(id);
CREATE INDEX idx_invoices_pos_sale ON invoices(pos_sale_id) WHERE pos_sale_id IS NOT NULL;

CREATE TABLE pos_sales_v2 (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  receipt_code TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mpesa','card','split','credit')),
  amount_tendered INTEGER,
  change_due INTEGER,
  mpesa_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','voided')),
  void_reason TEXT,
  table_label TEXT,
  note TEXT,
  served_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  voided_at TEXT,
  till_session_id TEXT REFERENCES pos_till_sessions(id),
  served_by_user_id TEXT REFERENCES users(id),
  voided_by_user_id TEXT REFERENCES users(id),
  customer_id TEXT REFERENCES customers(id)
);

INSERT INTO pos_sales_v2 (
  id, tenant_id, receipt_code, subtotal, discount, total, payment_method,
  amount_tendered, change_due, mpesa_reference, status, void_reason, table_label, note,
  served_by, created_at, voided_at, till_session_id, served_by_user_id, voided_by_user_id
) SELECT * FROM pos_sales;

CREATE TABLE pos_sale_items_v2 (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES pos_sales_v2(id),
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);

INSERT INTO pos_sale_items_v2 SELECT * FROM pos_sale_items;

DROP TABLE pos_sale_items;
DROP TABLE pos_sales;
ALTER TABLE pos_sales_v2 RENAME TO pos_sales;
ALTER TABLE pos_sale_items_v2 RENAME TO pos_sale_items;

CREATE INDEX idx_pos_sales_tenant ON pos_sales(tenant_id);
CREATE INDEX idx_pos_sales_tenant_created ON pos_sales(tenant_id, created_at);
CREATE UNIQUE INDEX idx_pos_sales_receipt ON pos_sales(tenant_id, receipt_code);
CREATE INDEX idx_pos_sales_till ON pos_sales(till_session_id, created_at);
CREATE INDEX idx_pos_sales_employee_period ON pos_sales(tenant_id, served_by_user_id, created_at);
CREATE INDEX idx_pos_sale_items_sale ON pos_sale_items(sale_id);

CREATE TRIGGER require_open_pos_till_for_sale
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

CREATE TABLE approval_requests_v2 (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  action_type TEXT NOT NULL CHECK(action_type IN (
    'refund','stock_adjustment','expense_edit','expense_delete','credit_write_off','credit_limit_override'
  )),
  target_type TEXT,
  target_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
  requested_by TEXT NOT NULL REFERENCES users(id),
  decided_by TEXT REFERENCES users(id),
  decision_note TEXT,
  decided_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO approval_requests_v2 SELECT * FROM approval_requests;
DROP TABLE approval_requests;
ALTER TABLE approval_requests_v2 RENAME TO approval_requests;

CREATE INDEX idx_approval_tenant_status ON approval_requests(tenant_id, status, created_at);
CREATE INDEX idx_approval_requester ON approval_requests(requested_by);
CREATE INDEX idx_approval_target ON approval_requests(target_type, target_id);
