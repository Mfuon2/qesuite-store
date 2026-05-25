# QeSuite Store

A multi-tenant SaaS commerce platform for grocery shops, mini-marts, kiosks, pharmacies, and local retail stores across Kenya and East Africa.

Built on Cloudflare's infrastructure — Workers, D1, R2, and Queues — with Vue 3 frontends.

## Apps

| App | URL | Port | Purpose |
|-----|-----|------|---------|
| `apps/storefront` | `store.qesuite.com/:slug` | 3000 | Customer-facing store |
| `apps/dashboard` | `dashboard.qesuite.com` | 3001 | Shop owner management |
| `apps/delivery` | `go.qesuite.com` | 3002 | Rider mobile view |
| `apps/admin` | `admin.qesuite.com` | 3003 | Platform superadmin |
| `apps/worker-api` | `api.qesuite.com` | 8787 | Hono backend on CF Workers |

## Quick Start

### 1. Prerequisites

- Node.js 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler`)
- A Cloudflare account

### 2. Install dependencies

```bash
npm install
cd apps/storefront && npm install
cd apps/dashboard && npm install
cd apps/delivery && npm install
cd apps/admin && npm install
cd apps/worker-api && npm install
```

### 3. Set up Cloudflare resources

```bash
# Create D1 database
wrangler d1 create qesuite_db

# Create R2 bucket
wrangler r2 bucket create qesuite-images

# Create notification queue
wrangler queues create qesuite-notifications
```

Update `wrangler.toml` with your D1 database ID.

### 4. Run migrations

```bash
wrangler d1 migrations apply qesuite_db
```

### 5. Configure environment

Copy `.env.example` to `.env` and fill in your credentials. Set Worker secrets:

```bash
wrangler secret put JWT_SECRET
wrangler secret put MPESA_CONSUMER_KEY
wrangler secret put MPESA_CONSUMER_SECRET
wrangler secret put MPESA_PASSKEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put AT_API_KEY
wrangler secret put WHATSAPP_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
```

Update `.env.local` in each frontend app with your API URL.

### 6. Start development

```bash
# In separate terminals:
npm run dev:api        # Worker API on :8787
npm run dev:storefront # Storefront on :3000
npm run dev:dashboard  # Dashboard on :3001
npm run dev:delivery   # Rider app on :3002
npm run dev:admin      # Admin panel on :3003
```

### 7. Deploy

```bash
# Deploy backend
wrangler deploy

# Deploy frontends (each to Cloudflare Pages)
cd apps/storefront && npm run build
wrangler pages deploy dist --project-name qesuite-storefront

cd apps/dashboard && npm run build
wrangler pages deploy dist --project-name qesuite-dashboard

cd apps/delivery && npm run build
wrangler pages deploy dist --project-name qesuite-delivery

cd apps/admin && npm run build
wrangler pages deploy dist --project-name qesuite-admin
```

## Architecture

### Multi-tenancy

Every database table carries a `tenant_id` (UUID). The `tenant_id` is resolved from the JWT claim on every authenticated request — never from the request body — preventing cross-tenant access.

### Auth Flow

- **Store owners**: Email/phone + password → JWT (15m access + 7d refresh as httpOnly cookie)
- **Riders**: Phone → magic link SMS → JWT
- **Customers**: No auth — phone number + tracking code only
- **Superadmin**: Separate login route with elevated claims

### Order State Machine

```
NEW → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
                                  ↘ CANCELLED (from any state)
```

### Notifications (via Cloudflare Queue)

All customer/owner notifications are async. Order events enqueue messages; the consumer handler sends SMS (Africa's Talking) and/or WhatsApp (Business Cloud API).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite + Pinia + TailwindCSS |
| API | Hono.js on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Queue | Cloudflare Queues |
| Realtime | Supabase Realtime |
| Payments | M-Pesa Daraja + Stripe |
| SMS | Africa's Talking |
| WhatsApp | WhatsApp Business Cloud API |
| Maps | Mapbox GL JS |

## Security

- JWT validated on every protected endpoint (Hono middleware)
- `tenant_id` extracted from JWT — never from request body
- Rate limiting: 100 req/min per IP (Cloudflare Workers)
- OTP: max 5 per phone per 10 minutes
- R2 uploads: presigned URLs only, 10-minute expiry, type + size validated
- Stripe webhooks: HMAC signature verification
- M-Pesa callbacks: IP whitelist to Safaricom IPs
- CORS: locked to `*.qesuite.com`
- All secrets in Cloudflare Worker secrets — never in `wrangler.toml`

## Database Migrations

Located in `migrations/`. Applied in order:

1. `0001_tenants_users` — Tenants and user accounts
2. `0002_store_branding` — Store settings
3. `0003_categories_products` — Product catalog
4. `0004_orders_order_items` — Orders
5. `0005_delivery_staff_assignments` — Delivery team
6. `0006_subscriptions_billing` — Billing
7. `0007_notifications_log` — Notification logs
8. `0008_analytics_snapshots` — Analytics + audit log
