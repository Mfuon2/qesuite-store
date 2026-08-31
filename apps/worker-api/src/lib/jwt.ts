import { JWTPayload } from '../types'

// Generic over the payload shape so a second token kind (e.g. DeviceSessionPayload)
// can reuse this exact HMAC implementation instead of a duplicated one — defaulted
// to JWTPayload so every existing call site keeps working unchanged.
export async function signJWT<T extends object = JWTPayload>(
  payload: Omit<T, 'exp' | 'iat'>,
  secret: string,
  expiresInSeconds = 900
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds } as T & { iat: number; exp: number }

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const body = btoa(JSON.stringify(fullPayload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const data = `${header}.${body}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${data}.${sig}`
}

export async function verifyJWT<T extends object = JWTPayload>(token: string, secret: string): Promise<T & { iat: number; exp: number }> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')

  const [header, body, sig] = parts
  const data = `${header}.${body}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const sigBytes = Uint8Array.from(
    atob(sig.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0)
  )
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
  if (!valid) throw new Error('Invalid signature')

  const payload = JSON.parse(
    atob(body.replace(/-/g, '+').replace(/_/g, '/'))
  ) as T & { iat: number; exp: number }
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')

  return payload
}

export function generateOTP(): string {
  // Cryptographically secure 6-digit OTP
  const buf = crypto.getRandomValues(new Uint32Array(1))
  return String(100000 + (buf[0] % 900000))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function generateTrackingCode(): string {
  // Cryptographically secure — replaces Math.random()
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}
