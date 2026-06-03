/**
 * Password hashing using PBKDF2-SHA256 via the Web Crypto API.
 *
 * Why PBKDF2 instead of bcrypt:
 *   Cloudflare Workers only expose the standard Web Crypto API — there is no
 *   native bcrypt support and pure-JS bcrypt (bcryptjs) adds ~50 kB bundle size
 *   and is slower in V8 isolates.  PBKDF2 is NIST SP 800-132 / FIPS-140 compliant
 *   and produces equally strong hashes when the iteration count is high enough.
 *
 * Parameters chosen to meet OWASP 2024 minimums:
 *   - 600,000 iterations of PBKDF2-SHA256  (OWASP minimum: 600,000)
 *   - 32-byte random salt per password
 *   - 256-bit derived key
 *
 * Hash format (v2): "v2:<iterHex>:<saltHex>:<hashHex>"
 * Legacy format (v1): "<saltHex>:<hashHex>"  — verified transparently, never created.
 */

const ITERATIONS = 100_000
const SALT_BYTES = 32
const KEY_BITS   = 256

const enc = new TextEncoder()

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  return new Uint8Array((hex.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await deriveKey(password, salt, ITERATIONS)
  const iterHex = ITERATIONS.toString(16).padStart(8, '0')
  return `v2:${iterHex}:${toHex(salt)}:${hash}`
}

/** Fast SHA-256 hash for non-password tokens (refresh tokens, not passwords) */
export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('v2:')) {
    // Current format: v2:<iterHex>:<saltHex>:<hashHex>
    const parts = stored.split(':')
    if (parts.length !== 4) return false
    const iterations = parseInt(parts[1], 16)
    const salt       = fromHex(parts[2])
    const expected   = parts[3]
    const actual     = await deriveKey(password, salt, iterations)
    return actual === expected
  }

  // Legacy v1 format: <saltHex>:<hashHex>  (100,000 iterations, 16-byte salt)
  const [saltHex, storedHash] = stored.split(':')
  if (!saltHex || !storedHash) return false
  const salt = fromHex(saltHex)
  const actual = await deriveKey(password, salt, 100_000)
  return actual === storedHash
}
