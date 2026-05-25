import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'

const store = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/store/check-slug/:slug — must be before /:slug
store.get('/check-slug/:slug', async (c) => {
  const slug = c.req.param('slug').toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const existing = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
    .bind(slug)
    .first()
  return c.json({ data: { available: !existing, slug }, error: null })
})

// GET /api/store/:slug — public storefront data
store.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')

    const tenant = await c.env.qesuite_db.prepare(
      `SELECT id, name, slug, logo_url, banner_url, primary_color, accent_color,
              font_family, phone, address, whatsapp_number, plan,
              subscription_status, is_suspended
       FROM tenants WHERE slug = ?`
    ).bind(slug).first<{
      id: string; name: string; slug: string; logo_url: string | null
      banner_url: string | null; primary_color: string; accent_color: string
      font_family: string; phone: string | null; address: string | null
      whatsapp_number: string | null; plan: string; subscription_status: string
      is_suspended: number
    }>()

    if (!tenant) {
      return c.json({ error: 'Store not found', data: null }, 404)
    }

    if (tenant.is_suspended) {
      return c.json({ error: 'This store is temporarily unavailable', data: null }, 403)
    }

    const settings = await c.env.qesuite_db.prepare(
      `SELECT delivery_enabled, pickup_enabled, delivery_fee, delivery_radius_km,
              estimated_delivery_minutes, min_order_amount, currency, language, dark_mode_enabled
       FROM store_settings WHERE tenant_id = ?`
    ).bind(tenant.id).first()

    const categoryCount = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM categories WHERE tenant_id = ? AND is_active = 1'
    ).bind(tenant.id).first<{ cnt: number }>()

    const productCount = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM products WHERE tenant_id = ? AND is_active = 1'
    ).bind(tenant.id).first<{ cnt: number }>()

    return c.json({
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logo_url: tenant.logo_url,
          banner_url: tenant.banner_url,
          primary_color: tenant.primary_color,
          accent_color: tenant.accent_color,
          font_family: tenant.font_family,
          phone: tenant.phone,
          address: tenant.address,
          whatsapp_number: tenant.whatsapp_number,
          plan: tenant.plan,
          subscription_status: tenant.subscription_status,
        },
        settings: settings ?? {},
        stats: {
          categories: categoryCount?.cnt ?? 0,
          products: productCount?.cnt ?? 0,
        },
      },
      error: null,
    })
  } catch (err) {
    console.error('store get error', err)
    return c.json({ error: 'Failed to load store', data: null }, 500)
  }
})

// PUT /api/store — update store settings
store.put('/', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can update store settings', data: null }, 403)
    }

    const body = await c.req.json<{
      name?: string
      logo_url?: string
      banner_url?: string
      primary_color?: string
      accent_color?: string
      font_family?: string
      phone?: string
      address?: string
      whatsapp_number?: string
      delivery_enabled?: number
      pickup_enabled?: number
      delivery_fee?: number
      delivery_radius_km?: number
      estimated_delivery_minutes?: number
      min_order_amount?: number
      currency?: string
      language?: string
      dark_mode_enabled?: number
      order_view?: string
    }>()

    const tenantId = user.tenant_id!

    // Update tenant branding fields
    const tenantFields: string[] = []
    const tenantValues: (string | number)[] = []

    const tenantMappings = {
      name: body.name,
      logo_url: body.logo_url,
      banner_url: body.banner_url,
      primary_color: body.primary_color,
      accent_color: body.accent_color,
      font_family: body.font_family,
      phone: body.phone,
      address: body.address,
      whatsapp_number: body.whatsapp_number,
    } as Record<string, string | undefined>

    for (const [key, val] of Object.entries(tenantMappings)) {
      if (val !== undefined) {
        tenantFields.push(`${key} = ?`)
        tenantValues.push(val)
      }
    }

    if (tenantFields.length > 0) {
      tenantValues.push(tenantId)
      await c.env.qesuite_db.prepare(
        `UPDATE tenants SET ${tenantFields.join(', ')} WHERE id = ?`
      ).bind(...tenantValues).run()
    }

    // Update store settings
    const settingsFields: string[] = []
    const settingsValues: (string | number)[] = []

    const settingsMappings = {
      delivery_enabled: body.delivery_enabled,
      pickup_enabled: body.pickup_enabled,
      delivery_fee: body.delivery_fee,
      delivery_radius_km: body.delivery_radius_km,
      estimated_delivery_minutes: body.estimated_delivery_minutes,
      min_order_amount: body.min_order_amount,
      currency: body.currency,
      language: body.language,
      dark_mode_enabled: body.dark_mode_enabled,
      order_view: body.order_view,
    } as Record<string, string | number | undefined>

    for (const [key, val] of Object.entries(settingsMappings)) {
      if (val !== undefined) {
        settingsFields.push(`${key} = ?`)
        settingsValues.push(val)
      }
    }

    if (settingsFields.length > 0) {
      settingsFields.push("updated_at = datetime('now')")
      settingsValues.push(tenantId)
      await c.env.qesuite_db.prepare(
        `UPDATE store_settings SET ${settingsFields.join(', ')} WHERE tenant_id = ?`
      ).bind(...settingsValues).run()
    }

    // Return updated data
    const tenant = await c.env.qesuite_db.prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(tenantId)
      .first()
    const settings = await c.env.qesuite_db.prepare(
      'SELECT * FROM store_settings WHERE tenant_id = ?'
    ).bind(tenantId).first()

    return c.json({ data: { tenant, settings }, error: null, message: 'Store updated' })
  } catch (err) {
    console.error('store update error', err)
    return c.json({ error: 'Failed to update store', data: null }, 500)
  }
})

export default store
