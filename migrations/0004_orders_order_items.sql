CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT,
  delivery_lat REAL,
  delivery_lng REAL,
  status TEXT DEFAULT 'NEW' CHECK(status IN (
    'NEW','CONFIRMED','PREPARING','READY',
    'OUT_FOR_DELIVERY','DELIVERED','CANCELLED'
  )),
  payment_method TEXT CHECK(payment_method IN ('pay_on_delivery','mpesa','stripe')),
  payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed')),
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  tracking_code TEXT UNIQUE NOT NULL,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  product_id TEXT REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_code);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
