/**
 * Pure derivation of trial state from a Users mirror row + current time.
 *
 * The Users row is the source of truth for the trial timer (`trialEndsAt`)
 * and the subscription mirror (`paypalSubscriptionStatus`); PayPal never
 * knows about the trial. Callers: dashboard banner, public route gate,
 * cron pause logic.
 */

export type TrialStatus =
  | { kind: 'pre-trial'; daysRemaining: null }
  | { kind: 'active'; daysRemaining: number }
  | { kind: 'expired'; daysRemaining: 0 }
  | { kind: 'paid'; daysRemaining: null };

export type TrialUser = {
  // `'free'` is the legacy label for `'trial'` — both resolve to the
  // same trial-status logic so a stray legacy row doesn't break.
  plan?: 'trial' | 'pro' | 'agency' | 'free' | string | null;
  trialEndsAt?: string | Date | null;
  paypalSubscriptionStatus?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | null;
};

export function getTrialStatus(args: { user: TrialUser; now: Date }): TrialStatus {
  const { user, now } = args;

  // An `ACTIVE` or `SUSPENDED` subscription supersedes the trial timer.
  // `SUSPENDED` is intentionally treated as paid: PayPal is mid-retry and
  // will fire an event on terminal failure — the cron must not pause until then.
  if (user.paypalSubscriptionStatus === 'ACTIVE' || user.paypalSubscriptionStatus === 'SUSPENDED') {
    return { kind: 'paid', daysRemaining: null };
  }

  // Once PayPal reports `CANCELLED`, the user is back on the free tier and
  // the trial does not resume (even if `trialEndsAt` is still in the
  // future). The cron pauses these on its next run.
  if (user.paypalSubscriptionStatus === 'CANCELLED') {
    return { kind: 'expired', daysRemaining: 0 };
  }

  if (!user.trialEndsAt) {
    return { kind: 'pre-trial', daysRemaining: null };
  }

  const ends = user.trialEndsAt instanceof Date ? user.trialEndsAt : new Date(user.trialEndsAt);
  const msRemaining = ends.getTime() - now.getTime();

  if (msRemaining <= 0) {
    return { kind: 'expired', daysRemaining: 0 };
  }

  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  return { kind: 'active', daysRemaining };
}
