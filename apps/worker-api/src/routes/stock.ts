import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId } from '@qesuite/shared'
import { auditEntry } from '../lib/audit'

const stock = new Hono<{ Bindings: Env; Variables: Variables }>()

stock.use('*', authMiddleware, tenantGuard, requireModule('inventory'))

// GET /api/stock/movements — the stock ledger, optionally scoped to one product
stock.get('/movements', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const productId = c.req.query('product_id')
    const conditions = ['sm.tenant_id = ?']
    const params: (string | number)[] = [tenantId]
    if (productId) { conditions.push('sm.product_id = ?'); params.push(productId) }

    const rows = await c.env.qesuite_db.prepare(
      `SELECT sm.*, p.name AS product_name
       FROM stock_movements sm JOIN products p ON p.id = sm.product_id
       WHERE ${conditions.join(' AND ')} ORDER BY sm.created_at DESC LIMIT 200`
    ).bind(...params).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('stock movements list error', err)
    return c.json({ success: false, error: 'Failed to fetch stock movements', data: null }, 500)
  }
})

// POST /api/stock/adjustments — request a manual stock adjustment. Does not
// touch products.stock directly: it queues an approval_requests row, applied
// (or discarded) only once a manager/owner decides it via /api/approvals.
stock.post('/adjustments', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{ product_id: string; quantity_delta: number; reason: string }>()

    if (!body.product_id) return c.json({ success: false, error: 'product_id is required', data: null }, 400)
    if (!Number.isInteger(body.quantity_delta) || body.quantity_delta === 0) {
      return c.json({ success: false, error: 'quantity_delta must be a non-zero integer', data: null }, 400)
    }
    if (!body.reason?.trim()) return c.json({ success: false, error: 'A reason is required for stock adjustments', data: null }, 400)

    const product = await c.env.qesuite_db.prepare('SELECT id, name, stock FROM products WHERE id = ? AND tenant_id = ?').bind(body.product_id, tenantId).first<{ id: string; name: string; stock: number }>()
    if (!product) return c.json({ success: false, error: 'Product not found', data: null }, 404)

    const id = generateId()
    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `INSERT INTO approval_requests (id, tenant_id, action_type, target_type, target_id, payload_json, reason, requested_by)
         VALUES (?, ?, 'stock_adjustment', 'product', ?, ?, ?, ?)`
      ).bind(id, tenantId, body.product_id, JSON.stringify({ quantity_delta: body.quantity_delta, product_name: product.name }), body.reason.trim(), user.sub),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'stock_adjustment.requested',
        targetType: 'product', targetId: body.product_id,
        detail: { quantity_delta: body.quantity_delta, reason: body.reason.trim() },
        ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Adjustment submitted for approval' }, 201)
  } catch (err) {
    console.error('stock adjustment request error', err)
    return c.json({ success: false, error: 'Failed to submit stock adjustment', data: null }, 500)
  }
})

// GET /api/stock/take — recent stock-take sessions, most recent first
stock.get('/take', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const rows = await c.env.qesuite_db.prepare(
      'SELECT * FROM stock_take_sessions WHERE tenant_id = ? ORDER BY opened_at DESC LIMIT 50'
    ).bind(tenantId).all()
    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('stock take list error', err)
    return c.json({ success: false, error: 'Failed to fetch stock-take sessions', data: null }, 500)
  }
})

// GET /api/stock/take/:sessionId — session detail with lines
stock.get('/take/:sessionId', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const sessionId = c.req.param('sessionId')
    const session = await c.env.qesuite_db.prepare('SELECT * FROM stock_take_sessions WHERE id = ? AND tenant_id = ?').bind(sessionId, tenantId).first()
    if (!session) return c.json({ success: false, error: 'Stock-take session not found', data: null }, 404)

    const lines = await c.env.qesuite_db.prepare(
      `SELECT stl.*, p.name AS product_name, p.unit_of_measure
       FROM stock_take_lines stl JOIN products p ON p.id = stl.product_id
       WHERE stl.session_id = ? ORDER BY p.name COLLATE NOCASE ASC`
    ).bind(sessionId).all()

    return c.json({ success: true, data: { ...session, lines: lines.results }, error: null })
  } catch (err) {
    console.error('stock take detail error', err)
    return c.json({ success: false, error: 'Failed to fetch stock-take session', data: null }, 500)
  }
})

// POST /api/stock/take/open — snapshot current stock for all active products
// into a new counting session.
stock.post('/take/open', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const open = await c.env.qesuite_db.prepare("SELECT id FROM stock_take_sessions WHERE tenant_id = ? AND status = 'open'").bind(tenantId).first()
    if (open) return c.json({ success: false, error: 'A stock-take session is already open', data: null }, 409)

    const body = await c.req.json<{ notes?: string }>().catch(() => ({} as { notes?: string }))
    const products = await c.env.qesuite_db.prepare('SELECT id, stock FROM products WHERE tenant_id = ? AND is_active = 1').bind(tenantId).all<{ id: string; stock: number }>()
    if (products.results.length === 0) return c.json({ success: false, error: 'No active products to count', data: null }, 400)

    const sessionId = generateId()
    const statements = [
      c.env.qesuite_db.prepare(
        "INSERT INTO stock_take_sessions (id, tenant_id, status, opened_by, notes) VALUES (?, ?, 'open', ?, ?)"
      ).bind(sessionId, tenantId, user.sub, body.notes ?? null),
      ...products.results.map(product => c.env.qesuite_db.prepare(
        'INSERT INTO stock_take_lines (id, session_id, product_id, expected_quantity) VALUES (?, ?, ?, ?)'
      ).bind(generateId(), sessionId, product.id, product.stock)),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'stock_take.opened',
        targetType: 'stock_take_session', targetId: sessionId, detail: { product_count: products.results.length },
        ip: c.req.header('CF-Connecting-IP'),
      }),
    ]

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id: sessionId }, error: null, message: 'Stock-take opened' }, 201)
  } catch (err) {
    console.error('stock take open error', err)
    return c.json({ success: false, error: 'Failed to open stock-take session', data: null }, 500)
  }
})

// POST /api/stock/take/:sessionId/count — record counted quantities for one
// or more lines. A reason is required whenever the count doesn't match what
// was expected.
stock.post('/take/:sessionId/count', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const sessionId = c.req.param('sessionId')
    const body = await c.req.json<{ counts: { product_id: string; counted_quantity: number; reason?: string }[] }>()

    const session = await c.env.qesuite_db.prepare("SELECT status FROM stock_take_sessions WHERE id = ? AND tenant_id = ?").bind(sessionId, tenantId).first<{ status: string }>()
    if (!session) return c.json({ success: false, error: 'Stock-take session not found', data: null }, 404)
    if (session.status !== 'open') return c.json({ success: false, error: 'This stock-take session is no longer open', data: null }, 409)

    if (!Array.isArray(body.counts) || body.counts.length === 0) {
      return c.json({ success: false, error: 'At least one count is required', data: null }, 400)
    }

    const statements = []
    for (const count of body.counts) {
      if (!Number.isInteger(count.counted_quantity) || count.counted_quantity < 0) {
        return c.json({ success: false, error: 'counted_quantity must be a non-negative integer', data: null }, 400)
      }
      const line = await c.env.qesuite_db.prepare(
        'SELECT expected_quantity FROM stock_take_lines WHERE session_id = ? AND product_id = ?'
      ).bind(sessionId, count.product_id).first<{ expected_quantity: number }>()
      if (!line) return c.json({ success: false, error: `Product ${count.product_id} is not part of this session`, data: null }, 404)

      const variance = count.counted_quantity - line.expected_quantity
      if (variance !== 0 && !count.reason?.trim()) {
        return c.json({ success: false, error: `A reason is required for the count mismatch on product ${count.product_id}`, data: null }, 400)
      }

      statements.push(c.env.qesuite_db.prepare(
        `UPDATE stock_take_lines SET counted_quantity = ?, variance = ?, reason = ?, counted_by = ?, counted_at = datetime('now')
         WHERE session_id = ? AND product_id = ?`
      ).bind(count.counted_quantity, variance, count.reason?.trim() ?? null, user.sub, sessionId, count.product_id))
    }

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { session_id: sessionId }, error: null, message: 'Counts recorded' })
  } catch (err) {
    console.error('stock take count error', err)
    return c.json({ success: false, error: 'Failed to record counts', data: null }, 500)
  }
})

// POST /api/stock/take/:sessionId/close — post count_correction stock
// movements for every counted line with a variance, then close the session.
// Lines never counted are left untouched (no forced correction).
stock.post('/take/:sessionId/close', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const sessionId = c.req.param('sessionId')

    const session = await c.env.qesuite_db.prepare("SELECT status FROM stock_take_sessions WHERE id = ? AND tenant_id = ?").bind(sessionId, tenantId).first<{ status: string }>()
    if (!session) return c.json({ success: false, error: 'Stock-take session not found', data: null }, 404)
    if (session.status !== 'open') return c.json({ success: false, error: 'This stock-take session is no longer open', data: null }, 409)

    const lines = await c.env.qesuite_db.prepare(
      'SELECT * FROM stock_take_lines WHERE session_id = ? AND counted_quantity IS NOT NULL AND variance != 0'
    ).bind(sessionId).all<{ product_id: string; counted_quantity: number; variance: number }>()

    const statements: D1PreparedStatement[] = []
    const ip = c.req.header('CF-Connecting-IP')

    for (const line of lines.results) {
      const product = await c.env.qesuite_db.prepare('SELECT cost_price FROM products WHERE id = ?').bind(line.product_id).first<{ cost_price: number }>()
      statements.push(
        c.env.qesuite_db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?").bind(line.counted_quantity, line.product_id),
        c.env.qesuite_db.prepare(
          `INSERT INTO stock_movements
            (id, tenant_id, product_id, type, quantity_delta, unit_cost, resulting_stock, resulting_avg_cost, reference_type, reference_id, recorded_by)
           VALUES (?, ?, ?, 'count_correction', ?, ?, ?, ?, 'stock_take_session', ?, ?)`
        ).bind(generateId(), tenantId, line.product_id, line.variance, product?.cost_price ?? null, line.counted_quantity, product?.cost_price ?? null, sessionId, user.sub),
      )
    }

    statements.push(
      c.env.qesuite_db.prepare("UPDATE stock_take_sessions SET status = 'closed', closed_by = ?, closed_at = datetime('now') WHERE id = ?").bind(user.sub, sessionId),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'stock_take.closed',
        targetType: 'stock_take_session', targetId: sessionId, detail: { corrections: lines.results.length }, ip,
      }),
    )

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id: sessionId, corrections: lines.results.length }, error: null, message: 'Stock-take closed' })
  } catch (err) {
    console.error('stock take close error', err)
    return c.json({ success: false, error: 'Failed to close stock-take session', data: null }, 500)
  }
})

export default stock
