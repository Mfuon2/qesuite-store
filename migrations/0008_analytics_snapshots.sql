CREATE TABLE IF NOT EXISTS analytics_daily (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  date TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  avg_order_value INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  snapshot_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON analytics_daily(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
