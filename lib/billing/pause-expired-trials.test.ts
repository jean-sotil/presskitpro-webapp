import { describe, expect, it, vi } from 'vitest';

import { pauseExpiredTrials } from './pause-expired-trials';
import type { CronDeps, ExpiredCandidate } from './pause-expired-trials';

const NOW = new Date('2026-05-06T12:00:00Z');
const day = (offset: number) =>
  new Date(NOW.getTime() + offset * 24 * 60 * 60 * 1000).toISOString();

function makeDeps(overrides: Partial<CronDeps> = {}): CronDeps {
  return {
    findExpiredCandidates: vi.fn(async () => []),
    findReminderCandidates: vi.fn(async () => []),
    pauseUserProfiles: vi.fn(async () => 0),
    sendReminderEmail: vi.fn(async () => undefined),
    markReminderSent: vi.fn(async () => undefined),
    log: vi.fn(),
    ...overrides,
  };
}

const candidate = (over: Partial<ExpiredCandidate> = {}): ExpiredCandidate => ({
  id: 1,
  email: 'a@b.test',
  trialEndsAt: day(-1),
  ...over,
});

describe('pauseExpiredTrials', () => {
  it('is a no-op when no users qualify', async () => {
    const deps = makeDeps();
    const result = await pauseExpiredTrials({ now: NOW, deps });
    expect(result.paused).toBe(0);
    expect(result.reminded).toBe(0);
    expect(deps.pauseUserProfiles).not.toHaveBeenCalled();
    expect(deps.sendReminderEmail).not.toHaveBeenCalled();
  });

  it('pauses profiles for each expired candidate and counts the totals', async () => {
    const deps = makeDeps({
      findExpiredCandidates: vi.fn(async () => [
        candidate({ id: 1 }),
        candidate({ id: 2, email: 'two@b.test' }),
      ]),
      pauseUserProfiles: vi.fn(async (userId) => (userId === 1 ? 1 : 2)),
    });
    const result = await pauseExpiredTrials({ now: NOW, deps });
    expect(result.paused).toBe(3); // total profiles paused, not users
    expect(deps.pauseUserProfiles).toHaveBeenCalledWith(1);
    expect(deps.pauseUserProfiles).toHaveBeenCalledWith(2);
  });

  it('sends a reminder for each Day-12 candidate and marks it sent', async () => {
    const deps = makeDeps({
      findReminderCandidates: vi.fn(async () => [
        candidate({ id: 9, email: 'nudge@b.test', trialEndsAt: day(2) }),
      ]),
    });
    const result = await pauseExpiredTrials({ now: NOW, deps });
    expect(result.reminded).toBe(1);
    expect(deps.sendReminderEmail).toHaveBeenCalledWith({
      userId: 9,
      email: 'nudge@b.test',
      daysRemaining: 2,
    });
    expect(deps.markReminderSent).toHaveBeenCalledWith(9);
  });

  it('continues processing other candidates if one pause fails', async () => {
    // One user's profile pause throwing must not prevent the rest from
    // running on this hour's tick. The next hour will retry the failed one.
    const deps = makeDeps({
      findExpiredCandidates: vi.fn(async () => [
        candidate({ id: 1 }),
        candidate({ id: 2 }),
        candidate({ id: 3 }),
      ]),
      pauseUserProfiles: vi.fn(async (userId) => {
        if (userId === 2) throw new Error('database brief outage');
        return 1;
      }),
    });
    const result = await pauseExpiredTrials({ now: NOW, deps });
    expect(result.paused).toBe(2);
    expect(result.errors).toBe(1);
    expect(deps.log).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'pause-error', userId: 2 }),
    );
  });
});
