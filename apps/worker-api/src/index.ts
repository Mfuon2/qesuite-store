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
    allowHeaders: ['Authorization', 'Content-Type'],
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
