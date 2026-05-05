/**
 * Sliding-window rate limiter.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60*60*1000, max: 5 });
 *   const r = limiter.check(ip);
 *   if (!r.ok) return new Response(429, { 'Retry-After': r.retryAfterSec });
 *
 * Pure module (no DOM, no Node-only globals beyond `Map`). Single-process
 * — multi-instance deployments need shared storage (task-27).
 */

export type RateLimitDeps = {
  windowMs: number;
  max: number;
  now?: () => number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export type RateLimiter = {
  check(key: string): RateLimitResult;
};

export function createRateLimiter(deps: RateLimitDeps): RateLimiter {
  const { windowMs, max } = deps;
  const now = deps.now ?? Date.now;
  // Per-key timestamp queues. Each entry is a millisecond hit time.
  const buckets = new Map<string, number[]>();

  return {
    check(key) {
      const t = now();
      const cutoff = t - windowMs;
      const queue = buckets.get(key) ?? [];
      // Drop expired entries from the head.
      let i = 0;
      while (i < queue.length && queue[i]! <= cutoff) i++;
      const fresh = i > 0 ? queue.slice(i) : queue;
      if (fresh.length >= max) {
        const oldest = fresh[0]!;
        const retryAfterSec = Math.max(
          1,
          Math.ceil((oldest + windowMs - t) / 1000),
        );
        // Persist the truncation so we don't keep walking dead entries.
        buckets.set(key, fresh);
        return { ok: false, retryAfterSec };
      }
      fresh.push(t);
      buckets.set(key, fresh);
      return { ok: true };
    },
  };
}
