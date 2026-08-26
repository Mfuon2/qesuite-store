-- Store-scoped staff access, invitations, and employee sales attribution.
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  granted_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_tenant_user
  ON user_permissions(tenant_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_staff_email
  ON users(LOWER(email)) WHERE role = 'staff' AND email IS NOT NULL;

CREATE TABLE IF NOT EXISTS staff_invitations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  permissions_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staff_invitations_tenant_status
  ON staff_invitations(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email
  ON staff_invitations(email);

ALTER TABLE orders ADD COLUMN handled_by_user_id TEXT REFERENCES users(id);
ALTER TABLE pos_sales ADD COLUMN served_by_user_id TEXT REFERENCES users(id);
ALTER TABLE pos_sales ADD COLUMN voided_by_user_id TEXT REFERENCES users(id);
ALTER TABLE expenses ADD COLUMN recorded_by_user_id TEXT REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_orders_employee_period
  ON orders(tenant_id, handled_by_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pos_sales_employee_period
  ON pos_sales(tenant_id, served_by_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_employee_period
  ON expenses(tenant_id, recorded_by_user_id, expense_date);
