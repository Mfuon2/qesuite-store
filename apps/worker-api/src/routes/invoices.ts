import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId, normalizeKenyaPhone } from '@qesuite/shared'
import { auditEntry } from '../lib/audit'
import { nextSequenceNumber } from '../lib/sequences'
import { buildDocumentPdf } from '../lib/pdf'

const invoices = new Hono<{ Bindings: Env; Variables: Variables }>()

invoices.use('*', authMiddleware, tenantGuard, requireModule('finance'))

const INVOICE_NUMBER_PREFIX: Record<string, string> = {
  quotation: 'QUO', proforma: 'PF', invoice: 'INV', recurring: 'REC',
}

type ItemInput = { product_id?: string; description: string; quantity: number; unit_price: number }

function validateItems(items: unknown): items is ItemInput[] {
  if (!Array.isArray(items) || items.length === 0) return false
  return items.every(item =>
    item && typeof item.description === 'string' && item.description.trim() &&
    Number.isInteger(item.quantity) && item.quantity > 0 &&
    Number.isInteger(item.unit_price) && item.unit_price >= 0
  )
}

async function loadInvoice(db: D1Database, tenantId: string, id: string) {
  const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<Record<string, unknown>>()
  if (!invoice) return null
  const items = await db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').bind(id).all()
  const payments = await db.prepare('SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY created_at DESC').bind(id).all()
  return { ...invoice, items: items.results, payments: payments.results }
}

// GET /api/invoices — list with filters
invoices.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const status = c.req.query('status')
    const type = c.req.query('type')
    const customerId = c.req.query('customer_id')

    const conditions = ['tenant_id = ?']
    const params: (string | number)[] = [tenantId]
    if (status) { conditions.push('status = ?'); params.push(status) }
    if (type) { conditions.push('type = ?'); params.push(type) }
    if (customerId) { conditions.push('customer_id = ?'); params.push(customerId) }

    const rows = await c.env.qesuite_db.prepare(
      `SELECT * FROM invoices WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 200`
    ).bind(...params).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('invoices list error', err)
    return c.json({ success: false, error: 'Failed to fetch invoices', data: null }, 500)
  }
})

// GET /api/invoices/ar-aging — outstanding balance per customer, bucketed by days overdue
invoices.get('/ar-aging', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const rows = await c.env.qesuite_db.prepare(
      `SELECT cu.id AS customer_id, cu.name, cu.phone, cu.credit_balance,
              MIN(i.due_date) AS oldest_due_date,
              CAST(MAX(0, julianday('now') - julianday(MIN(i.due_date))) AS INTEGER) AS days_overdue
       FROM customers cu
       JOIN invoices i ON i.customer_id = cu.id
         AND i.type IN ('invoice','recurring') AND i.status IN ('sent','partially_paid','overdue')
       WHERE cu.tenant_id = ? AND cu.credit_balance > 0
       GROUP BY cu.id
       ORDER BY days_overdue DESC`
    ).bind(tenantId).all<{ customer_id: string; name: string; phone: string; credit_balance: number; oldest_due_date: string | null; days_overdue: number }>()

    const bucketed = rows.results.map(row => ({
      ...row,
      bucket: row.days_overdue <= 30 ? '0-30' : row.days_overdue <= 60 ? '31-60' : row.days_overdue <= 90 ? '61-90' : '90+',
    }))

    return c.json({ success: true, data: bucketed, error: null })
  } catch (err) {
    console.error('ar aging error', err)
    return c.json({ success: false, error: 'Failed to load accounts receivable aging', data: null }, 500)
  }
})

// GET /api/invoices/:id
invoices.get('/:id', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const invoice = await loadInvoice(c.env.qesuite_db, tenantId, c.req.param('id'))
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)
    return c.json({ success: true, data: invoice, error: null })
  } catch (err) {
    console.error('invoice detail error', err)
    return c.json({ success: false, error: 'Failed to fetch invoice', data: null }, 500)
  }
})

const DOCUMENT_TITLES: Record<string, string> = {
  quotation: 'QUOTATION', proforma: 'PRO-FORMA INVOICE', invoice: 'INVOICE', recurring: 'RECURRING INVOICE',
}

// GET /api/invoices/:id/pdf — a downloadable/printable/shareable copy of the document
invoices.get('/:id/pdf', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')
    const invoice = await loadInvoice(c.env.qesuite_db, tenantId, id) as (Record<string, unknown> & {
      invoice_number: string; type: string; customer_name: string; customer_phone: string | null; customer_pin: string | null
      subtotal: number; discount: number; tax_amount: number; total: number; amount_paid: number; currency: string
      due_date: string | null; notes: string | null; created_at: string
      items: { description: string; quantity: number; unit_price: number; line_total: number }[]
    }) | null
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)

    const tenant = await c.env.qesuite_db.prepare(
      'SELECT name, phone, address, primary_color FROM tenants WHERE id = ?'
    ).bind(tenantId).first<{ name: string; phone: string | null; address: string | null; primary_color: string | null }>()

    const pdfBytes = await buildDocumentPdf({
      documentTitle: DOCUMENT_TITLES[invoice.type] ?? 'INVOICE',
      documentNumber: invoice.invoice_number || 'DRAFT',
      issuedDate: new Date(invoice.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
      dueDate: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      store: { name: tenant?.name ?? 'Store', phone: tenant?.phone, address: tenant?.address, primaryColorHex: tenant?.primary_color },
      billTo: { name: invoice.customer_name, phone: invoice.customer_phone, pin: invoice.customer_pin },
      items: invoice.items.map(item => ({ description: item.description, quantity: item.quantity, unitPrice: item.unit_price, lineTotal: item.line_total })),
      subtotal: invoice.subtotal, discount: invoice.discount, taxAmount: invoice.tax_amount, total: invoice.total,
      amountPaid: invoice.amount_paid, currency: invoice.currency, notes: invoice.notes,
    })

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number || 'draft'}.pdf"`,
      },
    })
  } catch (err) {
    console.error('invoice pdf error', err)
    return c.json({ success: false, error: 'Failed to generate PDF', data: null }, 500)
  }
})

type InvoiceBody = {
  type: 'quotation' | 'proforma' | 'invoice' | 'recurring'
  customer_name: string
  customer_phone?: string
  customer_pin?: string
  discount?: number
  tax_amount?: number
  payment_terms_days?: number
  recurring_interval?: 'weekly' | 'monthly'
  notes?: string
  items: ItemInput[]
}

function computeTotals(items: ItemInput[], discount = 0, taxAmount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const total = Math.max(0, subtotal - discount + taxAmount)
  return { subtotal, total }
}

// POST /api/invoices — create a draft
invoices.post('/', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<InvoiceBody>()

    if (!INVOICE_NUMBER_PREFIX[body.type]) return c.json({ success: false, error: 'Invalid invoice type', data: null }, 400)
    if (!body.customer_name?.trim()) return c.json({ success: false, error: 'customer_name is required', data: null }, 400)
    if (!validateItems(body.items)) return c.json({ success: false, error: 'At least one valid line item is required', data: null }, 400)

    const { subtotal, total } = computeTotals(body.items, body.discount ?? 0, body.tax_amount ?? 0)
    const id = generateId()

    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO invoices
          (id, tenant_id, invoice_number, customer_name, customer_phone, customer_pin, type, status,
           subtotal, discount, tax_amount, total, payment_terms_days, recurring_interval, notes, created_by)
         VALUES (?, ?, '', ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, tenantId, body.customer_name.trim(), body.customer_phone ?? null, body.customer_pin ?? null, body.type,
        subtotal, body.discount ?? 0, body.tax_amount ?? 0, total, body.payment_terms_days ?? 0,
        body.recurring_interval ?? null, body.notes ?? null, user.sub,
      ),
      ...body.items.map(item => c.env.qesuite_db.prepare(
        `INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), id, item.product_id ?? null, item.description.trim(), item.quantity, item.unit_price, item.quantity * item.unit_price)),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'invoice.created',
        targetType: 'invoice', targetId: id, detail: { type: body.type, total }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ]

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id }, error: null, message: 'Draft saved' }, 201)
  } catch (err) {
    console.error('invoice create error', err)
    return c.json({ success: false, error: 'Failed to create invoice', data: null }, 500)
  }
})

// PUT /api/invoices/:id — edit while still a draft
invoices.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<InvoiceBody>()

    const existing = await c.env.qesuite_db.prepare('SELECT status FROM invoices WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first<{ status: string }>()
    if (!existing) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)
    if (existing.status !== 'draft') return c.json({ success: false, error: 'Only draft invoices can be edited', data: null }, 409)
    if (!body.customer_name?.trim()) return c.json({ success: false, error: 'customer_name is required', data: null }, 400)
    if (!validateItems(body.items)) return c.json({ success: false, error: 'At least one valid line item is required', data: null }, 400)

    const { subtotal, total } = computeTotals(body.items, body.discount ?? 0, body.tax_amount ?? 0)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `UPDATE invoices SET customer_name = ?, customer_phone = ?, customer_pin = ?, subtotal = ?, discount = ?,
          tax_amount = ?, total = ?, payment_terms_days = ?, recurring_interval = ?, notes = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).bind(
        body.customer_name.trim(), body.customer_phone ?? null, body.customer_pin ?? null, subtotal,
        body.discount ?? 0, body.tax_amount ?? 0, total, body.payment_terms_days ?? 0,
        body.recurring_interval ?? null, body.notes ?? null, id,
      ),
      c.env.qesuite_db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').bind(id),
      ...body.items.map(item => c.env.qesuite_db.prepare(
        `INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), id, item.product_id ?? null, item.description.trim(), item.quantity, item.unit_price, item.quantity * item.unit_price)),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'invoice.updated',
        targetType: 'invoice', targetId: id, detail: { total }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Invoice updated' })
  } catch (err) {
    console.error('invoice update error', err)
    return c.json({ success: false, error: 'Failed to update invoice', data: null }, 500)
  }
})

// POST /api/invoices/:id/send — allocates the sequential number, resolves/creates
// the customer record by phone, and — for real invoices/recurring billing (not
// quotations/pro-formas, which aren't a sale) — books the total to their
// accounts-receivable balance.
invoices.post('/:id/send', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const invoice = await c.env.qesuite_db.prepare(
      'SELECT * FROM invoices WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{ status: string; type: string; customer_phone: string | null; customer_name: string; total: number; payment_terms_days: number }>()
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)
    if (invoice.status !== 'draft') return c.json({ success: false, error: 'Only draft invoices can be sent', data: null }, 409)

    const invoiceNumber = await nextSequenceNumber(c.env.qesuite_db, tenantId, `invoice_${invoice.type}`, INVOICE_NUMBER_PREFIX[invoice.type])
    const dueDate = invoice.payment_terms_days > 0
      ? new Date(Date.now() + invoice.payment_terms_days * 86_400_000).toISOString().slice(0, 10)
      : null

    const statements = []
    let customerId: string | null = null

    if (invoice.customer_phone) {
      const normalizedPhone = normalizeKenyaPhone(invoice.customer_phone)
      const existingCustomer = await c.env.qesuite_db.prepare(
        'SELECT id FROM customers WHERE tenant_id = ? AND phone = ?'
      ).bind(tenantId, normalizedPhone).first<{ id: string }>()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        customerId = generateId()
        statements.push(c.env.qesuite_db.prepare(
          `INSERT INTO customers (id, tenant_id, name, phone, order_count, total_spend)
           VALUES (?, ?, ?, ?, 0, 0)`
        ).bind(customerId, tenantId, invoice.customer_name, normalizedPhone))
      }

      if (invoice.type === 'invoice' || invoice.type === 'recurring') {
        statements.push(c.env.qesuite_db.prepare(
          'UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?'
        ).bind(invoice.total, customerId))
      }
    }

    statements.push(
      c.env.qesuite_db.prepare(
        `UPDATE invoices SET status = 'sent', invoice_number = ?, customer_id = ?, due_date = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(invoiceNumber, customerId, dueDate, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'invoice.sent',
        targetType: 'invoice', targetId: id, detail: { invoice_number: invoiceNumber }, ip: c.req.header('CF-Connecting-IP'),
      }),
    )

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id, invoice_number: invoiceNumber }, error: null, message: 'Invoice sent' })
  } catch (err) {
    console.error('invoice send error', err)
    return c.json({ success: false, error: 'Failed to send invoice', data: null }, 500)
  }
})

// POST /api/invoices/:id/payments — record a payment against an invoice
invoices.post('/:id/payments', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ amount: number; method: string; reference?: string; note?: string }>()

    if (!Number.isInteger(body.amount) || body.amount <= 0) {
      return c.json({ success: false, error: 'amount must be a positive integer', data: null }, 400)
    }
    if (!body.method?.trim()) return c.json({ success: false, error: 'method is required', data: null }, 400)

    const invoice = await c.env.qesuite_db.prepare(
      'SELECT status, total, amount_paid, customer_id FROM invoices WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{ status: string; total: number; amount_paid: number; customer_id: string | null }>()
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)
    if (!['sent', 'partially_paid', 'overdue'].includes(invoice.status)) {
      return c.json({ success: false, error: 'This invoice is not awaiting payment', data: null }, 409)
    }

    const outstanding = invoice.total - invoice.amount_paid
    if (body.amount > outstanding) {
      return c.json({ success: false, error: `Payment exceeds the outstanding balance of ${outstanding}`, data: null }, 400)
    }

    const newAmountPaid = invoice.amount_paid + body.amount
    const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partially_paid'

    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO invoice_payments (id, invoice_id, tenant_id, amount, method, reference, note, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), id, tenantId, body.amount, body.method.trim(), body.reference ?? null, body.note ?? null, user.sub),
      c.env.qesuite_db.prepare(
        `UPDATE invoices SET amount_paid = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(newAmountPaid, newStatus, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'invoice.payment_recorded',
        targetType: 'invoice', targetId: id, detail: { amount: body.amount, method: body.method }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ]

    if (invoice.customer_id) {
      statements.push(c.env.qesuite_db.prepare(
        'UPDATE customers SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?'
      ).bind(body.amount, invoice.customer_id))
    }

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id, status: newStatus }, error: null, message: 'Payment recorded' })
  } catch (err) {
    console.error('invoice payment error', err)
    return c.json({ success: false, error: 'Failed to record payment', data: null }, 500)
  }
})

// POST /api/invoices/:id/void — only while nothing has been paid yet
invoices.post('/:id/void', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ reason?: string }>().catch(() => ({} as { reason?: string }))

    const invoice = await c.env.qesuite_db.prepare(
      'SELECT status, total, amount_paid, customer_id, type FROM invoices WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{ status: string; total: number; amount_paid: number; customer_id: string | null; type: string }>()
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)
    if (invoice.status === 'void') return c.json({ success: false, error: 'Invoice is already void', data: null }, 409)
    if (invoice.amount_paid > 0) return c.json({ success: false, error: 'Cannot void an invoice that already has payments — write off the balance instead', data: null }, 409)

    const statements = [
      c.env.qesuite_db.prepare(
        "UPDATE invoices SET status = 'void', void_reason = ?, voided_by = ?, voided_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
      ).bind(body.reason ?? null, user.sub, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'invoice.voided',
        targetType: 'invoice', targetId: id, detail: { reason: body.reason }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ]

    // A voided invoice that had already been booked to AR (sent, real invoice type) needs that reversed.
    if (invoice.customer_id && invoice.status !== 'draft' && ['invoice', 'recurring'].includes(invoice.type)) {
      statements.push(c.env.qesuite_db.prepare(
        'UPDATE customers SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?'
      ).bind(invoice.total - invoice.amount_paid, invoice.customer_id))
    }

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id }, error: null, message: 'Invoice voided' })
  } catch (err) {
    console.error('invoice void error', err)
    return c.json({ success: false, error: 'Failed to void invoice', data: null }, 500)
  }
})

// POST /api/invoices/:id/write-off — queues approval; the balance is only
// cleared once a manager/owner approves it via /api/approvals.
invoices.post('/:id/write-off', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ reason: string }>()

    if (!body.reason?.trim()) return c.json({ success: false, error: 'A reason is required to write off a balance', data: null }, 400)

    const invoice = await c.env.qesuite_db.prepare(
      'SELECT status, total, amount_paid, customer_id FROM invoices WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{ status: string; total: number; amount_paid: number; customer_id: string | null }>()
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)
    if (!['sent', 'partially_paid', 'overdue'].includes(invoice.status)) {
      return c.json({ success: false, error: 'This invoice has no outstanding balance to write off', data: null }, 409)
    }

    const outstanding = invoice.total - invoice.amount_paid
    const approvalId = generateId()

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `INSERT INTO approval_requests (id, tenant_id, action_type, target_type, target_id, payload_json, reason, requested_by)
         VALUES (?, ?, 'credit_write_off', 'invoice', ?, ?, ?, ?)`
      ).bind(approvalId, tenantId, id, JSON.stringify({ amount: outstanding, customer_id: invoice.customer_id }), body.reason.trim(), user.sub),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'invoice.write_off_requested',
        targetType: 'invoice', targetId: id, detail: { amount: outstanding, reason: body.reason.trim() }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { approval_id: approvalId }, error: null, message: 'Write-off submitted for approval' }, 201)
  } catch (err) {
    console.error('invoice write-off request error', err)
    return c.json({ success: false, error: 'Failed to submit write-off', data: null }, 500)
  }
})

// POST /api/invoices/:id/credit-notes — issue a credit note against an invoice
invoices.post('/:id/credit-notes', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ amount: number; reason?: string }>()

    if (!Number.isInteger(body.amount) || body.amount <= 0) {
      return c.json({ success: false, error: 'amount must be a positive integer', data: null }, 400)
    }

    const invoice = await c.env.qesuite_db.prepare(
      'SELECT customer_id FROM invoices WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{ customer_id: string | null }>()
    if (!invoice) return c.json({ success: false, error: 'Invoice not found', data: null }, 404)

    const creditNoteId = generateId()
    const creditNoteNumber = await nextSequenceNumber(c.env.qesuite_db, tenantId, 'credit_note', 'CN')

    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO credit_notes (id, tenant_id, credit_note_number, invoice_id, customer_id, amount, reason, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(creditNoteId, tenantId, creditNoteNumber, id, invoice.customer_id, body.amount, body.reason ?? null, user.sub),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'credit_note.issued',
        targetType: 'invoice', targetId: id, detail: { amount: body.amount, credit_note_number: creditNoteNumber }, ip: c.req.header('CF-Connecting-IP'),
      }),
    ]

    if (invoice.customer_id) {
      statements.push(c.env.qesuite_db.prepare(
        'UPDATE customers SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?'
      ).bind(body.amount, invoice.customer_id))
    }

    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id: creditNoteId, credit_note_number: creditNoteNumber }, error: null, message: 'Credit note issued' }, 201)
  } catch (err) {
    console.error('credit note error', err)
    return c.json({ success: false, error: 'Failed to issue credit note', data: null }, 500)
  }
})

export default invoices
