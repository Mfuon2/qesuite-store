import { Hono } from 'hono'
import { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { generateId } from '../lib/jwt'
import { auditEntry } from '../lib/audit'

const products = new Hono<{ Bindings: Env; Variables: Variables }>()

/** Reject image URLs not originating from our own Worker/CDN — prevents SSRF via stored URLs */
function validateImageUrl(url: string | null | undefined, workerOrigin: string): string | null {
  if (!url) return null
  try {
    const allowed = [workerOrigin, 'https://images.qesuite.com']
    if (!allowed.some(o => url.startsWith(o))) return null
    return url
  } catch { return null }
}

// Nest the flat category_name column into { category: { id, name } } matching the Product type
function withCategory(p: Record<string, unknown>) {
  const { category_name, ...rest } = p as { category_name: string | null } & Record<string, unknown>
  return {
    ...rest,
    category: rest.category_id && category_name
      ? { id: rest.category_id, name: category_name }
      : null,
  }
}

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
    // Cost price, SKU, supplier, etc. are owner-facing data — never send them
    // down the public (slug-resolved, no auth) storefront path.
    let authenticated = false

    // Check if caller is authenticated
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyJWT } = await import('../lib/jwt')
        const payload = await verifyJWT(authHeader.substring(7), c.env.JWT_SECRET)
        tenantId = payload.tenant_id
        authenticated = true
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

    const ownerColumns = authenticated
      ? ', p.sku, p.barcode, p.cost_price, p.unit_of_measure, p.reorder_level, p.expiry_date, p.supplier_id'
      : ''

    const rows = await c.env.qesuite_db.prepare(
      `SELECT p.id, p.name, p.description, p.price, p.sale_price, p.stock,
              p.image_url, p.featured, p.on_sale, p.category_id,
              c.name as category_name, p.created_at, p.updated_at${ownerColumns}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY p.featured DESC, p.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all()

    return c.json({
      success: true,
      data: {
        items: rows.results.map(p => withCategory(p as Record<string, unknown>)),
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

// GET /api/products/:id
products.get('/:id', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const id = c.req.param('id')
    const product = await c.env.qesuite_db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? AND p.tenant_id = ?`
    ).bind(id, tenantId).first()
    if (!product) return c.json({ error: 'Product not found', data: null }, 404)
    return c.json({ success: true, data: product, error: null })
  } catch (err) {
    console.error('product get error', err)
    return c.json({ error: 'Failed to fetch product', data: null }, 500)
  }
})

// POST /api/products/bulk-import — before /:id routes
// Accepts JSON: { products: [{name, price, description?, stock?}] }
// or CSV text with header row: name,price,description,stock,category
products.post('/bulk-import', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const contentType = c.req.header('content-type') ?? ''

    let imported = 0
    const errors: string[] = []

    if (contentType.includes('application/json')) {
      // JSON format
      const body = await c.req.json<{ products?: Array<{ name: string; price: number; description?: string; stock?: number }> }>()
      const rows = body.products ?? []
      if (!rows.length) return c.json({ error: 'No products provided', data: null }, 400)

      const cat = await c.env.qesuite_db.prepare(
        'SELECT id FROM categories WHERE tenant_id = ? ORDER BY sort_order ASC LIMIT 1'
      ).bind(tenantId).first<{ id: string }>()
      const defaultCategoryId = cat?.id ?? null

      for (let i = 0; i < rows.length; i++) {
        const p = rows[i]
        if (!p.name || p.price === undefined || p.price < 0) {
          errors.push(`Row ${i + 1}: invalid name or price`)
          continue
        }
        await c.env.qesuite_db.prepare(
          `INSERT INTO products (id, tenant_id, category_id, name, description, price, stock,
            featured, on_sale, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, datetime('now'), datetime('now'))`
        ).bind(generateId(), tenantId, defaultCategoryId, p.name, p.description ?? null, p.price, p.stock ?? 0).run()
        imported++
      }
    } else {
      // CSV format
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

      const categoryCache: Record<string, string> = {}
      const getCategoryId = async (name: string): Promise<string> => {
        if (categoryCache[name]) return categoryCache[name]
        const existing = await c.env.qesuite_db.prepare(
          'SELECT id FROM categories WHERE tenant_id = ? AND name = ?'
        ).bind(tenantId, name).first<{ id: string }>()
        if (existing) { categoryCache[name] = existing.id; return existing.id }
        const newId = generateId()
        await c.env.qesuite_db.prepare(
          "INSERT INTO categories (id, tenant_id, name, icon, sort_order, is_active) VALUES (?, ?, ?, '📦', 0, 1)"
        ).bind(newId, tenantId, name).run()
        categoryCache[name] = newId
        return newId
      }

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((col) => col.trim())
        const name = cols[nameIdx]
        const price = parseInt(cols[priceIdx], 10)
        if (!name || isNaN(price) || price < 0) { errors.push(`Row ${i + 1}: invalid name or price`); continue }
        const description = descIdx !== -1 ? cols[descIdx] ?? '' : ''
        const stock = stockIdx !== -1 ? parseInt(cols[stockIdx], 10) || 0 : 0
        const categoryName = categoryIdx !== -1 ? cols[categoryIdx] : ''
        const categoryId = categoryName ? await getCategoryId(categoryName) : null
        await c.env.qesuite_db.prepare(
          `INSERT INTO products (id, tenant_id, category_id, name, description, price, stock,
            featured, on_sale, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 1, datetime('now'), datetime('now'))`
        ).bind(generateId(), tenantId, categoryId, name, description, price, stock).run()
        imported++
      }
    }

    return c.json({ success: true, data: { imported, errors }, error: null, message: `Imported ${imported} products` })
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
    const workerOrigin = new URL(c.req.url).origin
    const publicUrl = c.env.CDN_URL
      ? `${c.env.CDN_URL}/${key}`
      : `${workerOrigin}/api/upload/img?key=${encodeURIComponent(key)}`
    const uploadToken = btoa(JSON.stringify({ key, tenant_id: tenantId, exp: Date.now() + 600_000 }))
    const uploadUrl = `${workerOrigin}/api/upload/r2?token=${encodeURIComponent(uploadToken)}`

    await c.env.qesuite_db.prepare("UPDATE products SET image_url = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(publicUrl, productId)
      .run()

    return c.json({
      success: true,
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
      sku?: string
      barcode?: string
      cost_price?: number
      unit_of_measure?: string
      reorder_level?: number
      expiry_date?: string
      supplier_id?: string
    }>()

    if (!body.name || body.price === undefined || body.price < 0) {
      return c.json({ error: 'name and price are required', data: null }, 400)
    }
    if (body.cost_price !== undefined && body.cost_price < 0) {
      return c.json({ error: 'cost_price cannot be negative', data: null }, 400)
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
    if (body.supplier_id) {
      const supplier = await c.env.qesuite_db.prepare(
        'SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?'
      ).bind(body.supplier_id, tenantId).first()
      if (!supplier) return c.json({ error: 'Supplier not found', data: null }, 404)
    }

    const id = generateId()
    const initialStock = body.stock ?? 0
    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO products (id, tenant_id, category_id, name, description, price, sale_price,
          stock, image_url, featured, on_sale, is_active, sku, barcode, cost_price,
          unit_of_measure, reorder_level, expiry_date, supplier_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(
        id, tenantId, body.category_id ?? null, body.name, body.description ?? null,
        body.price, body.sale_price ?? null, initialStock,
        validateImageUrl(body.image_url, new URL(c.req.url).origin),
        body.featured ?? 0, body.on_sale ?? 0,
        body.sku ?? null, body.barcode ?? null, body.cost_price ?? 0,
        body.unit_of_measure ?? 'unit', body.reorder_level ?? 0, body.expiry_date ?? null, body.supplier_id ?? null,
      ),
    ]

    if (initialStock > 0) {
      statements.push(c.env.qesuite_db.prepare(
        `INSERT INTO stock_movements (id, tenant_id, product_id, type, quantity_delta, unit_cost, resulting_stock, resulting_avg_cost, recorded_by)
         VALUES (?, ?, ?, 'initial', ?, ?, ?, ?, ?)`
      ).bind(generateId(), tenantId, id, initialStock, body.cost_price ?? 0, initialStock, body.cost_price ?? 0, user.sub))
    }

    await c.env.qesuite_db.batch(statements)

    const product = await c.env.qesuite_db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    ).bind(id).first<Record<string, unknown>>()

    return c.json({ success: true, data: product ? withCategory(product) : null, error: null, message: 'Product created' }, 201)
  } catch (err) {
    console.error('product create error', err)
    const message = err instanceof Error ? err.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'That SKU or barcode is already used by another product', data: null }, 409)
    }
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
      'SELECT price, sale_price, cost_price, stock FROM products WHERE id = ? AND tenant_id = ?'
    ).bind(id, tenantId).first<{ price: number; sale_price: number | null; cost_price: number; stock: number }>()

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
      sku?: string
      barcode?: string
      cost_price?: number
      unit_of_measure?: string
      reorder_level?: number
      expiry_date?: string
      supplier_id?: string
    }>()

    if (body.supplier_id) {
      const supplier = await c.env.qesuite_db.prepare(
        'SELECT id FROM suppliers WHERE id = ? AND tenant_id = ?'
      ).bind(body.supplier_id, tenantId).first()
      if (!supplier) return c.json({ error: 'Supplier not found', data: null }, 404)
    }

    const fields: string[] = []
    const values: (string | number | null)[] = []

    const mappings: Record<string, string | number | null | undefined> = {
      name: body.name,
      description: body.description,
      price: body.price,
      sale_price: body.sale_price,
      stock: body.stock,
      category_id: body.category_id,
      image_url: body.image_url !== undefined ? validateImageUrl(body.image_url, new URL(c.req.url).origin) : undefined,
      // Convert booleans to SQLite integers (frontend may send true/false)
      featured: body.featured !== undefined ? (body.featured ? 1 : 0) : undefined,
      on_sale: body.on_sale !== undefined ? (body.on_sale ? 1 : 0) : undefined,
      sku: body.sku,
      barcode: body.barcode,
      cost_price: body.cost_price,
      unit_of_measure: body.unit_of_measure,
      reorder_level: body.reorder_level,
      expiry_date: body.expiry_date,
      supplier_id: body.supplier_id,
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

    const statements = [
      c.env.qesuite_db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values),
    ]

    // Track cost/selling price changes so margin history and P&L stay
    // reconstructable — these aren't just column updates, they change what
    // past-vs-future profit calculations mean.
    const priceChanges: { field: 'cost_price' | 'price' | 'sale_price'; oldValue: number | null; newValue: number }[] = []
    if (body.cost_price !== undefined && body.cost_price !== existing.cost_price) {
      priceChanges.push({ field: 'cost_price', oldValue: existing.cost_price, newValue: body.cost_price })
    }
    if (body.price !== undefined && body.price !== existing.price) {
      priceChanges.push({ field: 'price', oldValue: existing.price, newValue: body.price })
    }
    if (body.sale_price !== undefined && body.sale_price !== existing.sale_price) {
      priceChanges.push({ field: 'sale_price', oldValue: existing.sale_price, newValue: body.sale_price })
    }
    for (const change of priceChanges) {
      statements.push(c.env.qesuite_db.prepare(
        `INSERT INTO price_history (id, tenant_id, product_id, field, old_value, new_value, changed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), tenantId, id, change.field, change.oldValue, change.newValue, user.sub))
    }
    if (priceChanges.length > 0) {
      statements.push(auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'product.price_changed',
        targetType: 'product', targetId: id, detail: { changes: priceChanges },
        ip: c.req.header('CF-Connecting-IP'),
      }))
    }

    // A direct stock edit here (vs. the dedicated stock-adjustment/receiving
    // flows) still needs to land in the ledger so the trail stays complete.
    if (body.stock !== undefined && body.stock !== existing.stock) {
      const newCostPrice = body.cost_price ?? existing.cost_price
      statements.push(c.env.qesuite_db.prepare(
        `INSERT INTO stock_movements (id, tenant_id, product_id, type, quantity_delta, unit_cost, resulting_stock, resulting_avg_cost, reason, recorded_by)
         VALUES (?, ?, ?, 'adjustment', ?, ?, ?, ?, 'Direct edit on product form', ?)`
      ).bind(generateId(), tenantId, id, body.stock - existing.stock, newCostPrice, body.stock, newCostPrice, user.sub))
    }

    await c.env.qesuite_db.batch(statements)

    const product = await c.env.qesuite_db.prepare(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    ).bind(id).first<Record<string, unknown>>()

    return c.json({ success: true, data: product ? withCategory(product) : null, error: null, message: 'Product updated' })
  } catch (err) {
    console.error('product update error', err)
    const message = err instanceof Error ? err.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'That SKU or barcode is already used by another product', data: null }, 409)
    }
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

    return c.json({ success: true, data: { deleted: true }, error: null, message: 'Product deactivated' })
  } catch (err) {
    console.error('product delete error', err)
    return c.json({ error: 'Failed to delete product', data: null }, 500)
  }
})

export default products
