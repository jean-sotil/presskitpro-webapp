import { describe, expect, it, vi } from 'vitest';

import { createRateLimiterFromEnv, fakeKvForTests } from './rate-limit-from-env';

describe('createRateLimiterFromEnv', () => {
  it('falls back to the in-memory limiter when no kv adapter is provided', async () => {
    const limiter = createRateLimiterFromEnv({
      windowMs: 60_000,
      max: 1,
      kvAdapter: null,
    });
    expect((await limiter.check('a')).ok).toBe(true);
    expect((await limiter.check('a')).ok).toBe(false);
  });

  it('uses the KV-backed limiter when an adapter is supplied', async () => {
    const fake = fakeKvForTests();
    const spy = vi.spyOn(fake, 'zadd');
    const limiter = createRateLimiterFromEnv({
      windowMs: 60_000,
      max: 5,
      kvAdapter: fake,
    });
    await limiter.check('b');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
