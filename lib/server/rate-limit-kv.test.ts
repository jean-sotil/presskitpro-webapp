import { describe, expect, it } from 'vitest';

import { createKvRateLimiter, type KvAdapter } from './rate-limit-kv';

/**
 * Fake KV adapter — backed by a JS Map of sorted-set-like arrays. The
 * real `ZADD/ZRANGE/ZREMRANGEBYSCORE/PEXPIRE` behavior is approximated
 * just enough to drive the limiter logic.
 */
function fakeKv() {
  type Entry = { score: number; member: string };
  const store = new Map<string, Entry[]>();
  let lastError: unknown = null;
  let nextErrorOnce: unknown = null;
  const adapter: KvAdapter = {
    async zadd(key, { score, member }) {
      if (nextErrorOnce !== null) {
        const err = nextErrorOnce;
        nextErrorOnce = null;
        lastError = err;
        throw err;
      }
      const arr = store.get(key) ?? [];
      arr.push({ score, member });
      arr.sort((a, b) => a.score - b.score);
      store.set(key, arr);
    },
    async zremrangebyscore(key, min, max) {
      const arr = store.get(key) ?? [];
      const kept = arr.filter((e) => e.score < min || e.score > max);
      store.set(key, kept);
    },
    async zrange(key, start, stop, opts) {
      const arr = store.get(key) ?? [];
      const slice = arr.slice(start, stop === -1 ? undefined : stop + 1);
      if (opts?.withScores) {
        return slice.flatMap((e) => [e.member, String(e.score)]);
      }
      return slice.map((e) => e.member);
    },
    async pexpire() {
      // No-op for tests.
    },
  };
  return {
    adapter,
    store,
    failNextOnce: (err: unknown) => {
      nextErrorOnce = err;
    },
    lastError: () => lastError,
  };
}

describe('createKvRateLimiter', () => {
  it('passes within budget and rejects past it', async () => {
    let t = 1_000_000;
    const fake = fakeKv();
    const limiter = createKvRateLimiter({
      kv: fake.adapter,
      windowMs: 60_000,
      max: 3,
      now: () => t,
    });
    expect((await limiter.check('1.1.1.1')).ok).toBe(true);
    t += 1_000;
    expect((await limiter.check('1.1.1.1')).ok).toBe(true);
    t += 1_000;
    expect((await limiter.check('1.1.1.1')).ok).toBe(true);
    t += 1_000;
    const fourth = await limiter.check('1.1.1.1');
    expect(fourth.ok).toBe(false);
    if (!fourth.ok) {
      // 60s window minus 3s elapsed = 57s left until oldest entry exits.
      expect(fourth.retryAfterSec).toBeGreaterThanOrEqual(56);
      expect(fourth.retryAfterSec).toBeLessThanOrEqual(58);
    }
  });

  it('isolates buckets per key', async () => {
    const fake = fakeKv();
    const limiter = createKvRateLimiter({
      kv: fake.adapter,
      windowMs: 60_000,
      max: 1,
      now: () => 1_000,
    });
    expect((await limiter.check('a')).ok).toBe(true);
    expect((await limiter.check('a')).ok).toBe(false);
    expect((await limiter.check('b')).ok).toBe(true);
  });

  it('drops expired entries (sliding window)', async () => {
    let t = 1_000_000;
    const fake = fakeKv();
    const limiter = createKvRateLimiter({
      kv: fake.adapter,
      windowMs: 1_000,
      max: 1,
      now: () => t,
    });
    expect((await limiter.check('z')).ok).toBe(true);
    t += 999;
    expect((await limiter.check('z')).ok).toBe(false);
    t += 2;
    // First entry now expired; this hit should pass.
    expect((await limiter.check('z')).ok).toBe(true);
  });

  it('fails open on a backend error (logs but does not block)', async () => {
    const fake = fakeKv();
    fake.failNextOnce(new Error('kaboom'));
    const limiter = createKvRateLimiter({
      kv: fake.adapter,
      windowMs: 60_000,
      max: 1,
      now: () => 1_000,
    });
    const r = await limiter.check('x');
    expect(r.ok).toBe(true);
  });

  it('namespaces keys with the configured prefix', async () => {
    const fake = fakeKv();
    const limiter = createKvRateLimiter({
      kv: fake.adapter,
      windowMs: 60_000,
      max: 5,
      prefix: 'auth-test',
      now: () => 1_000,
    });
    await limiter.check('1.1.1.1');
    expect([...fake.store.keys()]).toEqual(['auth-test:1.1.1.1']);
  });
});
