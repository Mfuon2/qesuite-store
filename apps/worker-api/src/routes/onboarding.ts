import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'

const onboarding = new Hono<{ Bindings: Env; Variables: Variables }>()

onboarding.use('*', authMiddleware)

// GET /api/onboarding/status — wizard progress
onboarding.get('/status', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id

    if (!tenantId) {
      return c.json({ data: { step: 0, complete: false }, error: null })
    }

    const tenant = await c.env.qesuite_db.prepare(
      'SELECT id, name, slug, logo_url, primary_color, phone FROM tenants WHERE id = ?'
    ).bind(tenantId).first<{
      id: string; name: string; slug: string; logo_url: string | null
      primary_color: string; phone: string | null
    }>()

    const settings = await c.env.qesuite_db.prepare(
      'SELECT delivery_enabled, pickup_enabled, delivery_fee FROM store_settings WHERE tenant_id = ?'
    ).bind(tenantId).first()

    const productCount = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM products WHERE tenant_id = ?'
    ).bind(tenantId).first<{ cnt: number }>()

    const step1Complete = !!(tenant?.name && tenant?.slug && tenant?.primary_color)
    const step2Complete = (productCount?.cnt ?? 0) > 0
    const step3Complete = !!settings

    const completedSteps = [step1Complete, step2Complete, step3Complete].filter(Boolean).length

    return c.json({
      data: {
        tenant,
        settings,
        product_count: productCount?.cnt ?? 0,
        steps: {
          step1: step1Complete,
          step2: step2Complete,
          step3: step3Complete,
        },
        completed_steps: completedSteps,
        complete: completedSteps === 3,
      },
      error: null,
    })
  } catch (err) {
    console.error('onboarding status error', err)
    return c.json({ error: 'Failed to load onboarding status', data: null }, 500)
  }
})

// POST /api/onboarding/step1 — save branding
onboarding.post('/step1', tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can complete onboarding', data: null }, 403)
    }
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      name: string
      slug?: string
      logo_url?: string
      banner_url?: string
      primary_color?: string
      accent_color?: string
      font_family?: string
      phone?: string
      address?: string
    }>()

    if (!body.name) {
      return c.json({ error: 'name is required', data: null }, 400)
    }

    // Slug handling
    let slug = body.slug
    if (slug) {
      slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
      // Check uniqueness (excluding own tenant)
      const existing = await c.env.qesuite_db.prepare(
        'SELECT id FROM tenants WHERE slug = ? AND id != ?'
      ).bind(slug, tenantId).first()
      if (existing) {
        return c.json({ error: 'Slug already taken', data: null }, 409)
      }
    }

    const fields: string[] = []
    const values: (string | number | null)[] = []

    const mappings: Record<string, string | null | undefined> = {
      name: body.name,
      slug,
      logo_url: body.logo_url,
      banner_url: body.banner_url,
      primary_color: body.primary_color,
      accent_color: body.accent_color,
      font_family: body.font_family,
      phone: body.phone,
      address: body.address,
    }

    for (const [k, v] of Object.entries(mappings)) {
      if (v !== undefined) {
        fields.push(`${k} = ?`)
        values.push(v ?? null)
      }
    }

    if (fields.length > 0) {
      values.push(tenantId)
      await c.env.qesuite_db.prepare(
        `UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`
      ).bind(...values).run()
    }

    const tenant = await c.env.qesuite_db.prepare('SELECT * FROM tenants WHERE id = ?')
      .bind(tenantId).first()

    return c.json({ data: tenant, error: null, message: 'Store identity saved' })
  } catch (err) {
    console.error('onboarding step1 error', err)
    return c.json({ error: 'Failed to save store identity', data: null }, 500)
  }
})

// POST /api/onboarding/step2/product — add product during wizard
onboarding.post('/step2/product', tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can add products', data: null }, 403)
    }
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      name: string
      description?: string
      price: number
      sale_price?: number
      stock?: number
      category_name?: string
      image_url?: string
      featured?: number
      on_sale?: number
    }>()

    if (!body.name || body.price === undefined || body.price < 0) {
      return c.json({ error: 'name and price are required', data: null }, 400)
    }

    // Resolve or create category
    let categoryId: string | null = null
    if (body.category_name) {
      const existingCat = await c.env.qesuite_db.prepare(
        'SELECT id FROM categories WHERE tenant_id = ? AND name = ?'
      ).bind(tenantId, body.category_name).first<{ id: string }>()

      if (existingCat) {
        categoryId = existingCat.id
      } else {
        categoryId = generateId()
        await c.env.qesuite_db.prepare(
          "INSERT INTO categories (id, tenant_id, name, icon, sort_order, is_active) VALUES (?, ?, ?, '📦', 0, 1)"
        ).bind(categoryId, tenantId, body.category_name).run()
      }
    }

    const id = generateId()
    await c.env.qesuite_db.prepare(
      `INSERT INTO products (id, tenant_id, category_id, name, description, price, sale_price,
        stock, image_url, featured, on_sale, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
    ).bind(
      id, tenantId, categoryId, body.name, body.description ?? null,
      body.price, body.sale_price ?? null, body.stock ?? 0, body.image_url ?? null,
      body.featured ?? 0, body.on_sale ?? 0
    ).run()

    const product = await c.env.qesuite_db.prepare('SELECT * FROM products WHERE id = ?')
      .bind(id).first()

    return c.json({ data: product, error: null, message: 'Product added' }, 201)
  } catch (err) {
    console.error('onboarding step2 error', err)
    return c.json({ error: 'Failed to add product', data: null }, 500)
  }
})

// POST /api/onboarding/step3 — save delivery config
onboarding.post('/step3', tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can configure delivery', data: null }, 403)
    }
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      delivery_enabled?: number
      pickup_enabled?: number
      delivery_fee?: number
      delivery_radius_km?: number
      estimated_delivery_minutes?: number
      min_order_amount?: number
      whatsapp_number?: string
      rider_phones?: string[]  // invite riders
    }>()

    // Update store settings
    const fields: string[] = []
    const values: (string | number)[] = []

    const settingsMappings: Record<string, number | undefined> = {
      delivery_enabled: body.delivery_enabled,
      pickup_enabled: body.pickup_enabled,
      delivery_fee: body.delivery_fee,
      delivery_radius_km: body.delivery_radius_km,
      estimated_delivery_minutes: body.estimated_delivery_minutes,
      min_order_amount: body.min_order_amount,
    }

    for (const [k, v] of Object.entries(settingsMappings)) {
      if (v !== undefined) {
        fields.push(`${k} = ?`)
        values.push(v)
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')")
      values.push(tenantId)
      await c.env.qesuite_db.prepare(
        `UPDATE store_settings SET ${fields.join(', ')} WHERE tenant_id = ?`
      ).bind(...values).run()
    }

    // Update WhatsApp number on tenant
    if (body.whatsapp_number) {
      await c.env.qesuite_db.prepare(
        'UPDATE tenants SET whatsapp_number = ? WHERE id = ?'
      ).bind(body.whatsapp_number, tenantId).run()
    }

    // Invite riders
    const invitedRiders: string[] = []
    if (body.rider_phones && body.rider_phones.length > 0) {
      const { sendSMS } = await import('../lib/notifications')
      const { generateTrackingCode } = await import('../lib/jwt')

      for (const phone of body.rider_phones) {
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
          await sendSMS(c.env, phone, `You have been invited as a delivery rider on QeSuite. Access your dashboard here: ${link}`)
          invitedRiders.push(phone)
        }
      }
    }

    const settings = await c.env.qesuite_db.prepare(
      'SELECT * FROM store_settings WHERE tenant_id = ?'
    ).bind(tenantId).first()

    return c.json({
      data: { settings, invited_riders: invitedRiders },
      error: null,
      message: 'Delivery configured. Setup complete!',
    })
  } catch (err) {
    console.error('onboarding step3 error', err)
    return c.json({ error: 'Failed to save delivery config', data: null }, 500)
  }
})

export default onboarding
