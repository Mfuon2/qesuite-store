CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#10b981',
  accent_color TEXT DEFAULT '#0d9488',
  font_family TEXT DEFAULT 'Inter',
  phone TEXT,
  address TEXT,
  whatsapp_number TEXT,
  plan TEXT DEFAULT 'trial',
  trial_ends_at TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  is_suspended INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  password_hash TEXT,
  role TEXT NOT NULL CHECK(role IN ('owner','staff','rider','superadmin')),
  is_active INTEGER DEFAULT 1,
  otp_code TEXT,
  otp_expires_at TEXT,
  refresh_token TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
