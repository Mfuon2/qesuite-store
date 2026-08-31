-- Cost tracking (SKU/barcode/unit-of-measure/weighted-average cost/reorder
-- level/expiry), a price-change audit trail, and a full stock-movement
-- ledger so every quantity change (receipt, sale, adjustment, transfer,
-- damage, expiry, count correction) is attributable and reconstructable.

ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD COLUMN barcode TEXT;
ALTER TABLE products ADD COLUMN cost_price INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN unit_of_measure TEXT NOT NULL DEFAULT 'unit';
ALTER TABLE products ADD COLUMN reorder_level INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN expiry_date TEXT;
ALTER TABLE products ADD COLUMN supplier_id TEXT REFERENCES suppliers(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_sku ON products(tenant_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_tenant_barcode ON products(tenant_id, barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_reorder ON products(tenant_id, reorder_level);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(tenant_id, expiry_date) WHERE expiry_date IS NOT NULL;

CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  field TEXT NOT NULL CHECK(field IN ('cost_price','price','sale_price')),
  old_value INTEGER,
  new_value INTEGER,
  changed_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_price_history_tenant ON price_history(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  type TEXT NOT NULL CHECK(type IN (
    'purchase_receipt','sale','order_sale','adjustment','transfer_in','transfer_out',
    'damaged','expired','count_correction','initial'
  )),
  quantity_delta INTEGER NOT NULL,
  unit_cost INTEGER,
  resulting_stock INTEGER NOT NULL,
  resulting_avg_cost INTEGER,
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT,
  recorded_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_product ON stock_movements(tenant_id, product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
