import { describe, expect, it } from 'vitest';

import { aggregateRollup, type RawEvent } from './aggregate-rollup';

const day = '2026-05-05';
const dayStart = new Date(`${day}T00:00:00Z`);
const at = (h: number, m = 0) =>
  new Date(dayStart.getTime() + (h * 60 + m) * 60_000).toISOString();

const mk = (over: Partial<RawEvent>): RawEvent => ({
  profileId: 1,
  eventType: 'page_view',
  occurredAt: at(12),
  visitorHash: 'a',
  referrerHost: null,
  ...over,
});

describe('aggregateRollup', () => {
  it('returns an empty array when there are no events', () => {
    expect(aggregateRollup({ events: [], day })).toEqual([]);
  });

  it('counts events per (profile, event_type, day)', () => {
    const rows = aggregateRollup({
      events: [
        mk({ visitorHash: 'a' }),
        mk({ visitorHash: 'a' }), // same visitor
        mk({ visitorHash: 'b' }),
        mk({ profileId: 2, visitorHash: 'a' }),
      ],
      day,
    });
    const profile1 = rows.find((r) => r.profileId === 1)!;
    expect(profile1.count).toBe(3);
    expect(profile1.uniqueCount).toBe(2);
    const profile2 = rows.find((r) => r.profileId === 2)!;
    expect(profile2.count).toBe(1);
    expect(profile2.uniqueCount).toBe(1);
  });

  it('splits rows by event_type', () => {
    const rows = aggregateRollup({
      events: [
        mk({ eventType: 'page_view' }),
        mk({ eventType: 'press_kit_click' }),
      ],
      day,
    });
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((r) => r.eventType))).toEqual(
      new Set(['page_view', 'press_kit_click']),
    );
  });

  it('produces top-5 referrers sorted by count, ties broken by host name', () => {
    const rows = aggregateRollup({
      events: [
        ...Array.from({ length: 3 }, () => mk({ referrerHost: 'a.com' })),
        ...Array.from({ length: 3 }, () => mk({ referrerHost: 'b.com' })),
        mk({ referrerHost: 'c.com' }),
        mk({ referrerHost: 'd.com' }),
        mk({ referrerHost: 'e.com' }),
        mk({ referrerHost: 'f.com' }),
        mk({ referrerHost: null }),
      ],
      day,
    });
    const top = rows[0]!.topReferrers;
    expect(top).toHaveLength(5);
    expect(top.map((r) => r.host)).toEqual(['a.com', 'b.com', 'c.com', 'd.com', 'e.com']);
    expect(top[0]!.count).toBe(3);
  });

  it('drops events whose occurredAt is outside the requested UTC day', () => {
    const rows = aggregateRollup({
      events: [
        mk({ occurredAt: '2026-05-04T23:59:59Z' }), // previous day
        mk({ occurredAt: '2026-05-05T00:00:00Z' }), // included
        mk({ occurredAt: '2026-05-06T00:00:00Z' }), // next day
      ],
      day,
    });
    expect(rows[0]!.count).toBe(1);
  });

  it('treats missing visitorHash as a single anonymous visitor (does not boost unique count)', () => {
    const rows = aggregateRollup({
      events: [
        mk({ visitorHash: null }),
        mk({ visitorHash: null }),
        mk({ visitorHash: null }),
      ],
      day,
    });
    expect(rows[0]!.count).toBe(3);
    // All three count toward total, but uniqueness collapses to 0 — we
    // can't claim distinct visitors without a hash.
    expect(rows[0]!.uniqueCount).toBe(0);
  });
});
