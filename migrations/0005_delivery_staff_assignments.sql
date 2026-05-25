CREATE TABLE IF NOT EXISTS delivery_staff (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT,
  is_active INTEGER DEFAULT 1,
  current_lat REAL,
  current_lng REAL,
  location_updated_at TEXT,
  magic_link_token TEXT,
  magic_link_expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  staff_id TEXT REFERENCES delivery_staff(id),
  tenant_id TEXT REFERENCES tenants(id),
  status TEXT DEFAULT 'ASSIGNED' CHECK(status IN (
    'ASSIGNED','PICKED_UP','ON_THE_WAY','DELIVERED','FAILED'
  )),
  failure_reason TEXT,
  assigned_at TEXT DEFAULT (datetime('now')),
  picked_up_at TEXT,
  delivered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_delivery_staff_tenant ON delivery_staff(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_staff ON delivery_assignments(staff_id);
