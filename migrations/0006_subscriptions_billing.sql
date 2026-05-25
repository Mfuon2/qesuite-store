CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  plan TEXT DEFAULT 'starter',
  amount INTEGER DEFAULT 999,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'active',
  current_period_start TEXT,
  current_period_end TEXT,
  payment_method TEXT,
  stripe_subscription_id TEXT,
  mpesa_phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS billing_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  amount INTEGER,
  currency TEXT DEFAULT 'KES',
  status TEXT,
  payment_method TEXT,
  reference TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
