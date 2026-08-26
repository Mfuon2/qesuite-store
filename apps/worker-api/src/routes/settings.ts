import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { sendSMS } from '../lib/notifications'
import { validatePhone, normalizeKenyaPhone } from '@qesuite/shared'

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
    const workerOrigin = new URL(c.req.url).origin
    const allowed = ['name', 'logo_url', 'banner_url', 'primary_color', 'accent_color', 'font_family', 'phone', 'address', 'lat', 'lng', 'whatsapp_number', 'store_category']
    const fields: string[] = []
    const values: (string | number | null)[] = []
    for (const key of allowed) {
      if (!(key in body)) continue
      let val: string | number | null = body[key]
      // Validate image URLs to prevent stored SSRF
      if ((key === 'logo_url' || key === 'banner_url') && val) {
        const allowed_origins = [workerOrigin, 'https://images.qesuite.com']
        try {
          if (!allowed_origins.some(o => (val as string).startsWith(o))) val = null
        } catch { val = null }
      }
      // Validate colour strings (hex only)
      if ((key === 'primary_color' || key === 'accent_color') && val) {
        if (!/^#[0-9a-fA-F]{3,8}$/.test(val as string)) val = null
      }
      // Validate coordinate types
      if ((key === 'lat' || key === 'lng') && val !== null) {
        const n = parseFloat(String(val))
        if (isNaN(n)) { val = null } else {
          val = n
          if (key === 'lat'  && (n < -90  || n > 90))  val = null
          if (key === 'lng'  && (n < -180 || n > 180)) val = null
        }
      }
      // Normalize contact numbers to the canonical wire format (254XXXXXXXXX)
      // so storage, SMS, and WhatsApp all agree on the same string.
      if ((key === 'phone' || key === 'whatsapp_number') && val) {
        if (!validatePhone(val as string)) {
          return c.json({ success: false, error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
        }
        val = normalizeKenyaPhone(val as string)
      }
      fields.push(`${key} = ?`); values.push(val)
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
      'estimated_delivery_minutes', 'min_order_amount', 'currency', 'language', 'dark_mode_enabled', 'order_view',
      'mpesa_payment_type', 'mpesa_payment_number', 'mpesa_account_ref']
    const fields: string[] = []
    const values: unknown[] = []
    for (const key of allowed) {
      if (key in body) { fields.push(`${key} = ?`); values.push(body[key]) }
    }
    // Constrain M-Pesa payment type to known values
    if ('mpesa_payment_type' in body && body.mpesa_payment_type !== null &&
        !['till', 'paybill', 'send_money'].includes(String(body.mpesa_payment_type))) {
      return c.json({ success: false, error: 'Invalid mpesa_payment_type', data: null }, 400)
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
  // Exclude own tenant so the user can keep their current slug
  const tenantId = c.get('user')?.tenant_id
  let existing
  if (tenantId) {
    existing = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ? AND id != ?').bind(slug, tenantId).first()
  } else {
    existing = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?').bind(slug).first()
  }
  return c.json({ success: true, data: { available: !existing, slug }, error: null })
})

// POST /api/settings/onboarding — save all onboarding data and mark complete
settings.post('/onboarding', tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const body = await c.req.json<{
      tenant?: Record<string, unknown>
      settings?: Record<string, unknown>
      products?: Array<{ name: string; price: number; description?: string; stock?: number }>
      rider_phones?: string[]
    }>()

    if (body.tenant) {
      // Validate slug uniqueness before updating (exclude own tenant)
      if (body.tenant.slug) {
        const slug = String(body.tenant.slug).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
        const taken = await c.env.qesuite_db.prepare(
          'SELECT id FROM tenants WHERE slug = ? AND id != ?'
        ).bind(slug, tenantId).first()
        if (taken) return c.json({ success: false, error: 'This URL slug is already taken', data: null }, 409)
        body.tenant.slug = slug
      }

      const allowed = ['name', 'slug', 'logo_url', 'banner_url', 'primary_color', 'accent_color',
        'font_family', 'phone', 'address', 'lat', 'lng', 'whatsapp_number', 'store_category']
      const fields: string[] = []
      const values: unknown[] = []
      for (const key of allowed) {
        if (!(key in body.tenant)) continue
        let val = body.tenant[key]
        if ((key === 'phone' || key === 'whatsapp_number') && val) {
          if (!validatePhone(val as string)) {
            return c.json({ success: false, error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
          }
          val = normalizeKenyaPhone(val as string)
        }
        fields.push(`${key} = ?`); values.push(val)
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
        if (key in body.settings) {
          let val = body.settings[key]
          if (typeof val === 'boolean') val = val ? 1 : 0
          fields.push(`${key} = ?`)
          values.push(val)
        }
      }
      if (fields.length) {
        fields.push("updated_at = datetime('now')")
        values.push(tenantId)
        await c.env.qesuite_db.prepare(`UPDATE store_settings SET ${fields.join(', ')} WHERE tenant_id = ?`).bind(...values).run()
      }
    }

    // Replace product catalog: delete demo products then insert the user's catalog
    if (body.products && Array.isArray(body.products)) {
      // Remove any order_items referencing this tenant's products first (FK constraint)
      await c.env.qesuite_db.prepare(
        'DELETE FROM order_items WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ?)'
      ).bind(tenantId).run()
      await c.env.qesuite_db.prepare('DELETE FROM products WHERE tenant_id = ?').bind(tenantId).run()

      if (body.products.length > 0) {
        const { generateId } = await import('../lib/jwt')
        const cat = await c.env.qesuite_db.prepare(
          'SELECT id FROM categories WHERE tenant_id = ? ORDER BY sort_order ASC LIMIT 1'
        ).bind(tenantId).first<{ id: string }>()
        const categoryId = cat?.id ?? null

        for (const p of body.products as Array<{ name: string; price: number; description?: string; stock?: number; image_url?: string; sale_price?: number }>) {
          if (!p.name || p.price === undefined || p.price < 0) continue
          const hasSale = typeof p.sale_price === 'number' && p.sale_price > 0 && p.sale_price < p.price
          await c.env.qesuite_db.prepare(
            `INSERT INTO products (id, tenant_id, category_id, name, description, price, sale_price, stock,
              image_url, featured, on_sale, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1, datetime('now'), datetime('now'))`
          ).bind(generateId(), tenantId, categoryId, p.name, p.description ?? null, p.price, hasSale ? p.sale_price : null, p.stock ?? 0, p.image_url ?? null, hasSale ? 1 : 0).run()
        }
      }
    }

    // Invite riders via magic link SMS
    if (body.rider_phones && Array.isArray(body.rider_phones) && body.rider_phones.length > 0) {
      const { generateId, generateTrackingCode } = await import('../lib/jwt')

      for (const rawPhone of body.rider_phones) {
        if (!validatePhone(rawPhone)) continue
        const phone = normalizeKenyaPhone(rawPhone)

        const existing = await c.env.qesuite_db.prepare(
          'SELECT id FROM delivery_staff WHERE phone = ? AND tenant_id = ?'
        ).bind(phone, tenantId).first()

        if (!existing) {
          const staffId = generateId()
          const magicToken = generateTrackingCode() + generateTrackingCode()
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

          await c.env.qesuite_db.prepare(
            `INSERT INTO delivery_staff (id, tenant_id, name, phone, is_active, magic_link_token, magic_link_expires_at, created_at)
             VALUES (?, ?, '', ?, 1, ?, ?, datetime('now'))`
          ).bind(staffId, tenantId, phone, magicToken, expiresAt).run()

          const link = `${c.env.APP_BASE_URL.replace('store.', 'go.')}/verify?token=${magicToken}`
          await sendSMS(c.env, phone, `You have been invited as a delivery rider on QeSuite. Access your dashboard here: ${link}`).catch(() => {})
        }
      }
    }

    const tenant = await c.env.qesuite_db.prepare('SELECT * FROM tenants WHERE id = ?').bind(tenantId).first<{ slug: string; name: string }>()
    return c.json({
      success: true,
      data: { tenant, onboarding_complete: true },
      error: null,
      message: 'Your store is live!',
    })
  } catch (err) {
    console.error('settings/onboarding error', err)
    return c.json({ success: false, error: 'Failed to save onboarding', data: null }, 500)
  }
})

export default settings
