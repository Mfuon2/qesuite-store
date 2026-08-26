-- Restaurant Sales Terminal (POS) + Expenses, gated on tenants.store_category = 'food'.
CREATE TABLE IF NOT EXISTS pos_sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  receipt_code TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','mpesa')),
  amount_tendered INTEGER,
  change_due INTEGER,
  mpesa_reference TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed','voided')),
  void_reason TEXT,
  table_label TEXT,
  note TEXT,
  served_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  voided_at TEXT
);

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES pos_sales(id),
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  category TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL,
  expense_date TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pos_sales_tenant ON pos_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_tenant_created ON pos_sales(tenant_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_sales_receipt ON pos_sales(tenant_id, receipt_code);
CREATE INDEX IF NOT EXISTS idx_pos_sale_items_sale ON pos_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, expense_date);
