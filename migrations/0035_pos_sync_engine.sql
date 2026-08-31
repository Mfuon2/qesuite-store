-- Offline-first POS, Phase 1-2: the durable outbox-processing ledger
-- (idempotency) and the delta-pull change feed (checkpointed sync).
--
-- sync_mutations is the server-side idempotency record. A client's mutation
-- id (UUIDv7, generated on-device) is the idempotency key — this table lets
-- the same mutation arrive twice (client retried after a lost response) and
-- be recognized rather than re-applied, per the transactional-outbox pattern.
--
-- sync_change_log is the delta-pull backbone: an append-only, tenant-scoped,
-- globally monotonic feed of "this entity changed" rows, populated by
-- triggers on the tables a device needs cached to work offline (products,
-- customers). AUTOINCREMENT gives every device a simple integer cursor —
-- "give me everything after seq N" — with no per-tenant counter bookkeeping.
-- Only upserts are logged: neither products nor customers are ever
-- hard-deleted in this codebase (products are soft-deleted via is_active,
-- already covered by the UPDATE trigger), so no delete/tombstone handling
-- is needed for these two entity types.

CREATE TABLE IF NOT EXISTS sync_mutations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  device_id TEXT NOT NULL REFERENCES pos_devices(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('applied','rejected','pending_approval')),
  result_json TEXT NOT NULL DEFAULT '{}',
  applied_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_mutations_tenant ON sync_mutations(tenant_id, applied_at);
CREATE INDEX IF NOT EXISTS idx_sync_mutations_device ON sync_mutations(device_id);

CREATE TABLE IF NOT EXISTS sync_change_log (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('product','customer')),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL DEFAULT 'upsert' CHECK(operation IN ('upsert')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sync_change_log_tenant_seq ON sync_change_log(tenant_id, seq);

CREATE TRIGGER IF NOT EXISTS trg_products_sync_insert AFTER INSERT ON products
BEGIN
  INSERT INTO sync_change_log (tenant_id, entity_type, entity_id, operation)
  VALUES (NEW.tenant_id, 'product', NEW.id, 'upsert');
END;

CREATE TRIGGER IF NOT EXISTS trg_products_sync_update AFTER UPDATE ON products
BEGIN
  INSERT INTO sync_change_log (tenant_id, entity_type, entity_id, operation)
  VALUES (NEW.tenant_id, 'product', NEW.id, 'upsert');
END;

CREATE TRIGGER IF NOT EXISTS trg_customers_sync_insert AFTER INSERT ON customers
BEGIN
  INSERT INTO sync_change_log (tenant_id, entity_type, entity_id, operation)
  VALUES (NEW.tenant_id, 'customer', NEW.id, 'upsert');
END;

CREATE TRIGGER IF NOT EXISTS trg_customers_sync_update AFTER UPDATE ON customers
BEGIN
  INSERT INTO sync_change_log (tenant_id, entity_type, entity_id, operation)
  VALUES (NEW.tenant_id, 'customer', NEW.id, 'upsert');
END;

-- Each device's own pull checkpoint — advanced only after a pulled batch is
-- successfully committed to that device's local database (enforced
-- client-side; this column is just where the last-acknowledged value lives
-- so a re-registered/renewed session on the same device resumes correctly).
ALTER TABLE pos_devices ADD COLUMN sync_cursor INTEGER NOT NULL DEFAULT 0;
