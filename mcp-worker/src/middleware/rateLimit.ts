interface TokenBucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, TokenBucket>()

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 100)
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)

// Cleanup stale buckets every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) {
      buckets.delete(key)
    }
  }
}, 300_000)

/**
 * Check if a token is rate limited.
 * Returns { allowed: true } or { allowed: false, retryAfterMs }.
 */
export function checkRateLimit(token: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now()
  const bucket = buckets.get(token)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(token, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count++
  return { allowed: true }
}
