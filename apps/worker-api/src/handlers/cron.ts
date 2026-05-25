import { Env } from '../types'
import { generateId } from '../lib/jwt'

export async function handleCron(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.info(`CRON triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`)

  ctx.waitUntil(runDailyAnalyticsSnapshot(env))
}

async function runDailyAnalyticsSnapshot(env: Env): Promise<void> {
  // Snapshot for yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().substring(0, 10)

  try {
    // Get all tenants
    const tenants = await env.qesuite_db.prepare(
      'SELECT id FROM tenants WHERE is_suspended = 0'
    ).all<{ id: string }>()

    for (const tenant of tenants.results) {
      await snapshotTenantDay(env, tenant.id, dateStr)
    }

    console.info(`Analytics snapshot complete for ${tenants.results.length} tenants on ${dateStr}`)
  } catch (err) {
    console.error('Analytics snapshot failed:', err)
    throw err
  }
}

async function snapshotTenantDay(env: Env, tenantId: string, date: string): Promise<void> {
  const stats = await env.qesuite_db.prepare(
    `SELECT
       COUNT(*) as total_orders,
       COALESCE(SUM(total), 0) as total_revenue,
       COALESCE(AVG(total), 0) as avg_order_value,
       COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders
     FROM orders
     WHERE tenant_id = ? AND date(created_at) = ?`
  ).bind(tenantId, date).first<{
    total_orders: number
    total_revenue: number
    avg_order_value: number
    cancelled_orders: number
  }>()

  if (!stats) return

  // Upsert snapshot (idempotent re-runs)
  const existing = await env.qesuite_db.prepare(
    'SELECT id FROM analytics_daily WHERE tenant_id = ? AND date = ?'
  ).bind(tenantId, date).first<{ id: string }>()

  if (existing) {
    await env.qesuite_db.prepare(
      `UPDATE analytics_daily
       SET total_orders = ?, total_revenue = ?, avg_order_value = ?, cancelled_orders = ?,
           snapshot_at = datetime('now')
       WHERE id = ?`
    ).bind(
      stats.total_orders,
      Math.round(stats.total_revenue),
      Math.round(stats.avg_order_value),
      stats.cancelled_orders,
      existing.id
    ).run()
  } else {
    await env.qesuite_db.prepare(
      `INSERT INTO analytics_daily (id, tenant_id, date, total_orders, total_revenue, avg_order_value, cancelled_orders, snapshot_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      generateId(),
      tenantId,
      date,
      stats.total_orders,
      Math.round(stats.total_revenue),
      Math.round(stats.avg_order_value),
      stats.cancelled_orders
    ).run()
  }
}
