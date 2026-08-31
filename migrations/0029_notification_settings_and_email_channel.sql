-- Owner-facing notification channel preferences (independent of the
-- always-on customer-facing SMS/WhatsApp for order tracking, which stays
-- unconditional — these toggles only govern alerts sent TO the store owner).
ALTER TABLE store_settings ADD COLUMN owner_notify_sms INTEGER NOT NULL DEFAULT 1;
ALTER TABLE store_settings ADD COLUMN owner_notify_email INTEGER NOT NULL DEFAULT 0;
ALTER TABLE store_settings ADD COLUMN notification_email TEXT;

-- SQLite can't ALTER a CHECK constraint in place, so notifications_log is
-- recreated with 'email' added to the allowed channel list.
CREATE TABLE notifications_log_new (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  order_id TEXT REFERENCES orders(id),
  channel TEXT CHECK(channel IN ('sms','whatsapp','push','email')),
  recipient TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO notifications_log_new SELECT * FROM notifications_log;
DROP TABLE notifications_log;
ALTER TABLE notifications_log_new RENAME TO notifications_log;

CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications_log(order_id);
