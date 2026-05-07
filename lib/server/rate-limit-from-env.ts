import { createRateLimiter } from './rate-limit';
import {
  createKvRateLimiter,
  type AsyncRateLimiter,
  type KvAdapter,
} from './rate-limit-kv';

/**
 * Env-aware factory.
 *
 *  - In production (Vercel KV configured): a REST-based adapter talks
 *    to Upstash directly via `fetch`, no SDK dep needed.
 *  - In dev / tests / no creds: the existing in-memory limiter, wrapped
 *    in an async interface so callers always `await`.
 *
 * Tests inject `kvAdapter` directly; the env path is exercised only at
 * runtime on Vercel.
 */

export type FromEnvDeps = {
  windowMs: number;
  max: number;
  prefix?: string;
  /**
   * - `undefined` → auto-detect from env.
   * - `null` → force in-memory (used in tests).
   * - object → use the given adapter (also tests).
   */
  kvAdapter?: KvAdapter | null;
};

export function createRateLimiterFromEnv(deps: FromEnvDeps): AsyncRateLimiter {
  const adapter =
    deps.kvAdapter === undefined ? autoDetectKv() : deps.kvAdapter;

  if (adapter) {
    return createKvRateLimiter({
      kv: adapter,
      windowMs: deps.windowMs,
      max: deps.max,
      prefix: deps.prefix,
    });
  }

  const sync = createRateLimiter({ windowMs: deps.windowMs, max: deps.max });
  return {
    async check(key) {
      return sync.check(key);
    },
  };
}

function autoDetectKv(): KvAdapter | null {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return upstashRestAdapter({ url, token });
}

/**
 * Upstash/Vercel-KV REST adapter. The Upstash REST API accepts a
 * single command per POST as a JSON array of args; the response is
 * `{ result }`. This adapter sticks to the four primitives the
 * limiter needs.
 */
function upstashRestAdapter(opts: { url: string; token: string }): KvAdapter {
  async function cmd(args: Array<string | number>): Promise<unknown> {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${opts.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(args),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`KV ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { result?: unknown };
    return json.result;
  }
  return {
    async zadd(key, item) {
      await cmd(['ZADD', key, item.score, item.member]);
    },
    async zremrangebyscore(key, min, max) {
      await cmd(['ZREMRANGEBYSCORE', key, min, max]);
    },
    async zrange(key, start, stop, options) {
      const args: Array<string | number> = ['ZRANGE', key, start, stop];
      if (options?.withScores) args.push('WITHSCORES');
      const result = await cmd(args);
      if (!Array.isArray(result)) return [];
      return result.map((v) => String(v));
    },
    async pexpire(key, ms) {
      await cmd(['PEXPIRE', key, ms]);
    },
  };
}

// =====================================================================
// Test helper — exported so the factory test can drive a fake adapter.
// =====================================================================

export function fakeKvForTests(): KvAdapter {
  type Entry = { score: number; member: string };
  const store = new Map<string, Entry[]>();
  return {
    async zadd(key, item) {
      const arr = store.get(key) ?? [];
      arr.push(item);
      arr.sort((a, b) => a.score - b.score);
      store.set(key, arr);
    },
    async zremrangebyscore(key, min, max) {
      const arr = store.get(key) ?? [];
      store.set(
        key,
        arr.filter((e) => e.score < min || e.score > max),
      );
    },
    async zrange(key, start, stop, options) {
      const arr = store.get(key) ?? [];
      const slice = arr.slice(start, stop === -1 ? undefined : stop + 1);
      if (options?.withScores) {
        return slice.flatMap((e) => [e.member, String(e.score)]);
      }
      return slice.map((e) => e.member);
    },
    async pexpire() {
      // No-op for tests.
    },
  };
}
