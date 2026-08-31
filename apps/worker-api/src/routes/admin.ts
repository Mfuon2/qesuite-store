import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { superadminMiddleware } from '../middleware/auth'
import { parseDisabledModules } from '../middleware/tenant'
import { signJWT, generateId } from '../lib/jwt'
import { hashPassword } from '../lib/password'
import { businessDate, businessDateDaysAgo } from '../lib/time'
import { validatePhone, normalizeKenyaPhone, ALL_STORE_MODULE_KEYS } from '@qesuite/shared'

const admin = new Hono<{ Bindings: Env; Variables: Variables }>()

// All admin routes require superadmin role
admin.use('*', superadminMiddleware)

// Audit helper — fire-and-forget, never blocks the response
async function audit(
  db: Env['qesuite_db'],
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: string,
  ip?: string
) {
  try {
    await db.prepare(
      `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
       VALUES (?, ?, 'superadmin', ?, ?, ?, ?, ?)`
    ).bind(generateId(), actorId, action, targetType, targetId, detail ?? null, ip ?? null).run()
  } catch { /* audit must never crash the main flow */ }
}

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
              ((SELECT COUNT(*) FROM orders WHERE tenant_id = t.id AND status != 'CANCELLED') +
               (SELECT COUNT(*) FROM pos_sales WHERE tenant_id = t.id AND status = 'completed')) as total_orders,
              ((SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = t.id AND status != 'CANCELLED') +
               (SELECT COALESCE(SUM(total), 0) FROM pos_sales WHERE tenant_id = t.id AND status = 'completed')) as total_gmv
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
      `WITH sales AS (
         SELECT total,
                CASE WHEN status != 'CANCELLED' THEN 1 ELSE 0 END AS included,
                CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END AS completed,
                CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END AS cancelled
         FROM orders WHERE tenant_id = ?
         UNION ALL
         SELECT total,
                CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS included,
                CASE WHEN status = 'completed' THEN 1 ELSE 0 END AS completed,
                CASE WHEN status = 'voided' THEN 1 ELSE 0 END AS cancelled
         FROM pos_sales WHERE tenant_id = ?
       )
       SELECT COALESCE(SUM(included), 0) AS total_orders,
              COALESCE(SUM(CASE WHEN included = 1 THEN total ELSE 0 END), 0) AS total_revenue,
              COALESCE(SUM(completed), 0) AS delivered,
              COALESCE(SUM(cancelled), 0) AS cancelled
       FROM sales`
    ).bind(id, id).first()

    const recentOrders = await c.env.qesuite_db.prepare(
      'SELECT id, tracking_code, status, total, customer_name, created_at FROM orders WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(id).all()

    return c.json({
      success: true,
      data: {
        tenant: { ...tenant, disabled_modules: parseDisabledModules((tenant as { disabled_modules: string | null }).disabled_modules) },
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

// PUT /api/admin/stores/:id/profile — update store profile + owner user details
admin.put('/stores/:id/profile', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{
      name?: string
      slug?: string
      address?: string | null
      phone?: string | null
      whatsapp_number?: string | null
      store_category?: string
      primary_color?: string
      accent_color?: string
      font_family?: string
      owner_name?: string
      owner_email?: string
      owner_phone?: string
    }>()

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    for (const field of ['phone', 'whatsapp_number', 'owner_phone'] as const) {
      const val = body[field]
      if (val && !validatePhone(val)) {
        return c.json({ success: false, error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
      }
      if (val) (body as Record<string, string>)[field] = normalizeKenyaPhone(val)
    }

    if (body.slug) {
      const taken = await c.env.qesuite_db.prepare(
        'SELECT id FROM tenants WHERE slug = ? AND id != ?'
      ).bind(body.slug, id).first()
      if (taken) return c.json({ success: false, error: 'That URL slug is already taken', data: null }, 409)
    }

    const tenantCols = ['name', 'slug', 'address', 'phone', 'whatsapp_number', 'store_category', 'primary_color', 'accent_color', 'font_family']
    const tFields: string[] = []
    const tVals: (string | null)[] = []
    for (const col of tenantCols) {
      if (col in body) { tFields.push(`${col} = ?`); tVals.push((body as Record<string, string | null | undefined>)[col] ?? null) }
    }
    if (tFields.length) {
      tVals.push(id)
      await c.env.qesuite_db.prepare(`UPDATE tenants SET ${tFields.join(', ')} WHERE id = ?`).bind(...tVals).run()
    }

    const owner = await c.env.qesuite_db.prepare(
      "SELECT id FROM users WHERE tenant_id = ? AND role = 'owner'"
    ).bind(id).first<{ id: string }>()

    if (owner) {
      const uMap: { col: string; key: string }[] = [
        { col: 'name', key: 'owner_name' },
        { col: 'email', key: 'owner_email' },
        { col: 'phone', key: 'owner_phone' },
      ]
      const uFields: string[] = []
      const uVals: (string | null)[] = []
      for (const { col, key } of uMap) {
        if (key in body) { uFields.push(`${col} = ?`); uVals.push((body as Record<string, string | null | undefined>)[key] ?? null) }
      }
      if (uFields.length) {
        uVals.push(owner.id)
        await c.env.qesuite_db.prepare(`UPDATE users SET ${uFields.join(', ')} WHERE id = ?`).bind(...uVals).run()
      }
    }

    return c.json({ success: true, data: { updated: true }, error: null, message: 'Profile updated' })
  } catch (err) {
    console.error('admin update profile error', err)
    return c.json({ success: false, error: 'Failed to update profile', data: null }, 500)
  }
})

// PUT /api/admin/stores/:id/modules — toggle which dashboard modules this
// store owner can see, independent of their own staff's permission grants.
admin.put('/stores/:id/modules', async (c) => {
  try {
    const id = c.req.param('id')
    const { disabled_modules } = await c.req.json<{ disabled_modules?: unknown }>()

    if (!Array.isArray(disabled_modules) || !disabled_modules.every(key => typeof key === 'string' && (ALL_STORE_MODULE_KEYS as readonly string[]).includes(key))) {
      return c.json({ success: false, error: 'disabled_modules must be an array of known module keys', data: null }, 400)
    }

    const tenant = await c.env.qesuite_db.prepare('SELECT id, name FROM tenants WHERE id = ?').bind(id).first<{ id: string; name: string }>()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const normalized = [...new Set(disabled_modules)]
    await c.env.qesuite_db.prepare('UPDATE tenants SET disabled_modules = ? WHERE id = ?')
      .bind(JSON.stringify(normalized), id).run()

    await audit(c.env.qesuite_db, c.get('user').sub, 'UPDATE_MODULES', 'tenant', id, JSON.stringify({ disabled_modules: normalized }), c.req.header('CF-Connecting-IP'))

    return c.json({ success: true, data: { disabled_modules: normalized }, error: null, message: 'Modules updated' })
  } catch (err) {
    console.error('admin update modules error', err)
    return c.json({ success: false, error: 'Failed to update modules', data: null }, 500)
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
    await audit(c.env.qesuite_db, c.get('user').sub, 'SUSPEND_STORE', 'tenant', id, reason ?? 'unspecified', c.req.header('CF-Connecting-IP'))

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
    await audit(c.env.qesuite_db, c.get('user').sub, 'UNSUSPEND_STORE', 'tenant', id, undefined, c.req.header('CF-Connecting-IP'))

    return c.json({ success: true, data: { suspended: false, id }, error: null, message: 'Store unsuspended' })
  } catch (err) {
    console.error('admin unsuspend error', err)
    return c.json({ error: 'Failed to unsuspend store', data: null }, 500)
  }
})

// DELETE /api/admin/stores/:id — permanently delete a suspended store and all its data
admin.delete('/stores/:id', async (c) => {
  try {
    const id = c.req.param('id')

    const tenant = await c.env.qesuite_db.prepare(
      'SELECT id, name, is_suspended FROM tenants WHERE id = ?'
    ).bind(id).first<{ id: string; name: string; is_suspended: number }>()

    if (!tenant) {
      return c.json({ success: false, error: 'Store not found', data: null }, 404)
    }

    if (!tenant.is_suspended) {
      return c.json({
        success: false,
        error: 'Store must be suspended before it can be deleted.',
        data: null,
      }, 409)
    }

    const actorId = c.get('user').sub
    const statement = (sql: string) => c.env.qesuite_db.prepare(sql).bind(id)

    // D1 batch() is atomic. Keep the purge permission, dependent data deletion,
    // tenant deletion, and audit record in the same transaction so a failure
    // cannot leave a store half-deleted. The purge context is required by the
    // append-only POS cash-ledger trigger and is removed before commit.
    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        'INSERT INTO tenant_purge_context (tenant_id, authorized_by) VALUES (?, ?)'
      ).bind(id, actorId),
      statement('DELETE FROM audit_log WHERE actor_id IN (SELECT id FROM users WHERE tenant_id = ?)'),
      statement('DELETE FROM notifications_log WHERE tenant_id = ?'),
      statement('DELETE FROM delivery_assignments WHERE tenant_id = ?'),
      statement('DELETE FROM order_payments WHERE tenant_id = ?'),
      statement('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE tenant_id = ?)'),
      statement('DELETE FROM orders WHERE tenant_id = ?'),
      statement('DELETE FROM customers WHERE tenant_id = ?'),
      statement('DELETE FROM pos_sale_items WHERE sale_id IN (SELECT id FROM pos_sales WHERE tenant_id = ?)'),
      statement('DELETE FROM expenses WHERE tenant_id = ?'),
      statement('DELETE FROM pos_sales WHERE tenant_id = ?'),
      statement('DELETE FROM pos_cash_movements WHERE tenant_id = ?'),
      statement('DELETE FROM pos_till_sessions WHERE tenant_id = ?'),
      statement('DELETE FROM delivery_staff WHERE tenant_id = ?'),
      statement('DELETE FROM products WHERE tenant_id = ?'),
      statement('DELETE FROM categories WHERE tenant_id = ?'),
      statement('DELETE FROM store_settings WHERE tenant_id = ?'),
      statement('DELETE FROM billing_history WHERE tenant_id = ?'),
      statement('DELETE FROM subscriptions WHERE tenant_id = ?'),
      statement('DELETE FROM analytics_daily WHERE tenant_id = ?'),
      statement('DELETE FROM user_permissions WHERE tenant_id = ?'),
      statement('DELETE FROM staff_invitations WHERE tenant_id = ?'),
      statement('DELETE FROM users WHERE tenant_id = ?'),
      statement('DELETE FROM tenants WHERE id = ?'),
      statement('DELETE FROM tenant_purge_context WHERE tenant_id = ?'),
      c.env.qesuite_db.prepare(
        `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
         VALUES (?, ?, 'superadmin', 'DELETE_STORE', 'tenant', ?, ?, ?)`
      ).bind(
        generateId(), actorId, id, tenant.name,
        c.req.header('CF-Connecting-IP') ?? null,
      ),
    ])

    return c.json({ success: true, data: { deleted: true, id }, error: null, message: `Store permanently deleted.` })
  } catch (err) {
    console.error('admin delete store error', err)
    return c.json({ success: false, error: 'Failed to delete store', data: null }, 500)
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

// ─── Per-store subscription & billing management ─────────────────────────────

// GET /api/admin/stores/:id/subscription — full subscription overview
admin.get('/stores/:id/subscription', async (c) => {
  try {
    const id = c.req.param('id')
    const [tenant, sub, history] = await Promise.all([
      c.env.qesuite_db.prepare(
        'SELECT id, name, plan, subscription_status, trial_ends_at, is_suspended FROM tenants WHERE id = ?'
      ).bind(id).first<{ id: string; name: string; plan: string; subscription_status: string; trial_ends_at: string | null; is_suspended: number }>(),
      c.env.qesuite_db.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?').bind(id).first(),
      c.env.qesuite_db.prepare(
        'SELECT * FROM billing_history WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 20'
      ).bind(id).all(),
    ])
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)
    return c.json({
      success: true,
      data: { tenant, subscription: sub ?? null, billing_history: history.results },
      error: null,
    })
  } catch (err) {
    console.error('admin get subscription error', err)
    return c.json({ success: false, error: 'Failed to load subscription', data: null }, 500)
  }
})

// PUT /api/admin/stores/:id/subscription — update plan, amount, billing period
admin.put('/stores/:id/subscription', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{
      plan?: string
      amount?: number
      currency?: string
      current_period_start?: string
      current_period_end?: string
      payment_method?: string
    }>()

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    // Update tenant plan if provided
    if (body.plan) {
      await c.env.qesuite_db.prepare('UPDATE tenants SET plan = ? WHERE id = ?').bind(body.plan, id).run()
    }

    // Upsert subscription record
    const existing = await c.env.qesuite_db.prepare('SELECT id FROM subscriptions WHERE tenant_id = ?').bind(id).first<{ id: string }>()
    if (existing) {
      const fields: string[] = []
      const vals: (string | number)[] = []
      if (body.plan !== undefined) { fields.push('plan = ?'); vals.push(body.plan) }
      if (body.amount !== undefined) { fields.push('amount = ?'); vals.push(body.amount) }
      if (body.currency !== undefined) { fields.push('currency = ?'); vals.push(body.currency) }
      if (body.current_period_start !== undefined) { fields.push('current_period_start = ?'); vals.push(body.current_period_start) }
      if (body.current_period_end !== undefined) { fields.push('current_period_end = ?'); vals.push(body.current_period_end) }
      if (body.payment_method !== undefined) { fields.push('payment_method = ?'); vals.push(body.payment_method) }
      if (fields.length) {
        vals.push(id)
        await c.env.qesuite_db.prepare(`UPDATE subscriptions SET ${fields.join(', ')} WHERE tenant_id = ?`).bind(...vals).run()
      }
    } else {
      const { generateId } = await import('../lib/jwt')
      await c.env.qesuite_db.prepare(
        `INSERT INTO subscriptions (id, tenant_id, plan, amount, currency, status, current_period_start, current_period_end, payment_method)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
      ).bind(
        generateId(), id,
        body.plan ?? 'starter',
        body.amount ?? 999,
        body.currency ?? 'KES',
        body.current_period_start ?? businessDate(),
        body.current_period_end ?? null,
        body.payment_method ?? null,
      ).run()
    }

    const sub = await c.env.qesuite_db.prepare('SELECT * FROM subscriptions WHERE tenant_id = ?').bind(id).first()
    return c.json({ success: true, data: sub, error: null, message: 'Subscription updated' })
  } catch (err) {
    console.error('admin update subscription error', err)
    return c.json({ success: false, error: 'Failed to update subscription', data: null }, 500)
  }
})

// POST /api/admin/stores/:id/subscription/activate — activate paid subscription
admin.post('/stores/:id/subscription/activate', async (c) => {
  try {
    const { generateId } = await import('../lib/jwt')
    const id = c.req.param('id')
    const body = await c.req.json<{ plan?: string; amount?: number; period_months?: number; payment_method?: string }>()
      .catch((): { plan?: string; amount?: number; period_months?: number; payment_method?: string } => ({}))

    const tenant = await c.env.qesuite_db.prepare('SELECT id, name FROM tenants WHERE id = ?').bind(id).first<{ id: string; name: string }>()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const plan = body.plan ?? 'starter'
    const amount = body.amount ?? 999
    const months = body.period_months ?? 1

    // Update tenant
    await c.env.qesuite_db.prepare(
      "UPDATE tenants SET subscription_status = 'active', plan = ? WHERE id = ?"
    ).bind(plan, id).run()

    // Upsert subscription — stack on top of any remaining active period so days are never lost
    const existing = await c.env.qesuite_db.prepare(
      'SELECT id, current_period_end, status FROM subscriptions WHERE tenant_id = ?'
    ).bind(id).first<{ id: string; current_period_end: string | null; status: string }>()

    const now = new Date()
    const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null
    const periodStart = (existing?.status === 'active' && existingEnd && existingEnd > now)
      ? existingEnd   // queue: new period follows the current one
      : now           // no active sub or already expired: start immediately

    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + months)

    if (existing) {
      await c.env.qesuite_db.prepare(
        "UPDATE subscriptions SET status = 'active', plan = ?, amount = ?, current_period_start = ?, current_period_end = ?, payment_method = ? WHERE tenant_id = ?"
      ).bind(plan, amount, periodStart.toISOString(), periodEnd.toISOString(), body.payment_method ?? 'manual', id).run()
    } else {
      await c.env.qesuite_db.prepare(
        `INSERT INTO subscriptions (id, tenant_id, plan, amount, currency, status, current_period_start, current_period_end, payment_method)
         VALUES (?, ?, ?, ?, 'KES', 'active', ?, ?, ?)`
      ).bind(generateId(), id, plan, amount, periodStart.toISOString(), periodEnd.toISOString(), body.payment_method ?? 'manual').run()
    }

    // Record billing event
    await c.env.qesuite_db.prepare(
      `INSERT INTO billing_history (id, tenant_id, amount, currency, status, payment_method, reference, paid_at, created_at)
       VALUES (?, ?, ?, 'KES', 'paid', ?, ?, datetime('now'), datetime('now'))`
    ).bind(generateId(), id, amount, body.payment_method ?? 'manual', `ADMIN-ACT-${Date.now()}`).run()

    return c.json({ success: true, data: { activated: true }, error: null, message: 'Subscription activated' })
  } catch (err) {
    console.error('admin activate subscription error', err)
    return c.json({ success: false, error: 'Failed to activate subscription', data: null }, 500)
  }
})

// POST /api/admin/stores/:id/subscription/cancel — cancel subscription
admin.post('/stores/:id/subscription/cancel', async (c) => {
  try {
    const id = c.req.param('id')
    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    await c.env.qesuite_db.prepare("UPDATE tenants SET subscription_status = 'cancelled' WHERE id = ?").bind(id).run()
    await c.env.qesuite_db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE tenant_id = ?").bind(id).run()
    await audit(c.env.qesuite_db, c.get('user').sub, 'CANCEL_SUBSCRIPTION', 'tenant', id, undefined, c.req.header('CF-Connecting-IP'))

    return c.json({ success: true, data: { cancelled: true }, error: null, message: 'Subscription cancelled' })
  } catch (err) {
    console.error('admin cancel subscription error', err)
    return c.json({ success: false, error: 'Failed to cancel subscription', data: null }, 500)
  }
})

// POST /api/admin/stores/:id/subscription/revive — revive cancelled subscription
admin.post('/stores/:id/subscription/revive', async (c) => {
  try {
    const { generateId } = await import('../lib/jwt')
    const id = c.req.param('id')
    const body = await c.req.json<{ period_months?: number }>().catch((): { period_months?: number } => ({}))
    const months = body.period_months ?? 1

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const periodStart = new Date()
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + months)

    await c.env.qesuite_db.prepare("UPDATE tenants SET subscription_status = 'active' WHERE id = ?").bind(id).run()

    const existing = await c.env.qesuite_db.prepare('SELECT id FROM subscriptions WHERE tenant_id = ?').bind(id).first()
    if (existing) {
      await c.env.qesuite_db.prepare(
        "UPDATE subscriptions SET status = 'active', current_period_start = ?, current_period_end = ? WHERE tenant_id = ?"
      ).bind(periodStart.toISOString(), periodEnd.toISOString(), id).run()
    } else {
      await c.env.qesuite_db.prepare(
        `INSERT INTO subscriptions (id, tenant_id, plan, amount, currency, status, current_period_start, current_period_end)
         VALUES (?, ?, 'starter', 999, 'KES', 'active', ?, ?)`
      ).bind(generateId(), id, periodStart.toISOString(), periodEnd.toISOString()).run()
    }

    return c.json({ success: true, data: { revived: true }, error: null, message: 'Subscription revived' })
  } catch (err) {
    console.error('admin revive subscription error', err)
    return c.json({ success: false, error: 'Failed to revive subscription', data: null }, 500)
  }
})

// POST /api/admin/stores/:id/subscription/adjust-days — add or remove days from period end
admin.post('/stores/:id/subscription/adjust-days', async (c) => {
  try {
    const id = c.req.param('id')
    const { days } = await c.req.json<{ days: number }>()

    if (typeof days !== 'number' || days === 0) {
      return c.json({ success: false, error: 'days must be a non-zero number', data: null }, 400)
    }

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const sub = await c.env.qesuite_db.prepare(
      'SELECT current_period_end FROM subscriptions WHERE tenant_id = ?'
    ).bind(id).first<{ current_period_end: string | null }>()

    // Base the new end date on the existing period end (or today if none)
    const base = sub?.current_period_end ? new Date(sub.current_period_end) : new Date()
    base.setDate(base.getDate() + days)

    // Never let the period end go before today
    const minDate = new Date()
    minDate.setHours(0, 0, 0, 0)
    if (base < minDate) base.setTime(minDate.getTime())

    const newEnd = base.toISOString()

    if (sub) {
      await c.env.qesuite_db.prepare(
        'UPDATE subscriptions SET current_period_end = ? WHERE tenant_id = ?'
      ).bind(newEnd, id).run()
    }

    return c.json({
      success: true,
      data: { current_period_end: newEnd, days_adjusted: days },
      error: null,
      message: `Subscription ${days > 0 ? 'extended' : 'reduced'} by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`,
    })
  } catch (err) {
    console.error('admin adjust-days error', err)
    return c.json({ success: false, error: 'Failed to adjust subscription days', data: null }, 500)
  }
})

// PUT /api/admin/stores/:id/trial — enable/disable/update trial
admin.put('/stores/:id/trial', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{
      action: 'enable' | 'disable' | 'set_date' | 'add_days'
      trial_end_date?: string
      days?: number
    }>()

    const tenant = await c.env.qesuite_db.prepare(
      'SELECT id, trial_ends_at FROM tenants WHERE id = ?'
    ).bind(id).first<{ id: string; trial_ends_at: string | null }>()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    let newTrialEnd: string | null = null
    let newStatus: string | null = null

    if (body.action === 'enable') {
      const days = body.days ?? 14
      const end = new Date()
      end.setDate(end.getDate() + days)
      newTrialEnd = end.toISOString()
      newStatus = 'trialing'
    } else if (body.action === 'disable') {
      newTrialEnd = null
      newStatus = 'cancelled'
    } else if (body.action === 'set_date' && body.trial_end_date) {
      newTrialEnd = new Date(body.trial_end_date).toISOString()
      newStatus = 'trialing'
    } else if (body.action === 'add_days') {
      const base = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date()
      base.setDate(base.getDate() + (body.days ?? 7))
      newTrialEnd = base.toISOString()
      newStatus = 'trialing'
    }

    await c.env.qesuite_db.prepare(
      'UPDATE tenants SET trial_ends_at = ?, subscription_status = ? WHERE id = ?'
    ).bind(newTrialEnd, newStatus, id).run()

    return c.json({
      success: true,
      data: { trial_ends_at: newTrialEnd, subscription_status: newStatus },
      error: null,
      message: `Trial ${body.action === 'disable' ? 'disabled' : 'updated'}`,
    })
  } catch (err) {
    console.error('admin update trial error', err)
    return c.json({ success: false, error: 'Failed to update trial', data: null }, 500)
  }
})

// POST /api/admin/stores/:id/billing — manually record a billing event
admin.post('/stores/:id/billing', async (c) => {
  try {
    const { generateId } = await import('../lib/jwt')
    const id = c.req.param('id')
    const body = await c.req.json<{
      amount: number
      currency?: string
      status: string
      payment_method: string
      reference?: string
      description?: string
    }>()

    if (!body.amount || !body.status || !body.payment_method) {
      return c.json({ success: false, error: 'amount, status, and payment_method are required', data: null }, 400)
    }

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE id = ?').bind(id).first()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const recId = generateId()
    await c.env.qesuite_db.prepare(
      `INSERT INTO billing_history (id, tenant_id, amount, currency, status, payment_method, reference, paid_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      recId, id, body.amount,
      body.currency ?? 'KES',
      body.status,
      body.payment_method,
      body.reference ?? body.description ?? null,
      body.status === 'paid' ? new Date().toISOString() : null,
    ).run()

    const record = await c.env.qesuite_db.prepare('SELECT * FROM billing_history WHERE id = ?').bind(recId).first()
    return c.json({ success: true, data: record, error: null, message: 'Billing record added' }, 201)
  } catch (err) {
    console.error('admin add billing record error', err)
    return c.json({ success: false, error: 'Failed to add billing record', data: null }, 500)
  }
})

// POST /api/admin/billing/:id/verify — approve or reject a submitted M-Pesa reference
admin.post('/billing/:id/verify', async (c) => {
  try {
    const billingId = c.req.param('id')
    const body = await c.req.json<{ action?: 'approve' | 'reject' }>()
      .catch((): { action?: 'approve' | 'reject' } => ({}))

    if (body.action !== 'approve' && body.action !== 'reject') {
      return c.json({ success: false, error: 'Choose approve or reject.', data: null }, 400)
    }

    const record = await c.env.qesuite_db.prepare(
      `SELECT bh.id, bh.tenant_id, bh.amount, bh.currency, bh.status, bh.payment_method, bh.reference,
              t.plan, t.name AS store_name
       FROM billing_history bh
       JOIN tenants t ON t.id = bh.tenant_id
       WHERE bh.id = ?`
    ).bind(billingId).first<{
      id: string
      tenant_id: string
      amount: number
      currency: string
      status: string
      payment_method: string
      reference: string | null
      plan: string | null
      store_name: string
    }>()

    if (!record) return c.json({ success: false, error: 'Billing reference not found.', data: null }, 404)
    if (record.payment_method !== 'mpesa' || record.status !== 'pending') {
      return c.json({ success: false, error: 'This reference has already been reviewed.', data: null }, 409)
    }

    const actorId = c.get('user').sub
    const auditStatement = (action: string, detail: Record<string, unknown>) => c.env.qesuite_db.prepare(
      `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
       VALUES (?, ?, 'superadmin', ?, 'billing_history', ?, ?, ?)`
    ).bind(
      generateId(), actorId, action, billingId, JSON.stringify(detail),
      c.req.header('CF-Connecting-IP') ?? null,
    )

    if (body.action === 'reject') {
      await c.env.qesuite_db.batch([
        c.env.qesuite_db.prepare(
          "UPDATE billing_history SET status = 'failed', paid_at = NULL WHERE id = ? AND status = 'pending'"
        ).bind(billingId),
        auditStatement('REJECT_MPESA_REFERENCE', {
          tenant_id: record.tenant_id,
          reference: record.reference,
        }),
      ])

      return c.json({ success: true, data: { status: 'failed' }, error: null, message: 'Payment reference rejected.' })
    }

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id, current_period_end, status FROM subscriptions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(record.tenant_id).first<{ id: string; current_period_end: string | null; status: string }>()

    const now = new Date()
    const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null
    const periodStart = existing?.status === 'active' && existingEnd && existingEnd > now ? existingEnd : now
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const subscriptionStatement = existing
      ? c.env.qesuite_db.prepare(
          `UPDATE subscriptions
           SET status = 'active', plan = ?, amount = ?, currency = ?, current_period_start = ?,
               current_period_end = ?, payment_method = 'mpesa'
           WHERE id = ?`
        ).bind(
          record.plan ?? 'starter', record.amount, record.currency,
          periodStart.toISOString(), periodEnd.toISOString(), existing.id,
        )
      : c.env.qesuite_db.prepare(
          `INSERT INTO subscriptions
            (id, tenant_id, plan, amount, currency, status, current_period_start, current_period_end, payment_method)
           VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 'mpesa')`
        ).bind(
          generateId(), record.tenant_id, record.plan ?? 'starter', record.amount, record.currency,
          periodStart.toISOString(), periodEnd.toISOString(),
        )

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        "UPDATE tenants SET subscription_status = 'active' WHERE id = ?"
      ).bind(record.tenant_id),
      subscriptionStatement,
      c.env.qesuite_db.prepare(
        "UPDATE billing_history SET status = 'paid', paid_at = datetime('now') WHERE id = ? AND status = 'pending'"
      ).bind(billingId),
      auditStatement('APPROVE_MPESA_REFERENCE', {
        tenant_id: record.tenant_id,
        reference: record.reference,
        amount: record.amount,
        period_end: periodEnd.toISOString(),
      }),
    ])

    return c.json({
      success: true,
      data: { status: 'paid', current_period_end: periodEnd.toISOString() },
      error: null,
      message: 'Payment verified and subscription updated.',
    })
  } catch (err) {
    console.error('admin verify M-Pesa reference error', err)
    return c.json({ success: false, error: 'Failed to review the payment reference.', data: null }, 500)
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
    const since = businessDateDaysAgo(days - 1)

    const rows = await c.env.qesuite_db.prepare(
      `WITH sales AS (
         SELECT created_at, total FROM orders
         WHERE status != 'CANCELLED' AND date(created_at, '+3 hours') >= ?
         UNION ALL
         SELECT created_at, total FROM pos_sales
         WHERE status = 'completed' AND date(created_at, '+3 hours') >= ?
       )
       SELECT date(created_at, '+3 hours') AS date, COALESCE(SUM(total), 0) AS value
       FROM sales
       GROUP BY date(created_at, '+3 hours') ORDER BY date ASC`
    ).bind(since, since).all<{ date: string; value: number }>()

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
    const since = businessDateDaysAgo(days)

    const rows = await c.env.qesuite_db.prepare(
      `SELECT date(created_at, '+3 hours') as date, COUNT(*) as count
       FROM tenants WHERE date(created_at, '+3 hours') >= ?
       GROUP BY date(created_at, '+3 hours') ORDER BY date ASC`
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
      `SELECT
         (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'CANCELLED') +
         (SELECT COALESCE(SUM(total), 0) FROM pos_sales WHERE status = 'completed') AS gmv`
    ).first<{ gmv: number }>()

    // MRR: active subscriptions × amount
    const mrr = await c.env.qesuite_db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as mrr FROM subscriptions WHERE status = 'active'"
    ).first<{ mrr: number }>()

    // This month GMV + new stores this month
    const today = businessDate()
    const monthStart = `${today.slice(0, 7)}-01`

    const monthlyGmv = await c.env.qesuite_db.prepare(
      `SELECT
         (SELECT COALESCE(SUM(total), 0) FROM orders
          WHERE status != 'CANCELLED' AND date(created_at, '+3 hours') >= ?) +
         (SELECT COALESCE(SUM(total), 0) FROM pos_sales
          WHERE status = 'completed' AND date(created_at, '+3 hours') >= ?) AS gmv`
    ).bind(monthStart, monthStart).first<{ gmv: number }>()

    const newToday = await c.env.qesuite_db.prepare(
      "SELECT COUNT(*) as cnt FROM tenants WHERE date(created_at, '+3 hours') = ?"
    ).bind(today).first<{ cnt: number }>()

    const newThisMonth = await c.env.qesuite_db.prepare(
      "SELECT COUNT(*) as cnt FROM tenants WHERE date(created_at, '+3 hours') >= ?"
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

// POST /api/admin/stores/:id/reset-password — reset owner's password
admin.post('/stores/:id/reset-password', async (c) => {
  try {
    const tenantId = c.req.param('id')
    const body = await c.req.json<{ password?: string }>().catch(() => ({ password: undefined }))

    // Resolve or auto-generate password
    const plainPassword = (body as { password?: string }).password?.trim() ||
      Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'[b % 56])
        .join('')

    const owner = await c.env.qesuite_db.prepare(
      "SELECT id FROM users WHERE tenant_id = ? AND role = 'owner' AND is_active = 1 LIMIT 1"
    ).bind(tenantId).first<{ id: string }>()

    if (!owner) {
      return c.json({ error: 'Owner not found for this store', data: null }, 404)
    }

    const hashed = await hashPassword(plainPassword)
    await c.env.qesuite_db.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(hashed, owner.id).run()

    console.info(`Password reset for owner of store ${tenantId} by admin.`)

    return c.json({
      success: true,
      data: { new_password: plainPassword },
      error: null,
      message: 'Password reset successfully',
    })
  } catch (err) {
    console.error('admin reset-password error', err)
    return c.json({ error: 'Failed to reset password', data: null }, 500)
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
