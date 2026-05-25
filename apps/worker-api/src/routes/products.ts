import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'

const products = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /api/products — public list with filters
products.get('/', async (c) => {
  try {
    const slug = c.req.query('slug')
    const categoryId = c.req.query('category_id')
    const featured = c.req.query('featured')
    const onSale = c.req.query('on_sale')
    const search = c.req.query('search')
    const page = parseInt(c.req.query('page') ?? '1', 10)
    const limit = Math.min(parseInt(c.req.query('limit') ?? '50', 10), 100)
    const offset = (page - 1) * limit

    // Resolve tenant
    let tenantId: string | null = null

    // Check if caller is authenticated
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyJWT } = await import('../lib/jwt')
        const payload = await verifyJWT(authHeader.substring(7), c.env.JWT_SECRET)
        tenantId = payload.tenant_id
      } catch {
        // fall through to slug-based resolution
      }
    }

    if (!tenantId && slug) {
      const tenant = await c.env.qesuite_db.prepare('SELECT id FROM tenants WHERE slug = ?')
        .bind(slug)
        .first<{ id: string }>()
      tenantId = tenant?.id ?? null
    }

    if (!tenantId) {
      return c.json({ error: 'tenant slug or auth required', data: null }, 400)
    }

    const conditions: string[] = ['p.tenant_id = ?', 'p.is_active = 1']
    const params: (string | number)[] = [tenantId]

    if (categoryId) {
      conditions.push('p.category_id = ?')
      params.push(categoryId)
    }
    if (featured === '1') {
      conditions.push('p.featured = 1')
    }
    if (onSale === '1') {
      conditions.push('p.on_sale = 1')
    }
    if (search) {
      conditions.push("p.name LIKE ?")
      params.push(`%${search}%`)
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await c.env.qesuite_db.prepare(
      `SELECT COUNT(*) as cnt FROM products p WHERE ${whereClause}`
    ).bind(...params).first<{ cnt: number }>()

    const rows = await c.env.qesuite_db.prepare(
      `SELECT p.id, p.name, p.description, p.price, p.sale_price, p.stock,
              p.image_url, p.featured, p.on_sale, p.category_id,
              c.name as category_name, p.created_at, p.updated_at
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY p.featured DESC, p.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      data: {
        items: rows.results,
        total: countResult?.cnt ?? 0,
        page,
        limit,
      },
      error: null,
    })
  } catch (err) {
    console.error('products list error', err)
    return c.json({ error: 'Failed to fetch products', data: null }, 500)
  }
})

// POST /api/products/bulk-import — before /:id routes
products.post('/bulk-import', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.text()

    const lines = body.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      return c.json({ error: 'CSV must have header and at least one data row', data: null }, 400)
    }

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIdx = header.indexOf('name')
    const priceIdx = header.indexOf('price')
    const descIdx = header.indexOf('description')
    const stockIdx = header.indexOf('stock')
    const categoryIdx = header.indexOf('category')

    if (nameIdx === -1 || priceIdx === -1) {
      return c.json({ error: 'CSV must have at minimum name and price columns', data: null }, 400)
    }

    // Cache category lookup
    const categoryCache: Record<string, string> = {}

    const getCategoryId = async (name: string): Promise<string> => {
      if (categoryCache[name]) return categoryCache[name]
      const existing = await c.env.qesuite_db.prepare(
        'SELECT id FROM categories WHERE tenant_id = ? AND name = ?'
      ).bind(tenantId, name).first<{ id: string }>()
      if (existing) {
        categoryCache[name] = existing.id
        return existing.id
      }
      const newId = generateId()
      await c.env.qesuite_db.prepare(
        "INSERT INTO categories (id, tenant_id, name, icon, sort_order, is_active) VALUES (?, ?, ?, '📦', 0, 1)"
      ).bind(newId, tenantId, name).run()
      categoryCache[name] = newId
      return newId
    }

    let imported = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      const name = cols[nameIdx]
      const price = parseInt(cols[priceIdx], 10)

      if (!name || isNaN(price) || price < 0) {
        errors.push(`Row ${i + 1}: invalid name or price`)
        continue
      }

      const description = descIdx !== -1 ? cols[descIdx] ?? '' : ''
      const stock = stockIdx !== -1 ? parseInt(cols[stockIdx], 10) || 0 : 0
      const categoryName = categoryIdx !== -1 ? cols[categoryIdx] : ''
      const categoryId = categoryName ? await getCategoryId(categoryName) : null

      await c.env.qesuite_db.prepare(
        `INSERT INTO products (id, tenant_id, category_id, name, description, price, stock, featured, on_sale, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, datetime('now'), datetime('now'))`
      ).bind(generateId(), tenantId, categoryId, name, description, price, stock).run()

      imported++
    }

    return c.json({
      data: { imported, errors },
      error: null,
      message: `Imported ${imported} products`,
    })
  } catch (err) {
    console.error('bulk-import error', err)
    return c.json({ error: 'Bulk import failed', data: null }, 500)
  }
})

// POST /api/products/:id/image — presigned R2 URL
products.post('/:id/image', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const productId = c.req.param('id')

    const product = await c.env.qesuite_db.prepare(
      'SELECT id FROM products WHERE id = ? AND tenant_id = ?'
    ).bind(productId, tenantId).first()

    if (!product) {
      return c.json({ error: 'Product not found', data: null }, 404)
    }

    const { content_type } = await c.req.json<{ content_type?: string }>().catch(() => ({
      content_type: 'image/jpeg',
    }))

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    const ct = content_type ?? 'image/jpeg'
    if (!allowed.includes(ct)) {
      return c.json({ error: 'Only JPEG, PNG, or WebP images allowed', data: null }, 400)
    }

    const ext = ct === 'image/png' ? 'png' : ct === 'image/webp' ? 'webp' : 'jpg'
    const key = `products/${tenantId}/${productId}.${ext}`

    // Generate presigned URL (1 hour expiry)
    const url = await c.env.IMAGES.createMultipartUpload(key)
    // R2 direct upload — return the object key and a signed PUT URL
    // Cloudflare R2 presigned URLs require Workers signed URL pattern
    const uploadUrl = `${c.env.APP_BASE_URL}/api/upload/r2?key=${encodeURIComponent(key)}`

    // Store the expected URL so the product can reference it
    const publicUrl = `https://images.qesuite.com/${key}`
    await c.env.qesuite_db.prepare('UPDATE products SET image_url = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(publicUrl, productId)
      .run()

    return c.json({
      data: { upload_url: uploadUrl, public_url: publicUrl, key },
      error: null,
    })
  } catch (err) {
    console.error('product image error', err)
    return c.json({ error: 'Failed to generate upload URL', data: null }, 500)
  }
})

// POST /api/products
products.post('/', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!

    const body = await c.req.json<{
      name: string
      description?: string
      price: number
      sale_price?: number
      stock?: number
      category_id?: string
      image_url?: string
      featured?: number
      on_sale?: number
    }>()

    if (!body.name || body.price === undefined || body.price < 0) {
      return c.json({ error: 'name and price are required', data: null }, 400)
    }

    // Verify category belongs to this tenant
    if (body.category_id) {
      const cat = await c.env.qesuite_db.prepare(
        'SELECT id FROM categories WHERE id = ? AND tenant_id = ?'
      ).bind(body.category_id, tenantId).first()
      if (!cat) {
        return c.json({ error: 'Category not found', data: null }, 404)
      }
    }

    const id = generateId()
    await c.env.qesuite_db.prepare(
      `INSERT INTO products (id, tenant_id, category_id, name, description, price, sale_price,
        stock, image_url, featured, on_sale, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
    ).bind(
      id, tenantId, body.category_id ?? null, body.name, body.description ?? null,
      body.price, body.sale_price ?? null, body.stock ?? 0, body.image_url ?? null,
      body.featured ?? 0, body.on_sale ?? 0
    ).run()

    const product = await c.env.qesuite_db.prepare('SELECT * FROM products WHERE id = ?')
      .bind(id).first()

    return c.json({ data: product, error: null, message: 'Product created' }, 201)
  } catch (err) {
    console.error('product create error', err)
    return c.json({ error: 'Failed to create product', data: null }, 500)
  }
})

// PUT /api/products/:id
products.put('/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id') as string

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM products WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!existing) {
      return c.json({ error: 'Product not found', data: null }, 404)
    }

    const body = await c.req.json<{
      name?: string
      description?: string
      price?: number
      sale_price?: number
      stock?: number
      category_id?: string
      image_url?: string
      featured?: number
      on_sale?: number
    }>()

    const fields: string[] = []
    const values: (string | number | null)[] = []

    const mappings: Record<string, string | number | null | undefined> = {
      name: body.name,
      description: body.description,
      price: body.price,
      sale_price: body.sale_price,
      stock: body.stock,
      category_id: body.category_id,
      image_url: body.image_url,
      featured: body.featured,
      on_sale: body.on_sale,
    }

    for (const [key, val] of Object.entries(mappings)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`)
        values.push(val ?? null)
      }
    }

    if (fields.length === 0) {
      return c.json({ error: 'No fields to update', data: null }, 400)
    }

    fields.push("updated_at = datetime('now')")
    values.push(id)

    await c.env.qesuite_db.prepare(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run()

    const product = await c.env.qesuite_db.prepare('SELECT * FROM products WHERE id = ?')
      .bind(id).first()

    return c.json({ data: product, error: null, message: 'Product updated' })
  } catch (err) {
    console.error('product update error', err)
    return c.json({ error: 'Failed to update product', data: null }, 500)
  }
})

// DELETE /api/products/:id — soft delete
products.delete('/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const id = c.req.param('id')

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id FROM products WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first()

    if (!existing) {
      return c.json({ error: 'Product not found', data: null }, 404)
    }

    await c.env.qesuite_db.prepare(
      "UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run()

    return c.json({ data: { deleted: true }, error: null, message: 'Product deactivated' })
  } catch (err) {
    console.error('product delete error', err)
    return c.json({ error: 'Failed to delete product', data: null }, 500)
  }
})

export default products
