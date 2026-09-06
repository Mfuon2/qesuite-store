import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId } from '../lib/jwt'
import { inclusiveDateRange } from '../lib/time'
import { auditEntry } from '../lib/audit'

const expenses = new Hono<{ Bindings: Env; Variables: Variables }>()

expenses.use('*', authMiddleware, tenantGuard, requireModule('finance'))

const CATEGORIES = ['supplies', 'rent', 'utilities', 'staff_wages', 'maintenance', 'other']

function parseDateRange(period?: string | null, from?: string | null, to?: string | null): { dateFrom: string; dateTo: string } {
  return inclusiveDateRange(period ?? 'today', from, to)
}

// POST /api/expenses — log a business expense
expenses.post('/', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      category: string
      description?: string
      amount: number
      expense_date: string
    }>()

    if (!body.category || !CATEGORIES.includes(body.category)) {
      return c.json({ success: false, error: `category must be one of: ${CATEGORIES.join(', ')}`, data: null }, 400)
    }
    if (!body.amount || body.amount <= 0) {
      return c.json({ success: false, error: 'amount must be greater than 0', data: null }, 400)
    }
    if (!body.expense_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.expense_date)) {
      return c.json({ success: false, error: 'expense_date must be YYYY-MM-DD', data: null }, 400)
    }
    if (body.description && body.description.length > 500) {
      return c.json({ success: false, error: 'Description too long', data: null }, 400)
    }

    const id = generateId()
    await c.env.qesuite_db.prepare(
      `INSERT INTO expenses
        (id, tenant_id, category, description, amount, expense_date, recorded_by, recorded_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(id, tenantId, body.category, body.description ?? null, body.amount, body.expense_date, user.sub, user.sub).run()

    return c.json({
      success: true,
      data: { id, category: body.category, amount: body.amount, expense_date: body.expense_date },
      error: null,
      message: 'Expense recorded',
    }, 201)
  } catch (err) {
    console.error('expense create error', err)
    return c.json({ success: false, error: 'Failed to record expense', data: null }, 500)
  }
})

// GET /api/expenses — list expenses
expenses.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const category = c.req.query('category')
    const fromParam = c.req.query('from')
    const toParam = c.req.query('to')
    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10), 100)
    const offset = (page - 1) * limit

    const conditions = ['tenant_id = ?']
    const params: (string | number)[] = [tenantId]

    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }
    if (fromParam && toParam) {
      conditions.push('expense_date >= ?')
      conditions.push('expense_date <= ?')
      params.push(fromParam, toParam)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM expenses WHERE ${whereClause}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT * FROM expenses WHERE ${whereClause} ORDER BY expense_date DESC, created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: { items: rows.results, total: countResult?.cnt ?? 0, page, limit },
      error: null,
    })
  } catch (err) {
    console.error('expenses list error', err)
    return c.json({ success: false, error: 'Failed to fetch expenses', data: null }, 500)
  }
})

// GET /api/expenses/summary — total + breakdown by category for a date range
expenses.get('/summary', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const range = parseDateRange(c.req.query('period'), c.req.query('from'), c.req.query('to'))

    const total = await c.env.qesuite_db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt
       FROM expenses WHERE tenant_id = ? AND expense_date >= ? AND expense_date <= ?`
    ).bind(tenantId, range.dateFrom, range.dateTo).first<{ total: number; cnt: number }>()

    const byCategory = await c.env.qesuite_db.prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt
       FROM expenses WHERE tenant_id = ? AND expense_date >= ? AND expense_date <= ?
       GROUP BY category ORDER BY total DESC`
    ).bind(tenantId, range.dateFrom, range.dateTo).all()

    return c.json({
      success: true,
      data: {
        date_from: range.dateFrom,
        date_to: range.dateTo,
        total: total?.total ?? 0,
        expense_count: total?.cnt ?? 0,
        by_category: byCategory.results,
      },
      error: null,
    })
  } catch (err) {
    console.error('expenses summary error', err)
    return c.json({ success: false, error: 'Failed to load expense summary', data: null }, 500)
  }
})

// PUT /api/expenses/:id — proposes an edit; does not change the expense
// directly. Financial records need a review step once recorded, so this
// queues an approval_requests row (action_type 'expense_edit') and only
// applies the change once a manager/owner approves it via /api/approvals.
expenses.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const body = await c.req.json<{ category?: string; description?: string; amount?: number; expense_date?: string }>()
    if (body.category && !CATEGORIES.includes(body.category)) {
      return c.json({ success: false, error: `category must be one of: ${CATEGORIES.join(', ')}`, data: null }, 400)
    }
    if (body.amount !== undefined && body.amount <= 0) {
      return c.json({ success: false, error: 'amount must be greater than 0', data: null }, 400)
    }
    if (body.expense_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.expense_date)) {
      return c.json({ success: false, error: 'expense_date must be YYYY-MM-DD', data: null }, 400)
    }

    const existing = await c.env.qesuite_db.prepare('SELECT * FROM expenses WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first()
    if (!existing) return c.json({ success: false, error: 'Expense not found', data: null }, 404)

    const approvalId = generateId()
    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `INSERT INTO approval_requests (id, tenant_id, action_type, target_type, target_id, payload_json, reason, requested_by)
         VALUES (?, ?, 'expense_edit', 'expense', ?, ?, ?, ?)`
      ).bind(approvalId, tenantId, id, JSON.stringify(body), 'Edit requested', user.sub),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'expense.edit_requested',
        targetType: 'expense', targetId: id, detail: body, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { approval_id: approvalId }, error: null, message: 'Edit submitted for approval' }, 201)
  } catch (err) {
    console.error('expense edit request error', err)
    return c.json({ success: false, error: 'Failed to submit expense edit', data: null }, 500)
  }
})

// DELETE /api/expenses/:id
expenses.delete('/:id', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM expenses WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!existing) {
      return c.json({ success: false, error: 'Expense not found', data: null }, 404)
    }

    await c.env.qesuite_db.prepare('DELETE FROM expenses WHERE id = ?').bind(id).run()

    return c.json({ success: true, data: { id }, error: null, message: 'Expense deleted' })
  } catch (err) {
    console.error('expense delete error', err)
    return c.json({ success: false, error: 'Failed to delete expense', data: null }, 500)
  }
})

export default expenses
