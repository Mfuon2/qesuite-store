-- Adds 'card' and 'split' to pos_sales.payment_method (SQLite can't alter a
-- CHECK constraint in place, so the table is recreated) and a pos_sale_payments
-- table holding the per-method breakdown for split-tender sales. Single-method
-- sales (cash/mpesa/card) keep using the existing top-level columns unchanged —
-- pos_sale_payments is only populated when payment_method = 'split'.
--
-- pos_sale_items.sale_id carries a live FK to pos_sales, and `wrangler d1
-- migrations apply` runs a whole file in one transaction (where `PRAGMA
-- foreign_keys=OFF` is a documented no-op), so a plain DROP TABLE pos_sales
-- fails with SQLITE_CONSTRAINT_FOREIGNKEY — even though no row is ever left
-- dangling — because dropping a table SQLite treats like deleting every row
-- in it, which is checked against pos_sale_items. The fix: redirect
-- pos_sale_items to a new table FIRST (drop the *old* pos_sale_items, which
-- nothing else references, so that's unchecked), and only THEN drop the old
-- pos_sales — by which point nothing references it any more. Renaming the
-- "_v2" tables to their final names last relies on SQLite's table-rename
-- feature, which automatically rewrites any REFERENCES clause that pointed
-- at the old name to point at the new one.
CREATE TABLE pos_sales_v2 (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  receipt_code TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mpesa','card','split')),
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
  voided_by_user_id TEXT REFERENCES users(id)
);

INSERT INTO pos_sales_v2 SELECT * FROM pos_sales;

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

CREATE TABLE IF NOT EXISTS pos_sale_payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  method TEXT NOT NULL CHECK(method IN ('cash','mpesa','card')),
  amount INTEGER NOT NULL,
  reference TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pos_sale_payments_sale ON pos_sale_payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_pos_sale_payments_tenant ON pos_sale_payments(tenant_id);
