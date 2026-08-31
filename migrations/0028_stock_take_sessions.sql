-- Stock-take sessions: open a count, record expected-vs-actual per product,
-- require a reason on any mismatch, close to post count_correction stock
-- movements. Single-tenant scale — no multi-step approval routing here.

CREATE TABLE IF NOT EXISTS stock_take_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed','cancelled')),
  opened_by TEXT NOT NULL REFERENCES users(id),
  closed_by TEXT REFERENCES users(id),
  notes TEXT,
  opened_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_take_tenant_status ON stock_take_sessions(tenant_id, status, opened_at);

CREATE TABLE IF NOT EXISTS stock_take_lines (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES stock_take_sessions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  expected_quantity INTEGER NOT NULL,
  counted_quantity INTEGER,
  variance INTEGER,
  reason TEXT,
  counted_by TEXT REFERENCES users(id),
  counted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_stock_take_lines_session ON stock_take_lines(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stock_take_lines_session_product ON stock_take_lines(session_id, product_id);
