# Stores

A multi-tenant SaaS commerce platform for grocery shops, mini-marts, kiosks, pharmacies, and local retail stores across Kenya and East Africa.

Built on Cloudflare's infrastructure — Workers, D1, R2, and Queues — with Vue 3 frontends.

---

## Apps

| App | Path | Purpose |
|-----|------|---------|
| `apps/app` | `localhost:3000` | Unified Vue app: owner dashboard + rider app + superadmin panel (role-based routing) |
| `apps/storefront` | `localhost:3001` | Customer-facing store (`/:slug`) |
| `apps/worker-api` | `localhost:8787` | Hono backend on Cloudflare Workers |

---

## Quick Start

### 1. Prerequisites

- Node.js 18+ / Bun
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler`)
- A Cloudflare account

### 2. Install dependencies

```bash
bun install
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

### 6. Start development

```bash
# In separate terminals:
cd apps/worker-api && wrangler dev   # API on :8787
cd apps/app && bun run dev           # Dashboard/rider/admin on :3000
cd apps/storefront && bun run dev    # Storefront on :3001
```

### 7. Deploy

```bash
# Deploy backend
wrangler deploy

# Deploy frontends to Cloudflare Pages
cd apps/app && bun run build
wrangler pages deploy dist --project-name qesuite-app

cd apps/storefront && bun run build
wrangler pages deploy dist --project-name qesuite-storefront
```

---

## Progress

### Backend — Hono API (`apps/worker-api`)

22 route modules fully implemented:

| Module | Endpoints |
|--------|-----------|
| **auth** | Register, login, OTP send/verify, token refresh, logout, rider magic-link, `GET /me`, `PATCH /me` |
| **onboarding** | Status check, step 1 (branding), step 2 (products), step 3 (delivery config) |
| **store** | Public store by slug, slug availability check, store update |
| **products** | List, create, update, delete, image upload, bulk import |
| **categories** | List, create, update, delete |
| **orders** | Create, list, detail, status transition, public tracking by code, packing slip |
| **delivery** | Rider staff CRUD, magic-link generation, order assignment, GPS location update, status transitions |
| **payments** | M-Pesa STK Push + callback, Stripe PaymentIntent + webhook, subscription update |
| **analytics** | Summary KPIs, revenue trend, top products, peak hours, payment method breakdown |
| **billing** | Subscription details, billing history, M-Pesa subscription payment |
| **settings** | Tenant config read/write, store settings read |
| **admin** | Stores list/detail, suspend/unsuspend, extend trial, impersonate, platform GMV + store growth metrics |
| **upload** | R2 presigned URL generation (type + size validated, 10-min expiry) |

**Background workers:**
- Cron job (daily midnight) → analytics snapshot
- Queue consumer → SMS (Africa's Talking) + WhatsApp (Business Cloud API) notification dispatch

---

### Owner Dashboard (`apps/app` — role: `owner`)

| Feature | Status |
|---------|--------|
| Login / register | ✅ |
| 3-step onboarding wizard (branding → products → delivery) | ✅ |
| Real-time order feed (Supabase Realtime + fallback polling) | ✅ |
| Kanban & list order views | ✅ |
| Order detail + packing slip modal | ✅ |
| Rider assignment modal | ✅ |
| Products — list, create, edit, delete, image upload | ✅ |
| Bulk product import | ✅ |
| Categories management | ✅ |
| Delivery team management (add/remove riders, magic-link) | ✅ |
| Analytics — revenue chart, top products, peak hours, payment split | ✅ |
| Store settings — branding (logo, banner, colors, font), delivery fees/radius/ETA | ✅ |
| Trial banner + subscription billing | ✅ |
| Dark mode | ✅ |

---

### Rider App (`apps/app` — role: `rider`)

| Feature | Status |
|---------|--------|
| SMS magic-link login | ✅ |
| Assigned orders list (proximity-sorted) | ✅ |
| Order detail + customer contact | ✅ |
| GPS location polling (30s interval) | ✅ |
| Navigation deeplink (Mapbox / Google Maps) | ✅ |
| Status transitions: ASSIGNED → PICKED_UP → ON_THE_WAY → DELIVERED | ✅ |
| Failure reason capture | ✅ |

---

### Superadmin Panel (`apps/app` — role: `superadmin`)

| Feature | Status |
|---------|--------|
| All-stores datatable (sortable, filterable, paginated — default 10/page) | ✅ |
| Store detail — branding, settings, billing history | ✅ |
| Suspend / unsuspend store | ✅ |
| Extend trial | ✅ |
| Impersonate store owner | ✅ |
| Platform metrics — GMV trend, store growth, MRR, trial-to-paid conversion | ✅ |
| Platform billing history | ✅ |
| Admin profile management + password change | ✅ |

---

### Customer Storefront (`apps/storefront`)

| Feature | Status |
|---------|--------|
| Dynamic branding injection (CSS custom properties per tenant) | ✅ |
| Product browsing with category tabs | ✅ |
| Featured product strip | ✅ |
| Cart (localStorage persisted) | ✅ |
| Sticky cart bar | ✅ |
| 4-step checkout: Contact → Delivery → Payment → Confirmation | ✅ |
| Pay on Delivery | ✅ |
| M-Pesa STK Push with polling | ✅ |
| Stripe Checkout | ✅ |
| Order tracking (no auth) — status stepper + ETA | ✅ |
| Live rider location on tracking map | ✅ |
| Skeleton loaders, lazy images | ✅ |
| PWA + offline fallback page | ✅ |

---

### Database (`migrations/`)

| File | Tables |
|------|--------|
| `0001_tenants_users.sql` | `tenants`, `users` |
| `0002_store_branding.sql` | `store_settings` |
| `0003_categories_products.sql` | `categories`, `products` |
| `0004_orders_order_items.sql` | `orders`, `order_items` |
| `0005_delivery_staff_assignments.sql` | `delivery_staff`, `delivery_assignments` |
| `0006_subscriptions_billing.sql` | `subscriptions`, `billing_history` |
| `0007_notifications_log.sql` | `notifications_log` |
| `0008_analytics_snapshots.sql` | `analytics_daily`, `audit_log` |

---

### Shared Packages (`packages/`)

| Package | Contents |
|---------|----------|
| `@qesuite/types` | 39+ TypeScript interfaces — Tenant, User, JWT, Product, Order, Delivery, Cart, Analytics, M-Pesa, Stripe, Storefront |
| `@qesuite/styles` | TailwindCSS base stylesheet, design tokens, shared component classes (`.qs-input`, `.qs-btn`, `.qs-card`, etc.) |
| `@qesuite/shared` | Shared constants and utility helpers |

---

## Architecture

### Multi-tenancy

Every database table carries a `tenant_id` (UUID). The `tenant_id` is resolved from the JWT claim on every authenticated request — never from the request body — preventing cross-tenant data access.

### Auth

| Role | Method |
|------|--------|
| Store owner | Email/phone + password → JWT (15m access + 7d refresh httpOnly cookie) |
| Rider | Phone → magic-link SMS → JWT |
| Customer | No auth — phone number + tracking code only |
| Superadmin | Separate login route with elevated claims |

### Order State Machine

```
NEW → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
                                   ↘ CANCELLED (from any state)
```

### Notifications (Cloudflare Queue)

Order events enqueue messages asynchronously. The queue consumer dispatches:
- **SMS** via Africa's Talking (order confirmed, out for delivery, delivered, new order alert)
- **WhatsApp** via WhatsApp Business Cloud API

---

## Tech Stack

| Layer | Technology |
|-------|------------|
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
| Package manager | Bun |

---

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



claude --resume 2fb348cc-15b6-4265-9247-99930c6b11d5