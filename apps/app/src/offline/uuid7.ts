// UUIDv7 (RFC 9562) — a 48-bit millisecond timestamp followed by random
// bits, so client-generated ids for offline mutations/entities sort roughly
// by creation time (unlike the UUIDv4 the backend's own generateId() uses),
// which matters once these ids start flowing through a sync outbox/pull
// pipeline. No dependency needed — this is ~20 lines against Web Crypto.
export function uuid7(): string {
  const unixTsMs = BigInt(Date.now())
  const rand = crypto.getRandomValues(new Uint8Array(10))
  const bytes = new Uint8Array(16)

  bytes[0] = Number((unixTsMs >> 40n) & 0xffn)
  bytes[1] = Number((unixTsMs >> 32n) & 0xffn)
  bytes[2] = Number((unixTsMs >> 24n) & 0xffn)
  bytes[3] = Number((unixTsMs >> 16n) & 0xffn)
  bytes[4] = Number((unixTsMs >> 8n) & 0xffn)
  bytes[5] = Number(unixTsMs & 0xffn)

  bytes[6] = 0x70 | (rand[0] & 0x0f) // version 7
  bytes[7] = rand[1]
  bytes[8] = 0x80 | (rand[2] & 0x3f) // variant 10
  bytes[9] = rand[3]
  bytes[10] = rand[4]
  bytes[11] = rand[5]
  bytes[12] = rand[6]
  bytes[13] = rand[7]
  bytes[14] = rand[8]
  bytes[15] = rand[9]

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
