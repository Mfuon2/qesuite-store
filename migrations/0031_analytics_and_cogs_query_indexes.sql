-- Indexes informed by load-testing the analytics/profit-loss endpoints:
--
-- 1. stock_movements only had (tenant_id, product_id, created_at) — with
--    product_id as the second column, a COGS query that filters by
--    tenant_id + type + a created_at date range (no product_id) can only
--    use the tenant_id prefix, then scans every row for that tenant across
--    all products. As stock_movements grows (every sale now logs a row),
--    this gets slower. A (tenant_id, type, created_at) index lets the COGS
--    query narrow straight to matching rows.
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_type_created
  ON stock_movements(tenant_id, type, created_at);

-- 2. orders only had a bare (tenant_id) index. Every analytics endpoint
--    (summary, revenue, profit-loss) filters orders by tenant_id + a
--    created_at date range — pos_sales already has this exact composite
--    (idx_pos_sales_tenant_created) but orders never did.
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created
  ON orders(tenant_id, created_at);
