CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  first_order_at TEXT DEFAULT (datetime('now')),
  last_order_at TEXT DEFAULT (datetime('now')),
  order_count INTEGER DEFAULT 1,
  total_spend REAL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
