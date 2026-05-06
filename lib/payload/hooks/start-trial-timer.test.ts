import { describe, expect, it, vi } from 'vitest';

import { handleStartTrialTimer } from './start-trial-timer';

const NOW = new Date('2026-05-06T12:00:00Z');
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function makeDeps(opts: { ownerTrialEndsAt?: string | null } = {}) {
  return {
    now: () => NOW,
    findUserById: vi.fn(async () => ({
      id: 1,
      trialEndsAt: opts.ownerTrialEndsAt ?? null,
    })),
    updateUser: vi.fn(async () => undefined),
  };
}

describe('handleStartTrialTimer', () => {
  it('sets `trialEndsAt = now + 14d` on the owner when a profile is first created and the user has no timer', async () => {
    const deps = makeDeps();
    await handleStartTrialTimer(
      { operation: 'create', doc: { owner: 1 } },
      deps,
    );
    const expected = new Date(NOW.getTime() + FOURTEEN_DAYS_MS).toISOString();
    expect(deps.updateUser).toHaveBeenCalledWith(1, { trialEndsAt: expected });
  });

  it('is a no-op on update', async () => {
    const deps = makeDeps();
    await handleStartTrialTimer(
      { operation: 'update', doc: { owner: 1 } },
      deps,
    );
    expect(deps.updateUser).not.toHaveBeenCalled();
  });

  it('is a no-op when the user already has a timer (second profile, etc.)', async () => {
    const deps = makeDeps({
      ownerTrialEndsAt: '2026-05-20T12:00:00Z',
    });
    await handleStartTrialTimer(
      { operation: 'create', doc: { owner: 1 } },
      deps,
    );
    expect(deps.updateUser).not.toHaveBeenCalled();
  });

  it('accepts owner as an object reference (`{ id: 1 }`) — Payload sometimes passes populated docs', async () => {
    const deps = makeDeps();
    await handleStartTrialTimer(
      { operation: 'create', doc: { owner: { id: 1 } } },
      deps,
    );
    expect(deps.updateUser).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it('is a no-op when owner is missing (defensive — Payload schema requires it)', async () => {
    const deps = makeDeps();
    await handleStartTrialTimer({ operation: 'create', doc: {} }, deps);
    expect(deps.findUserById).not.toHaveBeenCalled();
    expect(deps.updateUser).not.toHaveBeenCalled();
  });
});
