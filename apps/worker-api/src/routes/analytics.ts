import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { addDays } from '@qesuite/shared'
import { inclusiveDateRange } from '../lib/time'

const analytics = new Hono<{ Bindings: Env; Variables: Variables }>()

interface DateRange {
  dateFrom: string  // YYYY-MM-DD inclusive start
  dateTo: string    // YYYY-MM-DD inclusive end
  prevFrom: string  // start of equal-length previous period
  prevTo: string    // end of previous period
  days: number
}

function parseDateRange(period?: string | null, from?: string | null, to?: string | null): DateRange {
  const { dateFrom, dateTo } = inclusiveDateRange(period ?? 'month', from, to)
  const ms = new Date(dateTo).getTime() - new Date(dateFrom).getTime()
  const days = Math.max(1, Math.round(ms / 86_400_000) + 1)
  const prevTo = addDays(dateFrom, -1)
  const prevFrom = addDays(prevTo, -(days - 1))
  return {
    dateFrom,
    dateTo,
    prevFrom,
    prevTo,
    days,
  }
}

interface SalesSummaryRow {
  total_orders: number
  total_revenue: number
  avg_order_value: number
  delivered_orders: number
  cancelled_orders: number
  online_orders: number
  pos_sales: number
}

async function getSalesSummary(
  db: D1Database,
  tenantId: string,
  dateFrom: string,
  dateTo: string,
): Promise<SalesSummaryRow | null> {
  return db.prepare(
    `WITH sales AS (
       SELECT total,
              CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END AS included,
              CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END AS completed,
              CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END AS cancelled,
              CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END AS online_order,
              0 AS pos_sale
       FROM orders
       WHERE tenant_id = ? AND date(created_at, '+3 hours') BETWEEN ? AND ?

       UNION ALL

       SELECT total,
              CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS included,
              CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS completed,
              CASE WHEN status = 'voided' THEN 1 ELSE 0 END AS cancelled,
              0 AS online_order,
              CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS pos_sale
       FROM pos_sales
       WHERE tenant_id = ? AND date(created_at, '+3 hours') BETWEEN ? AND ?
     )
     SELECT COALESCE(SUM(included), 0) AS total_orders,
            COALESCE(SUM(CASE WHEN included = 1 THEN total ELSE 0 END), 0) AS total_revenue,
            COALESCE(AVG(CASE WHEN included = 1 THEN total END), 0) AS avg_order_value,
            COALESCE(SUM(completed), 0) AS delivered_orders,
            COALESCE(SUM(cancelled), 0) AS cancelled_orders,
            COALESCE(SUM(online_order), 0) AS online_orders,
            COALESCE(SUM(pos_sale), 0) AS pos_sales
     FROM sales`
  ).bind(
    tenantId, dateFrom, dateTo,
    tenantId, dateFrom, dateTo,
  ).first<SalesSummaryRow>()
}

// Generate every date between two ISO date strings (inclusive)
function datesBetween(from: string, to: string): string[] {
  const dates: string[] = []
  let current = from
  while (current <= to) {
    dates.push(current)
    current = addDays(current, 1)
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

    const [current, previous] = await Promise.all([
      getSalesSummary(c.env.qesuite_db, tenantId, range.dateFrom, range.dateTo),
      getSalesSummary(c.env.qesuite_db, tenantId, range.prevFrom, range.prevTo),
    ])

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
        online_orders: current?.online_orders ?? 0,
        pos_sales: current?.pos_sales ?? 0,
        period_days: range.days,
        prev: {
          total_revenue: Math.round(previous?.total_revenue ?? 0),
          total_orders: prevTotalOrders,
          avg_order_value: Math.round(previous?.avg_order_value ?? 0),
          cancelled_orders: previous?.cancelled_orders ?? 0,
          completion_rate: prevCompletionRate,
          online_orders: previous?.online_orders ?? 0,
          pos_sales: previous?.pos_sales ?? 0,
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

// GET /api/analytics/employees — attributed online and POS performance by staff member
analytics.get('/employees', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )
    const rows = await c.env.qesuite_db.prepare(
      `WITH attributed_sales AS (
         SELECT handled_by_user_id AS user_id,
                1 AS total_sales,
                1 AS online_orders,
                0 AS pos_sales,
                CASE WHEN status != 'CANCELLED' THEN total ELSE 0 END AS revenue,
                CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END AS completed_sales,
                CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END AS cancelled_or_voided,
                updated_at AS sale_at
         FROM orders
         WHERE tenant_id = ? AND handled_by_user_id IS NOT NULL
           AND date(updated_at, '+3 hours') BETWEEN ? AND ?

         UNION ALL

         SELECT served_by_user_id AS user_id,
                1 AS total_sales,
                0 AS online_orders,
                1 AS pos_sales,
                CASE WHEN status = 'completed' THEN total ELSE 0 END AS revenue,
                CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS completed_sales,
                CASE WHEN status = 'voided' THEN 1 ELSE 0 END AS cancelled_or_voided,
                COALESCE(voided_at, created_at) AS sale_at
         FROM pos_sales
         WHERE tenant_id = ? AND served_by_user_id IS NOT NULL
           AND date(COALESCE(voided_at, created_at), '+3 hours') BETWEEN ? AND ?
       )
       SELECT u.id AS user_id, u.name, u.job_title, u.is_active,
              COALESCE(SUM(s.total_sales), 0) AS total_sales,
              COALESCE(SUM(s.online_orders), 0) AS online_orders,
              COALESCE(SUM(s.pos_sales), 0) AS pos_sales,
              COALESCE(SUM(s.revenue), 0) AS revenue,
              CASE WHEN SUM(s.completed_sales) > 0
                THEN ROUND(CAST(SUM(s.revenue) AS REAL) / SUM(s.completed_sales)) ELSE 0 END AS avg_sale,
              COALESCE(SUM(s.completed_sales), 0) AS completed_sales,
              COALESCE(SUM(s.cancelled_or_voided), 0) AS cancelled_or_voided,
              CASE WHEN SUM(s.total_sales) > 0
                THEN ROUND(CAST(SUM(s.completed_sales) AS REAL) * 100 / SUM(s.total_sales), 1) ELSE 0 END AS completion_rate,
              MAX(s.sale_at) AS last_sale_at
       FROM users u
       LEFT JOIN attributed_sales s ON s.user_id = u.id
       WHERE u.tenant_id = ? AND u.role = 'staff'
       GROUP BY u.id, u.name, u.job_title, u.is_active
       ORDER BY revenue DESC, total_sales DESC, u.name ASC`
    ).bind(
      tenantId, range.dateFrom, range.dateTo,
      tenantId, range.dateFrom, range.dateTo,
      tenantId,
    ).all<{
      user_id: string; name: string; job_title: string | null; is_active: number
      total_sales: number; online_orders: number; pos_sales: number; revenue: number
      avg_sale: number; completed_sales: number; cancelled_or_voided: number
      completion_rate: number; last_sale_at: string | null
    }>()
    return c.json({
      success: true,
      data: rows.results.map(row => ({ ...row, is_active: Boolean(row.is_active) })),
      error: null,
    })
  } catch (error) {
    console.error(JSON.stringify({ message: 'employee analytics failed', error: error instanceof Error ? error.message : String(error) }))
    return c.json({ success: false, error: 'Failed to load employee performance', data: null }, 500)
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
      `WITH sales AS (
         SELECT date(created_at, '+3 hours') AS date, total
         FROM orders
         WHERE tenant_id = ? AND status != 'CANCELLED'
           AND date(created_at, '+3 hours') BETWEEN ? AND ?
         UNION ALL
         SELECT date(created_at, '+3 hours') AS date, total
         FROM pos_sales
         WHERE tenant_id = ? AND status = 'completed'
           AND date(created_at, '+3 hours') BETWEEN ? AND ?
       )
       SELECT date,
              COUNT(*) AS order_count,
              COALESCE(SUM(total), 0) AS revenue
       FROM sales
       GROUP BY date
       ORDER BY date ASC`
    ).bind(
      tenantId, range.dateFrom, range.dateTo,
      tenantId, range.dateFrom, range.dateTo,
    ).all<{ date: string; order_count: number; revenue: number }>()

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

interface ExpenseTotalRow {
  expenses: number
  expense_count: number
}

function financialPeriod(revenueValue: number, expenseValue: number) {
  const revenue = Math.round(revenueValue)
  const expenses = Math.round(expenseValue)
  const variance = revenue - expenses
  return {
    revenue,
    expenses,
    variance,
    expense_ratio: revenue > 0 ? Number(((expenses / revenue) * 100).toFixed(1)) : null,
    margin: revenue > 0 ? Number(((variance / revenue) * 100).toFixed(1)) : null,
  }
}

// GET /api/analytics/profit-loss — sales, recorded expenses, and operating variance
analytics.get('/profit-loss', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(
      c.req.query('period') ?? c.req.query('range'),
      c.req.query('from'),
      c.req.query('to'),
    )

    const expenseTotalSql = `SELECT COALESCE(SUM(amount), 0) AS expenses,
                                    COUNT(*) AS expense_count
                             FROM expenses
                             WHERE tenant_id = ? AND expense_date BETWEEN ? AND ?`

    const [
      currentSales,
      previousSales,
      currentExpenses,
      previousExpenses,
      salesRows,
      expenseRows,
      categoryRows,
    ] = await Promise.all([
      getSalesSummary(c.env.qesuite_db, tenantId, range.dateFrom, range.dateTo),
      getSalesSummary(c.env.qesuite_db, tenantId, range.prevFrom, range.prevTo),
      c.env.qesuite_db.prepare(expenseTotalSql)
        .bind(tenantId, range.dateFrom, range.dateTo).first<ExpenseTotalRow>(),
      c.env.qesuite_db.prepare(expenseTotalSql)
        .bind(tenantId, range.prevFrom, range.prevTo).first<ExpenseTotalRow>(),
      c.env.qesuite_db.prepare(
        `WITH sales AS (
           SELECT date(created_at, '+3 hours') AS date, total
           FROM orders
           WHERE tenant_id = ? AND status != 'CANCELLED'
             AND date(created_at, '+3 hours') BETWEEN ? AND ?
           UNION ALL
           SELECT date(created_at, '+3 hours') AS date, total
           FROM pos_sales
           WHERE tenant_id = ? AND status = 'completed'
             AND date(created_at, '+3 hours') BETWEEN ? AND ?
         )
         SELECT date, COALESCE(SUM(total), 0) AS revenue
         FROM sales GROUP BY date ORDER BY date`
      ).bind(
        tenantId, range.dateFrom, range.dateTo,
        tenantId, range.dateFrom, range.dateTo,
      ).all<{ date: string; revenue: number }>(),
      c.env.qesuite_db.prepare(
        `SELECT expense_date AS date, COALESCE(SUM(amount), 0) AS expenses
         FROM expenses
         WHERE tenant_id = ? AND expense_date BETWEEN ? AND ?
         GROUP BY expense_date ORDER BY expense_date`
      ).bind(tenantId, range.dateFrom, range.dateTo)
        .all<{ date: string; expenses: number }>(),
      c.env.qesuite_db.prepare(
        `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
         FROM expenses
         WHERE tenant_id = ? AND expense_date BETWEEN ? AND ?
         GROUP BY category ORDER BY total DESC`
      ).bind(tenantId, range.dateFrom, range.dateTo)
        .all<{ category: string; total: number; count: number }>(),
    ])

    const current = financialPeriod(
      currentSales?.total_revenue ?? 0,
      currentExpenses?.expenses ?? 0,
    )
    const previous = financialPeriod(
      previousSales?.total_revenue ?? 0,
      previousExpenses?.expenses ?? 0,
    )
    const salesByDate = new Map(salesRows.results.map(row => [row.date, row.revenue]))
    const expensesByDate = new Map(expenseRows.results.map(row => [row.date, row.expenses]))
    const daily = datesBetween(range.dateFrom, range.dateTo).map(date => {
      const revenue = Math.round(salesByDate.get(date) ?? 0)
      const expenses = Math.round(expensesByDate.get(date) ?? 0)
      return { date, revenue, expenses, variance: revenue - expenses }
    })

    return c.json({
      success: true,
      data: {
        date_from: range.dateFrom,
        date_to: range.dateTo,
        ...current,
        expense_count: currentExpenses?.expense_count ?? 0,
        online_orders: currentSales?.online_orders ?? 0,
        pos_sales: currentSales?.pos_sales ?? 0,
        previous: {
          ...previous,
          expense_count: previousExpenses?.expense_count ?? 0,
          online_orders: previousSales?.online_orders ?? 0,
          pos_sales: previousSales?.pos_sales ?? 0,
        },
        daily,
        by_category: categoryRows.results,
      },
      error: null,
    })
  } catch (err) {
    console.error('analytics profit-loss error', err)
    return c.json({ success: false, error: 'Failed to load sales and expense performance', data: null }, 500)
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

    const productSalesSql = `WITH product_sales AS (
       SELECT oi.product_name, oi.quantity, oi.quantity * oi.price AS line_total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.tenant_id = ? AND o.status != 'CANCELLED'
         AND date(o.created_at, '+3 hours') BETWEEN ? AND ?
       UNION ALL
       SELECT psi.product_name, psi.quantity, psi.line_total
       FROM pos_sale_items psi
       JOIN pos_sales ps ON ps.id = psi.sale_id
       WHERE ps.tenant_id = ? AND ps.status = 'completed'
         AND date(ps.created_at, '+3 hours') BETWEEN ? AND ?
     )`
    const productSalesParams = [
      tenantId, range.dateFrom, range.dateTo,
      tenantId, range.dateFrom, range.dateTo,
    ]

    const byRevenue = await c.env.qesuite_db.prepare(
      `${productSalesSql}
       SELECT product_name,
              SUM(line_total) AS total_revenue,
              SUM(quantity) AS total_quantity
       FROM product_sales
       GROUP BY product_name
       ORDER BY total_revenue DESC
       LIMIT 5`
    ).bind(...productSalesParams).all()

    const byVolume = await c.env.qesuite_db.prepare(
      `${productSalesSql}
       SELECT product_name,
              SUM(quantity) AS total_quantity,
              SUM(line_total) AS total_revenue
       FROM product_sales
       GROUP BY product_name
       ORDER BY total_quantity DESC
       LIMIT 5`
    ).bind(...productSalesParams).all()

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
      `WITH sales AS (
         SELECT created_at
         FROM orders
         WHERE tenant_id = ? AND status != 'CANCELLED'
           AND date(created_at, '+3 hours') BETWEEN ? AND ?
         UNION ALL
         SELECT created_at
         FROM pos_sales
         WHERE tenant_id = ? AND status = 'completed'
           AND date(created_at, '+3 hours') BETWEEN ? AND ?
       )
       SELECT strftime('%H', created_at, '+3 hours') AS hour,
              COUNT(*) AS order_count
       FROM sales
       GROUP BY hour
       ORDER BY hour ASC`
    ).bind(
      tenantId, range.dateFrom, range.dateTo,
      tenantId, range.dateFrom, range.dateTo,
    ).all<{ hour: string; order_count: number }>()

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
      `WITH sales AS (
         SELECT payment_method, total
         FROM orders
         WHERE tenant_id = ? AND status != 'CANCELLED'
           AND date(created_at, '+3 hours') BETWEEN ? AND ?
         UNION ALL
         SELECT payment_method, total
         FROM pos_sales
         WHERE tenant_id = ? AND status = 'completed'
           AND date(created_at, '+3 hours') BETWEEN ? AND ?
       )
       SELECT payment_method,
              COUNT(*) AS order_count,
              COALESCE(SUM(total), 0) AS revenue
       FROM sales
       GROUP BY payment_method
       ORDER BY order_count DESC`
    ).bind(
      tenantId, range.dateFrom, range.dateTo,
      tenantId, range.dateFrom, range.dateTo,
    ).all<{ payment_method: string; order_count: number; revenue: number }>()

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
         WHERE tenant_id = ? AND date(created_at, '+3 hours') >= ? AND date(created_at, '+3 hours') <= ?
         GROUP BY status`
      ).bind(tenantId, range.dateFrom, range.dateTo).all<{ status: string; count: number }>(),

      c.env.qesuite_db.prepare(
        `SELECT COUNT(DISTINCT customer_phone) as count
         FROM orders
         WHERE tenant_id = ? AND date(created_at, '+3 hours') >= ? AND date(created_at, '+3 hours') <= ?`
      ).bind(tenantId, range.dateFrom, range.dateTo).first<{ count: number }>(),

      // New customers = phones that had no order before this period
      c.env.qesuite_db.prepare(
        `SELECT COUNT(DISTINCT customer_phone) as count
         FROM orders
         WHERE tenant_id = ? AND date(created_at, '+3 hours') >= ? AND date(created_at, '+3 hours') <= ?
           AND customer_phone NOT IN (
             SELECT DISTINCT customer_phone FROM orders
             WHERE tenant_id = ? AND date(created_at, '+3 hours') < ?
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
