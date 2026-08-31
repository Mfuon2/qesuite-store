import type { Context, Next } from 'hono'
import { ALL_ACCESS_PERMISSIONS, ACCESS_PERMISSION_GROUPS } from '@qesuite/shared'
import type { Env, Variables } from '../types'
import { authMiddleware } from './auth'
import { tenantGuard } from './tenant'

export type PermissionKey = (typeof ALL_ACCESS_PERMISSIONS)[number]

const validPermissions = new Set<string>(ALL_ACCESS_PERMISSIONS)

export function normalizePermissions(values: unknown): PermissionKey[] {
  if (!Array.isArray(values)) return []
  const selected = new Set<PermissionKey>()
  for (const value of values) {
    if (typeof value === 'string' && validPermissions.has(value)) {
      selected.add(value as PermissionKey)
    }
  }

  // An operation always implies access to its parent menu. Keeping this invariant
  // in the API prevents a malformed client from creating unusable access sets.
  for (const group of ACCESS_PERMISSION_GROUPS) {
    if (group.permissions.some(permission => selected.has(permission.key))) {
      selected.add(group.permissions[0].key)
    }
  }
  return [...selected]
}

export async function requirePermissions(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
  permissions: readonly PermissionKey[],
  mode: 'all' | 'any' = 'all',
) {
  const user = c.get('user')
  if (user.role === 'owner') {
    await next()
    return
  }
  if (user.role !== 'staff' || !user.tenant_id) {
    return c.json({ success: false, error: 'Forbidden', data: null }, 403)
  }

  const placeholders = permissions.map(() => '?').join(', ')
  const row = await c.env.qesuite_db.prepare(
    `SELECT u.is_active, COUNT(DISTINCT up.permission_key) AS permission_count
     FROM users u
     LEFT JOIN user_permissions up
       ON up.user_id = u.id AND up.tenant_id = u.tenant_id
       AND up.permission_key IN (${placeholders})
     WHERE u.id = ? AND u.tenant_id = ? AND u.role = 'staff'
     GROUP BY u.id`
  ).bind(...permissions, user.sub, user.tenant_id).first<{
    is_active: number
    permission_count: number
  }>()

  const requiredCount = mode === 'all' ? permissions.length : 1
  if (!row?.is_active || row.permission_count < requiredCount) {
    return c.json({
      success: false,
      error: 'You do not have permission to perform this action',
      data: null,
      required_permissions: permissions,
    }, 403)
  }
  await next()
}

type AccessRule = {
  method?: string
  path: RegExp
  permissions: readonly PermissionKey[]
  mode?: 'all' | 'any'
}

// Central policy for authenticated dashboard APIs. Individual route auth remains
// in place; this layer adds operation-level authorization before handlers run.
const accessRules: AccessRule[] = [
  { method: 'GET', path: /^\/api\/analytics\/(summary|revenue|order-status)$/, permissions: ['dashboard.view', 'analytics.view'], mode: 'any' },
  { method: 'GET', path: /^\/api\/analytics\/employees$/, permissions: ['analytics.view_employees'] },
  { path: /^\/api\/analytics\//, permissions: ['analytics.view'] },

  { method: 'PUT', path: /^\/api\/orders\/[^/]+\/status$/, permissions: ['orders.update_status'] },
  { method: 'POST', path: /^\/api\/orders\/[^/]+\/payment$/, permissions: ['orders.manage_payments'] },
  { method: 'GET', path: /^\/api\/orders(?:\/[^/]+(?:\/packing-slip)?)?$/, permissions: ['orders.view'] },

  { method: 'POST', path: /^\/api\/products\/bulk-import$/, permissions: ['products.create'] },
  { method: 'POST', path: /^\/api\/products\/[^/]+\/image$/, permissions: ['products.edit'] },
  { method: 'POST', path: /^\/api\/products\/?$/, permissions: ['products.create'] },
  { method: 'PUT', path: /^\/api\/products\/[^/]+$/, permissions: ['products.edit'] },
  { method: 'DELETE', path: /^\/api\/products\/[^/]+$/, permissions: ['products.delete'] },
  { method: 'GET', path: /^\/api\/products\/[^/]+$/, permissions: ['products.view'] },

  { method: 'POST', path: /^\/api\/categories\/?$/, permissions: ['categories.manage'] },
  { method: 'POST', path: /^\/api\/categories\/reorder$/, permissions: ['categories.manage'] },
  { method: 'PUT', path: /^\/api\/categories\/[^/]+$/, permissions: ['categories.manage'] },
  { method: 'DELETE', path: /^\/api\/categories\/[^/]+$/, permissions: ['categories.manage'] },

  { method: 'POST', path: /^\/api\/delivery\/assign$/, permissions: ['orders.assign_delivery', 'delivery.assign'], mode: 'any' },
  { method: 'GET', path: /^\/api\/delivery\/(staff|assignments)(?:\/|$)/, permissions: ['delivery.view'] },
  { path: /^\/api\/delivery\/staff(?:\/|$)/, permissions: ['delivery.manage_staff'] },

  { method: 'POST', path: /^\/api\/pos\/[^/]+\/void$/, permissions: ['pos.void_sale'] },
  { path: /^\/api\/pos\/till\/(open|close|movements)$/, permissions: ['pos.manage_till'] },
  { method: 'POST', path: /^\/api\/pos\/?$/, permissions: ['pos.create_sale'] },
  { method: 'GET', path: /^\/api\/pos(?:\/|$)/, permissions: ['pos.view'] },

  { method: 'POST', path: /^\/api\/expenses\/?$/, permissions: ['expenses.create'] },
  { method: 'PUT', path: /^\/api\/expenses\/[^/]+$/, permissions: ['expenses.edit'] },
  { method: 'DELETE', path: /^\/api\/expenses\/[^/]+$/, permissions: ['expenses.delete'] },
  { method: 'GET', path: /^\/api\/expenses(?:\/|$)/, permissions: ['expenses.view'] },

  { method: 'POST', path: /^\/api\/notifications\/[^/]+\/(send|resend)$/, permissions: ['notifications.send'] },
  { method: 'GET', path: /^\/api\/notifications(?:\/|$)/, permissions: ['notifications.view'] },
  { method: 'POST', path: /^\/api\/customers\/?$/, permissions: ['customers.manage'] },
  { method: 'PUT', path: /^\/api\/customers\/[^/]+$/, permissions: ['customers.manage'] },
  { method: 'GET', path: /^\/api\/customers(?:\/|$)/, permissions: ['dashboard.view', 'orders.view', 'customers.view'], mode: 'any' },

  { method: 'PUT', path: /^\/api\/(settings\/(tenant|store)|store)\/?$/, permissions: ['settings.edit'] },
  { method: 'POST', path: /^\/api\/settings\/onboarding$/, permissions: ['settings.edit'] },
  { method: 'POST', path: /^\/api\/onboarding\//, permissions: ['settings.edit'] },
  { method: 'POST', path: /^\/api\/upload\//, permissions: ['products.edit', 'settings.edit'], mode: 'any' },

  { method: 'GET', path: /^\/api\/billing\/(subscription|history)$/, permissions: ['subscriptions.view'] },
  { method: 'POST', path: /^\/api\/billing\//, permissions: ['subscriptions.manage'] },
  { method: 'POST', path: /^\/api\/payments\/subscription$/, permissions: ['subscriptions.manage'] },

  { method: 'GET', path: /^\/api\/invoices(?:\/|$)/, permissions: ['billing.view'] },
  { method: 'POST', path: /^\/api\/invoices\/[^/]+\/(payments|write-off|void|credit-notes)$/, permissions: ['billing.manage'] },
  { method: 'POST', path: /^\/api\/invoices\/[^/]+\/send$/, permissions: ['billing.create'] },
  { method: 'PUT', path: /^\/api\/invoices\/[^/]+$/, permissions: ['billing.create'] },
  { method: 'POST', path: /^\/api\/invoices\/?$/, permissions: ['billing.create'] },

  { method: 'GET', path: /^\/api\/suppliers(?:\/|$)/, permissions: ['suppliers.view'] },
  { method: 'POST', path: /^\/api\/suppliers\/?/, permissions: ['suppliers.manage'] },
  { method: 'PUT', path: /^\/api\/suppliers\/[^/]+$/, permissions: ['suppliers.manage'] },
  { method: 'DELETE', path: /^\/api\/suppliers\/[^/]+$/, permissions: ['suppliers.manage'] },

  { method: 'GET', path: /^\/api\/purchase-orders(?:\/|$)/, permissions: ['purchase_orders.view'] },
  { method: 'POST', path: /^\/api\/purchase-orders\/[^/]+\/(approve|reject|send)$/, permissions: ['purchase_orders.approve'] },
  { method: 'POST', path: /^\/api\/purchase-orders\/[^/]+\/receive$/, permissions: ['purchase_orders.receive'] },
  { method: 'POST', path: /^\/api\/purchase-orders\/[^/]+\/(submit|cancel)$/, permissions: ['purchase_orders.create'] },
  { method: 'PUT', path: /^\/api\/purchase-orders\/[^/]+$/, permissions: ['purchase_orders.create'] },
  { method: 'POST', path: /^\/api\/purchase-orders\/?$/, permissions: ['purchase_orders.create'] },

  { method: 'GET', path: /^\/api\/stock\/(movements|take)(?:\/|$)/, permissions: ['stock.view'] },
  { method: 'POST', path: /^\/api\/stock\/take\//, permissions: ['stock.take'] },
  { method: 'POST', path: /^\/api\/stock\/adjustments\/?$/, permissions: ['stock.adjust'] },

  { method: 'GET', path: /^\/api\/approvals(?:\/|$)/, permissions: ['approvals.view'] },
  { method: 'POST', path: /^\/api\/approvals\/[^/]+\/(approve|reject)$/, permissions: ['approvals.decide'] },
]

// Every request only needs to test rules that could possibly match its own
// method (its own method's rules, plus the handful with no method — meaning
// "any method"). Pre-splitting by method at module load avoids re-testing
// the full rule list — now 57 entries and growing — against every request.
// `.filter()` preserves relative order, so first-match semantics are
// unchanged; this is a pure lookup-cost optimization, not a policy change.
const rulesByMethod = new Map<string, AccessRule[]>()
function rulesFor(method: string): AccessRule[] {
  let rules = rulesByMethod.get(method)
  if (!rules) {
    rules = accessRules.filter(candidate => !candidate.method || candidate.method === method)
    rulesByMethod.set(method, rules)
  }
  return rules
}

export async function enforceAccessPolicy(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
): Promise<Response | void> {
  const rule = rulesFor(c.req.method).find(candidate => candidate.path.test(c.req.path))
  if (!rule) {
    await next()
    return
  }
  let response: Response | undefined
  const authResponse = await authMiddleware(c, async () => {
    const tenantResponse = await tenantGuard(c, async () => {
      const permissionResponse = await requirePermissions(c, next, rule.permissions, rule.mode)
      if (permissionResponse) response = permissionResponse
    })
    if (tenantResponse) response = tenantResponse
  })
  return authResponse ?? response
}

export async function ownerOnly(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next,
) {
  const user = c.get('user')
  if (user.role !== 'owner' || !user.tenant_id) {
    return c.json({ success: false, error: 'Only the store owner can manage staff access', data: null }, 403)
  }
  await next()
}
