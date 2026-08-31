import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard, requireModule } from '../middleware/tenant'
import { generateId, validatePhone } from '@qesuite/shared'
import { auditEntry } from '../lib/audit'

const suppliers = new Hono<{ Bindings: Env; Variables: Variables }>()

suppliers.use('*', authMiddleware, tenantGuard, requireModule('inventory'))

// GET /api/suppliers — list, most recently added first
suppliers.get('/', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const includeInactive = c.req.query('include_inactive') === '1'

    const rows = await c.env.qesuite_db.prepare(
      `SELECT * FROM suppliers WHERE tenant_id = ? ${includeInactive ? '' : 'AND is_active = 1'}
       ORDER BY name COLLATE NOCASE ASC`
    ).bind(tenantId).all()

    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('suppliers list error', err)
    return c.json({ success: false, error: 'Failed to fetch suppliers', data: null }, 500)
  }
})

// GET /api/suppliers/:id
suppliers.get('/:id', async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const supplier = await c.env.qesuite_db.prepare(
      'SELECT * FROM suppliers WHERE id = ? AND tenant_id = ?'
    ).bind(c.req.param('id'), tenantId).first()

    if (!supplier) return c.json({ success: false, error: 'Supplier not found', data: null }, 404)
    return c.json({ success: true, data: supplier, error: null })
  } catch (err) {
    console.error('supplier detail error', err)
    return c.json({ success: false, error: 'Failed to fetch supplier', data: null }, 500)
  }
})

// POST /api/suppliers — create
suppliers.post('/', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{ name: string; phone?: string; email?: string; address?: string; notes?: string }>()

    if (!body.name?.trim()) return c.json({ success: false, error: 'Supplier name is required', data: null }, 400)
    if (body.phone && !validatePhone(body.phone)) {
      return c.json({ success: false, error: 'Enter a valid phone number', data: null }, 400)
    }

    const id = generateId()
    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        `INSERT INTO suppliers (id, tenant_id, name, phone, email, address, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, tenantId, body.name.trim(), body.phone ?? null, body.email ?? null, body.address ?? null, body.notes ?? null),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'supplier.created',
        targetType: 'supplier', targetId: id, detail: { name: body.name.trim() },
        ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Supplier added' }, 201)
  } catch (err) {
    console.error('supplier create error', err)
    return c.json({ success: false, error: 'Failed to add supplier', data: null }, 500)
  }
})

// PUT /api/suppliers/:id — edit
suppliers.put('/:id', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')
    const body = await c.req.json<{ name?: string; phone?: string; email?: string; address?: string; notes?: string; is_active?: boolean }>()

    const existing = await c.env.qesuite_db.prepare('SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first()
    if (!existing) return c.json({ success: false, error: 'Supplier not found', data: null }, 404)

    if (body.name !== undefined && !body.name.trim()) {
      return c.json({ success: false, error: 'Supplier name is required', data: null }, 400)
    }
    if (body.phone && !validatePhone(body.phone)) {
      return c.json({ success: false, error: 'Enter a valid phone number', data: null }, 400)
    }

    const fields: string[] = []
    const params: (string | number | null)[] = []
    if (body.name !== undefined) { fields.push('name = ?'); params.push(body.name.trim()) }
    if (body.phone !== undefined) { fields.push('phone = ?'); params.push(body.phone || null) }
    if (body.email !== undefined) { fields.push('email = ?'); params.push(body.email || null) }
    if (body.address !== undefined) { fields.push('address = ?'); params.push(body.address || null) }
    if (body.notes !== undefined) { fields.push('notes = ?'); params.push(body.notes || null) }
    if (body.is_active !== undefined) { fields.push('is_active = ?'); params.push(body.is_active ? 1 : 0) }
    fields.push("updated_at = datetime('now')")

    if (fields.length === 1) return c.json({ success: false, error: 'Nothing to update', data: null }, 400)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`).bind(...params, id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'supplier.updated',
        targetType: 'supplier', targetId: id, detail: body, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Supplier updated' })
  } catch (err) {
    console.error('supplier update error', err)
    return c.json({ success: false, error: 'Failed to update supplier', data: null }, 500)
  }
})

// DELETE /api/suppliers/:id — soft delete (deactivate); suppliers are referenced by
// purchase orders and products, so a hard delete would break historical records.
suppliers.delete('/:id', async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare('SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?').bind(id, tenantId).first()
    if (!existing) return c.json({ success: false, error: 'Supplier not found', data: null }, 404)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare("UPDATE suppliers SET is_active = 0, updated_at = datetime('now') WHERE id = ?").bind(id),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'supplier.deactivated',
        targetType: 'supplier', targetId: id, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id }, error: null, message: 'Supplier deactivated' })
  } catch (err) {
    console.error('supplier delete error', err)
    return c.json({ success: false, error: 'Failed to deactivate supplier', data: null }, 500)
  }
})

export default suppliers
