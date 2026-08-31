import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Env, Variables } from './types'
import authRoutes from './routes/auth'
import storeRoutes from './routes/store'
import productRoutes from './routes/products'
import categoryRoutes from './routes/categories'
import orderRoutes from './routes/orders'
import deliveryRoutes from './routes/delivery'
import paymentRoutes from './routes/payments'
import analyticsRoutes from './routes/analytics'
import adminRoutes from './routes/admin'
import onboardingRoutes from './routes/onboarding'
import uploadRoutes from './routes/upload'
import storefrontRoutes from './routes/storefront'
import settingsRoutes from './routes/settings'
import billingRoutes from './routes/billing'
import notificationsRoutes from './routes/notifications'
import customersRoutes from './routes/customers'
import placesRoutes from './routes/places'
import posRoutes from './routes/pos'
import expensesRoutes from './routes/expenses'
import accessRoutes from './routes/access'
import suppliersRoutes from './routes/suppliers'
import purchaseOrdersRoutes from './routes/purchase-orders'
import stockRoutes from './routes/stock'
import approvalsRoutes from './routes/approvals'
import invoicesRoutes from './routes/invoices'
import posDevicesRoutes from './routes/pos-devices'
import syncRoutes from './routes/sync'
import { enforceAccessPolicy } from './middleware/access'
import { handleQueue } from './handlers/notifications'
import { handleCron } from './handlers/cron'
import { BUSINESS_TIME_ZONE, businessDate } from './lib/time'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Fail closed if a deployment is configured with any timezone other than EAT.
app.use('*', async (c, next) => {
  if (c.env.APP_TIME_ZONE !== BUSINESS_TIME_ZONE) {
    console.error(`Invalid APP_TIME_ZONE: expected ${BUSINESS_TIME_ZONE}, received ${c.env.APP_TIME_ZONE || 'unset'}`)
    return c.json({ success: false, error: 'Server timezone configuration is invalid', data: null }, 500)
  }
  await next()
})

app.use('*', logger())

// ── CORS — exact origin matching only, no substring tricks ──────────────────
const ALLOWED_ORIGINS = [
  'https://store.qesuite.com',
  'https://go.qesuite.com',
  'https://admin.qesuite.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null          // block null-origin requests
      return ALLOWED_ORIGINS.includes(origin) ? origin : null
    },
    credentials: true,
    allowHeaders: ['Authorization', 'Content-Type', 'X-Admin-Request'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Set-Cookie'],
    maxAge: 86400,
  })
)

// ── Security headers on every response ──────────────────────────────────────
app.use('*', async (c, next) => {
  await next()
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
  c.res.headers.set('X-Frame-Options', 'DENY')
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  // HSTS — only on HTTPS (Workers always serve HTTPS in production)
  c.res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
})

// ── Request body size limits ──────────────────────────────────────────────────
// Upload routes: 10 MB (product images, logos, banners)
// All other routes: 1 MB
app.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length')
  if (!contentLength) return next()
  const bytes = parseInt(contentLength, 10)
  const isUpload = c.req.path.startsWith('/api/upload')
  const limit = isUpload ? 10_485_760 : 1_048_576  // 10 MB or 1 MB
  if (bytes > limit) {
    return c.json({ error: `Request body too large (max ${isUpload ? '10' : '1'} MB)`, data: null }, 413)
  }
  return next()
})

// Routes
app.use('/api/*', enforceAccessPolicy)

app.route('/api/auth', authRoutes)
app.route('/api/store', storeRoutes)
app.route('/api/products', productRoutes)
app.route('/api/categories', categoryRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/delivery', deliveryRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/onboarding', onboardingRoutes)
app.route('/api/upload', uploadRoutes)
app.route('/api/storefront', storefrontRoutes)
app.route('/api/settings', settingsRoutes)
app.route('/api/billing', billingRoutes)
app.route('/api/notifications', notificationsRoutes)
app.route('/api/customers', customersRoutes)
app.route('/api/places', placesRoutes)
app.route('/api/pos', posRoutes)
app.route('/api/expenses', expensesRoutes)
app.route('/api/access', accessRoutes)
app.route('/api/suppliers', suppliersRoutes)
app.route('/api/purchase-orders', purchaseOrdersRoutes)
app.route('/api/stock', stockRoutes)
app.route('/api/approvals', approvalsRoutes)
app.route('/api/invoices', invoicesRoutes)
app.route('/api/pos-devices', posDevicesRoutes)
app.route('/api/sync/v1', syncRoutes)

// ── SEO endpoints (served at the storefront domain via Cloudflare routing) ──

// GET /sitemap.xml — all active store pages for Google indexing
app.get('/sitemap.xml', async (c) => {
  try {
    const base = c.env.APP_BASE_URL ?? 'https://store.qesuite.com'
    const stores = await c.env.qesuite_db.prepare(
      `SELECT slug, name FROM tenants
       WHERE is_suspended = 0
         AND (subscription_status = 'active'
              OR (subscription_status = 'trialing' AND unixepoch(trial_ends_at) > unixepoch('now')))`
    ).all<{ slug: string; name: string }>()

    const now = businessDate()
    const storeUrls = stores.results.map(s =>
      `  <url><loc>${base}/${s.slug}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
    ).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
${storeUrls}
</urlset>`

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
    })
  } catch {
    return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', {
      headers: { 'Content-Type': 'application/xml' }
    })
  }
})

// GET /robots.txt
app.get('/robots.txt', (c) => {
  const base = c.env.APP_BASE_URL ?? 'https://store.qesuite.com'
  return new Response(
    `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain' } }
  )
})

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

// GET /render/:slug — pre-rendered HTML for bots (dynamic rendering)
// Cloudflare Worker Route on store.qesuite.com calls this for crawlers
app.get('/render/:slug', async (c) => {
  const slug = c.req.param('slug')
  const base = c.env.APP_BASE_URL ?? 'https://store.qesuite.com'

  const tenant = await c.env.qesuite_db.prepare(
    `SELECT t.*, ss.delivery_enabled, ss.estimated_delivery_minutes, ss.currency
     FROM tenants t
     LEFT JOIN store_settings ss ON ss.tenant_id = t.id
     WHERE t.slug = ? AND t.is_suspended = 0
       AND (t.subscription_status = 'active'
            OR (t.subscription_status = 'trialing' AND unixepoch(t.trial_ends_at) > unixepoch('now')))`
  ).bind(slug).first<{
    id: string; name: string; slug: string; logo_url: string | null
    banner_url: string | null; address: string | null; phone: string | null
    store_category: string; primary_color: string; delivery_enabled: number
    estimated_delivery_minutes: number | null; currency: string | null
  }>()

  if (!tenant) {
    return new Response('Store not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  // Fetch top 12 products for content richness
  const { results: products } = await c.env.qesuite_db.prepare(
    `SELECT name, description, price, sale_price, image_url FROM products
     WHERE tenant_id = ? AND is_active = 1 ORDER BY featured DESC LIMIT 12`
  ).bind(tenant.id).all<{ name: string; description: string | null; price: number; sale_price: number | null; image_url: string | null }>()

  const eName = escHtml(tenant.name)
  const eAddr = tenant.address ? escHtml(tenant.address) : null
  const ePhone = tenant.phone ? escHtml(tenant.phone) : null
  const desc = escHtml(`Shop ${tenant.name} online${tenant.address ? ` in ${tenant.address}` : ''}. Fast delivery. ${products.slice(0, 5).map(p => p.name).join(', ')} and more.`)
  const currency = escHtml(tenant.currency ?? 'KES')
  const storeUrl = `${base}/${escHtml(slug)}`

  // JSON-LD uses JSON.stringify for safe escaping
  const productSchema = products.map(p => JSON.stringify({
    '@type': 'Product',
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    offers: { '@type': 'Offer', price: String(p.sale_price ?? p.price), priceCurrency: tenant.currency ?? 'KES', availability: 'https://schema.org/InStock' },
  })).join(',')

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tenant.name,
    url: storeUrl,
    ...(tenant.logo_url ? { image: tenant.logo_url } : {}),
    ...(tenant.address ? { address: { '@type': 'PostalAddress', streetAddress: tenant.address } } : {}),
    ...(tenant.phone ? { telephone: tenant.phone } : {}),
    currenciesAccepted: tenant.currency ?? 'KES',
  })

  const productListHtml = products.map(p => {
    const pName = escHtml(p.name)
    const pDesc = p.description ? escHtml(p.description) : null
    const imgSrc = p.image_url && p.image_url.startsWith('https://') ? escHtml(p.image_url) : null
    return `<div class="product">
      ${imgSrc ? `<img src="${imgSrc}" alt="${pName}" loading="lazy">` : ''}
      <h3>${pName}</h3>
      ${pDesc ? `<p>${pDesc}</p>` : ''}
      <span class="price">${currency} ${(p.sale_price ?? p.price).toLocaleString()}</span>
      ${p.sale_price ? `<span class="was">${currency} ${p.price.toLocaleString()}</span>` : ''}
    </div>`
  }).join('')

  const logoSrc = tenant.logo_url && tenant.logo_url.startsWith('https://') ? escHtml(tenant.logo_url) : null
  const primaryColor = /^#[0-9a-fA-F]{3,8}$/.test(tenant.primary_color) ? tenant.primary_color : '#10b981'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${eName} — Shop Online | QeSuite</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${storeUrl}">
<meta property="og:type" content="website">
<meta property="og:url" content="${storeUrl}">
<meta property="og:title" content="${eName} — Shop Online">
<meta property="og:description" content="${desc}">
${logoSrc ? `<meta property="og:image" content="${logoSrc}">` : ''}
<meta property="og:site_name" content="QeSuite Stores">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${primaryColor}">
<script type="application/ld+json">${jsonLd}</script>
<style>body{font-family:sans-serif;max-width:1200px;margin:0 auto;padding:16px}
.products{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.product{border:1px solid #eee;border-radius:8px;padding:12px}
.product img{width:100%;height:160px;object-fit:cover;border-radius:6px}
.price{font-weight:bold;color:${primaryColor}}
.was{text-decoration:line-through;color:#999;font-size:.9em;margin-left:8px}
</style>
</head>
<body>
<header>
  ${logoSrc ? `<img src="${logoSrc}" alt="${eName} logo" height="60">` : ''}
  <h1>${eName}</h1>
  ${eAddr ? `<p>📍 ${eAddr}</p>` : ''}
  ${ePhone ? `<p>📞 ${ePhone}</p>` : ''}
  <p><a href="${storeUrl}">Shop now at ${storeUrl}</a></p>
</header>
<main>
<h2>Our Products</h2>
<div class="products">${productListHtml}</div>
</main>
<footer><p>Powered by <a href="https://store.qesuite.com">QeSuite</a></p></footer>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Content-Security-Policy': "default-src 'none'; img-src https:; style-src 'unsafe-inline'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    }
  })
})

// Health check
app.get('/health', (c) =>
  c.json({ status: 'ok', ts: new Date().toISOString(), service: 'qesuite-worker-api' })
)

// 404 fallback
app.notFound((c) =>
  c.json({ error: 'Route not found', data: null }, 404)
)

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error', data: null }, 500)
})

export default {
  fetch: app.fetch,
  queue: handleQueue,
  scheduled: handleCron,
}
