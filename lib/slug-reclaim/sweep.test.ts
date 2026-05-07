import { describe, expect, it, vi } from 'vitest';

import {
  sweepInactiveSlugs,
  type SweepCandidate,
  type SweepDeps,
} from './sweep';

const NOW = new Date('2026-05-07T03:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function days(n: number): Date {
  return new Date(NOW.getTime() - n * DAY);
}

function makeCandidate(over: Partial<SweepCandidate> = {}): SweepCandidate {
  return {
    profileId: 1,
    slug: 'demo',
    status: 'published',
    profileUpdatedAt: days(45),
    ownerEmail: 'dj@example.com',
    ownerLocale: 'pt-BR',
    lastSignInAt: days(45),
    lastEventAt: null,
    hasActiveSubscription: false,
    slugReclaimWarningAt: null,
    slugSoftReleasedAt: null,
    ...over,
  };
}

function makeDeps(over: Partial<SweepDeps> = {}): SweepDeps {
  return {
    findCandidates: async () => [],
    sendWarning: vi.fn(async () => undefined),
    sendReleased: vi.fn(async () => undefined),
    stampWarning: vi.fn(async () => undefined),
    softRelease: vi.fn(async () => undefined),
    finalizeRelease: vi.fn(async () => undefined),
    audit: vi.fn(() => undefined),
    now: () => NOW,
    keepUrlBuilder: () => 'https://example.test/keep?token=tok',
    ...over,
  };
}

describe('sweepInactiveSlugs', () => {
  it('returns zero counts when no candidates', async () => {
    const r = await sweepInactiveSlugs(makeDeps());
    expect(r).toEqual({ checked: 0, warned: 0, released: 0, finalized: 0, skipped: 0 });
  });

  it('warns a Day-23+ candidate exactly once + audits + stamps the timestamp', async () => {
    const candidate = makeCandidate({ slug: 'kept-quiet' });
    const sendWarning = vi.fn(async () => undefined);
    const stampWarning = vi.fn(async () => undefined);
    const audit = vi.fn();
    const r = await sweepInactiveSlugs(
      makeDeps({
        findCandidates: async () => [candidate],
        sendWarning,
        stampWarning,
        audit,
      }),
    );
    expect(r.warned).toBe(1);
    expect(sendWarning).toHaveBeenCalledTimes(1);
    expect(stampWarning).toHaveBeenCalledWith({ profileId: 1, at: NOW });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'slug_reclaim_warned', profileId: 1 }),
    );
  });

  it('releases a Day-30+ candidate whose warning was sent 7+ days ago', async () => {
    const candidate = makeCandidate({
      profileUpdatedAt: days(50),
      lastSignInAt: days(50),
      slugReclaimWarningAt: days(8),
    });
    const sendReleased = vi.fn(async () => undefined);
    const softRelease = vi.fn(async () => undefined);
    const r = await sweepInactiveSlugs(
      makeDeps({
        findCandidates: async () => [candidate],
        sendReleased,
        softRelease,
      }),
    );
    expect(r.released).toBe(1);
    expect(sendReleased).toHaveBeenCalledTimes(1);
    expect(softRelease).toHaveBeenCalledWith({ profileId: 1, at: NOW });
  });

  it('finalizes when status is soft-released and 24h+ has passed', async () => {
    const candidate = makeCandidate({
      status: 'soft-released',
      profileUpdatedAt: days(50),
      slugReclaimWarningAt: days(15),
      slugSoftReleasedAt: days(2),
    });
    const finalizeRelease = vi.fn(async () => undefined);
    const r = await sweepInactiveSlugs(
      makeDeps({
        findCandidates: async () => [candidate],
        finalizeRelease,
      }),
    );
    expect(r.finalized).toBe(1);
    expect(finalizeRelease).toHaveBeenCalledWith({
      profileId: 1,
      currentSlug: 'demo',
    });
  });

  it('skips a candidate with an active subscription', async () => {
    const r = await sweepInactiveSlugs(
      makeDeps({
        findCandidates: async () => [
          makeCandidate({ hasActiveSubscription: true }),
        ],
      }),
    );
    expect(r.skipped).toBe(1);
    expect(r.warned + r.released + r.finalized).toBe(0);
  });

  it('processes a mixed batch in one run', async () => {
    const r = await sweepInactiveSlugs(
      makeDeps({
        findCandidates: async () => [
          makeCandidate({ profileId: 1, hasActiveSubscription: true }), // skip
          makeCandidate({ profileId: 2, slug: 'a' }), // warn
          makeCandidate({
            profileId: 3,
            slug: 'b',
            profileUpdatedAt: days(50),
            lastSignInAt: days(50),
            slugReclaimWarningAt: days(8),
          }), // release
        ],
      }),
    );
    expect(r.checked).toBe(3);
    expect(r.warned).toBe(1);
    expect(r.released).toBe(1);
    expect(r.skipped).toBe(1);
  });
});
