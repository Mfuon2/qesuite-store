-- Phase 0 of offline-first POS: a stable, revocable device identity, kept
-- separate from user authentication so both can participate in
-- authorization (a device credential proves "which registered terminal",
-- not "which user" — the existing JWTPayload/role model is untouched).
--
-- Two tables, not one, and not a reuse of users.refresh_token:
--   pos_devices          — the durable device identity (survives many
--                          credential renewals; this is what gets revoked
--                          when a terminal is decommissioned/stolen)
--   pos_device_sessions  — the actual issued, revocable credential. A device
--                          can have its credential renewed/rotated without
--                          losing its registered identity.
-- The device id itself is minted client-side (UUIDv7) and registered here,
-- not server-assigned — the whole point is a stable per-installation
-- identity the device already has before it ever talks to the server.

CREATE TABLE IF NOT EXISTS pos_devices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  last_seen_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  revoked_at TEXT,
  revoked_by TEXT REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pos_devices_tenant ON pos_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pos_devices_user ON pos_devices(user_id);

CREATE TABLE IF NOT EXISTS pos_device_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL REFERENCES pos_devices(id),
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked','expired')),
  issued_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_pos_device_sessions_device ON pos_device_sessions(device_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pos_device_sessions_hash ON pos_device_sessions(token_hash);
