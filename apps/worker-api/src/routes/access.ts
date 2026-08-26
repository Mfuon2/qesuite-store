import { Context, Hono } from 'hono'
import { ALL_ACCESS_PERMISSIONS, ACCESS_PERMISSION_GROUPS, ACCESS_PRESETS } from '@qesuite/shared'
import type { Env, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { normalizePermissions, ownerOnly } from '../middleware/access'
import { generateId } from '../lib/jwt'
import { hashPassword, hashToken } from '../lib/password'

const access = new Hono<{ Bindings: Env; Variables: Variables }>()

const MAX_NAME = 120
const MAX_EMAIL = 320
const MAX_PHONE = 20
const MAX_JOB_TITLE = 80
const INVITE_TTL_DAYS = 7

function createInviteToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function inviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace('store.', 'go.')}/accept-invite?token=${encodeURIComponent(token)}`
}

function parseStoredPermissions(value: string): string[] {
  try {
    return normalizePermissions(JSON.parse(value))
  } catch {
    return []
  }
}

async function findInvitation(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  token: string,
) {
  const tokenHash = await hashToken(token)
  return c.env.qesuite_db.prepare(
    `SELECT si.*, t.name AS store_name
     FROM staff_invitations si
     JOIN tenants t ON t.id = si.tenant_id
     WHERE si.token_hash = ? LIMIT 1`
  ).bind(tokenHash).first<{
    id: string
    tenant_id: string
    name: string
    email: string
    phone: string | null
    job_title: string | null
    permissions_json: string
    status: string
    expires_at: string
    store_name: string
  }>()
}

// Public invitation preview and acceptance.
access.get('/invitations/accept/:token', async (c) => {
  const invitation = await findInvitation(c, c.req.param('token'))
  if (!invitation) return c.json({ success: false, error: 'Invitation not found', data: null }, 404)
  const expired = Date.parse(invitation.expires_at) <= Date.now()
  if (expired && invitation.status === 'pending') {
    await c.env.qesuite_db.prepare(
      "UPDATE staff_invitations SET status = 'expired', updated_at = datetime('now') WHERE id = ?"
    ).bind(invitation.id).run()
  }
  return c.json({
    success: true,
    data: {
      name: invitation.name,
      email: invitation.email,
      phone: invitation.phone,
      job_title: invitation.job_title,
      store_name: invitation.store_name,
      status: expired ? 'expired' : invitation.status,
      expires_at: invitation.expires_at,
    },
    error: null,
  })
})

access.post('/invitations/accept/:token', async (c) => {
  try {
    const invitation = await findInvitation(c, c.req.param('token'))
    if (!invitation || invitation.status !== 'pending') {
      return c.json({ success: false, error: 'This invitation is no longer available', data: null }, 410)
    }
    if (Date.parse(invitation.expires_at) <= Date.now()) {
      await c.env.qesuite_db.prepare(
        "UPDATE staff_invitations SET status = 'expired', updated_at = datetime('now') WHERE id = ?"
      ).bind(invitation.id).run()
      return c.json({ success: false, error: 'This invitation has expired', data: null }, 410)
    }

    const body = await c.req.json<{ password?: string }>()
    if (!body.password || body.password.length < 8 || body.password.length > 128) {
      return c.json({ success: false, error: 'Password must be 8–128 characters', data: null }, 400)
    }
    const duplicate = await c.env.qesuite_db.prepare(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1 LIMIT 1'
    ).bind(invitation.email).first()
    if (duplicate) {
      return c.json({ success: false, error: 'An active account already uses this email', data: null }, 409)
    }

    const userId = generateId()
    const passwordHash = await hashPassword(body.password)
    const permissions = parseStoredPermissions(invitation.permissions_json)
    const statements = [
      c.env.qesuite_db.prepare(
        `INSERT INTO users
          (id, tenant_id, name, email, phone, password_hash, role, job_title, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'staff', ?, 1, datetime('now'))`
      ).bind(
        userId, invitation.tenant_id, invitation.name, invitation.email,
        invitation.phone, passwordHash, invitation.job_title,
      ),
      ...permissions.map(permission => c.env.qesuite_db.prepare(
        `INSERT INTO user_permissions
          (user_id, tenant_id, permission_key, granted_by, created_at, updated_at)
         SELECT ?, tenant_id, ?, invited_by, datetime('now'), datetime('now')
         FROM staff_invitations WHERE id = ?`
      ).bind(userId, permission, invitation.id)),
      c.env.qesuite_db.prepare(
        `UPDATE staff_invitations
         SET status = 'accepted', accepted_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ? AND status = 'pending'`
      ).bind(invitation.id),
    ]
    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { email: invitation.email }, error: null, message: 'Account created. You can now sign in.' }, 201)
  } catch (error) {
    console.error(JSON.stringify({ message: 'staff invitation acceptance failed', error: error instanceof Error ? error.message : String(error) }))
    return c.json({ success: false, error: 'Failed to accept invitation', data: null }, 500)
  }
})

access.use('*', authMiddleware, tenantGuard)

access.get('/me', async (c) => {
  const user = c.get('user')
  if (user.role === 'owner') {
    return c.json({ success: true, data: { role: user.role, is_owner: true, permissions: ALL_ACCESS_PERMISSIONS }, error: null })
  }
  if (user.role !== 'staff') {
    return c.json({ success: true, data: { role: user.role, is_owner: false, permissions: [] }, error: null })
  }
  const rows = await c.env.qesuite_db.prepare(
    'SELECT permission_key FROM user_permissions WHERE tenant_id = ? AND user_id = ? ORDER BY permission_key'
  ).bind(user.tenant_id, user.sub).all<{ permission_key: string }>()
  return c.json({
    success: true,
    data: { role: user.role, is_owner: false, permissions: normalizePermissions(rows.results.map(row => row.permission_key)) },
    error: null,
  })
})

access.use('/members/*', ownerOnly)
access.use('/members', ownerOnly)
access.use('/invitations/*', ownerOnly)
access.use('/invitations', ownerOnly)
access.get('/catalog', ownerOnly, (c) => c.json({
  success: true,
  data: { groups: ACCESS_PERMISSION_GROUPS, presets: ACCESS_PRESETS },
  error: null,
}))

access.get('/members', async (c) => {
  const tenantId = c.get('tenant_id')
  const [members, permissionRows] = await Promise.all([
    c.env.qesuite_db.prepare(
      `SELECT id, tenant_id, name, email, phone, role, job_title, is_active,
              last_login_at, created_at
       FROM users
       WHERE tenant_id = ? AND role IN ('owner', 'staff')
       ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, is_active DESC, name`
    ).bind(tenantId).all<{
      id: string; tenant_id: string; name: string; email: string | null; phone: string | null
      role: 'owner' | 'staff'; job_title: string | null; is_active: number
      last_login_at: string | null; created_at: string
    }>(),
    c.env.qesuite_db.prepare(
      'SELECT user_id, permission_key FROM user_permissions WHERE tenant_id = ? ORDER BY permission_key'
    ).bind(tenantId).all<{ user_id: string; permission_key: string }>(),
  ])
  const byUser = new Map<string, string[]>()
  for (const row of permissionRows.results) {
    const values = byUser.get(row.user_id) ?? []
    values.push(row.permission_key)
    byUser.set(row.user_id, values)
  }
  return c.json({
    success: true,
    data: members.results.map(member => ({
      ...member,
      is_active: Boolean(member.is_active),
      permissions: member.role === 'owner' ? ALL_ACCESS_PERMISSIONS : normalizePermissions(byUser.get(member.id) ?? []),
    })),
    error: null,
  })
})

access.put('/members/:id', async (c) => {
  try {
    const tenantId = c.get('tenant_id')
    const targetId = c.req.param('id')
    const target = await c.env.qesuite_db.prepare(
      "SELECT id, email FROM users WHERE id = ? AND tenant_id = ? AND role = 'staff'"
    ).bind(targetId, tenantId).first<{ id: string; email: string | null }>()
    if (!target) return c.json({ success: false, error: 'Staff member not found', data: null }, 404)

    const body = await c.req.json<{
      name?: string; email?: string; phone?: string | null; job_title?: string | null; permissions?: unknown
    }>()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const phone = body.phone?.trim() || null
    const jobTitle = body.job_title?.trim() || null
    if (!name || name.length > MAX_NAME) return c.json({ success: false, error: 'A valid name is required', data: null }, 400)
    if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'A valid email is required', data: null }, 400)
    }
    if ((phone?.length ?? 0) > MAX_PHONE || (jobTitle?.length ?? 0) > MAX_JOB_TITLE) {
      return c.json({ success: false, error: 'Phone or job title is too long', data: null }, 400)
    }
    const duplicate = await c.env.qesuite_db.prepare(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ? AND is_active = 1 LIMIT 1'
    ).bind(email, targetId).first()
    if (duplicate) return c.json({ success: false, error: 'This email is already in use', data: null }, 409)

    const permissions = normalizePermissions(body.permissions)
    const statements = [
      c.env.qesuite_db.prepare(
        'UPDATE users SET name = ?, email = ?, phone = ?, job_title = ? WHERE id = ? AND tenant_id = ?'
      ).bind(name, email, phone, jobTitle, targetId, tenantId),
      c.env.qesuite_db.prepare('DELETE FROM user_permissions WHERE user_id = ? AND tenant_id = ?').bind(targetId, tenantId),
      ...permissions.map(permission => c.env.qesuite_db.prepare(
        `INSERT INTO user_permissions
          (user_id, tenant_id, permission_key, granted_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).bind(targetId, tenantId, permission, c.get('user').sub)),
    ]
    await c.env.qesuite_db.batch(statements)
    return c.json({ success: true, data: { id: targetId, permissions }, error: null, message: 'Access updated' })
  } catch (error) {
    console.error(JSON.stringify({ message: 'staff access update failed', error: error instanceof Error ? error.message : String(error) }))
    return c.json({ success: false, error: 'Failed to update staff access', data: null }, 500)
  }
})

access.patch('/members/:id/status', async (c) => {
  const tenantId = c.get('tenant_id')
  const targetId = c.req.param('id')
  const body = await c.req.json<{ is_active?: boolean }>()
  if (typeof body.is_active !== 'boolean') {
    return c.json({ success: false, error: 'is_active must be true or false', data: null }, 400)
  }
  const result = await c.env.qesuite_db.prepare(
    `UPDATE users SET is_active = ?, refresh_token = CASE WHEN ? = 0 THEN NULL ELSE refresh_token END
     WHERE id = ? AND tenant_id = ? AND role = 'staff'`
  ).bind(body.is_active ? 1 : 0, body.is_active ? 1 : 0, targetId, tenantId).run()
  if (!result.meta.changes) return c.json({ success: false, error: 'Staff member not found', data: null }, 404)
  return c.json({ success: true, data: { id: targetId, is_active: body.is_active }, error: null })
})

access.get('/invitations', async (c) => {
  const tenantId = c.get('tenant_id')
  await c.env.qesuite_db.prepare(
    `UPDATE staff_invitations SET status = 'expired', updated_at = datetime('now')
     WHERE tenant_id = ? AND status = 'pending' AND unixepoch(expires_at) <= unixepoch('now')`
  ).bind(tenantId).run()
  const rows = await c.env.qesuite_db.prepare(
    `SELECT id, tenant_id, name, email, phone, job_title, permissions_json,
            status, expires_at, created_at
     FROM staff_invitations WHERE tenant_id = ?
     ORDER BY created_at DESC LIMIT 100`
  ).bind(tenantId).all<{
    id: string; tenant_id: string; name: string; email: string; phone: string | null
    job_title: string | null; permissions_json: string; status: string
    expires_at: string; created_at: string
  }>()
  return c.json({
    success: true,
    data: rows.results.map(row => ({
      ...row,
      permissions: parseStoredPermissions(row.permissions_json),
      permissions_json: undefined,
    })),
    error: null,
  })
})

access.post('/invitations', async (c) => {
  try {
    const tenantId = c.get('tenant_id')
    const body = await c.req.json<{
      name?: string; email?: string; phone?: string | null; job_title?: string | null; permissions?: unknown
    }>()
    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const phone = body.phone?.trim() || null
    const jobTitle = body.job_title?.trim() || null
    if (!name || name.length > MAX_NAME) return c.json({ success: false, error: 'A valid name is required', data: null }, 400)
    if (!email || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ success: false, error: 'A valid email is required', data: null }, 400)
    }
    if ((phone?.length ?? 0) > MAX_PHONE || (jobTitle?.length ?? 0) > MAX_JOB_TITLE) {
      return c.json({ success: false, error: 'Phone or job title is too long', data: null }, 400)
    }
    const existing = await c.env.qesuite_db.prepare(
      `SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1
       UNION ALL
       SELECT id FROM staff_invitations
       WHERE LOWER(email) = LOWER(?) AND status = 'pending' AND unixepoch(expires_at) > unixepoch('now')
       LIMIT 1`
    ).bind(email, email).first()
    if (existing) return c.json({ success: false, error: 'This email already has active or pending access', data: null }, 409)

    const permissions = normalizePermissions(body.permissions)
    const rawToken = createInviteToken()
    const id = generateId()
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString()
    await c.env.qesuite_db.prepare(
      `INSERT INTO staff_invitations
        (id, tenant_id, name, email, phone, job_title, token_hash, permissions_json,
         status, invited_by, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      id, tenantId, name, email, phone, jobTitle, await hashToken(rawToken),
      JSON.stringify(permissions), c.get('user').sub, expiresAt,
    ).run()
    return c.json({
      success: true,
      data: { id, invite_url: inviteUrl(c.env.APP_BASE_URL, rawToken), expires_at: expiresAt },
      error: null,
      message: 'Invitation created',
    }, 201)
  } catch (error) {
    console.error(JSON.stringify({ message: 'staff invitation creation failed', error: error instanceof Error ? error.message : String(error) }))
    return c.json({ success: false, error: 'Failed to create invitation', data: null }, 500)
  }
})

access.post('/invitations/:id/renew', async (c) => {
  const tenantId = c.get('tenant_id')
  const rawToken = createInviteToken()
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString()
  const result = await c.env.qesuite_db.prepare(
    `UPDATE staff_invitations
     SET token_hash = ?, status = 'pending', expires_at = ?, updated_at = datetime('now')
     WHERE id = ? AND tenant_id = ? AND status != 'accepted'`
  ).bind(await hashToken(rawToken), expiresAt, c.req.param('id'), tenantId).run()
  if (!result.meta.changes) return c.json({ success: false, error: 'Invitation not found', data: null }, 404)
  return c.json({ success: true, data: { invite_url: inviteUrl(c.env.APP_BASE_URL, rawToken), expires_at: expiresAt }, error: null })
})

access.delete('/invitations/:id', async (c) => {
  const result = await c.env.qesuite_db.prepare(
    `UPDATE staff_invitations SET status = 'revoked', updated_at = datetime('now')
     WHERE id = ? AND tenant_id = ? AND status = 'pending'`
  ).bind(c.req.param('id'), c.get('tenant_id')).run()
  if (!result.meta.changes) return c.json({ success: false, error: 'Pending invitation not found', data: null }, 404)
  return c.json({ success: true, data: null, error: null })
})

export default access
