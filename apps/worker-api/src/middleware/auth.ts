import { Context, Next } from 'hono'
import { verifyJWT } from '../lib/jwt'
import { Env, Variables, DeviceSessionPayload } from '../types'

export async function authMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', data: null }, 401)
  }

  const token = authHeader.substring(7)
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    c.set('user', payload)
    if (payload.tenant_id) {
      c.set('tenant_id', payload.tenant_id)
    }
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token', data: null }, 401)
  }
}

export async function superadminMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', data: null }, 401)
  }
  const token = authHeader.substring(7)
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    if (payload.role !== 'superadmin') {
      return c.json({ error: 'Forbidden', data: null }, 403)
    }
    c.set('user', payload)
    if (payload.tenant_id) c.set('tenant_id', payload.tenant_id)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token', data: null }, 401)
  }
}

// Verifies a POS device-session credential (a separate credential kind from
// JWTPayload — see the comment on DeviceSessionPayload). The JWT signature
// only proves the token wasn't tampered with; the actual revocation gate is
// the DB check below, since a device-session token is long-lived enough
// that "revoke the device" must take effect before the token's own expiry.
export async function deviceSessionMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', data: null }, 401)
  }
  const token = authHeader.substring(7)
  try {
    const payload = await verifyJWT<DeviceSessionPayload>(token, c.env.JWT_SECRET)
    if (payload.scope !== 'pos') {
      return c.json({ error: 'Forbidden', data: null }, 403)
    }

    const session = await c.env.qesuite_db.prepare(
      'SELECT status, expires_at FROM pos_device_sessions WHERE id = ? AND device_id = ?'
    ).bind(payload.session_id, payload.device_id).first<{ status: string; expires_at: string }>()
    if (!session || session.status !== 'active' || new Date(session.expires_at) < new Date()) {
      return c.json({ error: 'Device session is no longer valid', data: null }, 401)
    }

    const device = await c.env.qesuite_db.prepare(
      'SELECT status FROM pos_devices WHERE id = ?'
    ).bind(payload.device_id).first<{ status: string }>()
    if (!device || device.status !== 'active') {
      return c.json({ error: 'This device has been revoked', data: null }, 401)
    }

    c.set('deviceSession', payload)
    c.set('tenant_id', payload.tenant_id)
    // Fire-and-forget — a slow/failed last_seen_at write must never block the request.
    c.env.qesuite_db.prepare("UPDATE pos_devices SET last_seen_at = datetime('now') WHERE id = ?")
      .bind(payload.device_id).run().catch(() => {})

    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token', data: null }, 401)
  }
}

export async function riderMiddleware(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', data: null }, 401)
  }
  const token = authHeader.substring(7)
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    if (payload.role !== 'rider' && payload.role !== 'owner') {
      return c.json({ error: 'Forbidden', data: null }, 403)
    }
    c.set('user', payload)
    if (payload.tenant_id) c.set('tenant_id', payload.tenant_id)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token', data: null }, 401)
  }
}
