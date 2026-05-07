import { describe, expect, it } from 'vitest';

import { decideReclaimAction, type DecideInput } from './decide-action';

const NOW = new Date('2026-05-07T00:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function days(n: number): Date {
  return new Date(NOW.getTime() - n * DAY);
}

function base(over: Partial<DecideInput> = {}): DecideInput {
  return {
    now: NOW,
    profile: {
      status: 'published',
      updatedAt: days(45),
      slugReclaimWarningAt: null,
      slugSoftReleasedAt: null,
    },
    lastSignInAt: days(45),
    lastEventAt: null,
    hasActiveSubscription: false,
    ...over,
  };
}

describe('decideReclaimAction', () => {
  it('skips when the user has an active subscription, regardless of activity', () => {
    expect(decideReclaimAction(base({ hasActiveSubscription: true }))).toBe('skip');
  });

  it('skips when the profile is in the paused-grace window (90-day handled elsewhere)', () => {
    expect(
      decideReclaimAction(
        base({ profile: { ...base().profile, status: 'paused' } }),
      ),
    ).toBe('skip');
  });

  it('skips when the most-recent activity is within 30 days', () => {
    expect(decideReclaimAction(base({ lastSignInAt: days(10) }))).toBe('skip');
    expect(decideReclaimAction(base({ lastEventAt: days(5) }))).toBe('skip');
    expect(
      decideReclaimAction(
        base({ profile: { ...base().profile, updatedAt: days(20) } }),
      ),
    ).toBe('skip');
  });

  it('warns at Day-23 when no warning has been sent and inactivity > 23 days', () => {
    expect(
      decideReclaimAction(
        base({
          profile: { ...base().profile, updatedAt: days(40) },
          lastSignInAt: days(40),
        }),
      ),
    ).toBe('warn');
  });

  it('does NOT re-warn when a warning was already sent within the 7-day window', () => {
    expect(
      decideReclaimAction(
        base({
          profile: {
            ...base().profile,
            updatedAt: days(40),
            slugReclaimWarningAt: days(3),
          },
          lastSignInAt: days(40),
        }),
      ),
    ).toBe('skip');
  });

  it('soft-releases at Day-30 when 7+ days passed since the warning', () => {
    expect(
      decideReclaimAction(
        base({
          profile: {
            ...base().profile,
            updatedAt: days(45),
            slugReclaimWarningAt: days(8),
          },
          lastSignInAt: days(45),
        }),
      ),
    ).toBe('release');
  });

  it('finalizes at Day-31 when 24h+ passed since soft-release', () => {
    expect(
      decideReclaimAction(
        base({
          profile: {
            ...base().profile,
            status: 'soft-released',
            updatedAt: days(50),
            slugReclaimWarningAt: days(15),
            slugSoftReleasedAt: days(2),
          },
          lastSignInAt: days(50),
        }),
      ),
    ).toBe('finalize');
  });

  it('skips finalize when soft-released < 24h ago (revert window)', () => {
    expect(
      decideReclaimAction(
        base({
          profile: {
            ...base().profile,
            status: 'soft-released',
            slugReclaimWarningAt: days(8),
            slugSoftReleasedAt: new Date(NOW.getTime() - 12 * 60 * 60 * 1000),
          },
        }),
      ),
    ).toBe('skip');
  });

  it('skips when inactivity is 25 days but no warning yet (under the 23-day warning bar — wait? actually 25>23, so we DO warn)', () => {
    expect(
      decideReclaimAction(
        base({
          profile: { ...base().profile, updatedAt: days(25) },
          lastSignInAt: days(25),
        }),
      ),
    ).toBe('warn');
  });

  it('skips when inactivity is exactly 22 days (under the warning bar)', () => {
    expect(
      decideReclaimAction(
        base({
          profile: { ...base().profile, updatedAt: days(22) },
          lastSignInAt: days(22),
        }),
      ),
    ).toBe('skip');
  });

  it('treats null timestamps as "infinitely old" for activity computation', () => {
    expect(
      decideReclaimAction(
        base({
          profile: { ...base().profile, updatedAt: null },
          lastSignInAt: null,
          lastEventAt: null,
        }),
      ),
    ).toBe('warn');
  });
});
