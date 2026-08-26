import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { riderMiddleware } from '../middleware/auth'
import { generateId, generateTrackingCode } from '../lib/jwt'
import { sendSMS } from '../lib/notifications'
import { validatePhone, normalizeKenyaPhone } from '@qesuite/shared'

const delivery = new Hono<{ Bindings: Env; Variables: Variables }>()

// POST /api/delivery/staff — add rider
delivery.post('/staff', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can add delivery staff', data: null }, 403)
    }
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      name: string
      phone: string
      vehicle_type?: string
    }>()

    if (!body.name || !body.phone) {
      return c.json({ error: 'name and phone are required', data: null }, 400)
    }
    if (!validatePhone(body.phone)) {
      return c.json({ error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
    }
    const phone = normalizeKenyaPhone(body.phone)

    // Check for existing rider with same phone in this tenant
    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM delivery_staff WHERE phone = ? AND tenant_id = ?'
    ).bind(phone, tenantId).first()

    if (existing) {
      return c.json({ error: 'A rider with this phone already exists', data: null }, 409)
    }

    const id = generateId()
    const magicToken = generateTrackingCode() + generateTrackingCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    await c.env.qesuite_db.prepare(
      `INSERT INTO delivery_staff (id, tenant_id, name, phone, vehicle_type, is_active,
        magic_link_token, magic_link_expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, datetime('now'))`
    ).bind(id, tenantId, body.name, phone, body.vehicle_type ?? null, magicToken, expiresAt).run()

    // Send magic link SMS
    const link = `${c.env.APP_BASE_URL.replace('store.', 'go.')}/verify?token=${magicToken}`
    await sendSMS(
      c.env,
      phone,
      `Hi ${body.name}! You have been invited as a delivery rider on QeSuite. Access your dashboard here: ${link}\nThis link expires in 30 minutes.`
    )

    const staff = await c.env.qesuite_db.prepare('SELECT id, name, phone, vehicle_type, is_active, created_at FROM delivery_staff WHERE id = ?')
      .bind(id).first()

    return c.json({ success: true, data: staff, error: null, message: 'Rider added and magic link sent' }, 201)
  } catch (err) {
    console.error('add rider error', err)
    return c.json({ error: 'Failed to add rider', data: null }, 500)
  }
})

// GET /api/delivery/staff — list riders
delivery.get('/staff', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const rows = await c.env.qesuite_db.prepare(
      `SELECT ds.id, ds.name, ds.phone, ds.vehicle_type, ds.is_active,
              ds.current_lat, ds.current_lng, ds.location_updated_at, ds.created_at,
              COUNT(da.id) FILTER (WHERE da.status NOT IN ('DELIVERED','FAILED')) as active_orders
       FROM delivery_staff ds
       LEFT JOIN delivery_assignments da ON da.staff_id = ds.id
       WHERE ds.tenant_id = ?
       GROUP BY ds.id
       ORDER BY ds.name ASC`
    ).bind(tenantId).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('list riders error', err)
    return c.json({ error: 'Failed to fetch riders', data: null }, 500)
  }
})

// DELETE /api/delivery/staff/:id — deactivate rider
delivery.delete('/staff/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can remove riders', data: null }, 403)
    }
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const staff = await c.env.qesuite_db.prepare(
      'SELECT id FROM delivery_staff WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!staff) {
      return c.json({ error: 'Rider not found', data: null }, 404)
    }

    await c.env.qesuite_db.prepare('UPDATE delivery_staff SET is_active = 0 WHERE id = ?')
      .bind(id).run()

    return c.json({ success: true, data: { deactivated: true }, error: null, message: 'Rider deactivated' })
  } catch (err) {
    console.error('deactivate rider error', err)
    return c.json({ error: 'Failed to deactivate rider', data: null }, 500)
  }
})

// POST /api/delivery/assign — assign order to rider
delivery.post('/assign', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'owner') {
      return c.json({ error: 'Only owners can assign orders', data: null }, 403)
    }
    const tenantId = user.tenant_id!

    const { order_id, staff_id } = await c.req.json<{ order_id: string; staff_id: string }>()
    if (!order_id || !staff_id) {
      return c.json({ error: 'order_id and staff_id are required', data: null }, 400)
    }

    // Verify order belongs to tenant
    const order = await c.env.qesuite_db.prepare(
      "SELECT id, status, tracking_code, customer_phone, total FROM orders WHERE id = ? AND tenant_id = ? AND status IN ('READY','CONFIRMED','PREPARING')"
    ).bind(order_id, tenantId).first<{
      id: string; status: string; tracking_code: string; customer_phone: string; total: number
    }>()

    if (!order) {
      return c.json({ error: 'Order not found or not in an assignable state', data: null }, 404)
    }

    // Verify rider belongs to tenant
    const staff = await c.env.qesuite_db.prepare(
      'SELECT id, name, phone FROM delivery_staff WHERE id = ? AND tenant_id = ? AND is_active = 1'
    ).bind(staff_id, tenantId).first<{ id: string; name: string; phone: string }>()

    if (!staff) {
      return c.json({ error: 'Rider not found or inactive', data: null }, 404)
    }

    // Remove any prior assignment for this order
    await c.env.qesuite_db.prepare(
      "UPDATE delivery_assignments SET status = 'FAILED', failure_reason = 'Reassigned' WHERE order_id = ? AND status = 'ASSIGNED'"
    ).bind(order_id).run()

    const assignmentId = generateId()
    await c.env.qesuite_db.prepare(
      "INSERT INTO delivery_assignments (id, order_id, staff_id, tenant_id, status, assigned_at) VALUES (?, ?, ?, ?, 'ASSIGNED', datetime('now'))"
    ).bind(assignmentId, order_id, staff_id, tenantId).run()

    // Update order status to OUT_FOR_DELIVERY
    await c.env.qesuite_db.prepare(
      "UPDATE orders SET status = 'OUT_FOR_DELIVERY', updated_at = datetime('now') WHERE id = ?"
    ).bind(order_id).run()

    // Notify rider
    try {
      await sendSMS(
        c.env,
        staff.phone,
        `You have been assigned a new delivery order (ID: ${order_id.substring(0, 8).toUpperCase()}). Open your app: ${c.env.APP_BASE_URL.replace('store.', 'go.')}`
      )
    } catch {
      // Non-blocking
    }

    // Notify customer their order is on the way (with rider details + tracking link)
    try {
      const tenant = await c.env.qesuite_db.prepare(
        'SELECT slug, name FROM tenants WHERE id = ?'
      ).bind(tenantId).first<{ slug: string; name: string }>()

      if (tenant && c.env.NOTIFICATION_QUEUE) {
        await c.env.NOTIFICATION_QUEUE.send({
          type: 'ORDER_STATUS_OUT_FOR_DELIVERY',
          order_id,
          tenant_id: tenantId,
          tracking_code: order.tracking_code,
          customer_phone: order.customer_phone,
          total: order.total,
          slug: tenant.slug,
          store_name: tenant.name,
          rider_name: staff.name,
          rider_phone: staff.phone,
        })
      }
    } catch (qErr) {
      console.error('Dispatch notification enqueue failed:', qErr)
    }

    return c.json({
      success: true,
      data: { assignment_id: assignmentId, order_id, staff_id },
      error: null,
      message: `Order assigned to ${staff.name}`,
    })
  } catch (err) {
    console.error('assign order error', err)
    return c.json({ error: 'Failed to assign order', data: null }, 500)
  }
})

// PUT /api/delivery/status — rider updates assignment status
delivery.put('/status', riderMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      assignment_id: string
      status: 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED' | 'FAILED'
      failure_reason?: string
    }>()

    if (!body.assignment_id || !body.status) {
      return c.json({ error: 'assignment_id and status are required', data: null }, 400)
    }

    const allowed = ['PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FAILED']
    if (!allowed.includes(body.status)) {
      return c.json({ error: `status must be one of: ${allowed.join(', ')}`, data: null }, 400)
    }

    // Verify assignment belongs to this rider's tenant and is active
    const assignment = await c.env.qesuite_db.prepare(
      `SELECT da.id, da.order_id, da.status as current_status,
              o.tracking_code, o.customer_phone, o.total, o.tenant_id,
              t.slug, t.name as store_name
       FROM delivery_assignments da
       JOIN orders o ON o.id = da.order_id
       JOIN tenants t ON t.id = o.tenant_id
       WHERE da.id = ? AND da.tenant_id = ?`
    ).bind(body.assignment_id, tenantId).first<{
      id: string; order_id: string; current_status: string
      tracking_code: string; customer_phone: string; total: number
      tenant_id: string; slug: string; store_name: string
    }>()

    if (!assignment) {
      return c.json({ error: 'Assignment not found', data: null }, 404)
    }

    // Update timestamps based on status
    const now = new Date().toISOString()
    const updates: Record<string, string | null> = { status: body.status }
    if (body.status === 'PICKED_UP') updates.picked_up_at = now
    if (body.status === 'DELIVERED') updates.delivered_at = now
    if (body.status === 'FAILED') updates.failure_reason = body.failure_reason ?? 'Unspecified'

    const fields = Object.entries(updates).map(([k]) => `${k} = ?`).join(', ')
    const values = [...Object.values(updates), body.assignment_id]

    await c.env.qesuite_db.prepare(
      `UPDATE delivery_assignments SET ${fields} WHERE id = ?`
    ).bind(...values).run()

    // Update order status
    if (body.status === 'DELIVERED') {
      await c.env.qesuite_db.prepare(
        "UPDATE orders SET status = 'DELIVERED', updated_at = datetime('now') WHERE id = ?"
      ).bind(assignment.order_id).run()

      // Notify customer
      try {
        await c.env.NOTIFICATION_QUEUE.send({
          type: 'ORDER_STATUS_DELIVERED',
          order_id: assignment.order_id,
          tenant_id: assignment.tenant_id,
          tracking_code: assignment.tracking_code,
          customer_phone: assignment.customer_phone,
          total: assignment.total,
          slug: assignment.slug,
          store_name: assignment.store_name,
        })
      } catch {
        // Non-blocking
      }
    }

    if (body.status === 'FAILED') {
      await c.env.qesuite_db.prepare(
        "UPDATE orders SET status = 'CANCELLED', cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(`Delivery failed: ${body.failure_reason ?? 'Unspecified'}`, assignment.order_id).run()
    }

    return c.json({
      success: true,
      data: { assignment_id: body.assignment_id, status: body.status },
      error: null,
      message: `Assignment updated to ${body.status}`,
    })
  } catch (err) {
    console.error('delivery status update error', err)
    return c.json({ error: 'Failed to update delivery status', data: null }, 500)
  }
})

// GET /api/delivery/orders — rider's assigned orders
delivery.get('/orders', riderMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    // Find rider's delivery_staff record
    const staff = await c.env.qesuite_db.prepare(
      'SELECT id FROM delivery_staff WHERE user_id = ? AND tenant_id = ?'
    ).bind(user.sub, tenantId).first<{ id: string }>()

    if (!staff) {
      return c.json({ error: 'Rider profile not found', data: null }, 404)
    }

    const rows = await c.env.qesuite_db.prepare(
      `SELECT da.id as assignment_id, da.status as assignment_status,
              da.assigned_at, da.picked_up_at,
              o.id as order_id, o.tracking_code, o.customer_name, o.customer_phone,
              o.delivery_address, o.delivery_lat, o.delivery_lng, o.total,
              o.notes, o.status as order_status
       FROM delivery_assignments da
       JOIN orders o ON o.id = da.order_id
       WHERE da.staff_id = ? AND da.status NOT IN ('DELIVERED','FAILED')
       ORDER BY da.assigned_at ASC`
    ).bind(staff.id).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('rider orders error', err)
    return c.json({ error: 'Failed to fetch assigned orders', data: null }, 500)
  }
})

// PUT /api/delivery/location — rider pings GPS location
delivery.put('/location', riderMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const { lat, lng } = await c.req.json<{ lat: number; lng: number }>()
    if (lat === undefined || lng === undefined) {
      return c.json({ error: 'lat and lng are required', data: null }, 400)
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return c.json({ error: 'Invalid coordinates', data: null }, 400)
    }

    await c.env.qesuite_db.prepare(
      "UPDATE delivery_staff SET current_lat = ?, current_lng = ?, location_updated_at = datetime('now') WHERE user_id = ? AND tenant_id = ?"
    ).bind(lat, lng, user.sub, tenantId).run()

    return c.json({ success: true, data: { lat, lng }, error: null })
  } catch (err) {
    console.error('location update error', err)
    return c.json({ error: 'Failed to update location', data: null }, 500)
  }
})

// GET /api/delivery/assignments?status=active — owner: list current assignments
delivery.get('/assignments', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const status = c.req.query('status') // 'active' or specific status

    let query = `SELECT da.id, da.status as assignment_status, da.assigned_at, da.picked_up_at, da.delivered_at,
                        ds.id as staff_id, ds.name as rider_name, ds.phone as rider_phone,
                        o.id as order_id, o.tracking_code, o.customer_name, o.total, o.status as order_status
                 FROM delivery_assignments da
                 JOIN delivery_staff ds ON ds.id = da.staff_id
                 JOIN orders o ON o.id = da.order_id
                 WHERE da.tenant_id = ?`
    const params: string[] = [tenantId]

    if (status === 'active') {
      query += ` AND da.status NOT IN ('DELIVERED','FAILED')`
    } else if (status) {
      query += ` AND da.status = ?`
      params.push(status.toUpperCase())
    }

    query += ' ORDER BY da.assigned_at DESC LIMIT 100'
    const { results } = await c.env.qesuite_db.prepare(query).bind(...params).all()
    return c.json({ success: true, data: results, error: null })
  } catch (err) {
    console.error('assignments list error', err)
    return c.json({ error: 'Failed to fetch assignments', data: null }, 500)
  }
})

// PUT /api/delivery/staff/:id — update rider info
delivery.put('/staff/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ name?: string; phone?: string; vehicle_type?: string; is_active?: number }>()

    const staff = await c.env.qesuite_db.prepare('SELECT id FROM delivery_staff WHERE id = ? AND tenant_id = ?')
      .bind(id, tenantId).first()
    if (!staff) return c.json({ error: 'Rider not found', data: null }, 404)

    if (body.phone !== undefined && !validatePhone(body.phone)) {
      return c.json({ error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
    }

    const fields: string[] = []
    const values: unknown[] = []
    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name) }
    if (body.phone !== undefined) { fields.push('phone = ?'); values.push(normalizeKenyaPhone(body.phone)) }
    if (body.vehicle_type !== undefined) { fields.push('vehicle_type = ?'); values.push(body.vehicle_type) }
    if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active) }

    if (!fields.length) return c.json({ error: 'No fields to update', data: null }, 400)
    values.push(id)
    await c.env.qesuite_db.prepare(`UPDATE delivery_staff SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
    const updated = await c.env.qesuite_db.prepare('SELECT * FROM delivery_staff WHERE id = ?').bind(id).first()
    return c.json({ success: true, data: updated, error: null, message: 'Rider updated' })
  } catch (err) {
    console.error('rider update error', err)
    return c.json({ error: 'Failed to update rider', data: null }, 500)
  }
})

// POST /api/delivery/staff/:id/magic-link — resend magic link
delivery.post('/staff/:id/magic-link', authMiddleware, tenantGuard, async (c) => {
  try {
    const { generateTrackingCode } = await import('../lib/jwt')
    const { sendSMS } = await import('../lib/notifications')
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')

    const staff = await c.env.qesuite_db.prepare(
      'SELECT id, phone, name FROM delivery_staff WHERE id = ? AND tenant_id = ? AND is_active = 1'
    ).bind(id, tenantId).first<{ id: string; phone: string; name: string }>()
    if (!staff) return c.json({ error: 'Rider not found', data: null }, 404)

    const token = generateTrackingCode() + generateTrackingCode()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await c.env.qesuite_db.prepare(
      'UPDATE delivery_staff SET magic_link_token = ?, magic_link_expires_at = ? WHERE id = ?'
    ).bind(token, expiresAt, id).run()

    const link = `${c.env.APP_BASE_URL.replace('store.', 'go.')}/auth/verify?token=${token}`
    await sendSMS(c.env, staff.phone, `Welcome to QeSuite! Click here to access your delivery dashboard: ${link}`)

    return c.json({ success: true, data: { sent: true }, error: null, message: 'Magic link sent' })
  } catch (err) {
    console.error('magic-link error', err)
    return c.json({ error: 'Failed to send magic link', data: null }, 500)
  }
})

export default delivery
