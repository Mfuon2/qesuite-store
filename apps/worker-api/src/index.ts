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
import { handleQueue } from './handlers/notifications'
import { handleCron } from './handlers/cron'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use('*', logger())

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin
      const allowed = ['.qesuite.com', 'localhost', '127.0.0.1']
      if (allowed.some((h) => origin.includes(h))) return origin
      return null
    },
    credentials: true,
    allowHeaders: ['Authorization', 'Content-Type', 'X-Admin-Request'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Set-Cookie'],
  })
)

// Routes
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

// ── SEO endpoints (served at the storefront domain via Cloudflare routing) ──

// GET /sitemap.xml — all active store pages for Google indexing
app.get('/sitemap.xml', async (c) => {
  try {
    const base = c.env.APP_BASE_URL ?? 'https://store.qesuite.com'
    const stores = await c.env.qesuite_db.prepare(
      `SELECT slug, name FROM tenants
       WHERE is_suspended = 0
         AND (subscription_status = 'active'
              OR (subscription_status = 'trialing' AND trial_ends_at > datetime('now')))`
    ).all<{ slug: string; name: string }>()

    const now = new Date().toISOString().split('T')[0]
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
            OR (t.subscription_status = 'trialing' AND t.trial_ends_at > datetime('now')))`
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

  const desc = `Shop ${tenant.name} online${tenant.address ? ` in ${tenant.address}` : ''}. Order groceries, get fast delivery and track your order live. ${products.slice(0, 5).map(p => p.name).join(', ')} and more.`
  const currency = tenant.currency ?? 'KES'
  const storeUrl = `${base}/${slug}`

  const productSchema = products.map((p, i) => `{
    "@type": "Product",
    "name": "${p.name.replace(/"/g, '\\"')}",
    ${p.description ? `"description": "${p.description.replace(/"/g, '\\"')}",` : ''}
    "offers": { "@type": "Offer", "price": "${p.sale_price ?? p.price}", "priceCurrency": "${currency}", "availability": "https://schema.org/InStock" }
  }`).join(',')

  const jsonLd = `{
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${tenant.name.replace(/"/g, '\\"')}",
    "url": "${storeUrl}",
    ${tenant.logo_url ? `"image": "${tenant.logo_url}",` : ''}
    ${tenant.address ? `"address": { "@type": "PostalAddress", "streetAddress": "${tenant.address.replace(/"/g, '\\"')}" },` : ''}
    ${tenant.phone ? `"telephone": "${tenant.phone}",` : ''}
    "currenciesAccepted": "${currency}",
    "openingHoursSpecification": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] },
    "hasOfferCatalog": { "@type": "OfferCatalog", "name": "Products", "itemListElement": [${productSchema}] }
  }`

  const productListHtml = products.map(p =>
    `<div class="product">
      ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy">` : ''}
      <h3>${p.name}</h3>
      ${p.description ? `<p>${p.description}</p>` : ''}
      <span class="price">${currency} ${(p.sale_price ?? p.price).toLocaleString()}</span>
      ${p.sale_price ? `<span class="was">${currency} ${p.price.toLocaleString()}</span>` : ''}
    </div>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${tenant.name} — Shop Online | QeSuite</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${storeUrl}">
<meta property="og:type" content="website">
<meta property="og:url" content="${storeUrl}">
<meta property="og:title" content="${tenant.name} — Shop Online">
<meta property="og:description" content="${desc}">
${tenant.logo_url ? `<meta property="og:image" content="${tenant.logo_url}">` : ''}
<meta property="og:site_name" content="QeSuite Stores">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${tenant.primary_color}">
<script type="application/ld+json">${jsonLd}</script>
<style>body{font-family:sans-serif;max-width:1200px;margin:0 auto;padding:16px}
.products{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.product{border:1px solid #eee;border-radius:8px;padding:12px}
.product img{width:100%;height:160px;object-fit:cover;border-radius:6px}
.price{font-weight:bold;color:${tenant.primary_color}}
.was{text-decoration:line-through;color:#999;font-size:.9em;margin-left:8px}
</style>
</head>
<body>
<header>
  ${tenant.logo_url ? `<img src="${tenant.logo_url}" alt="${tenant.name} logo" height="60">` : ''}
  <h1>${tenant.name}</h1>
  ${tenant.address ? `<p>📍 ${tenant.address}</p>` : ''}
  ${tenant.phone ? `<p>📞 ${tenant.phone}</p>` : ''}
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
