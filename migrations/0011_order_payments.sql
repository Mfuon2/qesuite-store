CREATE TABLE IF NOT EXISTS order_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  note TEXT,
  recorded_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order  ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_tenant ON order_payments(tenant_id);
