import { describe, expect, it } from 'vitest';

import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
  it('admits up to `max` requests inside the window', () => {
    const now = 1_000_000;
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 3,
      now: () => now,
    });
    expect(limiter.check('1.1.1.1')).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1')).toEqual({ ok: true });
    expect(limiter.check('1.1.1.1')).toEqual({ ok: true });
    const r = limiter.check('1.1.1.1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it('isolates buckets per key', () => {
    const now = 1_000_000;
    const limiter = createRateLimiter({
      windowMs: 60_000,
      max: 2,
      now: () => now,
    });
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(false);
    expect(limiter.check('b').ok).toBe(true);
    expect(limiter.check('b').ok).toBe(true);
    expect(limiter.check('b').ok).toBe(false);
  });

  it('evicts entries older than the window', () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({
      windowMs: 1_000,
      max: 2,
      now: () => now,
    });
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(true);
    expect(limiter.check('a').ok).toBe(false);
    now += 1_001; // slide past the window
    expect(limiter.check('a').ok).toBe(true);
  });

  it('reports a meaningful retryAfterSec equal to the oldest hit + window', () => {
    let now = 0;
    const limiter = createRateLimiter({
      windowMs: 10_000,
      max: 1,
      now: () => now,
    });
    limiter.check('a');
    now += 3_000;
    const r = limiter.check('a');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      // first hit at t=0, window=10s → retryAfter at t=10000; current t=3000
      // → 7s
      expect(r.retryAfterSec).toBe(7);
    }
  });
});
