import { Context, Next } from 'hono'
import { verifyJWT } from '../lib/jwt'
import { Env, Variables } from '../types'

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
