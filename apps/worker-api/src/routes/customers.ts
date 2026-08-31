import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId, validatePhone, normalizeKenyaPhone } from '@qesuite/shared'
import { auditEntry } from '../lib/audit'

const customers = new Hono<{ Bindings: Env; Variables: Variables }>()
customers.use('*', authMiddleware, tenantGuard)

// GET /api/customers — paginated customer list for the store owner
customers.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const page  = Math.max(1, parseInt(c.req.query('page')  ?? '1', 10))
    const limit = Math.min(parseInt(c.req.query('limit') ?? '25', 10), 100)
    const offset = (page - 1) * limit
    const search = c.req.query('search')?.trim()

    const conditions = ['c.tenant_id = ?']
    const params: (string | number)[] = [tenantId]
    if (search) {
      conditions.push('(c.name LIKE ? OR c.phone LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    const where = conditions.join(' AND ')

    const countRow = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM customers c WHERE ${where}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT c.id, c.name, c.phone, c.order_count, c.total_spend,
              c.first_order_at, c.last_order_at
       FROM customers c
       WHERE ${where}
       ORDER BY c.last_order_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: rows.results,
      meta: {
        total: countRow?.cnt ?? 0,
        page,
        limit,
        total_pages: Math.ceil((countRow?.cnt ?? 0) / limit),
      },
      error: null,
    })
  } catch (err) {
    console.error('customers list error', err)
    return c.json({ success: false, error: 'Failed to fetch customers', data: null }, 500)
  }
})

// GET /api/customers/summary — quick stats for the dashboard
customers.get('/summary', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const row = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as total,
              COUNT(*) FILTER (WHERE order_count > 1) as repeat_customers,
              COALESCE(SUM(total_spend), 0) as total_revenue
       FROM customers WHERE tenant_id = ?`
    ).bind(tenantId).first<{ total: number; repeat_customers: number; total_revenue: number }>()
    return c.json({ success: true, data: row ?? { total: 0, repeat_customers: 0, total_revenue: 0 }, error: null })
  } catch {
    return c.json({ success: true, data: { total: 0, repeat_customers: 0, total_revenue: 0 }, error: null })
  }
})

// GET /api/customers/:id — profile plus open (unpaid) credit sales/invoices
customers.get('/:id', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')

    const customer = await c.env.qesuite_db.prepare(
      `SELECT id, name, phone, email, credit_limit, credit_balance, order_count, total_spend, first_order_at, last_order_at
       FROM customers WHERE id = ? AND tenant_id = ?`
    ).bind(id, tenantId).first()
    if (!customer) return c.json({ success: false, error: 'Customer not found', data: null }, 404)

    const openInvoices = await c.env.qesuite_db.prepare(
      `SELECT id, invoice_number, total, amount_paid, due_date, created_at
       FROM invoices
       WHERE customer_id = ? AND tenant_id = ? AND status IN ('sent','partially_paid','overdue')
       ORDER BY created_at ASC`
    ).bind(id, tenantId).all()

    return c.json({ success: true, data: { ...customer, open_invoices: openInvoices.results }, error: null })
  } catch (err) {
    console.error('customer detail error', err)
    return c.json({ success: false, error: 'Failed to fetch customer', data: null }, 500)
  }
})

type CustomerBody = { name: string; phone: string; email?: string | null; credit_limit?: number }

function validateCustomerBody(body: Partial<CustomerBody>): string | null {
  if (!body.name?.trim()) return 'name is required'
  if (body.credit_limit !== undefined && (!Number.isInteger(body.credit_limit) || body.credit_limit < 0)) {
    return 'credit_limit must be a non-negative whole KES amount'
  }
  return null
}

// POST /api/customers — register a customer (a credit sale can only be made
// against an existing customer record, so this is how one gets created ahead
// of time — distinct from the implicit walk-in customer rows an order/invoice
// creates on the fly).
customers.post('/', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<CustomerBody>()

    const validationError = validateCustomerBody(body)
    if (validationError) return c.json({ success: false, error: validationError, data: null }, 400)
    if (!body.phone || !validatePhone(body.phone)) {
      return c.json({ success: false, error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
    }
    const phone = normalizeKenyaPhone(body.phone)

    const existing = await c.env.qesuite_db.prepare('SELECT id FROM customers WHERE tenant_id = ? AND phone = ?').bind(tenantId, phone).first()
    if (existing) return c.json({ success: false, error: 'A customer with this phone number already exists', data: null }, 409)

    const id = generateId()
    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `INSERT INTO customers (id, tenant_id, name, phone, email, credit_limit, order_count, total_spend)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0)`
      ).bind(id, tenantId, body.name.trim(), phone, body.email?.trim() || null, body.credit_limit ?? 0),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'customer.created',
        targetType: 'customer', targetId: id, detail: { name: body.name.trim(), credit_limit: body.credit_limit ?? 0 },
        ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Customer added' }, 201)
  } catch (err) {
    console.error('customer create error', err)
    return c.json({ success: false, error: 'Failed to create customer', data: null }, 500)
  }
})

// PUT /api/customers/:id — edit profile and credit limit
customers.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<CustomerBody>()

    const validationError = validateCustomerBody(body)
    if (validationError) return c.json({ success: false, error: validationError, data: null }, 400)

    const existing = await c.env.qesuite_db.prepare('SELECT id FROM customers WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first()
    if (!existing) return c.json({ success: false, error: 'Customer not found', data: null }, 404)

    let phone: string | undefined
    if (body.phone) {
      if (!validatePhone(body.phone)) return c.json({ success: false, error: 'Enter a valid Kenyan phone number, e.g. 0712345678', data: null }, 400)
      phone = normalizeKenyaPhone(body.phone)
      const taken = await c.env.qesuite_db.prepare('SELECT id FROM customers WHERE tenant_id = ? AND phone = ? AND id != ?').bind(tenantId, phone, id).first()
      if (taken) return c.json({ success: false, error: 'Another customer already uses this phone number', data: null }, 409)
    }

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `UPDATE customers SET name = ?, phone = COALESCE(?, phone), email = ?, credit_limit = ? WHERE id = ?`
      ).bind(body.name.trim(), phone ?? null, body.email?.trim() || null, body.credit_limit ?? 0, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'customer.updated',
        targetType: 'customer', targetId: id, detail: { credit_limit: body.credit_limit ?? 0 },
        ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Customer updated' })
  } catch (err) {
    console.error('customer update error', err)
    return c.json({ success: false, error: 'Failed to update customer', data: null }, 500)
  }
})

export default customers
