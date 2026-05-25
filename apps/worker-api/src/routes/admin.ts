import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { superadminMiddleware } from '../middleware/auth'
import { signJWT } from '../lib/jwt'

const admin = new Hono<{ Bindings: Env; Variables: Variables }>()

// All admin routes require superadmin role
admin.use('*', superadminMiddleware)

// GET /api/admin/stores — all stores
admin.get('/stores', async (c) => {
  try {
    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100)
    const offset = (page - 1) * limit
    const search = c.req.query('search')
    const status = c.req.query('status') // trialing | active | suspended

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (search) {
      conditions.push("(t.name LIKE ? OR t.slug LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)")
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (status === 'suspended') {
      conditions.push('t.is_suspended = 1')
    } else if (status === 'trialing') {
      conditions.push("t.subscription_status = 'trialing' AND t.is_suspended = 0")
    } else if (status === 'active') {
      conditions.push("t.subscription_status = 'active' AND t.is_suspended = 0")
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
       ${whereClause}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT t.id, t.name, t.slug, t.plan, t.subscription_status, t.is_suspended,
              t.trial_ends_at, t.created_at,
              u.name as owner_name, u.phone as owner_phone, u.email as owner_email,
              (SELECT COUNT(*) FROM orders WHERE tenant_id = t.id) as total_orders,
              (SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = t.id AND status != 'CANCELLED') as total_gmv
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: rows.results,
      meta: {
        total: countResult?.cnt ?? 0,
        page,
        limit,
      },
      error: null,
    })
  } catch (err) {
    console.error('admin stores list error', err)
    return c.json({ error: 'Failed to fetch stores', data: null }, 500)
  }
})

// GET /api/admin/stores/:id — store detail
admin.get('/stores/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const tenant = await c.env.qesuite_db.prepare(
      `SELECT t.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'owner'
       WHERE t.id = ?`
    ).bind(id).first()

    if (!tenant) {
      return c.json({ error: 'Store not found', data: null }, 404)
    }

    const settings = await c.env.qesuite_db.prepare(
      'SELECT * FROM store_settings WHERE tenant_id = ?'
    ).bind(id).first()

    const subscription = await c.env.qesuite_db.prepare(
      'SELECT * FROM subscriptions WHERE tenant_id = ?'
    ).bind(id).first()

    const billing = await c.env.qesuite_db.prepare(
      'SELECT * FROM billing_history WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(id).all()

    const orderStats = await c.env.qesuite_db.prepare(
      `SELECT
         COUNT(*) as total_orders,
         COALESCE(SUM(total), 0) as total_revenue,
         COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
         COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
       FROM orders WHERE tenant_id = ?`
    ).bind(id).first()

    const recentOrders = await c.env.qesuite_db.prepare(
      'SELECT id, tracking_code, status, total, customer_name, created_at FROM orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(id).all()

    return c.json({
      success: true,
      data: {
        tenant,
        settings,
        subscription,
        billing_history: billing.results,
        order_stats: orderStats,
        recent_orders: recentOrders.results,
      },
      error: null,
    })
  } catch (err) {
    console.error('admin store detail error', err)
    return c.json({ error: 'Failed to fetch store details', data: null }, 500)
  }
})

// GET /api/admin/stores/:id/billing — billing history for a single store
admin.get('/stores/:id/billing', async (c) => {
  try {
    const id = c.req.param('id')
    const rows = await c.env.qesuite_db.prepare(
      `SELECT id, amount, currency, status, payment_method, reference, paid_at, created_at
       FROM billing_history WHERE tenant_id = ? ORDER BY created_at DESC`
    ).bind(id).all()
    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('admin store billing error', err)
    return c.json({ error: 'Failed to load billing history', data: null }, 500)
  }
})

// PUT /api/admin/stores/:id/suspend
admin.put('/stores/:id/suspend', async (c) => {
  try {
    const id = c.req.param('id')
    const { reason } = await c.req.json<{ reason?: string }>().catch(() => ({ reason: '' }))

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) {
      return c.json({ error: 'Store not found', data: null }, 404)
    }

    await c.env.qesuite_db.prepare('UPDATE tenants SET is_suspended = 1 WHERE id = ?').bind(id).run()

    console.info(`Store ${id} suspended by admin. Reason: ${reason ?? 'unspecified'}`)

    return c.json({ success: true, data: { suspended: true, id }, error: null, message: 'Store suspended' })
  } catch (err) {
    console.error('admin suspend error', err)
    return c.json({ error: 'Failed to suspend store', data: null }, 500)
  }
})

// PUT /api/admin/stores/:id/unsuspend
admin.put('/stores/:id/unsuspend', async (c) => {
  try {
    const id = c.req.param('id')

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) {
      return c.json({ error: 'Store not found', data: null }, 404)
    }

    await c.env.qesuite_db.prepare('UPDATE tenants SET is_suspended = 0 WHERE id = ?').bind(id).run()

    return c.json({ success: true, data: { suspended: false, id }, error: null, message: 'Store unsuspended' })
  } catch (err) {
    console.error('admin unsuspend error', err)
    return c.json({ error: 'Failed to unsuspend store', data: null }, 500)
  }
})

// PUT /api/admin/stores/:id/extend-trial
admin.put('/stores/:id/extend-trial', async (c) => {
  try {
    const id = c.req.param('id')
    const { days = 7 } = await c.req.json<{ days?: number }>().catch(() => ({ days: 7 }))

    const tenant = await c.env.qesuite_db.prepare(
      'SELECT id, trial_ends_at FROM tenants WHERE id = ?'
    ).bind(id).first<{ id: string; trial_ends_at: string | null }>()

    if (!tenant) {
      return c.json({ error: 'Store not found', data: null }, 404)
    }

    const base = tenant.trial_ends_at
      ? new Date(tenant.trial_ends_at)
      : new Date()
    base.setDate(base.getDate() + days)

    await c.env.qesuite_db.prepare(
      "UPDATE tenants SET trial_ends_at = ?, subscription_status = 'trialing' WHERE id = ?"
    ).bind(base.toISOString(), id).run()

    return c.json({
      success: true,
      data: { trial_ends_at: base.toISOString() },
      error: null,
      message: `Trial extended by ${days} days`,
    })
  } catch (err) {
    console.error('admin extend trial error', err)
    return c.json({ error: 'Failed to extend trial', data: null }, 500)
  }
})

// GET /api/admin/billing — platform-wide billing records
admin.get('/billing', async (c) => {
  try {
    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100)
    const offset = (page - 1) * limit
    const search = c.req.query('search')
    const status = c.req.query('status')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (search) {
      conditions.push('(t.name LIKE ? OR bh.reference LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (status && status !== 'all') {
      conditions.push('bh.status = ?')
      params.push(status)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM billing_history bh LEFT JOIN tenants t ON t.id = bh.tenant_id ${where}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT bh.id, bh.tenant_id as store_id, t.name as store_name, t.plan,
              bh.amount, bh.currency, bh.status, bh.payment_method, bh.reference, bh.paid_at, bh.created_at
       FROM billing_history bh
       LEFT JOIN tenants t ON t.id = bh.tenant_id
       ${where}
       ORDER BY bh.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    const total = countResult?.cnt ?? 0
    return c.json({
      success: true,
      data: rows.results,
      meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
      error: null,
    })
  } catch (err) {
    console.error('admin billing error', err)
    return c.json({ error: 'Failed to load billing records', data: null }, 500)
  }
})

// GET /api/admin/metrics/gmv — GMV chart data
admin.get('/metrics/gmv', async (c) => {
  try {
    const period = c.req.query('period') ?? '30d'
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const since = new Date(Date.now() - days * 86400_000).toISOString().split('T')[0]

    const rows = await c.env.qesuite_db.prepare(
      `SELECT date(created_at) as date, COALESCE(SUM(total), 0) as value
       FROM orders WHERE status != 'CANCELLED' AND date(created_at) >= ?
       GROUP BY date(created_at) ORDER BY date ASC`
    ).bind(since).all<{ date: string; value: number }>()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('admin metrics/gmv error', err)
    return c.json({ error: 'Failed to load GMV chart', data: null }, 500)
  }
})

// GET /api/admin/metrics/store-growth — new stores over time
admin.get('/metrics/store-growth', async (c) => {
  try {
    const period = c.req.query('period') ?? '30d'
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const since = new Date(Date.now() - days * 86400_000).toISOString().split('T')[0]

    const rows = await c.env.qesuite_db.prepare(
      `SELECT date(created_at) as date, COUNT(*) as count
       FROM tenants WHERE date(created_at) >= ?
       GROUP BY date(created_at) ORDER BY date ASC`
    ).bind(since).all<{ date: string; count: number }>()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('admin metrics/store-growth error', err)
    return c.json({ error: 'Failed to load store growth chart', data: null }, 500)
  }
})

// GET /api/admin/metrics — platform KPIs
admin.get('/metrics', async (c) => {
  try {
    const totalStores = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM tenants'
    ).first<{ cnt: number }>()

    const activeStores = await c.env.qesuite_db.prepare(
      "SELECT COUNT(*) as cnt FROM tenants WHERE subscription_status = 'active' AND is_suspended = 0"
    ).first<{ cnt: number }>()

    const trialingStores = await c.env.qesuite_db.prepare(
      "SELECT COUNT(*) as cnt FROM tenants WHERE subscription_status = 'trialing' AND is_suspended = 0"
    ).first<{ cnt: number }>()

    const suspendedStores = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM tenants WHERE is_suspended = 1'
    ).first<{ cnt: number }>()

    const platformGmv = await c.env.qesuite_db.prepare(
      "SELECT COALESCE(SUM(total), 0) as gmv FROM orders WHERE status != 'CANCELLED'"
    ).first<{ gmv: number }>()

    // MRR: active subscriptions × amount
    const mrr = await c.env.qesuite_db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as mrr FROM subscriptions WHERE status = 'active'"
    ).first<{ mrr: number }>()

    // This month GMV + new stores this month
    const thisMonth = new Date()
    const monthStart = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}-01`
    const today = thisMonth.toISOString().split('T')[0]

    const monthlyGmv = await c.env.qesuite_db.prepare(
      `SELECT COALESCE(SUM(total), 0) as gmv
       FROM orders WHERE status != 'CANCELLED' AND date(created_at) >= ?`
    ).bind(monthStart).first<{ gmv: number }>()

    const newToday = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM tenants WHERE date(created_at) = ?'
    ).bind(today).first<{ cnt: number }>()

    const newThisMonth = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM tenants WHERE date(created_at) >= ?'
    ).bind(monthStart).first<{ cnt: number }>()

    // Trial-to-paid conversion
    const totalTrials = (trialingStores?.cnt ?? 0) + (activeStores?.cnt ?? 0)
    const conversionRate =
      totalTrials > 0 ? (activeStores?.cnt ?? 0) / totalTrials : 0

    return c.json({
      success: true,
      data: {
        total_stores: totalStores?.cnt ?? 0,
        active_stores: activeStores?.cnt ?? 0,
        trialing_stores: trialingStores?.cnt ?? 0,
        suspended_stores: suspendedStores?.cnt ?? 0,
        platform_gmv: Math.round(platformGmv?.gmv ?? 0),
        monthly_gmv: Math.round(monthlyGmv?.gmv ?? 0),
        mrr: Math.round(mrr?.mrr ?? 0),
        trial_to_paid_rate: parseFloat(conversionRate.toFixed(4)),
        new_stores_today: newToday?.cnt ?? 0,
        new_stores_this_month: newThisMonth?.cnt ?? 0,
      },
      error: null,
    })
  } catch (err) {
    console.error('admin metrics error', err)
    return c.json({ error: 'Failed to load metrics', data: null }, 500)
  }
})

// POST /api/admin/stores/:id/impersonate — ghost login as store owner
admin.post('/stores/:id/impersonate', async (c) => {
  try {
    const tenantId = c.req.param('id')

    const owner = await c.env.qesuite_db.prepare(
      "SELECT id, name, tenant_id FROM users WHERE tenant_id = ? AND role = 'owner' AND is_active = 1 LIMIT 1"
    ).bind(tenantId).first<{ id: string; name: string; tenant_id: string }>()

    if (!owner) {
      return c.json({ error: 'Owner not found for this store', data: null }, 404)
    }

    const expiresAt = new Date(Date.now() + 3600_000).toISOString()
    const token = await signJWT(
      { sub: owner.id, tenant_id: owner.tenant_id, role: 'owner', name: `[Ghost] ${owner.name}` },
      c.env.JWT_SECRET,
      3600
    )

    return c.json({
      success: true,
      data: { token, expires_at: expiresAt },
      error: null,
    })
  } catch (err) {
    console.error('admin impersonate error', err)
    return c.json({ error: 'Failed to impersonate', data: null }, 500)
  }
})

export default admin
