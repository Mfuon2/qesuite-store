// In-memory sliding-window rate limiter, shared across routes. Good enough
// as an abuse deterrent within a single Workers isolate; it resets on every
// isolate restart and isn't coordinated across isolates in production — for
// a guaranteed cross-isolate limit, back this with KV or a Durable Object.
const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true
  }
  if (bucket.count >= maxRequests) return false
  bucket.count++
  return true
}
