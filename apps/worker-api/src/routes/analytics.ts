import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'

const analytics = new Hono<{ Bindings: Env; Variables: Variables }>()

// Helper to get date N days ago in ISO format
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().substring(0, 10)
}

// GET /api/analytics/summary — KPI cards
analytics.get('/summary', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const range = c.req.query('range') ?? 'today'

    let dateFilter: string
    let prevDateFilter: string

    const today = daysAgo(0)
    const yesterday = daysAgo(1)

    switch (range) {
      case 'week':
        dateFilter = daysAgo(7)
        prevDateFilter = daysAgo(14)
        break
      case 'month':
        dateFilter = daysAgo(30)
        prevDateFilter = daysAgo(60)
        break
      default: // today
        dateFilter = today
        prevDateFilter = yesterday
    }

    // Current period
    const current = await c.env.qesuite_db.prepare(
      `SELECT
         COUNT(*) as total_orders,
         COALESCE(SUM(total), 0) as total_revenue,
         COALESCE(AVG(total), 0) as avg_order_value,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered_orders,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND status != 'CANCELLED'`
    ).bind(tenantId, dateFilter).first<{
      total_orders: number; total_revenue: number; avg_order_value: number
      delivered_orders: number; cancelled_orders: number
    }>()

    // Previous period for % change
    const previous = await c.env.qesuite_db.prepare(
      `SELECT
         COUNT(*) as total_orders,
         COALESCE(SUM(total), 0) as total_revenue
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND date(created_at) < ? AND status != 'CANCELLED'`
    ).bind(tenantId, prevDateFilter, dateFilter).first<{
      total_orders: number; total_revenue: number
    }>()

    const pctChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const totalOrders = current?.total_orders ?? 0
    const deliveredOrders = current?.delivered_orders ?? 0
    const completionRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0

    return c.json({
      data: {
        total_revenue: {
          value: Math.round(current?.total_revenue ?? 0),
          change_pct: pctChange(current?.total_revenue ?? 0, previous?.total_revenue ?? 0),
        },
        total_orders: {
          value: totalOrders,
          change_pct: pctChange(totalOrders, previous?.total_orders ?? 0),
        },
        avg_order_value: {
          value: Math.round(current?.avg_order_value ?? 0),
        },
        completion_rate: {
          value: completionRate,
        },
        cancellation_rate: {
          value: totalOrders > 0
            ? Math.round(((current?.cancelled_orders ?? 0) / totalOrders) * 100)
            : 0,
        },
        range,
      },
      error: null,
    })
  } catch (err) {
    console.error('analytics summary error', err)
    return c.json({ error: 'Failed to load analytics', data: null }, 500)
  }
})

// GET /api/analytics/revenue — daily revenue series (last 30 days)
analytics.get('/revenue', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const since = daysAgo(30)

    const rows = await c.env.qesuite_db.prepare(
      `SELECT date(created_at) as date,
              COUNT(*) as order_count,
              COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND status NOT IN ('CANCELLED')
       GROUP BY date(created_at)
       ORDER BY date ASC`
    ).bind(tenantId, since).all<{ date: string; order_count: number; revenue: number }>()

    // Fill in missing dates with zeros
    const dataMap = new Map(rows.results.map((r) => [r.date, r]))
    const series: Array<{ date: string; order_count: number; revenue: number }> = []

    for (let i = 29; i >= 0; i--) {
      const d = daysAgo(i)
      series.push(
        dataMap.get(d) ?? { date: d, order_count: 0, revenue: 0 }
      )
    }

    return c.json({ data: series, error: null })
  } catch (err) {
    console.error('analytics revenue error', err)
    return c.json({ error: 'Failed to load revenue data', data: null }, 500)
  }
})

// GET /api/analytics/top-products — top 5 by revenue and volume
analytics.get('/top-products', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const since = c.req.query('since') ?? daysAgo(30)

    const byRevenue = await c.env.qesuite_db.prepare(
      `SELECT oi.product_name,
              SUM(oi.quantity * oi.price) as revenue,
              SUM(oi.quantity) as units
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = ? AND date(o.created_at) >= ? AND o.status NOT IN ('CANCELLED')
       GROUP BY oi.product_name
       ORDER BY revenue DESC
       LIMIT 5`
    ).bind(tenantId, since).all()

    const byVolume = await c.env.qesuite_db.prepare(
      `SELECT oi.product_name,
              SUM(oi.quantity) as units,
              SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = ? AND date(o.created_at) >= ? AND o.status NOT IN ('CANCELLED')
       GROUP BY oi.product_name
       ORDER BY units DESC
       LIMIT 5`
    ).bind(tenantId, since).all()

    return c.json({
      data: {
        by_revenue: byRevenue.results,
        by_volume: byVolume.results,
      },
      error: null,
    })
  } catch (err) {
    console.error('analytics top-products error', err)
    return c.json({ error: 'Failed to load top products', data: null }, 500)
  }
})

// GET /api/analytics/peak-hours — hourly order distribution
analytics.get('/peak-hours', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const since = daysAgo(30)

    const rows = await c.env.qesuite_db.prepare(
      `SELECT strftime('%H', created_at) as hour,
              COUNT(*) as order_count
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND status NOT IN ('CANCELLED')
       GROUP BY hour
       ORDER BY hour ASC`
    ).bind(tenantId, since).all<{ hour: string; order_count: number }>()

    // Fill all 24 hours
    const dataMap = new Map(rows.results.map((r) => [r.hour, r.order_count]))
    const series = Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, '0')
      return { hour: `${hour}:00`, order_count: dataMap.get(hour) ?? 0 }
    })

    return c.json({ data: series, error: null })
  } catch (err) {
    console.error('analytics peak-hours error', err)
    return c.json({ error: 'Failed to load peak hours', data: null }, 500)
  }
})

// GET /api/analytics/payment-methods — payment method breakdown
analytics.get('/payment-methods', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const since = daysAgo(30)

    const rows = await c.env.qesuite_db.prepare(
      `SELECT payment_method,
              COUNT(*) as order_count,
              COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE tenant_id = ? AND date(created_at) >= ? AND status NOT IN ('CANCELLED')
       GROUP BY payment_method
       ORDER BY order_count DESC`
    ).bind(tenantId, since).all()

    return c.json({ data: rows.results, error: null })
  } catch (err) {
    console.error('analytics payment-methods error', err)
    return c.json({ error: 'Failed to load payment methods data', data: null }, 500)
  }
})

export default analytics
