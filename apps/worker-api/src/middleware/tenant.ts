import { Context, Next } from 'hono'
import { Env, Variables } from '../types'

// Shared with settings.ts/admin.ts, which return the raw `tenants` row (with
// its JSON-encoded disabled_modules column) straight to a dashboard client.
export function parseDisabledModules(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function tenantGuard(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const user = c.get('user')
  if (!user.tenant_id) {
    return c.json({ error: 'No tenant context', data: null }, 400)
  }

  const tenant = await c.env.qesuite_db.prepare('SELECT is_suspended, disabled_modules FROM tenants WHERE id = ?')
    .bind(user.tenant_id)
    .first<{ is_suspended: number; disabled_modules: string | null }>()

  if (!tenant) {
    return c.json({ error: 'Tenant not found', data: null }, 404)
  }

  if (tenant.is_suspended) {
    return c.json({ error: 'Store is suspended', data: null }, 403)
  }

  // Parsed once here (tenantGuard already runs on every tenant-scoped route)
  // so requireModule below never needs its own extra query.
  c.set('disabledModules', parseDisabledModules(tenant.disabled_modules))

  await next()
}

// Restricts a route to tenants registered under the 'food' (restaurant) category —
// gates the Sales Terminal (POS) and Expenses features.
export function categoryGuard(...allowed: string[]) {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const user = c.get('user')
    const tenant = await c.env.qesuite_db.prepare('SELECT store_category FROM tenants WHERE id = ?')
      .bind(user.tenant_id)
      .first<{ store_category: string }>()

    if (!tenant || !allowed.includes(tenant.store_category)) {
      return c.json({ error: `This feature is only available for ${allowed.join('/')} stores`, data: null }, 403)
    }

    await next()
  }
}
export const restaurantGuard = categoryGuard('food')

// Blocks a route when a superadmin has switched the owning module off for this
// tenant (Store Detail > Modules). Must run after tenantGuard, which populates
// `disabledModules` on the request context.
export function requireModule(moduleKey: string) {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const disabled = c.get('disabledModules') ?? []
    if (disabled.includes(moduleKey)) {
      return c.json({ error: 'This feature has been disabled for your store by the platform administrator', data: null }, 403)
    }
    await next()
  }
}
