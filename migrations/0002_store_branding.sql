CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT UNIQUE REFERENCES tenants(id),
  delivery_enabled INTEGER DEFAULT 1,
  pickup_enabled INTEGER DEFAULT 1,
  delivery_fee INTEGER DEFAULT 0,
  delivery_radius_km INTEGER DEFAULT 5,
  estimated_delivery_minutes INTEGER DEFAULT 30,
  min_order_amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'KES',
  language TEXT DEFAULT 'en',
  dark_mode_enabled INTEGER DEFAULT 0,
  order_view TEXT DEFAULT 'kanban',
  updated_at TEXT DEFAULT (datetime('now'))
);
