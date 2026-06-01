import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'

const analytics = new Hono<{ Bindings: Env; Variables: Variables }>()

function daysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().substring(0, 10)
}

interface DateRange {
  dateFrom: string  // YYYY-MM-DD inclusive start
  dateTo: string    // YYYY-MM-DD inclusive end
  prevFrom: string  // start of equal-length previous period
  prevTo: string    // end of previous period
  days: number
}

function parseDateRange(period?: string | null, from?: string | null, to?: string | null): DateRange {
  if (from && to) {
    const ms = new Date(to).getTime() - new Date(from).getTime()
    const days = Math.max(1, Math.round(ms / 86_400_000) + 1)
    const prevTo = new Date(new Date(from).getTime() - 86_400_000).toISOString().substring(0, 10)
    const prevFrom = new Date(new Date(from).getTime() - days * 86_400_000).toISOString().substring(0, 10)
    return { dateFrom: from, dateTo: to, prevFrom, prevTo, days }
  }
  const p = period ?? 'month'
  const days = p === 'today' ? 1 : p === 'week' ? 7 : 30
  return {
    dateFrom: daysAgo(days),
    dateTo: daysAgo(0),
    prevFrom: daysAgo(days * 2),
    prevTo: daysAgo(days),
    days,
  }
}

// Generate every date between two ISO date strings (inclusive)
function datesBetween(from: string, to: string): string[] {
  const dates: string[] = []
  const end = new Date(to).getTime()
  let cur = new Date(from).getTime()
  while (cur <= end) {
    dates.push(new Date(cur).toISOString().substring(0, 10))
    cur += 86_400_000
  }
  return dates
}

// GET /api/analytics/summary — KPI cards
analytics.get('/summary', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const current = await c.env.qesuite_db.prepare(
      `SELECT
         COUNT(*) FILTER (WHERE status != 'CANCELLED') as total_orders,
         COALESCE(SUM(total) FILTER (WHERE status != 'CANCELLED'), 0) as total_revenue,
         COALESCE(AVG(total) FILTER (WHERE status != 'CANCELLED'), 0) as avg_order_value,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered_orders,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?`
    ).bind(tenantId, range.dateFrom, range.dateTo).first<{
      total_orders: number; total_revenue: number; avg_order_value: number
      delivered_orders: number; cancelled_orders: number
    }>()

    const previous = await c.env.qesuite_db.prepare(
      `SELECT
         COUNT(*) FILTER (WHERE status != 'CANCELLED') as total_orders,
         COALESCE(SUM(total) FILTER (WHERE status != 'CANCELLED'), 0) as total_revenue,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered_orders,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?`
    ).bind(tenantId, range.prevFrom, range.prevTo).first<{
      total_orders: number; total_revenue: number
      delivered_orders: number; cancelled_orders: number
    }>()

    const totalOrders = current?.total_orders ?? 0
    const prevTotalOrders = previous?.total_orders ?? 0
    const completionRate = totalOrders > 0
      ? Math.round(((current?.delivered_orders ?? 0) / totalOrders) * 100) : 0
    const prevCompletionRate = prevTotalOrders > 0
      ? Math.round(((previous?.delivered_orders ?? 0) / prevTotalOrders) * 100) : 0

    return c.json({
      success: true,
      data: {
        total_revenue: Math.round(current?.total_revenue ?? 0),
        total_orders: totalOrders,
        avg_order_value: Math.round(current?.avg_order_value ?? 0),
        cancelled_orders: current?.cancelled_orders ?? 0,
        completion_rate: completionRate,
        period_days: range.days,
        prev: {
          total_revenue: Math.round(previous?.total_revenue ?? 0),
          total_orders: prevTotalOrders,
          avg_order_value: 0,
          cancelled_orders: previous?.cancelled_orders ?? 0,
          completion_rate: prevCompletionRate,
          period_days: range.days,
        },
      },
      error: null,
    })
  } catch (err) {
    console.error('analytics summary error', err)
    return c.json({ success: false, error: 'Failed to load analytics', data: null }, 500)
  }
})

// GET /api/analytics/revenue — daily revenue series
analytics.get('/revenue', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const rows = await c.env.qesuite_db.prepare(
      `SELECT date(created_at) as date,
              COUNT(*) as order_count,
              COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
         AND status NOT IN ('CANCELLED')
       GROUP BY date(created_at)
       ORDER BY date ASC`
    ).bind(tenantId, range.dateFrom, range.dateTo).all<{ date: string; order_count: number; revenue: number }>()

    const dataMap = new Map(rows.results.map((r) => [r.date, r]))
    const series = datesBetween(range.dateFrom, range.dateTo).map((d) =>
      dataMap.get(d) ?? { date: d, order_count: 0, revenue: 0 }
    )

    return c.json({ success: true, data: series, error: null })
  } catch (err) {
    console.error('analytics revenue error', err)
    return c.json({ success: false, error: 'Failed to load revenue data', data: null }, 500)
  }
})

// GET /api/analytics/top-products — top 5 by revenue and volume
analytics.get('/top-products', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const byRevenue = await c.env.qesuite_db.prepare(
      `SELECT oi.product_name,
              SUM(oi.quantity * oi.price) as total_revenue,
              SUM(oi.quantity) as total_quantity
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = ? AND date(o.created_at) >= ? AND date(o.created_at) <= ?
         AND o.status NOT IN ('CANCELLED')
       GROUP BY oi.product_name
       ORDER BY total_revenue DESC
       LIMIT 5`
    ).bind(tenantId, range.dateFrom, range.dateTo).all()

    const byVolume = await c.env.qesuite_db.prepare(
      `SELECT oi.product_name,
              SUM(oi.quantity) as total_quantity,
              SUM(oi.quantity * oi.price) as total_revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = ? AND date(o.created_at) >= ? AND date(o.created_at) <= ?
         AND o.status NOT IN ('CANCELLED')
       GROUP BY oi.product_name
       ORDER BY total_quantity DESC
       LIMIT 5`
    ).bind(tenantId, range.dateFrom, range.dateTo).all()

    return c.json({
      success: true,
      data: { by_revenue: byRevenue.results, by_volume: byVolume.results },
      error: null,
    })
  } catch (err) {
    console.error('analytics top-products error', err)
    return c.json({ success: false, error: 'Failed to load top products', data: null }, 500)
  }
})

// GET /api/analytics/peak-hours — hourly order distribution
analytics.get('/peak-hours', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const rows = await c.env.qesuite_db.prepare(
      `SELECT strftime('%H', created_at) as hour,
              COUNT(*) as order_count
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
         AND status NOT IN ('CANCELLED')
       GROUP BY hour
       ORDER BY hour ASC`
    ).bind(tenantId, range.dateFrom, range.dateTo).all<{ hour: string; order_count: number }>()

    const dataMap = new Map(rows.results.map((r) => [r.hour, r.order_count]))
    const series = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      orders: dataMap.get(String(i).padStart(2, '0')) ?? 0,
    }))

    return c.json({ success: true, data: series, error: null })
  } catch (err) {
    console.error('analytics peak-hours error', err)
    return c.json({ success: false, error: 'Failed to load peak hours', data: null }, 500)
  }
})

// GET /api/analytics/payment-methods — payment method breakdown
analytics.get('/payment-methods', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const rows = await c.env.qesuite_db.prepare(
      `SELECT payment_method,
              COUNT(*) as order_count,
              COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
         AND status NOT IN ('CANCELLED')
       GROUP BY payment_method
       ORDER BY order_count DESC`
    ).bind(tenantId, range.dateFrom, range.dateTo).all<{ payment_method: string; order_count: number; revenue: number }>()

    const totalOrders = rows.results.reduce((s, r) => s + r.order_count, 0)
    const data = rows.results.map((r) => ({
      method: r.payment_method,
      count: r.order_count,
      total: r.revenue,
      percentage: totalOrders > 0 ? Math.round((r.order_count / totalOrders) * 100) : 0,
    }))

    return c.json({ success: true, data, error: null })
  } catch (err) {
    console.error('analytics payment-methods error', err)
    return c.json({ success: false, error: 'Failed to load payment methods data', data: null }, 500)
  }
})

// GET /api/analytics/order-status — per-status counts + unique customer count for the period
analytics.get('/order-status', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const [statusRows, customerRow, newCustomerRow] = await Promise.all([
      c.env.qesuite_db.prepare(
        `SELECT status, COUNT(*) as count
         FROM orders
         WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
         GROUP BY status`
      ).bind(tenantId, range.dateFrom, range.dateTo).all<{ status: string; count: number }>(),

      c.env.qesuite_db.prepare(
        `SELECT COUNT(DISTINCT customer_phone) as count
         FROM orders
         WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?`
      ).bind(tenantId, range.dateFrom, range.dateTo).first<{ count: number }>(),

      // New customers = phones that had no order before this period
      c.env.qesuite_db.prepare(
        `SELECT COUNT(DISTINCT customer_phone) as count
         FROM orders
         WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) <= ?
           AND customer_phone NOT IN (
             SELECT DISTINCT customer_phone FROM orders
             WHERE tenant_id = ? AND date(created_at) < ?
           )`
      ).bind(tenantId, range.dateFrom, range.dateTo, tenantId, range.dateFrom)
        .first<{ count: number }>(),
    ])

    const counts: Record<string, number> = {}
    for (const r of statusRows.results) counts[r.status] = r.count

    return c.json({
      success: true,
      data: {
        counts,
        unique_customers: customerRow?.count ?? 0,
        new_customers: newCustomerRow?.count ?? 0,
      },
      error: null,
    })
  } catch (err) {
    console.error('analytics order-status error', err)
    return c.json({ success: false, error: 'Failed to load order status', data: null }, 500)
  }
})

export default analytics
