import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId, generateTrackingCode } from '../lib/jwt'

const orders = new Hono<{ Bindings: Env; Variables: Variables }>()

type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

// Valid state transitions
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

// GET /api/orders/track/:code — public, before /:id routes
orders.get('/track/:code', async (c) => {
  try {
    const code = c.req.param('code').toUpperCase()

    const order = await c.env.qesuite_db.prepare(
      `SELECT o.id, o.tracking_code, o.status, o.payment_method, o.payment_status,
              o.subtotal, o.delivery_fee, o.total,
              o.customer_name, o.customer_phone, o.delivery_address,
              o.delivery_lat, o.delivery_lng, o.notes, o.created_at, o.updated_at,
              t.name as store_name, t.slug, t.phone as store_phone,
              t.whatsapp_number, t.primary_color,
              ss.estimated_delivery_minutes
       FROM orders o
       JOIN tenants t ON t.id = o.tenant_id
       LEFT JOIN store_settings ss ON ss.tenant_id = o.tenant_id
       WHERE o.tracking_code = ?`
    ).bind(code).first<{
      id: string; tracking_code: string; status: OrderStatus
      customer_name: string | null; delivery_address: string | null
      store_name: string; slug: string; whatsapp_number: string | null
      primary_color: string; estimated_delivery_minutes: number | null
    }>()

    if (!order) {
      return c.json({ error: 'Order not found', data: null }, 404)
    }

    const items = await c.env.qesuite_db.prepare(
      'SELECT product_name, quantity, price FROM order_items WHERE order_id = ?'
    ).bind(order.id).all()

    // If out for delivery, include rider location
    let riderLocation: { lat: number; lng: number; name: string; phone: string } | null = null
    if (order.status === 'OUT_FOR_DELIVERY') {
      const assignment = await c.env.qesuite_db.prepare(
        `SELECT ds.current_lat, ds.current_lng, ds.name, ds.phone
         FROM delivery_assignments da
         JOIN delivery_staff ds ON ds.id = da.staff_id
         WHERE da.order_id = ? AND da.status IN ('ASSIGNED','PICKED_UP','ON_THE_WAY')
         ORDER BY da.assigned_at DESC LIMIT 1`
      ).bind(order.id).first<{
        current_lat: number | null; current_lng: number | null
        name: string; phone: string
      }>()

      if (assignment && assignment.current_lat !== null) {
        riderLocation = {
          lat: assignment.current_lat,
          lng: assignment.current_lng!,
          name: assignment.name,
          phone: assignment.phone,
        }
      }
    }

    return c.json({
      success: true,
      data: { order, items: items.results, rider_location: riderLocation },
      error: null,
    })
  } catch (err) {
    console.error('track error', err)
    return c.json({ error: 'Failed to track order', data: null }, 500)
  }
})

// POST /api/orders — customer places order (no auth)
orders.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      slug: string
      customer_name?: string
      customer_phone: string
      delivery_address?: string
      delivery_lat?: number
      delivery_lng?: number
      payment_method: 'pay_on_delivery' | 'mpesa' | 'stripe'
      notes?: string
      items: Array<{ product_id: string; quantity: number }>
    }>()

    if (!body.slug || !body.customer_phone || !body.payment_method || !body.items?.length) {
      return c.json({ error: 'slug, customer_phone, payment_method, and items are required', data: null }, 400)
    }

    // Resolve tenant
    const tenant = await c.env.qesuite_db.prepare(
      'SELECT id, name, slug, phone, whatsapp_number, is_suspended FROM tenants WHERE slug = ?'
    ).bind(body.slug).first<{
      id: string; name: string; slug: string; phone: string | null
      whatsapp_number: string | null; is_suspended: number
    }>()

    if (!tenant) {
      return c.json({ error: 'Store not found', data: null }, 404)
    }
    if (tenant.is_suspended) {
      return c.json({ error: 'Store is temporarily unavailable', data: null }, 403)
    }

    const settings = await c.env.qesuite_db.prepare(
      'SELECT min_order_amount, delivery_fee, delivery_enabled, pickup_enabled FROM store_settings WHERE tenant_id = ?'
    ).bind(tenant.id).first<{
      min_order_amount: number; delivery_fee: number
      delivery_enabled: number; pickup_enabled: number
    }>()

    // Validate and price items
    let subtotal = 0
    const resolvedItems: Array<{
      id: string; product_id: string; product_name: string; quantity: number; price: number
    }> = []

    for (const item of body.items) {
      if (!item.product_id || item.quantity < 1) {
        return c.json({ error: 'Each item needs product_id and quantity >= 1', data: null }, 400)
      }

      const product = await c.env.qesuite_db.prepare(
        'SELECT id, name, price, sale_price, stock, is_active FROM products WHERE id = ? AND tenant_id = ?'
      ).bind(item.product_id, tenant.id).first<{
        id: string; name: string; price: number; sale_price: number | null
        stock: number; is_active: number
      }>()

      if (!product || !product.is_active) {
        return c.json({ error: `Product ${item.product_id} not available`, data: null }, 400)
      }
      if (product.stock < item.quantity) {
        return c.json({ error: `Insufficient stock for ${product.name}`, data: null }, 400)
      }

      const unitPrice = product.sale_price ?? product.price
      subtotal += unitPrice * item.quantity
      resolvedItems.push({
        id: generateId(),
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: unitPrice,
      })
    }

    if (settings && settings.min_order_amount > 0 && subtotal < settings.min_order_amount) {
      return c.json({
        error: `Minimum order is KES ${settings.min_order_amount}`,
        data: null,
      }, 400)
    }

    const isDelivery = !!body.delivery_address
    const deliveryFee = isDelivery && settings ? settings.delivery_fee : 0
    const total = subtotal + deliveryFee

    // Generate unique tracking code
    let trackingCode = generateTrackingCode()
    while (true) {
      const exists = await c.env.qesuite_db.prepare('SELECT id FROM orders WHERE tracking_code = ?')
        .bind(trackingCode).first()
      if (!exists) break
      trackingCode = generateTrackingCode()
    }

    const orderId = generateId()

    await c.env.qesuite_db.prepare(
      `INSERT INTO orders (id, tenant_id, customer_name, customer_phone, delivery_address,
        delivery_lat, delivery_lng, status, payment_method, payment_status,
        subtotal, delivery_fee, total, tracking_code, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'NEW', ?, 'pending', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      orderId, tenant.id,
      body.customer_name ?? null,
      body.customer_phone,
      body.delivery_address ?? null,
      body.delivery_lat ?? null,
      body.delivery_lng ?? null,
      body.payment_method,
      subtotal, deliveryFee, total,
      trackingCode,
      body.notes ?? null
    ).run()

    // Insert order items
    for (const item of resolvedItems) {
      await c.env.qesuite_db.prepare(
        'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(item.id, orderId, item.product_id, item.product_name, item.quantity, item.price).run()
    }

    // Decrement stock
    for (const item of resolvedItems) {
      await c.env.qesuite_db.prepare(
        'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?'
      ).bind(item.quantity, item.product_id).run()
    }

    // Queue notifications
    try {
      await c.env.NOTIFICATION_QUEUE.send({
        type: 'ORDER_CONFIRMED',
        order_id: orderId,
        tenant_id: tenant.id,
        tracking_code: trackingCode,
        customer_phone: body.customer_phone,
        customer_name: body.customer_name ?? 'Customer',
        total,
        payment_method: body.payment_method,
        slug: tenant.slug,
        store_name: tenant.name,
        store_phone: tenant.phone,
        whatsapp_number: tenant.whatsapp_number,
      })
    } catch (qErr) {
      console.error('Queue enqueue failed:', qErr)
    }

    return c.json({
      success: true,
      data: {
        order_id: orderId,
        tracking_code: trackingCode,
        total,
        subtotal,
        delivery_fee: deliveryFee,
        status: 'NEW',
        payment_method: body.payment_method,
      },
      error: null,
      message: `Order placed! Track at ${c.env.APP_BASE_URL}/${tenant.slug}/track/${trackingCode}`,
    }, 201)
  } catch (err) {
    console.error('order create error', err)
    return c.json({ error: 'Failed to place order', data: null }, 500)
  }
})

// GET /api/orders — owner lists orders
orders.get('/', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const status = c.req.query('status')
    const periodParam = c.req.query('period')
    const fromParam = c.req.query('from')
    const toParam = c.req.query('to')
    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100)
    const offset = (page - 1) * limit

    const conditions = ['o.tenant_id = ?']
    const params: (string | number)[] = [tenantId]

    if (status) {
      conditions.push('o.status = ?')
      params.push(status.toUpperCase())
    }

    // Optional date filter (from dashboard period selector or custom range)
    if (fromParam && toParam) {
      conditions.push('date(o.created_at) >= ?')
      conditions.push('date(o.created_at) <= ?')
      params.push(fromParam, toParam)
    } else if (periodParam) {
      const days = periodParam === 'today' ? 0 : periodParam === 'week' ? 6 : 29
      const since = new Date()
      since.setUTCDate(since.getUTCDate() - days)
      conditions.push('date(o.created_at) >= ?')
      params.push(since.toISOString().substring(0, 10))
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM orders o WHERE ${whereClause}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT o.id, o.tracking_code, o.status, o.payment_method, o.payment_status,
              o.customer_name, o.customer_phone, o.delivery_address,
              o.subtotal, o.delivery_fee, o.total, o.notes,
              o.created_at, o.updated_at,
              (SELECT GROUP_CONCAT(product_name || ' x' || quantity)
               FROM order_items WHERE order_id = o.id) as items_summary
       FROM orders o
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: {
        items: rows.results,
        total: countResult?.cnt ?? 0,
        page,
        limit,
      },
      error: null,
    })
  } catch (err) {
    console.error('orders list error', err)
    return c.json({ error: 'Failed to fetch orders', data: null }, 500)
  }
})

// GET /api/orders/:id — order detail
orders.get('/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const order = await c.env.qesuite_db.prepare(
      `SELECT * FROM orders WHERE id = ? AND tenant_id = ?`
    ).bind(id, tenantId).first()

    if (!order) {
      return c.json({ error: 'Order not found', data: null }, 404)
    }

    const items = await c.env.qesuite_db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).bind(id).all()

    const assignment = await c.env.qesuite_db.prepare(
      `SELECT da.status as assignment_status, da.assigned_at, da.picked_up_at, da.delivered_at,
              ds.name as rider_name, ds.phone as rider_phone, ds.vehicle_type,
              ds.current_lat, ds.current_lng
       FROM delivery_assignments da
       JOIN delivery_staff ds ON ds.id = da.staff_id
       WHERE da.order_id = ?
       ORDER BY da.assigned_at DESC LIMIT 1`
    ).bind(id).first()

    return c.json({
      success: true,
      data: { order, items: items.results, assignment: assignment ?? null },
      error: null,
    })
  } catch (err) {
    console.error('order detail error', err)
    return c.json({ error: 'Failed to fetch order', data: null }, 500)
  }
})

// PUT /api/orders/:id/status
orders.put('/:id/status', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const { status, cancellation_reason } = await c.req.json<{
      status: OrderStatus
      cancellation_reason?: string
    }>()

    if (!status) {
      return c.json({ error: 'status is required', data: null }, 400)
    }

    const order = await c.env.qesuite_db.prepare(
      'SELECT id, status, tracking_code, customer_phone, total, tenant_id FROM orders WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{
      id: string; status: OrderStatus; tracking_code: string
      customer_phone: string; total: number; tenant_id: string
    }>()

    if (!order) {
      return c.json({ error: 'Order not found', data: null }, 404)
    }

    const allowed = TRANSITIONS[order.status]
    if (!allowed.includes(status)) {
      return c.json({
        error: `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
        data: null,
      }, 400)
    }

    await c.env.qesuite_db.prepare(
      `UPDATE orders SET status = ?, cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(status, cancellation_reason ?? null, id).run()

    // Queue notification based on new status
    const tenant = await c.env.qesuite_db.prepare(
      'SELECT slug, name, phone, whatsapp_number FROM tenants WHERE id = ?'
    ).bind(tenantId).first<{
      slug: string; name: string; phone: string | null; whatsapp_number: string | null
    }>()

    if (tenant) {
      try {
        await c.env.NOTIFICATION_QUEUE.send({
          type: `ORDER_STATUS_${status}`,
          order_id: id,
          tenant_id: tenantId,
          tracking_code: order.tracking_code,
          customer_phone: order.customer_phone,
          total: order.total,
          slug: tenant.slug,
          store_name: tenant.name,
        })
      } catch (qErr) {
        console.error('Queue enqueue failed:', qErr)
      }
    }

    return c.json({
      success: true,
      data: { id, status, previous_status: order.status },
      error: null,
      message: `Order updated to ${status}`,
    })
  } catch (err) {
    console.error('order status update error', err)
    return c.json({ error: 'Failed to update order status', data: null }, 500)
  }
})

// GET /api/orders/:id/packing-slip
orders.get('/:id/packing-slip', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const order = await c.env.qesuite_db.prepare(
      `SELECT o.*, t.name as store_name
       FROM orders o JOIN tenants t ON t.id = o.tenant_id
       WHERE o.id = ? AND o.tenant_id = ?`
    ).bind(id, tenantId).first<{
      id: string; tracking_code: string; customer_name: string | null
      customer_phone: string; delivery_address: string | null
      subtotal: number; delivery_fee: number; total: number
      payment_method: string; created_at: string; store_name: string
    }>()

    if (!order) {
      return c.json({ error: 'Order not found', data: null }, 404)
    }

    const items = await c.env.qesuite_db.prepare(
      'SELECT product_name, quantity, price FROM order_items WHERE order_id = ?'
    ).bind(id).all<{ product_name: string; quantity: number; price: number }>()

    const line = '━'.repeat(24)
    const pad = (label: string, value: string, width = 24): string => {
      const right = value.toString()
      const left = label.padEnd(width - right.length, ' ')
      return `${left}${right}`
    }

    const createdAt = new Date(order.created_at)
    const timeStr = createdAt.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    const dateStr = createdAt.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

    let slip = `${line}\n`
    slip += `ORDER #${order.tracking_code} — ${order.store_name}\n`
    slip += `${line}\n`
    slip += `Customer: ${order.customer_name ?? 'N/A'}\n`
    slip += `Phone:    ${order.customer_phone}\n`
    if (order.delivery_address) {
      slip += `Address:  ${order.delivery_address}\n`
    }
    slip += `\nITEMS:\n`

    for (const item of items.results) {
      const lineTotal = item.quantity * item.price
      slip += `  ${pad(`${item.quantity}× ${item.product_name}`, `KES ${lineTotal}`)}\n`
    }

    slip += `${line}\n`
    slip += `${pad('Subtotal:', `KES ${order.subtotal}`)}\n`
    if (order.delivery_fee > 0) {
      slip += `${pad('Delivery fee:', `KES ${order.delivery_fee}`)}\n`
    }
    slip += `${pad('TOTAL:', `KES ${order.total}`)}\n`
    slip += `${line}\n`
    slip += `Payment: ${order.payment_method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}\n`
    slip += `Time:     ${timeStr} | ${dateStr}\n`
    slip += `${line}\n`

    return c.json({ success: true, data: { packing_slip: slip }, error: null })
  } catch (err) {
    console.error('packing slip error', err)
    return c.json({ error: 'Failed to generate packing slip', data: null }, 500)
  }
})

export default orders
