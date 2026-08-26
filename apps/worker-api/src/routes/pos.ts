import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, restaurantGuard } from '../middleware/tenant'
import { generateId, generateTrackingCode } from '../lib/jwt'
import { EXPENSE_CATEGORIES } from '@qesuite/shared'
import { businessDate, inclusiveDateRange } from '../lib/time'

const pos = new Hono<{ Bindings: Env; Variables: Variables }>()

pos.use('*', authMiddleware, tenantGuard, restaurantGuard)

type PosPaymentMethod = 'cash' | 'mpesa'

function parseDateRange(period?: string | null, from?: string | null, to?: string | null): { dateFrom: string; dateTo: string } {
  return inclusiveDateRange(period ?? 'today', from, to)
}

interface PosTillSummary {
  id: string
  tenant_id: string
  business_date: string
  opening_float: number
  status: 'open' | 'closed'
  opened_by: string
  opened_at: string
  closed_by: string | null
  closed_at: string | null
  counted_cash: number | null
  expected_cash: number | null
  variance: number | null
  running_float: number
  cash_sales: number
  paid_in: number
  paid_out: number
  corrections: number
  movement_count: number
}

function validKesAmount(value: unknown, options: { allowZero?: boolean; signed?: boolean } = {}): value is number {
  if (!Number.isSafeInteger(value)) return false
  if (Math.abs(value as number) > 100_000_000) return false
  if (options.signed) return options.allowZero ? true : value !== 0
  return options.allowZero ? (value as number) >= 0 : (value as number) > 0
}

async function getOpenTill(db: D1Database, tenantId: string): Promise<PosTillSummary | null> {
  return db.prepare(
    `SELECT ts.id, ts.tenant_id, ts.business_date, ts.opening_float, ts.status,
            ts.opened_by, ts.opened_at, ts.closed_by, ts.closed_at,
            ts.counted_cash, ts.expected_cash, ts.variance,
            COALESCE(SUM(cm.amount), 0) AS running_float,
            COALESCE(SUM(CASE WHEN cm.movement_type = 'cash_sale' THEN cm.amount ELSE 0 END), 0) AS cash_sales,
            COALESCE(SUM(CASE WHEN cm.movement_type = 'paid_in' THEN cm.amount ELSE 0 END), 0) AS paid_in,
            COALESCE(SUM(CASE WHEN cm.movement_type = 'paid_out' THEN ABS(cm.amount) ELSE 0 END), 0) AS paid_out,
            COALESCE(SUM(CASE WHEN cm.movement_type = 'correction' THEN cm.amount ELSE 0 END), 0) AS corrections,
            COUNT(cm.id) AS movement_count
     FROM pos_till_sessions ts
     LEFT JOIN pos_cash_movements cm ON cm.till_session_id = ts.id
     WHERE ts.tenant_id = ? AND ts.status = 'open'
     GROUP BY ts.id
     LIMIT 1`
  ).bind(tenantId).first<PosTillSummary>()
}

async function getRecentTillMovements(db: D1Database, tenantId: string, tillId: string) {
  return db.prepare(
    `SELECT id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at
     FROM pos_cash_movements
     WHERE tenant_id = ? AND till_session_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT 20`
  ).bind(tenantId, tillId).all()
}

// GET /api/pos/till/current — active till and its running cash ledger balance
pos.get('/till/current', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const till = await getOpenTill(c.env.qesuite_db, tenantId)
    if (!till) return c.json({ success: true, data: null, error: null })
    const movements = await getRecentTillMovements(c.env.qesuite_db, tenantId, till.id)
    return c.json({ success: true, data: { ...till, recent_movements: movements.results }, error: null })
  } catch (err) {
    console.error('pos till current error', err)
    return c.json({ success: false, error: 'Failed to load the current till', data: null }, 500)
  }
})

// GET /api/pos/till/history — persisted opening/closing balances and variances
pos.get('/till/history', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const rows = await c.env.qesuite_db.prepare(
      `SELECT ts.id, ts.tenant_id, ts.business_date, ts.opening_float, ts.status, ts.opened_by, ts.opened_at,
              ts.closed_by, ts.closed_at, ts.counted_cash, ts.expected_cash, ts.variance,
              COALESCE(SUM(cm.amount), 0) AS running_float,
              COALESCE(SUM(CASE WHEN cm.movement_type = 'cash_sale' THEN cm.amount ELSE 0 END), 0) AS cash_sales,
              COALESCE(SUM(CASE WHEN cm.movement_type = 'paid_in' THEN cm.amount ELSE 0 END), 0) AS paid_in,
              COALESCE(SUM(CASE WHEN cm.movement_type = 'paid_out' THEN ABS(cm.amount) ELSE 0 END), 0) AS paid_out,
              COALESCE(SUM(CASE WHEN cm.movement_type = 'correction' THEN cm.amount ELSE 0 END), 0) AS corrections,
              COUNT(cm.id) AS movement_count
       FROM pos_till_sessions ts
       LEFT JOIN pos_cash_movements cm ON cm.till_session_id = ts.id
       WHERE ts.tenant_id = ?
       GROUP BY ts.id
       ORDER BY ts.opened_at DESC
       LIMIT 50`
    ).bind(tenantId).all()
    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('pos till history error', err)
    return c.json({ success: false, error: 'Failed to load till history', data: null }, 500)
  }
})

// POST /api/pos/till/open — start an operating session with opening cash
pos.post('/till/open', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{ opening_float?: number; business_date?: string }>()
    const openingFloat = body.opening_float
    const tillBusinessDate = body.business_date ?? businessDate()

    if (!validKesAmount(openingFloat, { allowZero: true })) {
      return c.json({ success: false, error: 'Cash at the start must be a whole KES amount from 0 to 100,000,000', data: null }, 400)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tillBusinessDate) || tillBusinessDate !== businessDate()) {
      return c.json({ success: false, error: 'Invalid business date', data: null }, 400)
    }

    const existing = await getOpenTill(c.env.qesuite_db, tenantId)
    if (existing) {
      return c.json({ success: false, error: 'A till is already open for this store', data: existing }, 409)
    }

    const tillId = generateId()
    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO pos_till_sessions
          (id, tenant_id, business_date, opening_float, status, opened_by, opened_at)
         VALUES (?, ?, ?, ?, 'open', ?, datetime('now'))`
      ).bind(tillId, tenantId, tillBusinessDate, openingFloat, user.sub),
      ...(openingFloat > 0 ? [
        c.env.qesuite_db.prepare(
          `INSERT INTO pos_cash_movements
            (id, tenant_id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at)
           VALUES (?, ?, ?, 'opening_float', ?, 'Opening operating float', ?, ?, datetime('now'))`
        ).bind(generateId(), tenantId, tillId, openingFloat, tillId, user.sub),
      ] : []),
      c.env.qesuite_db.prepare(
        `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
         VALUES (?, ?, ?, 'pos.till.open', 'pos_till_session', ?, ?, ?)`
      ).bind(
        generateId(), user.sub, user.role, tillId,
        JSON.stringify({ tenant_id: tenantId, opening_float: openingFloat, business_date: tillBusinessDate }),
        c.req.header('CF-Connecting-IP') ?? null
      ),
    ]

    await c.env.qesuite_db.batch(statements)
    const till = await getOpenTill(c.env.qesuite_db, tenantId)
    return c.json({ success: true, data: till, error: null, message: 'Till opened' }, 201)
  } catch (err) {
    console.error('pos till open error', err)
    const message = err instanceof Error ? err.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, error: 'A till is already open for this store', data: null }, 409)
    }
    return c.json({ success: false, error: 'Failed to open the till', data: null }, 500)
  }
})

// POST /api/pos/till/movements — append paid-in, paid-out, or correction cash
pos.post('/till/movements', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{
      movement_type?: 'paid_in' | 'paid_out' | 'correction'
      amount?: number
      reason?: string
      record_as_expense?: boolean
      expense_category?: keyof typeof EXPENSE_CATEGORIES
    }>()

    if (!['paid_in', 'paid_out', 'correction'].includes(body.movement_type ?? '')) {
      return c.json({ success: false, error: 'Choose how the till cash changed', data: null }, 400)
    }
    const signed = body.movement_type === 'correction'
    if (!validKesAmount(body.amount, { signed })) {
      return c.json({ success: false, error: signed ? 'The corrected amount must change the till by a whole KES amount' : 'Enter a positive whole KES amount', data: null }, 400)
    }
    const reason = body.reason?.trim() ?? ''
    if (!reason || reason.length > 300) {
      return c.json({ success: false, error: 'Say why the cash changed (up to 300 characters)', data: null }, 400)
    }
    if (body.record_as_expense && body.movement_type !== 'paid_out') {
      return c.json({ success: false, error: 'Only cash taken out can be saved as a business expense', data: null }, 400)
    }
    if (body.record_as_expense && (!body.expense_category || !(body.expense_category in EXPENSE_CATEGORIES))) {
      return c.json({ success: false, error: 'Choose the type of business expense', data: null }, 400)
    }

    const till = await getOpenTill(c.env.qesuite_db, tenantId)
    if (!till) return c.json({ success: false, error: 'Open the till before changing its cash', data: null }, 409)

    const movementId = generateId()
    const amount = body.movement_type === 'paid_out' ? -body.amount : body.amount
    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `INSERT INTO pos_cash_movements
          (id, tenant_id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(movementId, tenantId, till.id, body.movement_type, amount, reason, movementId, user.sub),
      ...(body.record_as_expense && body.expense_category ? [
        c.env.qesuite_db.prepare(
          `INSERT INTO expenses
            (id, tenant_id, category, description, amount, expense_date, recorded_by, created_at, cash_movement_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`
        ).bind(
          generateId(), tenantId, body.expense_category, reason, Math.abs(amount),
          till.business_date, user.sub, movementId
        ),
      ] : []),
      c.env.qesuite_db.prepare(
        `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
         VALUES (?, ?, ?, 'pos.cash.movement', 'pos_cash_movement', ?, ?, ?)`
      ).bind(
        generateId(), user.sub, user.role, movementId,
        JSON.stringify({
          tenant_id: tenantId,
          till_session_id: till.id,
          movement_type: body.movement_type,
          amount,
          reason,
          recorded_as_expense: body.record_as_expense === true,
          expense_category: body.record_as_expense ? body.expense_category : null,
        }),
        c.req.header('CF-Connecting-IP') ?? null
      ),
    ])

    const updated = await getOpenTill(c.env.qesuite_db, tenantId)
    return c.json({
      success: true,
      data: updated,
      error: null,
      message: body.record_as_expense ? 'Cash taken out and expense saved' : 'Cash change saved',
    }, 201)
  } catch (err) {
    console.error('pos cash movement error', err)
    return c.json({ success: false, error: 'Failed to save the cash change', data: null }, 500)
  }
})

// POST /api/pos/till/close — cash up and persist the drawer variance
pos.post('/till/close', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{ counted_cash?: number }>()
    if (!validKesAmount(body.counted_cash, { allowZero: true })) {
      return c.json({ success: false, error: 'The cash you counted must be a whole KES amount of 0 or more', data: null }, 400)
    }

    const till = await getOpenTill(c.env.qesuite_db, tenantId)
    if (!till) return c.json({ success: false, error: 'No open till exists', data: null }, 409)

    const results = await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `UPDATE pos_till_sessions
         SET status = 'closed', closed_by = ?, closed_at = datetime('now'),
             counted_cash = ?,
             expected_cash = COALESCE((
               SELECT SUM(amount) FROM pos_cash_movements WHERE till_session_id = pos_till_sessions.id
             ), 0),
             variance = ? - COALESCE((
               SELECT SUM(amount) FROM pos_cash_movements WHERE till_session_id = pos_till_sessions.id
             ), 0)
         WHERE id = ? AND tenant_id = ? AND status = 'open'`
      ).bind(user.sub, body.counted_cash, body.counted_cash, till.id, tenantId),
      c.env.qesuite_db.prepare(
        `INSERT INTO audit_log (id, actor_id, actor_role, action, target_type, target_id, detail, ip)
         SELECT ?, ?, ?, 'pos.till.close', 'pos_till_session', ?,
                json_object(
                  'tenant_id', tenant_id,
                  'counted_cash', counted_cash,
                  'expected_cash', expected_cash,
                  'variance', variance
                ), ?
         FROM pos_till_sessions
         WHERE id = ? AND tenant_id = ? AND changes() = 1`
      ).bind(
        generateId(), user.sub, user.role, till.id,
        c.req.header('CF-Connecting-IP') ?? null, till.id, tenantId
      ),
    ])
    if (results[0]?.meta.changes !== 1) {
      return c.json({ success: false, error: 'The till was already closed', data: null }, 409)
    }

    const closed = await c.env.qesuite_db.prepare(
      `SELECT id, counted_cash, expected_cash, variance
       FROM pos_till_sessions WHERE id = ? AND tenant_id = ?`
    ).bind(till.id, tenantId).first<{
      id: string; counted_cash: number; expected_cash: number; variance: number
    }>()
    if (!closed) throw new Error('Closed till record was not found')

    return c.json({
      success: true,
      data: closed,
      error: null,
      message: 'Till closed',
    })
  } catch (err) {
    console.error('pos till close error', err)
    return c.json({ success: false, error: 'Failed to close the till', data: null }, 500)
  }
})

// POST /api/pos — ring up a walk-in/dine-in sale
pos.post('/', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      items: Array<{ product_id: string; quantity: number }>
      payment_method: PosPaymentMethod
      amount_tendered?: number
      mpesa_reference?: string
      discount?: number
      table_label?: string
      note?: string
    }>()

    if (!body.items?.length) {
      return c.json({ success: false, error: 'items is required', data: null }, 400)
    }
    if (body.items.length > 50) {
      return c.json({ success: false, error: 'Too many items', data: null }, 400)
    }
    if (!['cash', 'mpesa'].includes(body.payment_method)) {
      return c.json({ success: false, error: 'Invalid payment method', data: null }, 400)
    }
    if (body.payment_method === 'mpesa' && !body.mpesa_reference?.trim()) {
      return c.json({ success: false, error: 'mpesa_reference is required for M-Pesa sales', data: null }, 400)
    }
    if (body.table_label && body.table_label.length > 60) {
      return c.json({ success: false, error: 'Table label too long', data: null }, 400)
    }
    if (body.note && body.note.length > 500) {
      return c.json({ success: false, error: 'Note too long', data: null }, 400)
    }

    const till = await getOpenTill(c.env.qesuite_db, tenantId)
    if (!till) {
      return c.json({ success: false, error: 'Open the POS till before recording a sale', data: null }, 409)
    }

    let subtotal = 0
    const resolvedItems: Array<{
      id: string; product_id: string; product_name: string; quantity: number; unit_price: number; line_total: number
    }> = []

    for (const item of body.items) {
      if (!item.product_id || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
        return c.json({ success: false, error: 'Each item needs product_id and a whole quantity of at least 1', data: null }, 400)
      }

      const product = await c.env.qesuite_db.prepare(
        'SELECT id, name, price, sale_price, stock, is_active FROM products WHERE id = ? AND tenant_id = ?'
      ).bind(item.product_id, tenantId).first<{
        id: string; name: string; price: number; sale_price: number | null
        stock: number; is_active: number
      }>()

      if (!product || !product.is_active) {
        return c.json({ success: false, error: `Product ${item.product_id} not available`, data: null }, 400)
      }
      if (product.stock < item.quantity) {
        return c.json({ success: false, error: `Insufficient stock for ${product.name}`, data: null }, 400)
      }

      const unitPrice = product.sale_price ?? product.price
      const lineTotal = unitPrice * item.quantity
      subtotal += lineTotal
      resolvedItems.push({
        id: generateId(),
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
      })
    }

    if (body.discount !== undefined && !validKesAmount(body.discount, { allowZero: true })) {
      return c.json({ success: false, error: 'Discount must be a non-negative whole KES amount', data: null }, 400)
    }
    const discount = Math.max(0, body.discount ?? 0)
    if (discount > subtotal) {
      return c.json({ success: false, error: 'Discount cannot exceed the subtotal', data: null }, 400)
    }
    const total = Math.max(0, subtotal - discount)

    let amountTendered: number | null = null
    let changeDue: number | null = null
    if (body.payment_method === 'cash' && body.amount_tendered !== undefined) {
      if (!validKesAmount(body.amount_tendered, { allowZero: true })) {
        return c.json({ success: false, error: 'Amount tendered must be a non-negative whole KES amount', data: null }, 400)
      }
      if (body.amount_tendered < total) {
        return c.json({ success: false, error: 'Amount tendered is less than the total', data: null }, 400)
      }
      amountTendered = body.amount_tendered
      changeDue = body.amount_tendered - total
    }

    // Generate a unique receipt code (retry on collision, same pattern as order tracking codes)
    let receiptCode = generateTrackingCode()
    while (true) {
      const exists = await c.env.qesuite_db.prepare(
        'SELECT id FROM pos_sales WHERE tenant_id = ? AND receipt_code = ?'
      ).bind(tenantId, receiptCode).first()
      if (!exists) break
      receiptCode = generateTrackingCode()
    }

    const saleId = generateId()

    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO pos_sales (id, tenant_id, receipt_code, subtotal, discount, total, payment_method,
          amount_tendered, change_due, mpesa_reference, status, table_label, note, served_by,
          served_by_user_id, created_at, till_session_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, datetime('now'), ?)`
      ).bind(
        saleId, tenantId, receiptCode, subtotal, discount, total, body.payment_method,
        amountTendered, changeDue, body.mpesa_reference?.trim() ?? null,
        body.table_label ?? null, body.note ?? null, user.sub, user.sub, till.id
      ),
      ...resolvedItems.map(item =>
        c.env.qesuite_db.prepare(
          'INSERT INTO pos_sale_items (id, sale_id, product_id, product_name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(item.id, saleId, item.product_id, item.product_name, item.quantity, item.unit_price, item.line_total)
      ),
      ...resolvedItems.map(item =>
        c.env.qesuite_db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?')
          .bind(item.quantity, item.product_id)
      ),
      ...(body.payment_method === 'cash' && total > 0 ? [
        c.env.qesuite_db.prepare(
          `INSERT INTO pos_cash_movements
            (id, tenant_id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at)
           VALUES (?, ?, ?, 'cash_sale', ?, ?, ?, ?, datetime('now'))`
        ).bind(generateId(), tenantId, till.id, total, `Cash sale ${receiptCode}`, saleId, user.sub),
      ] : []),
    ]

    await c.env.qesuite_db.batch(statements)

    return c.json({
      success: true,
      data: {
        sale_id: saleId,
        receipt_code: receiptCode,
        subtotal,
        discount,
        total,
        payment_method: body.payment_method,
        amount_tendered: amountTendered,
        change_due: changeDue,
        till_session_id: till.id,
        running_float: till.running_float + (body.payment_method === 'cash' ? total : 0),
        items: resolvedItems,
      },
      error: null,
      message: `Sale ${receiptCode} recorded`,
    }, 201)
  } catch (err) {
    console.error('pos sale create error', err)
    if (err instanceof Error && err.message.includes('POS till is not open')) {
      return c.json({ success: false, error: 'The POS till is no longer open. Open a till before recording a sale.', data: null }, 409)
    }
    return c.json({ success: false, error: 'Failed to record sale', data: null }, 500)
  }
})

// GET /api/pos — list sales
pos.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const status = c.req.query('status')
    const fromParam = c.req.query('from')
    const toParam = c.req.query('to')
    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100)
    const offset = (page - 1) * limit

    const conditions = ['tenant_id = ?']
    const params: (string | number)[] = [tenantId]

    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }
    if (fromParam && toParam) {
      conditions.push("date(created_at, '+3 hours') >= ?")
      conditions.push("date(created_at, '+3 hours') <= ?")
      params.push(fromParam, toParam)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM pos_sales WHERE ${whereClause}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT id, receipt_code, subtotal, discount, total, payment_method, status, till_session_id,
              table_label, note, created_at, voided_at, void_reason,
              (SELECT GROUP_CONCAT(product_name || ' x' || quantity) FROM pos_sale_items WHERE sale_id = pos_sales.id) as items_summary
       FROM pos_sales
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: { items: rows.results, total: countResult?.cnt ?? 0, page, limit },
      error: null,
    })
  } catch (err) {
    console.error('pos list error', err)
    return c.json({ success: false, error: 'Failed to fetch sales', data: null }, 500)
  }
})

// GET /api/pos/report — revenue by payment method + top items for a date range
pos.get('/report', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(c.req.query('period'), c.req.query('from'), c.req.query('to'))

    const summary = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as sale_count, COALESCE(SUM(total), 0) as revenue
       FROM pos_sales
       WHERE tenant_id = ? AND status = 'completed' AND date(created_at, '+3 hours') >= ? AND date(created_at, '+3 hours') <= ?`
    ).bind(tenantId, range.dateFrom, range.dateTo).first<{ sale_count: number; revenue: number }>()

    const byMethod = await c.env.qesuite_db.prepare(
      `SELECT payment_method, COUNT(*) as sale_count, COALESCE(SUM(total), 0) as revenue
       FROM pos_sales
       WHERE tenant_id = ? AND status = 'completed' AND date(created_at, '+3 hours') >= ? AND date(created_at, '+3 hours') <= ?
       GROUP BY payment_method`
    ).bind(tenantId, range.dateFrom, range.dateTo).all<{ payment_method: string; sale_count: number; revenue: number }>()

    const voidedCount = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM pos_sales
       WHERE tenant_id = ? AND status = 'voided' AND date(created_at, '+3 hours') >= ? AND date(created_at, '+3 hours') <= ?`
    ).bind(tenantId, range.dateFrom, range.dateTo).first<{ cnt: number }>()

    const topItems = await c.env.qesuite_db.prepare(
      `SELECT psi.product_name,
              SUM(psi.quantity) as total_quantity,
              SUM(psi.line_total) as total_revenue
       FROM pos_sale_items psi
       JOIN pos_sales ps ON ps.id = psi.sale_id
       WHERE ps.tenant_id = ? AND ps.status = 'completed'
         AND date(ps.created_at, '+3 hours') >= ? AND date(ps.created_at, '+3 hours') <= ?
       GROUP BY psi.product_name
       ORDER BY total_revenue DESC
       LIMIT 10`
    ).bind(tenantId, range.dateFrom, range.dateTo).all()

    const expenseSummary = await c.env.qesuite_db.prepare(
      `SELECT COALESCE(SUM(amount), 0) AS expenses, COUNT(*) AS expense_count
       FROM expenses
       WHERE tenant_id = ? AND expense_date >= ? AND expense_date <= ?`
    ).bind(tenantId, range.dateFrom, range.dateTo).first<{ expenses: number; expense_count: number }>()

    const expensesByCategory = await c.env.qesuite_db.prepare(
      `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM expenses
       WHERE tenant_id = ? AND expense_date >= ? AND expense_date <= ?
       GROUP BY category
       ORDER BY total DESC`
    ).bind(tenantId, range.dateFrom, range.dateTo).all()

    const revenue = summary?.revenue ?? 0
    const expenseTotal = expenseSummary?.expenses ?? 0

    return c.json({
      success: true,
      data: {
        date_from: range.dateFrom,
        date_to: range.dateTo,
        revenue,
        expenses: expenseTotal,
        profit_loss: revenue - expenseTotal,
        expense_count: expenseSummary?.expense_count ?? 0,
        expenses_by_category: expensesByCategory.results,
        sale_count: summary?.sale_count ?? 0,
        voided_count: voidedCount?.cnt ?? 0,
        by_payment_method: byMethod.results,
        top_items: topItems.results,
      },
      error: null,
    })
  } catch (err) {
    console.error('pos report error', err)
    return c.json({ success: false, error: 'Failed to load sales report', data: null }, 500)
  }
})

// GET /api/pos/:id — sale detail
pos.get('/:id', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')

    const sale = await c.env.qesuite_db.prepare(
      'SELECT * FROM pos_sales WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!sale) {
      return c.json({ success: false, error: 'Sale not found', data: null }, 404)
    }

    const items = await c.env.qesuite_db.prepare(
      'SELECT * FROM pos_sale_items WHERE sale_id = ?'
    ).bind(id).all()

    return c.json({ success: true, data: { sale, items: items.results }, error: null })
  } catch (err) {
    console.error('pos detail error', err)
    return c.json({ success: false, error: 'Failed to fetch sale', data: null }, 500)
  }
})

// POST /api/pos/:id/void — void a completed sale and restock its items
pos.post('/:id/void', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const { reason } = await c.req.json<{ reason?: string }>()
    if (!reason?.trim() || reason.trim().length > 300) {
      return c.json({ success: false, error: 'reason is required', data: null }, 400)
    }

    const sale = await c.env.qesuite_db.prepare(
      'SELECT id, receipt_code, status, payment_method, total FROM pos_sales WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{
      id: string; receipt_code: string; status: string; payment_method: PosPaymentMethod; total: number
    }>()

    if (!sale) {
      return c.json({ success: false, error: 'Sale not found', data: null }, 404)
    }
    if (sale.status === 'voided') {
      return c.json({ success: false, error: 'Sale is already voided', data: null }, 400)
    }

    const till = sale.payment_method === 'cash'
      ? await getOpenTill(c.env.qesuite_db, tenantId)
      : null
    if (sale.payment_method === 'cash' && !till) {
      return c.json({ success: false, error: 'Open the POS till before refunding a cash sale', data: null }, 409)
    }

    const items = await c.env.qesuite_db.prepare(
      'SELECT product_id, quantity FROM pos_sale_items WHERE sale_id = ?'
    ).bind(id).all<{ product_id: string | null; quantity: number }>()

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `UPDATE pos_sales
         SET status = 'voided', void_reason = ?, voided_by_user_id = ?, voided_at = datetime('now')
         WHERE id = ? AND tenant_id = ?`
      ).bind(reason.trim(), user.sub, id, tenantId),
      ...items.results
        .filter(item => item.product_id)
        .map(item =>
          c.env.qesuite_db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
            .bind(item.quantity, item.product_id)
        ),
      ...(sale.payment_method === 'cash' && till && sale.total > 0 ? [
        c.env.qesuite_db.prepare(
          `INSERT INTO pos_cash_movements
            (id, tenant_id, till_session_id, movement_type, amount, reason, reference_id, recorded_by, created_at)
           VALUES (?, ?, ?, 'cash_void', ?, ?, ?, ?, datetime('now'))`
        ).bind(
          generateId(), tenantId, till.id, -sale.total,
          `Void ${sale.receipt_code}: ${reason.trim()}`, sale.id, user.sub
        ),
      ] : []),
    ])

    return c.json({
      success: true,
      data: {
        id,
        status: 'voided',
        running_float: till ? till.running_float - sale.total : undefined,
      },
      error: null,
      message: 'Sale voided',
    })
  } catch (err) {
    console.error('pos void error', err)
    return c.json({ success: false, error: 'Failed to void sale', data: null }, 500)
  }
})

export default pos
