import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { generateId, generateTrackingCode } from '../lib/jwt'
import { sendSMS, sendWhatsApp, normalizeKenyaPhone, getOrderConfirmedSMS, getNewOrderSMS } from '../lib/notifications'

const storefront = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/storefront — list all active stores for the marketplace directory
storefront.get('/', async (c) => {
  try {
    const category = c.req.query('category')
    const search = c.req.query('search')?.trim()

    // Only surface stores with a valid subscription (active or within trial window)
    let query = `SELECT id, name, slug, logo_url, banner_url, primary_color, accent_color,
                        address, store_category
                 FROM tenants
                 WHERE is_suspended = 0
                   AND (
                     subscription_status = 'active'
                     OR (subscription_status = 'trialing' AND trial_ends_at > datetime('now'))
                   )`
    const params: (string | number)[] = []

    if (category && category !== 'all') {
      query += ' AND store_category = ?'
      params.push(category)
    }
    if (search) {
      query += ' AND (name LIKE ? OR address LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    query += ' ORDER BY created_at DESC'

    const { results } = await c.env.qesuite_db.prepare(query).bind(...params).all<{
      id: string; name: string; slug: string; logo_url: string | null
      banner_url: string | null; primary_color: string; accent_color: string
      address: string | null; store_category: string
    }>()

    // Batch-fetch up to 4 featured products per store for the preview grid
    let productPreviews: Record<string, Array<{ name: string; image_url: string | null }>> = {}
    if (results.length > 0) {
      const ids = results.map(s => s.id)
      const placeholders = ids.map(() => '?').join(', ')
      const { results: pRows } = await c.env.qesuite_db.prepare(
        `SELECT tenant_id, name, image_url FROM products
         WHERE tenant_id IN (${placeholders}) AND is_active = 1
         ORDER BY RANDOM()`
      ).bind(...ids).all<{ tenant_id: string; name: string; image_url: string | null }>()

      for (const p of pRows) {
        if (!productPreviews[p.tenant_id]) productPreviews[p.tenant_id] = []
        if (productPreviews[p.tenant_id].length < 4) {
          productPreviews[p.tenant_id].push({ name: p.name, image_url: p.image_url })
        }
      }
    }

    const data = results.map(s => ({ ...s, product_previews: productPreviews[s.id] ?? [] }))
    return c.json({ success: true, data, error: null })
  } catch (err) {
    console.error('storefront list error', err)
    return c.json({ success: false, error: 'Failed to load stores', data: [] }, 500)
  }
})

// GET /api/storefront/:slug — public storefront config
storefront.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const tenant = await c.env.qesuite_db.prepare(
      `SELECT id, name, slug, logo_url, banner_url, primary_color, accent_color,
              font_family, phone, address, whatsapp_number, is_suspended,
              subscription_status, trial_ends_at
       FROM tenants WHERE slug = ?`
    ).bind(slug).first<{
      id: string; name: string; slug: string; logo_url: string | null
      banner_url: string | null; primary_color: string; accent_color: string
      font_family: string; phone: string | null; address: string | null
      whatsapp_number: string | null; is_suspended: number
      subscription_status: string; trial_ends_at: string | null
    }>()

    if (!tenant) {
      return c.json({ success: false, error: 'Store not found', data: null }, 404)
    }

    const settings = await c.env.qesuite_db.prepare(
      `SELECT delivery_enabled, pickup_enabled, delivery_fee, estimated_delivery_minutes,
              min_order_amount, currency, language
       FROM store_settings WHERE tenant_id = ?`
    ).bind(tenant.id).first<Record<string, unknown>>()

    return c.json({
      success: true,
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
          is_suspended: Boolean(tenant.is_suspended),
          subscription_status: tenant.subscription_status,
          trial_ends_at: tenant.trial_ends_at,
        },
        settings: settings ?? {
          delivery_enabled: true,
          pickup_enabled: true,
          delivery_fee: 0,
          estimated_delivery_minutes: 30,
          min_order_amount: 0,
          currency: 'KES',
          language: 'en',
        },
      },
      error: null,
    })
  } catch (err) {
    console.error('storefront get error', err)
    return c.json({ success: false, error: 'Failed to load store', data: null }, 500)
  }
})

// GET /api/storefront/:slug/categories
storefront.get('/:slug/categories', async (c) => {
  try {
    const slug = c.req.param('slug')
    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
      .bind(slug).first<{ id: string }>()
    if (!tenant) return c.json({ success: true, data: [], error: null })

    const { results } = await c.env.qesuite_db.prepare(
      `SELECT id, name, icon, sort_order FROM categories
       WHERE tenant_id = ? AND is_active = 1 ORDER BY sort_order ASC, name ASC`
    ).bind(tenant.id).all()

    return c.json({ success: true, data: results, error: null })
  } catch (err) {
    console.error('storefront categories error', err)
    return c.json({ success: false, error: 'Failed to load categories', data: [] }, 500)
  }
})

// GET /api/storefront/:slug/products?category_id=...&featured=...
storefront.get('/:slug/products', async (c) => {
  try {
    const slug = c.req.param('slug')
    const categoryId = c.req.query('category_id')
    const featured = c.req.query('featured')

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
      .bind(slug).first<{ id: string }>()
    if (!tenant) return c.json({ success: true, data: [], error: null })

    let query = `SELECT p.id, p.name, p.description, p.price, p.sale_price, p.stock,
                        p.image_url, p.featured, p.on_sale, p.is_active, p.category_id,
                        c.name as category_name
                 FROM products p
                 LEFT JOIN categories c ON c.id = p.category_id
                 WHERE p.tenant_id = ? AND p.is_active = 1`
    const params: (string | number)[] = [tenant.id]

    if (categoryId) {
      query += ' AND p.category_id = ?'
      params.push(categoryId)
    }
    if (featured === '1') {
      query += ' AND p.featured = 1'
    }
    query += ' ORDER BY p.featured DESC, p.created_at DESC'

    const { results } = await c.env.qesuite_db.prepare(query).bind(...params).all()

    return c.json({ success: true, data: results, error: null })
  } catch (err) {
    console.error('storefront products error', err)
    return c.json({ success: false, error: 'Failed to load products', data: [] }, 500)
  }
})

// POST /api/storefront/:slug/orders — customer places order (no auth)
storefront.post('/:slug/orders', async (c) => {
  try {
    const slug = c.req.param('slug')
    const body = await c.req.json<{
      customer_name?: string
      customer_phone: string
      delivery_address?: string
      delivery_lat?: number
      delivery_lng?: number
      payment_method: string
      notes?: string
      items: { product_id: string; quantity: number }[]
    }>()

    if (!body.customer_phone || !body.items?.length || !body.payment_method) {
      return c.json({ success: false, error: 'customer_phone, items, and payment_method are required', data: null }, 400)
    }

    const tenant = await c.env.qesuite_db.prepare(
      `SELECT t.id, t.name, t.slug, t.whatsapp_number,
              ss.delivery_fee, ss.min_order_amount, ss.delivery_enabled, ss.currency
       FROM tenants t
       LEFT JOIN store_settings ss ON ss.tenant_id = t.id
       WHERE t.slug = ? AND t.is_suspended = 0`
    ).bind(slug).first<{
      id: string; name: string; slug: string; whatsapp_number: string | null
      delivery_fee: number; min_order_amount: number; delivery_enabled: number; currency: string
    }>()

    if (!tenant) {
      return c.json({ success: false, error: 'Store not found or unavailable', data: null }, 404)
    }

    // Validate and price each item
    let subtotal = 0
    const itemDetails: { product_id: string; product_name: string; quantity: number; price: number }[] = []

    for (const item of body.items) {
      const product = await c.env.qesuite_db.prepare(
        'SELECT id, name, price, sale_price, on_sale, stock, is_active FROM products WHERE id = ? AND tenant_id = ?'
      ).bind(item.product_id, tenant.id).first<{
        id: string; name: string; price: number; sale_price: number | null
        on_sale: number; stock: number; is_active: number
      }>()

      if (!product || !product.is_active) {
        return c.json({ success: false, error: `Product not available: ${item.product_id}`, data: null }, 400)
      }
      if (product.stock < item.quantity) {
        return c.json({ success: false, error: `Insufficient stock for: ${product.name}`, data: null }, 400)
      }

      const unitPrice = (product.on_sale && product.sale_price) ? product.sale_price : product.price
      subtotal += unitPrice * item.quantity
      itemDetails.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        price: unitPrice,
      })
    }

    if (tenant.min_order_amount && subtotal < tenant.min_order_amount) {
      return c.json({
        success: false,
        error: `Minimum order amount is ${tenant.currency} ${tenant.min_order_amount}`,
        data: null,
      }, 400)
    }

    const isDelivery = body.delivery_address && tenant.delivery_enabled
    const deliveryFee = isDelivery ? (tenant.delivery_fee ?? 0) : 0
    const total = subtotal + deliveryFee
    const orderId = generateId()
    const trackingCode = generateTrackingCode()

    // Insert order
    await c.env.qesuite_db.prepare(
      `INSERT INTO orders (id, tenant_id, customer_name, customer_phone, delivery_address,
       delivery_lat, delivery_lng, status, payment_method, payment_status, subtotal,
       delivery_fee, total, tracking_code, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?, 'pending', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      orderId, tenant.id, body.customer_name ?? null, body.customer_phone,
      body.delivery_address ?? null, body.delivery_lat ?? null, body.delivery_lng ?? null,
      body.payment_method, subtotal, deliveryFee, total, trackingCode, body.notes ?? null
    ).run()

    // Insert order items and update stock
    for (const item of itemDetails) {
      await c.env.qesuite_db.prepare(
        `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), orderId, item.product_id, item.product_name, item.quantity, item.price).run()

      await c.env.qesuite_db.prepare(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND tenant_id = ?'
      ).bind(item.quantity, item.product_id, tenant.id).run()
    }

    // Queue notifications asynchronously
    if (c.env.NOTIFICATION_QUEUE) {
      await c.env.NOTIFICATION_QUEUE.send({
        type: 'ORDER_CONFIRMED',
        tenant_id: tenant.id,
        order_id: orderId,
        customer_phone: body.customer_phone,
        tracking_code: trackingCode,
        total,
        payment_method: body.payment_method,
        store_name: tenant.name,
        store_slug: tenant.slug,
        whatsapp_number: tenant.whatsapp_number,
      })
    }

    return c.json({
      success: true,
      data: {
        id: orderId,
        tracking_code: trackingCode,
        total,
        subtotal,
        delivery_fee: deliveryFee,
        status: 'NEW',
        payment_method: body.payment_method,
        payment_status: 'pending',
      },
      error: null,
      message: `Order placed! Track: ${c.env.APP_BASE_URL}/${slug}/track/${trackingCode}`,
    }, 201)
  } catch (err) {
    console.error('storefront order error', err)
    return c.json({ success: false, error: 'Failed to place order', data: null }, 500)
  }
})

// GET /api/storefront/:slug/track/:code — public order tracking
storefront.get('/:slug/track/:code', async (c) => {
  try {
    const slug = c.req.param('slug')
    const code = c.req.param('code').toUpperCase()

    const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
      .bind(slug).first<{ id: string }>()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const order = await c.env.qesuite_db.prepare(
      `SELECT id, tracking_code, status, payment_status, customer_name, customer_phone,
              delivery_address, total, delivery_fee, subtotal, created_at, updated_at
       FROM orders WHERE tracking_code = ? AND tenant_id = ?`
    ).bind(code, tenant.id).first()

    if (!order) return c.json({ success: false, error: 'Order not found', data: null }, 404)

    const { results: items } = await c.env.qesuite_db.prepare(
      'SELECT id, product_name, quantity, price FROM order_items WHERE order_id = ?'
    ).bind((order as { id: string }).id).all()

    const assignment = await c.env.qesuite_db.prepare(
      `SELECT da.status, da.assigned_at, da.picked_up_at, da.delivered_at,
              ds.name as rider_name, ds.phone as rider_phone,
              ds.current_lat, ds.current_lng
       FROM delivery_assignments da
       JOIN delivery_staff ds ON ds.id = da.staff_id
       WHERE da.order_id = ? AND da.status NOT IN ('FAILED')
       ORDER BY da.assigned_at DESC LIMIT 1`
    ).bind((order as { id: string }).id).first()

    return c.json({
      success: true,
      data: { order, items, assignment: assignment ?? null },
      error: null,
    })
  } catch (err) {
    console.error('storefront track error', err)
    return c.json({ success: false, error: 'Failed to fetch tracking info', data: null }, 500)
  }
})

// POST /api/storefront/:slug/mpesa/initiate — trigger STK push
storefront.post('/:slug/mpesa/initiate', async (c) => {
  try {
    const body = await c.req.json<{ phone: string; order_id: string }>()
    if (!body.phone || !body.order_id) {
      return c.json({ success: false, error: 'phone and order_id are required', data: null }, 400)
    }

    const slug = c.req.param('slug')
    const tenant = await c.env.qesuite_db.prepare('SELECT id, name FROM tenants WHERE slug = ?')
      .bind(slug).first<{ id: string; name: string }>()
    if (!tenant) return c.json({ success: false, error: 'Store not found', data: null }, 404)

    const order = await c.env.qesuite_db.prepare(
      'SELECT id, total FROM orders WHERE id = ? AND tenant_id = ?'
    ).bind(body.order_id, tenant.id).first<{ id: string; total: number }>()
    if (!order) return c.json({ success: false, error: 'Order not found', data: null }, 404)

    // M-Pesa STK Push
    const phone = normalizeKenyaPhone(body.phone)
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    const password = btoa(`${c.env.MPESA_SHORTCODE}${c.env.MPESA_PASSKEY}${timestamp}`)

    // Get OAuth token
    const tokenRes = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${btoa(`${c.env.MPESA_CONSUMER_KEY}:${c.env.MPESA_CONSUMER_SECRET}`)}`,
        },
      }
    )
    const tokenData = await tokenRes.json() as { access_token: string }

    const stkRes = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: c.env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: order.total,
          PartyA: phone,
          PartyB: c.env.MPESA_SHORTCODE,
          PhoneNumber: phone,
          CallBackURL: c.env.MPESA_CALLBACK_URL,
          AccountReference: `ORD-${body.order_id.slice(0, 8).toUpperCase()}`,
          TransactionDesc: `Payment for order at ${tenant.name}`,
        }),
      }
    )

    const stkData = await stkRes.json() as {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResponseCode: string
      CustomerMessage: string
    }

    if (stkData.ResponseCode !== '0') {
      return c.json({ success: false, error: 'STK Push failed', data: null }, 502)
    }

    return c.json({
      success: true,
      data: {
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
        message: stkData.CustomerMessage,
      },
      error: null,
    })
  } catch (err) {
    console.error('mpesa initiate error', err)
    return c.json({ success: false, error: 'Failed to initiate M-Pesa payment', data: null }, 500)
  }
})

// GET /api/storefront/mpesa/status/:orderId
storefront.get('/mpesa/status/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId')
    const order = await c.env.qesuite_db.prepare(
      'SELECT payment_status FROM orders WHERE id = ?'
    ).bind(orderId).first<{ payment_status: string }>()

    if (!order) return c.json({ success: false, error: 'Order not found', data: null }, 404)

    return c.json({
      success: true,
      data: { status: order.payment_status },
      error: null,
    })
  } catch (err) {
    console.error('mpesa status error', err)
    return c.json({ success: false, error: 'Failed to check payment status', data: null }, 500)
  }
})

export default storefront
