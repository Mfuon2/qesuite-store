import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'

const categories = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/categories — public or authenticated
categories.get('/', async (c) => {
  try {
    const slug = c.req.query('slug')

    let tenantId: string | null = null

    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyJWT } = await import('../lib/jwt')
        const payload = await verifyJWT(authHeader.substring(7), c.env.JWT_SECRET)
        tenantId = payload.tenant_id
      } catch {
        // fall through
      }
    }

    if (!tenantId && slug) {
      const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
        .bind(slug)
        .first<{ id: string }>()
      tenantId = tenant?.id ?? null
    }

    if (!tenantId) {
      return c.json({ error: 'slug or auth required', data: null }, 400)
    }

    const rows = await c.env.qesuite_db.prepare(
      `SELECT c.id, c.name, c.icon, c.sort_order, c.is_active,
              COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       WHERE c.tenant_id = ? AND c.is_active = 1
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    ).bind(tenantId).all()

    return c.json({ data: rows.results, error: null })
  } catch (err) {
    console.error('categories list error', err)
    return c.json({ error: 'Failed to fetch categories', data: null }, 500)
  }
})

// POST /api/categories
categories.post('/', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      name: string
      icon?: string
      sort_order?: number
    }>()

    if (!body.name) {
      return c.json({ error: 'name is required', data: null }, 400)
    }

    // Check for duplicate name in this tenant
    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM categories WHERE tenant_id = ? AND name = ?'
    ).bind(tenantId, body.name).first()

    if (existing) {
      return c.json({ error: 'Category with this name already exists', data: null }, 409)
    }

    const id = generateId()
    await c.env.qesuite_db.prepare(
      'INSERT INTO categories (id, tenant_id, name, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(id, tenantId, body.name, body.icon ?? '📦', body.sort_order ?? 0).run()

    const category = await c.env.qesuite_db.prepare('SELECT * FROM categories WHERE id = ?')
      .bind(id).first()

    return c.json({ data: category, error: null, message: 'Category created' }, 201)
  } catch (err) {
    console.error('category create error', err)
    return c.json({ error: 'Failed to create category', data: null }, 500)
  }
})

// PUT /api/categories/:id
categories.put('/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id') as string

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM categories WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!existing) {
      return c.json({ error: 'Category not found', data: null }, 404)
    }

    const body = await c.req.json<{
      name?: string
      icon?: string
      sort_order?: number
      is_active?: number
    }>()

    const fields: string[] = []
    const values: (string | number)[] = []

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name!) }
    if (body.icon !== undefined) { fields.push('icon = ?'); values.push(body.icon!) }
    if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order!) }
    if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active!) }

    if (fields.length === 0) {
      return c.json({ error: 'No fields to update', data: null }, 400)
    }

    values.push(id)
    await c.env.qesuite_db.prepare(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const category = await c.env.qesuite_db.prepare('SELECT * FROM categories WHERE id = ?')
      .bind(id).first()

    return c.json({ data: category, error: null, message: 'Category updated' })
  } catch (err) {
    console.error('category update error', err)
    return c.json({ error: 'Failed to update category', data: null }, 500)
  }
})

// DELETE /api/categories/:id — soft delete
categories.delete('/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM categories WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!existing) {
      return c.json({ error: 'Category not found', data: null }, 404)
    }

    // Check if category has active products
    const productCount = await c.env.qesuite_db.prepare(
      'SELECT COUNT(*) as cnt FROM products WHERE category_id = ? AND is_active = 1'
    ).bind(id).first<{ cnt: number }>()

    if (productCount && productCount.cnt > 0) {
      return c.json({
        error: `Cannot delete: category has ${productCount.cnt} active product(s). Move or delete them first.`,
        data: null,
      }, 409)
    }

    await c.env.qesuite_db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?')
      .bind(id).run()

    return c.json({ data: { deleted: true }, error: null, message: 'Category deactivated' })
  } catch (err) {
    console.error('category delete error', err)
    return c.json({ error: 'Failed to delete category', data: null }, 500)
  }
})

// POST /api/categories/reorder
categories.post('/reorder', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const { order } = await c.req.json<{ order: { id: string; sort_order: number }[] }>()
    if (!order?.length) return c.json({ error: 'order array is required', data: null }, 400)

    for (const item of order) {
      await c.env.qesuite_db.prepare(
        'UPDATE categories SET sort_order = ? WHERE id = ? AND tenant_id = ?'
      ).bind(item.sort_order, item.id, tenantId).run()
    }
    return c.json({ data: { reordered: true }, error: null, message: 'Order updated' })
  } catch (err) {
    console.error('category reorder error', err)
    return c.json({ error: 'Failed to reorder categories', data: null }, 500)
  }
})

export default categories
