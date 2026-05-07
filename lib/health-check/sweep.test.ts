import { describe, expect, it, vi } from 'vitest';

import type { CheckResult } from './check-press-kit-url';
import { sweepPressKitHealth, type SweepDeps, type SweepProfile } from './sweep';

function makeProfile(overrides: Partial<SweepProfile> = {}): SweepProfile {
  return {
    id: 1,
    slug: 'demo',
    pressKitUrl: 'https://example.com/k',
    pressKitHealthStatus: 'healthy',
    pressKitConsecutiveFails: 0,
    defaultLocale: 'pt-BR',
    ownerEmail: 'dj@example.com',
    ...overrides,
  };
}

function makeDeps(
  partial: Partial<SweepDeps> & { checkResult?: CheckResult },
): SweepDeps {
  const fixedNow = new Date('2026-05-07T03:00:00Z');
  return {
    findCandidates: partial.findCandidates ?? (async () => []),
    checkUrl:
      partial.checkUrl ??
      (async () => partial.checkResult ?? { ok: true, kind: 'http-2xx', statusCode: 200 }),
    updateProfile: partial.updateProfile ?? (async () => undefined),
    sendWarningEmail: partial.sendWarningEmail ?? (async () => undefined),
    sendBrokenEmail: partial.sendBrokenEmail ?? (async () => undefined),
    now: partial.now ?? (() => fixedNow),
  };
}

describe('sweepPressKitHealth', () => {
  it('returns zero counts when there are no candidates', async () => {
    const deps = makeDeps({ findCandidates: async () => [] });
    const r = await sweepPressKitHealth(deps);
    expect(r).toEqual({
      checked: 0,
      healthy: 0,
      transitionedToWarning: 0,
      transitionedToBroken: 0,
      transitionedToHealthy: 0,
    });
  });

  it('marks healthy on a 200 and writes pressKitLastCheckedAt', async () => {
    const profile = makeProfile({ pressKitHealthStatus: 'unknown' });
    const updateProfile = vi.fn(async () => undefined);
    const deps = makeDeps({
      findCandidates: async () => [profile],
      checkUrl: async () => ({ ok: true, kind: 'http-2xx', statusCode: 200 }),
      updateProfile,
    });
    const r = await sweepPressKitHealth(deps);
    expect(r.checked).toBe(1);
    expect(r.healthy).toBe(1);
    expect(updateProfile).toHaveBeenCalledTimes(1);
    expect(updateProfile).toHaveBeenCalledWith({
      profileId: 1,
      patch: {
        pressKitHealthStatus: 'healthy',
        pressKitConsecutiveFails: 0,
        pressKitLastCheckedAt: expect.any(String),
      },
    });
  });

  it('first failure: status stays healthy, counter increments to 1, no email', async () => {
    const profile = makeProfile({
      pressKitHealthStatus: 'healthy',
      pressKitConsecutiveFails: 0,
    });
    const sendWarningEmail = vi.fn(async () => undefined);
    const sendBrokenEmail = vi.fn(async () => undefined);
    const updateProfile = vi.fn(async () => undefined);
    const deps = makeDeps({
      findCandidates: async () => [profile],
      checkUrl: async () => ({ ok: false, kind: 'http-error', statusCode: 404 }),
      updateProfile,
      sendWarningEmail,
      sendBrokenEmail,
    });
    const r = await sweepPressKitHealth(deps);
    expect(r.transitionedToWarning).toBe(0);
    expect(r.transitionedToBroken).toBe(0);
    expect(sendWarningEmail).not.toHaveBeenCalled();
    expect(sendBrokenEmail).not.toHaveBeenCalled();
    expect(updateProfile).toHaveBeenCalledWith({
      profileId: 1,
      patch: expect.objectContaining({
        pressKitHealthStatus: 'healthy',
        pressKitConsecutiveFails: 1,
      }),
    });
  });

  it('second failure: flips to warning + sends warning email', async () => {
    const profile = makeProfile({
      pressKitHealthStatus: 'healthy',
      pressKitConsecutiveFails: 1,
    });
    const sendWarningEmail = vi.fn(async () => undefined);
    const deps = makeDeps({
      findCandidates: async () => [profile],
      checkUrl: async () => ({ ok: false, kind: 'http-error', statusCode: 404 }),
      sendWarningEmail,
    });
    const r = await sweepPressKitHealth(deps);
    expect(r.transitionedToWarning).toBe(1);
    expect(sendWarningEmail).toHaveBeenCalledTimes(1);
    expect(sendWarningEmail).toHaveBeenCalledWith({
      profile,
      to: 'dj@example.com',
    });
  });

  it('third failure: flips to broken + sends broken email', async () => {
    const profile = makeProfile({
      pressKitHealthStatus: 'warning',
      pressKitConsecutiveFails: 2,
    });
    const sendBrokenEmail = vi.fn(async () => undefined);
    const deps = makeDeps({
      findCandidates: async () => [profile],
      checkUrl: async () => ({ ok: false, kind: 'http-error', statusCode: 404 }),
      sendBrokenEmail,
    });
    const r = await sweepPressKitHealth(deps);
    expect(r.transitionedToBroken).toBe(1);
    expect(sendBrokenEmail).toHaveBeenCalledTimes(1);
  });

  it('recovery: failing profile that succeeds resets counter + transitions to healthy', async () => {
    const profile = makeProfile({
      pressKitHealthStatus: 'broken',
      pressKitConsecutiveFails: 3,
    });
    const updateProfile = vi.fn(async () => undefined);
    const deps = makeDeps({
      findCandidates: async () => [profile],
      checkUrl: async () => ({ ok: true, kind: 'http-2xx', statusCode: 200 }),
      updateProfile,
    });
    const r = await sweepPressKitHealth(deps);
    expect(r.transitionedToHealthy).toBe(1);
    expect(updateProfile).toHaveBeenCalledWith({
      profileId: 1,
      patch: expect.objectContaining({
        pressKitHealthStatus: 'healthy',
        pressKitConsecutiveFails: 0,
      }),
    });
  });

  it('processes a batch with mixed outcomes in one run', async () => {
    const success = makeProfile({ id: 1, pressKitHealthStatus: 'healthy' });
    const flipping = makeProfile({
      id: 2,
      pressKitHealthStatus: 'healthy',
      pressKitConsecutiveFails: 1,
    });
    const fresh = makeProfile({ id: 3, pressKitHealthStatus: 'unknown' });
    const checkUrl = vi.fn(async (url: string): Promise<CheckResult> => {
      void url;
      // Profile #1 succeeds, #2 fails (its second consecutive), #3 succeeds.
      return checkUrl.mock.calls.length % 3 === 2
        ? { ok: false, kind: 'http-error', statusCode: 404 }
        : { ok: true, kind: 'http-2xx', statusCode: 200 };
    });
    const deps = makeDeps({
      findCandidates: async () => [success, flipping, fresh],
      checkUrl,
    });
    const r = await sweepPressKitHealth(deps);
    expect(r.checked).toBe(3);
    expect(r.healthy + r.transitionedToWarning).toBeGreaterThan(0);
  });
});
