import { Context, Next } from 'hono'
import { Env, Variables } from '../types'

export async function tenantGuard(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const user = c.get('user')
  if (!user.tenant_id) {
    return c.json({ error: 'No tenant context', data: null }, 400)
  }

  const tenant = await c.env.qesuite_db.prepare('SELECT is_suspended FROM tenants WHERE id = ?')
    .bind(user.tenant_id)
    .first<{ is_suspended: number }>()

  if (!tenant) {
    return c.json({ error: 'Tenant not found', data: null }, 404)
  }

  if (tenant.is_suspended) {
    return c.json({ error: 'Store is suspended', data: null }, 403)
  }

  await next()
}

// Restricts a route to tenants registered under the 'food' (restaurant) category —
// gates the Sales Terminal (POS) and Expenses features.
export async function restaurantGuard(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const user = c.get('user')
  const tenant = await c.env.qesuite_db.prepare('SELECT store_category FROM tenants WHERE id = ?')
    .bind(user.tenant_id)
    .first<{ store_category: string }>()

  if (!tenant || tenant.store_category !== 'food') {
    return c.json({ error: 'This feature is only available for restaurant stores', data: null }, 403)
  }

  await next()
}
