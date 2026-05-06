/**
 * Pure cron-tick logic. Two effects per run:
 *
 *   1. Pause profiles whose owner's trial expired and has no active sub.
 *   2. Send the Day-12 reminder to users 1-2 days from expiry.
 *
 * Real DB calls live in the route layer (`app/api/cron/billing/route.ts`)
 * which composes these deps from Payload. Email sending is the same
 * "log when not configured" posture as task-14's Resend integration.
 */

export type ExpiredCandidate = {
  id: number | string;
  email: string | null;
  trialEndsAt: string | Date;
};

export type CronDeps = {
  findExpiredCandidates: (now: Date) => Promise<ExpiredCandidate[]>;
  findReminderCandidates: (now: Date) => Promise<ExpiredCandidate[]>;
  pauseUserProfiles: (userId: number | string) => Promise<number>;
  sendReminderEmail: (args: {
    userId: number | string;
    email: string | null;
    daysRemaining: number;
  }) => Promise<void>;
  markReminderSent: (userId: number | string) => Promise<void>;
  log: (entry: Record<string, unknown>) => void;
};

export type CronResult = { paused: number; reminded: number; errors: number };

export async function pauseExpiredTrials(args: {
  now: Date;
  deps: CronDeps;
}): Promise<CronResult> {
  const { now, deps } = args;
  let paused = 0;
  let reminded = 0;
  let errors = 0;

  const expired = await deps.findExpiredCandidates(now);
  for (const candidate of expired) {
    try {
      const count = await deps.pauseUserProfiles(candidate.id);
      paused += count;
    } catch (err) {
      errors += 1;
      deps.log({
        kind: 'pause-error',
        userId: candidate.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const reminders = await deps.findReminderCandidates(now);
  for (const candidate of reminders) {
    try {
      const ends = candidate.trialEndsAt instanceof Date
        ? candidate.trialEndsAt
        : new Date(candidate.trialEndsAt);
      const daysRemaining = Math.max(
        0,
        Math.ceil((ends.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
      );
      await deps.sendReminderEmail({
        userId: candidate.id,
        email: candidate.email,
        daysRemaining,
      });
      await deps.markReminderSent(candidate.id);
      reminded += 1;
    } catch (err) {
      errors += 1;
      deps.log({
        kind: 'reminder-error',
        userId: candidate.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { paused, reminded, errors };
}
