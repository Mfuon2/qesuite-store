import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'

const settings = new Hono<{ Bindings: Env; Variables: Variables }>()

settings.use('*', authMiddleware)

// GET /api/settings/tenant
settings.get('/tenant', tenantGuard, async (c) => {
  const tenantId = c.get('user').tenant_id!
  const tenant = await c.env.qesuite_db.prepare('SELECT * FROM tenants WHERE id = ?')
    .bind(tenantId).first()
  return c.json({ success: true, data: tenant, error: null })
})

// PUT /api/settings/tenant
settings.put('/tenant', tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const body = await c.req.json<Record<string, string | null>>()
    const allowed = ['name', 'logo_url', 'banner_url', 'primary_color', 'accent_color', 'font_family', 'phone', 'address', 'whatsapp_number']
    const fields: string[] = []
    const values: (string | null)[] = []
    for (const key of allowed) {
      if (key in body) { fields.push(`${key} = ?`); values.push(body[key]) }
    }
    if (!fields.length) return c.json({ success: false, error: 'No fields to update', data: null }, 400)
    values.push(tenantId)
    await c.env.qesuite_db.prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
    const tenant = await c.env.qesuite_db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first()
    return c.json({ success: true, data: tenant, error: null, message: 'Store updated' })
  } catch (err) {
    console.error('settings/tenant put error', err)
    return c.json({ success: false, error: 'Failed to update tenant', data: null }, 500)
  }
})

// GET /api/settings/store
settings.get('/store', tenantGuard, async (c) => {
  const tenantId = c.get('user').tenant_id!
  const s = await c.env.qesuite_db.prepare('SELECT * FROM store_settings WHERE tenant_id = ?').bind(tenantId).first()
  return c.json({ success: true, data: s, error: null })
})

// PUT /api/settings/store
settings.put('/store', tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const body = await c.req.json<Record<string, unknown>>()
    const allowed = ['delivery_enabled', 'pickup_enabled', 'delivery_fee', 'delivery_radius_km',
      'estimated_delivery_minutes', 'min_order_amount', 'currency', 'language', 'dark_mode_enabled', 'order_view']
    const fields: string[] = []
    const values: unknown[] = []
    for (const key of allowed) {
      if (key in body) { fields.push(`${key} = ?`); values.push(body[key]) }
    }
    if (!fields.length) return c.json({ success: false, error: 'No fields to update', data: null }, 400)
    fields.push("updated_at = datetime('now')")
    values.push(tenantId)
    await c.env.qesuite_db.prepare(`UPDATE store_settings SET ${fields.join(', ')} WHERE tenant_id = ?`).bind(...values).run()
    const s = await c.env.qesuite_db.prepare('SELECT * FROM store_settings WHERE tenant_id = ?').bind(tenantId).first()
    return c.json({ success: true, data: s, error: null, message: 'Settings updated' })
  } catch (err) {
    console.error('settings/store put error', err)
    return c.json({ success: false, error: 'Failed to update settings', data: null }, 500)
  }
})

// GET /api/settings/slug-check?slug=...
settings.get('/slug-check', async (c) => {
  const slug = c.req.query('slug')?.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (!slug) return c.json({ success: false, error: 'slug is required', data: null }, 400)
  const existing = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?').bind(slug).first()
  return c.json({ success: true, data: { available: !existing, slug }, error: null })
})

// POST /api/settings/onboarding — mark onboarding complete
settings.post('/onboarding', tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const body = await c.req.json<{ tenant?: Record<string, unknown>; settings?: Record<string, unknown> }>()

    if (body.tenant) {
      const allowed = ['name', 'logo_url', 'banner_url', 'primary_color', 'accent_color', 'font_family', 'phone', 'address', 'whatsapp_number']
      const fields: string[] = []
      const values: unknown[] = []
      for (const key of allowed) {
        if (key in body.tenant) { fields.push(`${key} = ?`); values.push(body.tenant[key]) }
      }
      if (fields.length) {
        values.push(tenantId)
        await c.env.qesuite_db.prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
      }
    }

    if (body.settings) {
      const allowed = ['delivery_enabled', 'pickup_enabled', 'delivery_fee', 'delivery_radius_km',
        'estimated_delivery_minutes', 'min_order_amount', 'currency', 'language']
      const fields: string[] = []
      const values: unknown[] = []
      for (const key of allowed) {
        if (key in body.settings) { fields.push(`${key} = ?`); values.push(body.settings[key]) }
      }
      if (fields.length) {
        fields.push("updated_at = datetime('now')")
        values.push(tenantId)
        await c.env.qesuite_db.prepare(`UPDATE store_settings SET ${fields.join(', ')} WHERE tenant_id = ?`).bind(...values).run()
      }
    }

    const tenant = await c.env.qesuite_db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first<{ slug: string; name: string }>()
    return c.json({
      success: true,
      data: { tenant, onboarding_complete: true },
      error: null,
      message: tenant ? `Your store is live!` : 'Onboarding complete',
    })
  } catch (err) {
    console.error('settings/onboarding error', err)
    return c.json({ success: false, error: 'Failed to save onboarding', data: null }, 500)
  }
})

export default settings
