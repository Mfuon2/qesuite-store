ALTER TABLE tenants ADD COLUMN store_category TEXT DEFAULT 'other';
CREATE INDEX IF NOT EXISTS idx_tenants_category ON tenants(store_category);
