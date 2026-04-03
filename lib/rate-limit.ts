/**
 * Simple in-memory rate limiter.
 * Works per-process — suitable for Railway single-instance deployments.
 * Replace with @upstash/ratelimit if you scale to multiple instances.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 10 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  /** Window size in milliseconds */
  windowMs: number;
  /** Max requests allowed per window */
  max: number;
}

/**
 * Returns { ok: true } if the request is within limits.
 * Returns { ok: false, retryAfterMs } if rate limited.
 */
export function rateLimit(key: string, opts: RateLimitOptions): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= opts.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (entry.count >= opts.max) {
    const retryAfterMs = opts.windowMs - (now - entry.windowStart);
    return { ok: false, retryAfterMs };
  }

  entry.count++;
  return { ok: true };
}

/** Extract a rate-limit key from a Next.js request (IP + optional suffix) */
export function getRateLimitKey(req: Request, suffix = ""): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return suffix ? `${ip}:${suffix}` : ip;
}
