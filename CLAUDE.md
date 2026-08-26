# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Stores** (package name `qesuite-store`) is a multi-tenant SaaS commerce platform for grocery shops, mini-marts, kiosks, pharmacies, and local retail stores in Kenya/East Africa — think Shopify + a delivery dispatch layer, built specifically for low-end Android / 3G conditions. Full product/feature breakdown is in `README.md`; this file covers what you need to make changes correctly.

Bun workspace monorepo: `apps/*` (deployables) + `packages/*` (shared code), all on the Cloudflare stack (Workers, D1, R2, Queues).

| App | Path | Dev port | Role |
|---|---|---|---|
| `apps/worker-api` | Hono API on Cloudflare Workers | `:8787` | backend for everything below |
| `apps/app` | Vue 3 SPA | `:3000` | owner dashboard + rider app + superadmin panel, one codebase, role-based routing |
| `apps/storefront` | Vue 3 SPA, PWA | `:3001` | customer-facing store at `/:slug`, no auth |

## Commands

```bash
bun install                          # install everything (workspaces)

# Dev — run these in separate terminals (or `bun run dev` for API + app together)
cd apps/worker-api && wrangler dev    # or: bun run dev:api
cd apps/app && bun run dev            # or: bun run dev:app
cd apps/storefront && bun run dev     # or: bun run dev:storefront

bun run --filter '*' build            # build all apps/packages
bun run --filter '*' type-check       # type-check all apps/packages (vue-tsc / tsc --noEmit)
```

There is no lint config and no test suite in this repo — `type-check` is the primary correctness gate. Vite dev servers proxy `/api` to `localhost:8787` (see each app's `vite.config.ts`), so the worker must be running for the frontends to talk to a real backend.

Database migrations (D1, sequential numbered files in `migrations/`):

```bash
wrangler d1 migrations apply qesuite_db          # apply locally/remote per wrangler.toml
```

Deploy: `./deploy.sh` builds and deploys the worker + both Pages apps. It refuses to run with uncommitted/unpushed changes and checks that required Worker secrets and Cloudflare resources (D1/R2/Queue) exist first — read it before deploying manually.

## Backend architecture (`apps/worker-api`)

Single Hono app, entry at `src/index.ts`. Structure:
- `src/routes/*` — one file per resource (auth, store, products, categories, orders, delivery, payments, analytics, admin, onboarding, upload, storefront, settings, billing, notifications, customers, places), mounted under `/api/<name>` in `index.ts`.
- `src/middleware/auth.ts` — three JWT guards: `authMiddleware` (any authenticated user), `superadminMiddleware`, `riderMiddleware` (rider or owner). Role lives in the JWT payload (`owner | staff | rider | superadmin`).
- `src/middleware/tenant.ts` — `tenantGuard` checks the tenant isn't suspended; apply after `authMiddleware` on tenant-scoped routes.
- `src/lib/` — `jwt.ts`, `password.ts`, `notifications.ts` (SMS/WhatsApp senders).
- `src/handlers/cron.ts` — daily analytics snapshot (`[triggers] crons` in `wrangler.toml`).
- `src/handlers/notifications.ts` — Cloudflare Queue consumer, dispatches SMS (Africa's Talking / TextSMS Kenya) and WhatsApp (Business Cloud API) for order events.
- `index.ts` also serves `/sitemap.xml`, `/robots.txt`, and `/render/:slug` — a hand-rolled pre-rendered HTML page per store for crawlers/bots (dynamic rendering), independent of the Vue storefront.

**Multi-tenancy**: every tenant-scoped table has `tenant_id`. It is always taken from the verified JWT claim (`c.get('tenant_id')` after `authMiddleware`), never from the request body — this is the load-bearing invariant that prevents cross-tenant access. Don't add a route that trusts a `tenant_id` from the client.

**Auth model**:
- Owner/staff: password login → 15m JWT access token + 7d httpOnly-cookie refresh token.
- Rider: phone → SMS magic-link → JWT (no password).
- Customer: no auth at all — order tracking is by phone + tracking code only.
- Superadmin: separate login route, elevated JWT claim, checked by `superadminMiddleware`.

**Order state machine**: `NEW → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED` reachable from any non-terminal state. Valid transitions are encoded in `packages/shared/src/constants.ts` (`ORDER_STATUSES[...].next`) — reuse that table rather than hardcoding transition logic elsewhere.

**Env bindings**: declared in `apps/worker-api/src/types.ts` (`Env` interface) and `wrangler.toml`. Non-secret vars go in `wrangler.toml [vars]`; everything else (`JWT_SECRET`, M-Pesa/Stripe/AT/WhatsApp/Supabase creds) is a Worker secret (`wrangler secret put ...`), never committed.

## Frontend architecture

Both `apps/app` and `apps/storefront` are Vue 3 + Vite + Pinia + vue-router + TailwindCSS, importing shared code from `@qesuite/types`, `@qesuite/shared`, `@qesuite/styles`, `@qesuite/ui` (workspace packages under `packages/`, referenced via `"*"` in `package.json` — no build step, consumed as source).

**`apps/app` role-based routing** (`src/router/index.ts`): one router, three role sections (`/` owner dashboard, `/rider`, `/admin` superadmin), each route tagged with `meta.role`. The global `beforeEach` guard reads `useAuthStore()`, waits on `authStore.ready` (cookie-based session rehydration on reload), then redirects based on token/role/onboarding-completion. When adding a route, set `meta.requiresAuth` + `meta.role` and it's covered by the existing guard — don't write a new per-view auth check.

**Token handling** (`src/api/*` in both apps, e.g. `apps/app/src/api/index.ts`): the access token lives in a module-level JS variable only — **never** localStorage/sessionStorage — to limit XSS blast radius. Session continuity across reloads comes from the httpOnly refresh cookie via `POST /api/auth/refresh`, called on mount. `apiFetch()` wraps `fetch`, auto-attaches `Authorization: Bearer`, and retries once through `refreshAccessToken()` on a 401. Follow this pattern for any new API call rather than calling `fetch` directly.

**Storefront PWA** (`apps/storefront`): configured via `vite-plugin-pwa` in `vite.config.ts` — service worker auto-updates and claims clients immediately (`skipWaiting`/`clientsClaim`), with a `NetworkFirst` runtime cache for `/api/products`. Cart state is `localStorage`-persisted client-side (no auth).

## Database (`migrations/`)

Sequential, numbered, additive (`ALTER TABLE ... ADD COLUMN`, `CREATE TABLE IF NOT EXISTS`) — never edit an already-applied migration; add a new numbered file. Current tables span tenants/users, store branding/settings, categories/products, orders/order_items, delivery staff/assignments, subscriptions/billing, notifications log, analytics snapshots, customers, order_payments, audit_log, plus tenant GPS coordinates and per-store M-Pesa receiving config.

## Shared packages (`packages/`)

- `@qesuite/types` — all cross-cutting TypeScript interfaces (Tenant, User, JWT, Product, Order, Delivery, Cart, Analytics, M-Pesa, Stripe, storefront types).
- `@qesuite/shared` — `constants.ts`: order status metadata/transitions, subscription plans (`PLANS`), currency symbols, payment methods, vehicle types, SMS/WhatsApp message templates (`SMS_TEMPLATES`), regexes for Kenyan phone numbers and M-Pesa codes, `APP_CONSTANTS`. Prefer extending these tables over inlining new copies of this data in an app.
- `@qesuite/styles` — Tailwind base stylesheet + design tokens + shared component classes (`.qs-input`, `.qs-btn`, `.qs-card`, ...).
- `@qesuite/ui` — shared Vue components (peer-depends on `vue`).

## Security invariants (don't relax these without asking)

- CORS in `index.ts` is an exact-match allowlist (`ALLOWED_ORIGINS`) — no wildcard/substring matching, and requests with no `Origin` header are blocked.
- Request bodies are capped (1 MB general, 10 MB for `/api/upload`) at the top-level middleware in `index.ts`.
- R2 uploads only via short-lived (10 min) presigned URLs, type/size validated server-side.
- Stripe webhooks verified by HMAC signature; M-Pesa callbacks expected from Safaricom IPs.
- `tenant_id` always from JWT, never from client-supplied body/query (see Backend architecture above).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
