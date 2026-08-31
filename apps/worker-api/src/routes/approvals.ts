import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId } from '@qesuite/shared'
import { auditEntry } from '../lib/audit'
import { resolvePosSale, buildCreditBookingStatements, type PosSaleInput } from '../lib/posSale'
import { getOpenTill } from './pos'

const approvals = new Hono<{ Bindings: Env; Variables: Variables }>()

approvals.use('*', authMiddleware, tenantGuard, requireModule('approvals'))

type ApprovalRequestRow = {
  id: string
  tenant_id: string
  action_type: string
  target_type: string | null
  target_id: string | null
  payload_json: string
  reason: string | null
  status: string
  requested_by: string
}

// GET /api/approvals — the pending queue by default, or a status filter
approvals.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const status = c.req.query('status') ?? 'pending'

    const rows = await c.env.qesuite_db.prepare(
      `SELECT ar.*, u.name AS requested_by_name
       FROM approval_requests ar JOIN users u ON u.id = ar.requested_by
       WHERE ar.tenant_id = ? AND ar.status = ?
       ORDER BY ar.created_at DESC LIMIT 100`
    ).bind(tenantId, status).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('approvals list error', err)
    return c.json({ success: false, error: 'Failed to fetch approvals', data: null }, 500)
  }
})

// POST /api/approvals/:id/approve — applies the queued action's effect, then marks it approved
approvals.post('/:id/approve', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ note?: string }>().catch(() => ({} as { note?: string }))

    const request = await c.env.qesuite_db.prepare(
      'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<ApprovalRequestRow>()
    if (!request) return c.json({ success: false, error: 'Approval request not found', data: null }, 404)
    if (request.status !== 'pending') return c.json({ success: false, error: 'This request has already been decided', data: null }, 409)

    const payload = JSON.parse(request.payload_json) as Record<string, unknown>
    const ip = c.req.header('CF-Connecting-IP')
    const statements = []

    if (request.action_type === 'stock_adjustment') {
      const productId = request.target_id!
      const quantityDelta = payload.quantity_delta as number
      const product = await c.env.qesuite_db.prepare('SELECT stock, cost_price FROM products WHERE id = ?').bind(productId).first<{ stock: number; cost_price: number }>()
      if (!product) return c.json({ success: false, error: 'Product no longer exists', data: null }, 404)

      const newStock = Math.max(0, product.stock + quantityDelta)
      statements.push(
        c.env.qesuite_db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?").bind(newStock, productId),
        c.env.qesuite_db.prepare(
          `INSERT INTO stock_movements
            (id, tenant_id, product_id, type, quantity_delta, unit_cost, resulting_stock, resulting_avg_cost, reference_type, reference_id, reason, recorded_by)
           VALUES (?, ?, ?, 'adjustment', ?, ?, ?, ?, 'approval_request', ?, ?, ?)`
        ).bind(generateId(), tenantId, productId, quantityDelta, product.cost_price, newStock, product.cost_price, id, request.reason, user.sub),
      )
    } else if (request.action_type === 'expense_edit') {
      const expenseId = request.target_id!
      const fields: string[] = []
      const params: (string | number)[] = []
      if (typeof payload.category === 'string') { fields.push('category = ?'); params.push(payload.category) }
      if (typeof payload.description === 'string') { fields.push('description = ?'); params.push(payload.description) }
      if (typeof payload.amount === 'number') { fields.push('amount = ?'); params.push(payload.amount) }
      if (typeof payload.expense_date === 'string') { fields.push('expense_date = ?'); params.push(payload.expense_date) }
      if (fields.length > 0) {
        statements.push(c.env.qesuite_db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`).bind(...params, expenseId))
      }
    } else if (request.action_type === 'credit_write_off') {
      const invoiceId = request.target_id!
      const amount = payload.amount as number
      const customerId = payload.customer_id as string | null
      const invoice = await c.env.qesuite_db.prepare('SELECT total, amount_paid FROM invoices WHERE id = ?').bind(invoiceId).first<{ total: number; amount_paid: number }>()
      if (!invoice) return c.json({ success: false, error: 'Invoice no longer exists', data: null }, 404)

      const newAmountPaid = Math.min(invoice.total, invoice.amount_paid + amount)
      const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partially_paid'
      statements.push(
        c.env.qesuite_db.prepare("UPDATE invoices SET amount_paid = ?, status = ?, updated_at = datetime('now') WHERE id = ?").bind(newAmountPaid, newStatus, invoiceId),
      )
      if (customerId) {
        statements.push(c.env.qesuite_db.prepare('UPDATE customers SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?').bind(amount, customerId))
      }
    } else if (request.action_type === 'credit_limit_override') {
      const customerId = request.target_id!
      const { till_session_id: _ignored, ...saleInput } = payload as unknown as PosSaleInput & { till_session_id: string }

      const till = await getOpenTill(c.env.qesuite_db, tenantId)
      if (!till) {
        return c.json({ success: false, error: 'No till is currently open — open one before approving this sale', data: null }, 409)
      }

      const customer = await c.env.qesuite_db.prepare(
        'SELECT id, name, phone FROM customers WHERE id = ? AND tenant_id = ?'
      ).bind(customerId, tenantId).first<{ id: string; name: string; phone: string | null }>()
      if (!customer) return c.json({ success: false, error: 'Customer no longer exists', data: null }, 404)

      // Stock/prices are re-resolved fresh rather than trusting the
      // request-time snapshot — time may have passed since the cashier
      // submitted this for approval.
      const resolved = await resolvePosSale(c.env.qesuite_db, tenantId, request.requested_by, till, saleInput)
      if (!resolved.ok) return c.json({ success: false, error: resolved.error, data: null }, resolved.status)

      statements.push(
        ...resolved.statements,
        ...await buildCreditBookingStatements(
          c.env.qesuite_db, tenantId, request.requested_by, customer,
          { saleId: resolved.saleId, receiptCode: resolved.receiptCode, total: resolved.total },
          resolved.resolvedItems,
        ),
      )
    } else {
      return c.json({ success: false, error: `Approving "${request.action_type}" requests isn't supported yet`, data: null }, 501)
    }

    statements.push(
      c.env.qesuite_db.prepare(
        "UPDATE approval_requests SET status = 'approved', decided_by = ?, decision_note = ?, decided_at = datetime('now') WHERE id = ?"
      ).bind(user.sub, body.note ?? null, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'approval.approved',
        targetType: request.target_type ?? 'approval_request', targetId: request.target_id ?? id,
        detail: { action_type: request.action_type }, ip,
      }),
    )

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id }, error: null, message: 'Request approved' })
  } catch (err) {
    console.error('approval decide error', err)
    return c.json({ success: false, error: 'Failed to approve request', data: null }, 500)
  }
})

// POST /api/approvals/:id/reject — no side effect on the underlying record
approvals.post('/:id/reject', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ note?: string }>().catch(() => ({} as { note?: string }))

    const request = await c.env.qesuite_db.prepare(
      'SELECT * FROM approval_requests WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<ApprovalRequestRow>()
    if (!request) return c.json({ success: false, error: 'Approval request not found', data: null }, 404)
    if (request.status !== 'pending') return c.json({ success: false, error: 'This request has already been decided', data: null }, 409)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        "UPDATE approval_requests SET status = 'rejected', decided_by = ?, decision_note = ?, decided_at = datetime('now') WHERE id = ?"
      ).bind(user.sub, body.note ?? null, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'approval.rejected',
        targetType: request.target_type ?? 'approval_request', targetId: request.target_id ?? id,
        detail: { action_type: request.action_type, note: body.note }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Request rejected' })
  } catch (err) {
    console.error('approval reject error', err)
    return c.json({ success: false, error: 'Failed to reject request', data: null }, 500)
  }
})

export default approvals
