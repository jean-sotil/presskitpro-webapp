import type { RateLimitResult } from './rate-limit';

/**
 * KV-backed sliding-window rate limiter (task-27).
 *
 * Mirrors `createRateLimiter` semantics but stores per-key timestamp
 * sets in a Redis-compatible KV (Vercel KV / Upstash). Survives
 * serverless cold starts so a multi-instance deploy enforces one
 * shared budget.
 *
 * Fail-open posture: a KV error returns `{ ok: true }` and console.warns
 * — denying real traffic on infra hiccups is worse than briefly losing
 * the budget. Sentry (task-28) ingests the warning.
 */

export type AsyncRateLimiter = {
  check(key: string): Promise<RateLimitResult>;
};

export type KvAdapter = {
  zadd(key: string, item: { score: number; member: string }): Promise<void>;
  zremrangebyscore(key: string, min: number, max: number): Promise<void>;
  zrange(
    key: string,
    start: number,
    stop: number,
    opts?: { withScores?: boolean },
  ): Promise<string[]>;
  pexpire(key: string, ms: number): Promise<void>;
};

export type KvRateLimitDeps = {
  kv: KvAdapter;
  windowMs: number;
  max: number;
  now?: () => number;
  prefix?: string;
};

export function createKvRateLimiter(deps: KvRateLimitDeps): AsyncRateLimiter {
  const now = deps.now ?? Date.now;
  const prefix = deps.prefix ?? 'rl';
  return {
    async check(key) {
      const t = now();
      const cutoff = t - deps.windowMs;
      const k = `${prefix}:${key}`;
      try {
        // Drop expired hits, then read what's left to decide.
        await deps.kv.zremrangebyscore(k, 0, cutoff);
        const range = await deps.kv.zrange(k, 0, -1, { withScores: true });
        // `range` alternates [member, score, member, score, ...].
        const count = Math.floor(range.length / 2);
        if (count >= deps.max) {
          const oldestScoreStr = range[1];
          const oldestT = oldestScoreStr ? Number(oldestScoreStr) : t;
          const retryAfterSec = Math.max(
            1,
            Math.ceil((oldestT + deps.windowMs - t) / 1000),
          );
          return { ok: false, retryAfterSec };
        }
        // Member must be unique within the window — append a random
        // suffix so concurrent checks at the same millisecond don't
        // collide on a sorted-set member key.
        const member = `${t}-${Math.floor(Math.random() * 1e9).toString(36)}`;
        await deps.kv.zadd(k, { score: t, member });
        // 2x the window so abandoned keys vacate without manual GC.
        await deps.kv.pexpire(k, deps.windowMs * 2);
        return { ok: true };
      } catch (err) {
        console.warn('[rate-limit-kv] backend error, failing open:', err);
        return { ok: true };
      }
    },
  };
}
