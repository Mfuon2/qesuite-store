import { Hono } from 'hono'
import { Env, Variables, DeviceSessionPayload } from '../types'
import { authMiddleware, deviceSessionMiddleware } from '../middleware/auth'
import { tenantGuard } from '../middleware/tenant'
import { ownerOnly } from '../middleware/access'
import { signJWT, generateId } from '../lib/jwt'
import { hashToken } from '../lib/password'
import { auditEntry } from '../lib/audit'

const posDevices = new Hono<{ Bindings: Env; Variables: Variables }>()

// Phase 0 of offline-first POS. This registers/renews/revokes the long-lived
// device-session credential a POS terminal uses to keep working through a
// refresh/restart while offline — a separate, additive credential alongside
// (not a replacement for) the normal 15-minute dashboard access token. See
// migrations/0034_pos_device_sessions.sql for the schema this backs.
const POS_DEVICE_SESSION_TTL = 60 * 60 * 48 // 48 hours

async function issueSession(
  db: D1Database, tenantId: string, userId: string, deviceId: string, secret: string,
): Promise<{ credential: string; expires_at: string }> {
  const sessionId = generateId()
  const credential = await signJWT<DeviceSessionPayload>(
    { session_id: sessionId, device_id: deviceId, tenant_id: tenantId, user_id: userId, scope: 'pos' },
    secret,
    POS_DEVICE_SESSION_TTL,
  )
  const expiresAt = new Date(Date.now() + POS_DEVICE_SESSION_TTL * 1000).toISOString()
  await db.prepare(
    `INSERT INTO pos_device_sessions (id, device_id, tenant_id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(sessionId, deviceId, tenantId, userId, await hashToken(credential), expiresAt).run()
  return { credential, expires_at: expiresAt }
}

// POST /api/pos-devices/register — first-time registration for a device id
// the client already generated (UUIDv7) and persisted locally. Idempotent
// for an already-active device; a previously revoked device_id is refused —
// the client must mint a fresh identity rather than resurrect a revoked one.
posDevices.post('/register', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const body = await c.req.json<{ device_id?: string; name?: string }>()

    if (!body.device_id?.trim()) return c.json({ success: false, error: 'device_id is required', data: null }, 400)
    if (!body.name?.trim() || body.name.length > 80) {
      return c.json({ success: false, error: 'A device name (up to 80 characters) is required', data: null }, 400)
    }

    const existing = await c.env.qesuite_db.prepare(
      'SELECT id, status FROM pos_devices WHERE id = ? AND tenant_id = ?'
    ).bind(body.device_id, tenantId).first<{ id: string; status: string }>()

    if (existing?.status === 'revoked') {
      return c.json({ success: false, error: 'This device was revoked and cannot re-register — reinstall to get a new device identity', data: null }, 409)
    }

    if (!existing) {
      await c.env.qesuite_db.batch([
        c.env.qesuite_db.prepare(
          'INSERT INTO pos_devices (id, tenant_id, user_id, name) VALUES (?, ?, ?, ?)'
        ).bind(body.device_id, tenantId, user.sub, body.name.trim()),
        auditEntry(c.env.qesuite_db, {
          actorId: user.sub, actorRole: user.role, action: 'pos_device.registered',
          targetType: 'pos_device', targetId: body.device_id, detail: { name: body.name.trim() },
          ip: c.req.header('CF-Connecting-IP'),
        }),
      ])
    }

    const session = await issueSession(c.env.qesuite_db, tenantId, user.sub, body.device_id, c.env.JWT_SECRET)
    return c.json({ success: true, data: session, error: null, message: 'Device registered' }, 201)
  } catch (err) {
    console.error('pos device register error', err)
    return c.json({ success: false, error: 'Failed to register device', data: null }, 500)
  }
})

// POST /api/pos-devices/:id/session — renew the credential for an
// already-registered, active device (the "while online, before expiry" path).
posDevices.post('/:id/session', authMiddleware, tenantGuard, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const deviceId = c.req.param('id') as string

    const device = await c.env.qesuite_db.prepare(
      'SELECT status FROM pos_devices WHERE id = ? AND tenant_id = ?'
    ).bind(deviceId, tenantId).first<{ status: string }>()
    if (!device) return c.json({ success: false, error: 'Device not found', data: null }, 404)
    if (device.status !== 'active') return c.json({ success: false, error: 'This device has been revoked', data: null }, 409)

    const session = await issueSession(c.env.qesuite_db, tenantId, user.sub, deviceId, c.env.JWT_SECRET)
    return c.json({ success: true, data: session, error: null, message: 'Session renewed' })
  } catch (err) {
    console.error('pos device session error', err)
    return c.json({ success: false, error: 'Failed to renew device session', data: null }, 500)
  }
})

// GET /api/pos-devices — list this tenant's registered devices
posDevices.get('/', authMiddleware, tenantGuard, async (c) => {
  try {
    const tenantId = c.get('user').tenant_id!
    const rows = await c.env.qesuite_db.prepare(
      `SELECT d.id, d.name, d.status, d.last_seen_at, d.created_at, u.name AS registered_by_name
       FROM pos_devices d JOIN users u ON u.id = d.user_id
       WHERE d.tenant_id = ? ORDER BY d.created_at DESC`
    ).bind(tenantId).all()
    return c.json({ success: true, data: rows.results, error: null })
  } catch (err) {
    console.error('pos devices list error', err)
    return c.json({ success: false, error: 'Failed to list devices', data: null }, 500)
  }
})

// POST /api/pos-devices/:id/revoke — owner-only, mirroring the staff-access
// pattern in middleware/access.ts. Revokes the device identity itself plus
// every active credential it currently holds.
posDevices.post('/:id/revoke', authMiddleware, tenantGuard, ownerOnly, async (c) => {
  try {
    const user = c.get('user')
    const tenantId = user.tenant_id!
    const deviceId = c.req.param('id') as string

    const device = await c.env.qesuite_db.prepare(
      'SELECT id FROM pos_devices WHERE id = ? AND tenant_id = ?'
    ).bind(deviceId, tenantId).first()
    if (!device) return c.json({ success: false, error: 'Device not found', data: null }, 404)

    await c.env.qesuite_db.batch([
      c.env.qesuite_db.prepare(
        "UPDATE pos_devices SET status = 'revoked', revoked_at = datetime('now'), revoked_by = ? WHERE id = ?"
      ).bind(user.sub, deviceId),
      c.env.qesuite_db.prepare(
        "UPDATE pos_device_sessions SET status = 'revoked', revoked_at = datetime('now') WHERE device_id = ? AND status = 'active'"
      ).bind(deviceId),
      auditEntry(c.env.qesuite_db, {
        actorId: user.sub, actorRole: user.role, action: 'pos_device.revoked',
        targetType: 'pos_device', targetId: deviceId, ip: c.req.header('CF-Connecting-IP'),
      }),
    ])

    return c.json({ success: true, data: { id: deviceId }, error: null, message: 'Device revoked' })
  } catch (err) {
    console.error('pos device revoke error', err)
    return c.json({ success: false, error: 'Failed to revoke device', data: null }, 500)
  }
})

// GET /api/pos-devices/whoami — proves the credential/middleware/revocation
// loop end-to-end; the only thing later sync endpoints (Phase 2+) actually
// need from deviceSessionMiddleware already works before they're built on it.
posDevices.get('/whoami', deviceSessionMiddleware, async (c) => {
  const session = c.get('deviceSession')!
  return c.json({ success: true, data: { device_id: session.device_id, tenant_id: session.tenant_id, user_id: session.user_id }, error: null })
})

export default posDevices
