CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  order_id TEXT REFERENCES orders(id),
  channel TEXT CHECK(channel IN ('sms','whatsapp','push')),
  recipient TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications_log(order_id);
