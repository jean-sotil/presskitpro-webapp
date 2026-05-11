import { describe, expect, it } from 'vitest';

import { getTrialStatus } from './trial-status';

const NOW = new Date('2026-05-06T12:00:00Z');
const day = (offset: number) =>
  new Date(NOW.getTime() + offset * 24 * 60 * 60 * 1000).toISOString();

describe('getTrialStatus', () => {
  it('returns `pre-trial` when trialEndsAt is unset (no profile created yet)', () => {
    const result = getTrialStatus({
      user: { plan: 'free', trialEndsAt: null, paypalSubscriptionStatus: null },
      now: NOW,
    });
    expect(result.kind).toBe('pre-trial');
    expect(result.daysRemaining).toBe(null);
  });

  it('returns `active` with daysRemaining when trial is in flight', () => {
    const result = getTrialStatus({
      user: {
        plan: 'free',
        trialEndsAt: day(5),
        paypalSubscriptionStatus: null,
      },
      now: NOW,
    });
    expect(result.kind).toBe('active');
    expect(result.daysRemaining).toBe(5);
  });

  it('rounds up partial days so a trial 12h before expiry still reads as 1 day', () => {
    const result = getTrialStatus({
      user: {
        plan: 'free',
        trialEndsAt: new Date(NOW.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        paypalSubscriptionStatus: null,
      },
      now: NOW,
    });
    expect(result.daysRemaining).toBe(1);
  });

  it('returns `expired` when trialEndsAt is in the past and no active sub', () => {
    const result = getTrialStatus({
      user: {
        plan: 'free',
        trialEndsAt: day(-1),
        paypalSubscriptionStatus: null,
      },
      now: NOW,
    });
    expect(result.kind).toBe('expired');
    expect(result.daysRemaining).toBe(0);
  });

  it('returns `paid` when the user has an active subscription, regardless of trial date', () => {
    const result = getTrialStatus({
      user: {
        plan: 'pro',
        trialEndsAt: day(-30),
        paypalSubscriptionStatus: 'ACTIVE',
      },
      now: NOW,
    });
    expect(result.kind).toBe('paid');
  });

  it('treats `SUSPENDED` as still paid (the cron should not pause yet — PayPal is retrying)', () => {
    const result = getTrialStatus({
      user: {
        plan: 'pro',
        trialEndsAt: day(-30),
        paypalSubscriptionStatus: 'SUSPENDED',
      },
      now: NOW,
    });
    expect(result.kind).toBe('paid');
  });

  it('treats `CANCELLED` as expired even when trialEndsAt is still in the future', () => {
    // Edge case: user converted then cancelled mid-trial. Once PayPal says
    // CANCELLED, we don't bring back the trial timer.
    const result = getTrialStatus({
      user: {
        plan: 'free',
        trialEndsAt: day(5),
        paypalSubscriptionStatus: 'CANCELLED',
      },
      now: NOW,
    });
    expect(result.kind).toBe('expired');
  });
});
