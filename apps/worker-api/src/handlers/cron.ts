import { Env } from '../types'
import { generateId } from '../lib/jwt'
import { sendSMS } from '../lib/notifications'
import { SMS_TEMPLATES } from '@qesuite/shared'

export async function handleCron(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.info(`CRON triggered: ${event.cron} at ${new Date(event.scheduledTime).toISOString()}`)

  ctx.waitUntil(runDailyAnalyticsSnapshot(env))
  ctx.waitUntil(runSubscriptionReminders(env))
}

// ── Fibonacci helpers ──────────────────────────────────────────────────────

/** Returns the Nth Fibonacci number (1-indexed: fib(0)=1, fib(1)=1, fib(2)=2, …) */
function fib(n: number): number {
  if (n <= 1) return 1
  let a = 1, b = 1
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b]
  return b
}

// ── Subscription reminder cron ────────────────────────────────────────────

async function runSubscriptionReminders(env: Env): Promise<void> {
  try {
    // Find all stores with an inactive subscription (not active, not in valid trial)
    const unpaid = await env.qesuite_db.prepare(
      `SELECT t.id, t.name, t.created_at,
              u.phone as owner_phone, u.name as owner_name
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
       WHERE t.is_suspended = 0
         AND t.subscription_status NOT IN ('active')
         AND NOT (t.subscription_status = 'trialing' AND t.trial_ends_at > datetime('now'))`
    ).all<{ id: string; name: string; created_at: string; owner_phone: string | null; owner_name: string | null }>()

    for (const tenant of unpaid.results) {
      if (!tenant.owner_phone) continue
      await maybeSendReminder(env, { ...tenant, owner_phone: tenant.owner_phone })
    }

    console.info(`Subscription reminders checked for ${unpaid.results.length} unpaid tenants`)
  } catch (err) {
    console.error('Subscription reminder cron failed:', err)
  }
}

async function maybeSendReminder(
  env: Env,
  tenant: { id: string; name: string; created_at: string; owner_phone: string; owner_name: string | null }
): Promise<void> {
  // Count reminders already sent for this tenant
  const countRow = await env.qesuite_db.prepare(
    "SELECT COUNT(*) as cnt, MAX(sent_at) as last_sent FROM notifications_log WHERE tenant_id = ? AND message LIKE 'SUBSCRIPTION_REMINDER%'"
  ).bind(tenant.id).first<{ cnt: number; last_sent: string | null }>()

  const reminderCount = countRow?.cnt ?? 0
  const lastSent = countRow?.last_sent ? new Date(countRow.last_sent) : null

  // Days since store was created (or last reminder)
  const daysSinceLast = lastSent
    ? Math.floor((Date.now() - lastSent.getTime()) / 86_400_000)
    : Math.floor((Date.now() - new Date(tenant.created_at).getTime()) / 86_400_000)

  // Next reminder interval follows Fibonacci: 1, 1, 2, 3, 5, 8, 13...
  const nextInterval = fib(reminderCount)

  if (daysSinceLast < nextInterval) return // not yet time

  // Build escalating message
  const message = SMS_TEMPLATES.subscription_reminder(
    tenant.name,
    tenant.owner_name ?? 'Store Owner',
    env.APP_BASE_URL,
    reminderCount + 1
  )

  try {
    await sendSMS(env, tenant.owner_phone, message)

    await env.qesuite_db.prepare(
      `INSERT INTO notifications_log (id, tenant_id, channel, recipient, message, status, sent_at)
       VALUES (?, ?, 'sms', ?, ?, 'sent', datetime('now'))`
    ).bind(
      generateId(),
      tenant.id,
      tenant.owner_phone,
      `SUBSCRIPTION_REMINDER:${reminderCount + 1}:interval_${nextInterval}d`
    ).run()

    console.info(`Subscription reminder #${reminderCount + 1} sent to tenant ${tenant.id} (interval: ${nextInterval} days)`)
  } catch (err) {
    console.error(`Failed to send reminder to tenant ${tenant.id}:`, err)
  }
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
