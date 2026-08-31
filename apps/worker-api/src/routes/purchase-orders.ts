import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId } from '@qesuite/shared'
import { auditEntry } from '../lib/audit'
import { nextSequenceNumber } from '../lib/sequences'

const purchaseOrders = new Hono<{ Bindings: Env; Variables: Variables }>()

purchaseOrders.use('*', authMiddleware, tenantGuard, requireModule('inventory'))

type ItemInput = { product_id: string; quantity_ordered: number; unit_cost: number }

function validateItems(items: unknown): items is ItemInput[] {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.every(item =>
    item && typeof item.product_id === 'string' &&
    Number.isInteger(item.quantity_ordered) && item.quantity_ordered > 0 &&
    Number.isInteger(item.unit_cost) && item.unit_cost >= 0
  )
}

async function loadOrder(db: D1Database, tenantId: string, id: string) {
  const order = await db.prepare('SELECT * FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<Record<string, unknown>>()
  if (!order) return null
  const items = await db.prepare(
    `SELECT poi.*, p.name AS product_name, p.unit_of_measure
     FROM purchase_order_items poi JOIN products p ON p.id = poi.product_id
     WHERE poi.purchase_order_id = ?`
  ).bind(id).all()
  return { ...order, items: items.results }
}

// GET /api/purchase-orders — list
purchaseOrders.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const status = c.req.query('status')
    const conditions = ['po.tenant_id = ?']
    const params: (string | number)[] = [tenantId]
    if (status) { conditions.push('po.status = ?'); params.push(status) }

    const rows = await c.env.qesuite_db.prepare(
      `SELECT po.*, s.name AS supplier_name
       FROM purchase_orders po JOIN suppliers s ON s.id = po.supplier_id
       WHERE ${conditions.join(' AND ')} ORDER BY po.created_at DESC LIMIT 200`
    ).bind(...params).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('purchase orders list error', err)
    return c.json({ success: false, error: 'Failed to fetch purchase orders', data: null }, 500)
  }
})

// GET /api/purchase-orders/:id
purchaseOrders.get('/:id', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const order = await loadOrder(c.env.qesuite_db, tenantId, c.req.param('id'))
    if (!order) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    return c.json({ success: true, data: order, error: null })
  } catch (err) {
    console.error('purchase order detail error', err)
    return c.json({ success: false, error: 'Failed to fetch purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders — create a draft
purchaseOrders.post('/', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{ supplier_id: string; notes?: string; items: ItemInput[] }>()

    if (!body.supplier_id) return c.json({ success: false, error: 'supplier_id is required', data: null }, 400)
    if (!validateItems(body.items)) return c.json({ success: false, error: 'At least one valid line item is required', data: null }, 400)

    const supplier = await c.env.qesuite_db.prepare('SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?').bind(body.supplier_id, tenantId).first()
    if (!supplier) return c.json({ success: false, error: 'Supplier not found', data: null }, 404)

    const id = generateId()
    const poNumber = await nextSequenceNumber(c.env.qesuite_db, tenantId, 'purchase_order', 'PO')
    const subtotal = body.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0)

    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO purchase_orders (id, tenant_id, supplier_id, po_number, status, subtotal, notes, created_by)
         VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`
      ).bind(id, tenantId, body.supplier_id, poNumber, subtotal, body.notes ?? null, user.sub),
      ...body.items.map(item => c.env.qesuite_db.prepare(
        `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity_ordered, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), id, item.product_id, item.quantity_ordered, item.unit_cost, item.quantity_ordered * item.unit_cost)),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.created',
        targetType: 'purchase_order', targetId: id, detail: { po_number: poNumber, subtotal },
        ip: c.req.header('CF-Connecting-IP'),
      }),
    ]

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id, po_number: poNumber }, error: null, message: 'Purchase order drafted' }, 201)
  } catch (err) {
    console.error('purchase order create error', err)
    return c.json({ success: false, error: 'Failed to create purchase order', data: null }, 500)
  }
})

// PUT /api/purchase-orders/:id — edit while still a draft
purchaseOrders.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ supplier_id?: string; notes?: string; items: ItemInput[] }>()

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (existing.status !== 'draft') return c.json({ success: false, error: 'Only draft purchase orders can be edited', data: null }, 409)
    if (!validateItems(body.items)) return c.json({ success: false, error: 'At least one valid line item is required', data: null }, 400)

    const subtotal = body.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `UPDATE purchase_orders SET supplier_id = COALESCE(?, supplier_id), notes = ?, subtotal = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(body.supplier_id ?? null, body.notes ?? null, subtotal, id),
      c.env.qesuite_db.prepare('DELETE FROM purchase_order_items WHERE purchase_order_id = ?').bind(id),
      ...body.items.map(item => c.env.qesuite_db.prepare(
        `INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity_ordered, unit_cost, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), id, item.product_id, item.quantity_ordered, item.unit_cost, item.quantity_ordered * item.unit_cost)),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.updated',
        targetType: 'purchase_order', targetId: id, detail: { subtotal }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Purchase order updated' })
  } catch (err) {
    console.error('purchase order update error', err)
    return c.json({ success: false, error: 'Failed to update purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders/:id/submit — draft -> pending_approval
purchaseOrders.post('/:id/submit', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (existing.status !== 'draft') return c.json({ success: false, error: 'Only draft purchase orders can be submitted', data: null }, 409)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare("UPDATE purchase_orders SET status = 'pending_approval', updated_at = datetime('now') WHERE id = ?").bind(id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.submitted',
        targetType: 'purchase_order', targetId: id, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Submitted for approval' })
  } catch (err) {
    console.error('purchase order submit error', err)
    return c.json({ success: false, error: 'Failed to submit purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders/:id/approve
purchaseOrders.post('/:id/approve', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (existing.status !== 'pending_approval') return c.json({ success: false, error: 'Only purchase orders pending approval can be approved', data: null }, 409)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        "UPDATE purchase_orders SET status = 'approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
      ).bind(user.sub, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.approved',
        targetType: 'purchase_order', targetId: id, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Purchase order approved' })
  } catch (err) {
    console.error('purchase order approve error', err)
    return c.json({ success: false, error: 'Failed to approve purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders/:id/reject
purchaseOrders.post('/:id/reject', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ reason?: string }>().catch(() => ({} as { reason?: string }))

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (existing.status !== 'pending_approval') return c.json({ success: false, error: 'Only purchase orders pending approval can be rejected', data: null }, 409)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        "UPDATE purchase_orders SET status = 'rejected', approved_by = ?, approved_at = datetime('now'), notes = COALESCE(notes || char(10) || 'Rejected: ' || ?, notes), updated_at = datetime('now') WHERE id = ?"
      ).bind(user.sub, body.reason ?? 'No reason given', id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.rejected',
        targetType: 'purchase_order', targetId: id, detail: { reason: body.reason }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Purchase order rejected' })
  } catch (err) {
    console.error('purchase order reject error', err)
    return c.json({ success: false, error: 'Failed to reject purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders/:id/send — approved -> sent (to supplier)
purchaseOrders.post('/:id/send', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (existing.status !== 'approved') return c.json({ success: false, error: 'Only approved purchase orders can be sent', data: null }, 409)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare("UPDATE purchase_orders SET status = 'sent', sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.sent',
        targetType: 'purchase_order', targetId: id, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Marked as sent to supplier' })
  } catch (err) {
    console.error('purchase order send error', err)
    return c.json({ success: false, error: 'Failed to update purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders/:id/cancel
purchaseOrders.post('/:id/cancel', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (!['draft', 'pending_approval', 'approved', 'sent'].includes(existing.status)) {
      return c.json({ success: false, error: 'This purchase order can no longer be cancelled', data: null }, 409)
    }

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare("UPDATE purchase_orders SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").bind(id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.cancelled',
        targetType: 'purchase_order', targetId: id, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Purchase order cancelled' })
  } catch (err) {
    console.error('purchase order cancel error', err)
    return c.json({ success: false, error: 'Failed to cancel purchase order', data: null }, 500)
  }
})

// POST /api/purchase-orders/:id/receive — record stock received against this
// PO, one or more line items at a time (supports partial deliveries). Rolls
// each product's cost_price forward to a new weighted-average cost, writes a
// stock_movements row and a price_history row when cost changes, so the
// ledger and P&L both stay reconstructable from history alone.
purchaseOrders.post('/:id/receive', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ items: { item_id: string; quantity_received_now: number }[] }>()

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return c.json({ success: false, error: 'At least one item receipt is required', data: null }, 400)
    }
    if (body.items.some(item => !Number.isInteger(item.quantity_received_now) || item.quantity_received_now <= 0)) {
      return c.json({ success: false, error: 'quantity_received_now must be a positive integer', data: null }, 400)
    }

    const order = await c.env.qesuite_db.prepare('SELECT status FROM purchase_orders WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!order) return c.json({ success: false, error: 'Purchase order not found', data: null }, 404)
    if (!['sent', 'partially_received'].includes(order.status)) {
      return c.json({ success: false, error: 'This purchase order is not awaiting receipt', data: null }, 409)
    }

    const statements: D1PreparedStatement[] = []
    const ip = c.req.header('CF-Connecting-IP')

    for (const receipt of body.items) {
      const item = await c.env.qesuite_db.prepare(
        'SELECT * FROM purchase_order_items WHERE id = ? AND purchase_order_id = ?'
      ).bind(receipt.item_id, id).first<{ id: string; product_id: string; quantity_ordered: number; quantity_received: number; unit_cost: number }>()
      if (!item) return c.json({ success: false, error: `Line item ${receipt.item_id} not found on this order`, data: null }, 404)

      const remaining = item.quantity_ordered - item.quantity_received
      if (receipt.quantity_received_now > remaining) {
        return c.json({ success: false, error: `Cannot receive more than the ${remaining} unit(s) still outstanding for this item`, data: null }, 400)
      }

      const product = await c.env.qesuite_db.prepare(
        'SELECT stock, cost_price FROM products WHERE id = ? AND tenant_id = ?'
      ).bind(item.product_id, tenantId).first<{ stock: number; cost_price: number }>()
      if (!product) return c.json({ success: false, error: 'Product no longer exists', data: null }, 404)

      const newStock = product.stock + receipt.quantity_received_now
      const newAvgCost = newStock > 0
        ? Math.round((product.stock * product.cost_price + receipt.quantity_received_now * item.unit_cost) / newStock)
        : item.unit_cost

      statements.push(
        c.env.qesuite_db.prepare('UPDATE purchase_order_items SET quantity_received = quantity_received + ? WHERE id = ?')
          .bind(receipt.quantity_received_now, item.id),
        c.env.qesuite_db.prepare("UPDATE products SET stock = ?, cost_price = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(newStock, newAvgCost, item.product_id),
        c.env.qesuite_db.prepare(
          `INSERT INTO stock_movements
            (id, tenant_id, product_id, type, quantity_delta, unit_cost, resulting_stock, resulting_avg_cost, reference_type, reference_id, recorded_by)
           VALUES (?, ?, ?, 'purchase_receipt', ?, ?, ?, ?, 'purchase_order', ?, ?)`
        ).bind(generateId(), tenantId, item.product_id, receipt.quantity_received_now, item.unit_cost, newStock, newAvgCost, id, user.sub),
      )

      if (newAvgCost !== product.cost_price) {
        statements.push(
          c.env.qesuite_db.prepare(
            `INSERT INTO price_history (id, tenant_id, product_id, field, old_value, new_value, changed_by)
             VALUES (?, ?, ?, 'cost_price', ?, ?, ?)`
          ).bind(generateId(), tenantId, item.product_id, product.cost_price, newAvgCost, user.sub),
        )
      }

      statements.push(auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'purchase_order.item_received',
        targetType: 'purchase_order', targetId: id,
        detail: { product_id: item.product_id, quantity: receipt.quantity_received_now, unit_cost: item.unit_cost },
        ip,
      }))
    }

    const totals = await c.env.qesuite_db.prepare(
      'SELECT SUM(quantity_ordered) AS ordered, SUM(quantity_received) AS received FROM purchase_order_items WHERE purchase_order_id = ?'
    ).bind(id).first<{ ordered: number; received: number }>()
    // quantity_received in this snapshot predates the batch above, so a partial receipt
    // now completing the order still needs the post-batch status computed here.
    const receivedAfterThisBatch = (totals?.received ?? 0) + body.items.reduce((sum, i) => sum + i.quantity_received_now, 0)
    const newStatus = receivedAfterThisBatch >= (totals?.ordered ?? 0) ? 'received' : 'partially_received'

    statements.push(
      c.env.qesuite_db.prepare(
        `UPDATE purchase_orders SET status = ?, received_at = CASE WHEN ? = 'received' THEN datetime('now') ELSE received_at END, updated_at = datetime('now') WHERE id = ?`
      ).bind(newStatus, newStatus, id),
    )

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id, status: newStatus }, error: null, message: 'Stock received' })
  } catch (err) {
    console.error('purchase order receive error', err)
    return c.json({ success: false, error: 'Failed to record stock receipt', data: null }, 500)
  }
})

export default purchaseOrders
