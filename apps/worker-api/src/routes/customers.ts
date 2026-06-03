import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'

const customers = new Hono<{ Bindings: Env; Variables: Variables }>()
customers.use('*', authMiddleware, tenantGuard)

// GET /api/customers — paginated customer list for the store owner
customers.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const page  = Math.max(1, parseInt(c.req.query('page')  ?? '1', 10))
    const limit = Math.min(parseInt(c.req.query('limit') ?? '25', 10), 100)
    const offset = (page - 1) * limit
    const search = c.req.query('search')?.trim()

    const conditions = ['c.tenant_id = ?']
    const params: (string | number)[] = [tenantId]
    if (search) {
      conditions.push('(c.name LIKE ? OR c.phone LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    const where = conditions.join(' AND ')

    const countRow = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM customers c WHERE ${where}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT c.id, c.name, c.phone, c.order_count, c.total_spend,
              c.first_order_at, c.last_order_at
       FROM customers c
       WHERE ${where}
       ORDER BY c.last_order_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: rows.results,
      meta: {
        total: countRow?.cnt ?? 0,
        page,
        limit,
        total_pages: Math.ceil((countRow?.cnt ?? 0) / limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('customers list error', err)
    return c.json({ success: false, error: 'Failed to fetch customers', data: null }, 500)
  }
})

// GET /api/customers/summary — quick stats for the dashboard
customers.get('/summary', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const row = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE order_count > 1) as repeat_customers,
              COALESCE(SUM(total_spend), 0) as total_revenue
       FROM customers WHERE tenant_id = ?`
    ).bind(tenantId).first<{ total: number; repeat_customers: number; total_revenue: number }>()
    return c.json({ success: true, data: row ?? { total: 0, repeat_customers: 0, total_revenue: 0 }, error: null })
  } catch {
    return c.json({ success: true, data: { total: 0, repeat_customers: 0, total_revenue: 0 }, error: null })
  }
})

export default customers
