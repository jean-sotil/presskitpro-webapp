/**
 * Slug reclamation decision (task-32). Pure state machine.
 *
 * The cron iterates every Profile that's a candidate (status NOT in
 * paused/soft-released; user has no active subscription) and runs this
 * function to decide what to do:
 *
 *   - `skip`     — recent activity OR active sub OR paused-grace.
 *   - `warn`     — Day-23+ inactivity, no warning yet → email + stamp.
 *   - `release`  — Day-30+ inactivity AND warning was sent 7+ days ago
 *                  → flip status to `soft-released` + stamp.
 *   - `finalize` — Soft-released > 24h ago → rotate slug to free the pool.
 */

const DAY = 24 * 60 * 60 * 1000;
const WARN_AT_DAYS = 23;
const RELEASE_AT_DAYS = 30;
const WARN_TO_RELEASE_GAP_MS = 7 * DAY;
const SOFT_RELEASE_TO_FINALIZE_GAP_MS = 24 * 60 * 60 * 1000;

export type ReclaimAction = 'skip' | 'warn' | 'release' | 'finalize';

export type DecideInput = {
  now: Date;
  profile: {
    status: 'draft' | 'published' | 'unpublished' | 'paused' | 'soft-released';
    updatedAt: Date | null;
    slugReclaimWarningAt: Date | null;
    slugSoftReleasedAt: Date | null;
  };
  lastSignInAt: Date | null;
  lastEventAt: Date | null;
  hasActiveSubscription: boolean;
};

export function decideReclaimAction(input: DecideInput): ReclaimAction {
  if (input.hasActiveSubscription) return 'skip';

  // Paused profiles ride the 90-day grace from task-23; they are not
  // eligible for slug reclamation until paused-grace itself frees them.
  if (input.profile.status === 'paused') return 'skip';

  // Already soft-released — only finalize tick is relevant.
  if (input.profile.status === 'soft-released') {
    if (!input.profile.slugSoftReleasedAt) return 'skip';
    const elapsed = input.now.getTime() - input.profile.slugSoftReleasedAt.getTime();
    return elapsed >= SOFT_RELEASE_TO_FINALIZE_GAP_MS ? 'finalize' : 'skip';
  }

  const lastActivity = mostRecent([
    input.profile.updatedAt,
    input.lastSignInAt,
    input.lastEventAt,
  ]);
  const daysSinceActivity = daysBetween(input.now, lastActivity);

  if (daysSinceActivity < WARN_AT_DAYS) return 'skip';

  // 30+ days inactive AND warning is at least 7 days old → release.
  if (
    daysSinceActivity >= RELEASE_AT_DAYS &&
    input.profile.slugReclaimWarningAt &&
    input.now.getTime() - input.profile.slugReclaimWarningAt.getTime() >=
      WARN_TO_RELEASE_GAP_MS
  ) {
    return 'release';
  }

  // No warning yet → send one. (If a warning was sent within the last
  // 7 days, we wait — the warn-to-release gap protects against re-warns.)
  if (input.profile.slugReclaimWarningAt) {
    const sinceWarn =
      input.now.getTime() - input.profile.slugReclaimWarningAt.getTime();
    if (sinceWarn < WARN_TO_RELEASE_GAP_MS) return 'skip';
  }
  return 'warn';
}

function mostRecent(dates: ReadonlyArray<Date | null>): Date | null {
  let max: Date | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (!max || d.getTime() > max.getTime()) max = d;
  }
  return max;
}

function daysBetween(now: Date, then: Date | null): number {
  // No prior activity at all = treat as infinitely old so the cron
  // can warn / release on first encounter.
  if (!then) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - then.getTime()) / DAY);
}
