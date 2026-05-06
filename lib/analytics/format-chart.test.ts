import { describe, expect, it } from 'vitest';

import { formatChart } from './format-chart';

const today = new Date('2026-05-06T12:00:00Z');

describe('formatChart', () => {
  it('returns 14 contiguous days ending today, oldest first', () => {
    const result = formatChart({ rows: [], today });
    expect(result.days).toHaveLength(14);
    expect(result.days[0]).toBe('2026-04-23');
    expect(result.days[13]).toBe('2026-05-06');
  });

  it('zero-fills days that have no rows', () => {
    const result = formatChart({ rows: [], today });
    expect(result.bars.every((b) => b.count === 0)).toBe(true);
    expect(result.maxCount).toBe(0);
  });

  it('sums multiple event types per day into a single bar (page_view-only by default)', () => {
    const result = formatChart({
      rows: [
        { day: '2026-05-06', eventType: 'page_view', count: 10, uniqueCount: 8, topReferrers: [] },
        { day: '2026-05-06', eventType: 'press_kit_click', count: 3, uniqueCount: 2, topReferrers: [] },
      ],
      today,
    });
    // Default mode is "page_view only" — that's the headline metric.
    const last = result.bars[13]!;
    expect(last.count).toBe(10);
  });

  it('respects an explicit eventType filter', () => {
    const result = formatChart({
      rows: [
        { day: '2026-05-06', eventType: 'page_view', count: 10, uniqueCount: 8, topReferrers: [] },
        { day: '2026-05-06', eventType: 'press_kit_click', count: 3, uniqueCount: 2, topReferrers: [] },
      ],
      today,
      eventType: 'press_kit_click',
    });
    expect(result.bars[13]!.count).toBe(3);
    expect(result.maxCount).toBe(3);
  });

  it('sets maxCount to the largest count across the window (drives bar scaling)', () => {
    const result = formatChart({
      rows: [
        { day: '2026-04-30', eventType: 'page_view', count: 4, uniqueCount: 4, topReferrers: [] },
        { day: '2026-05-06', eventType: 'page_view', count: 12, uniqueCount: 9, topReferrers: [] },
      ],
      today,
    });
    expect(result.maxCount).toBe(12);
  });

  it('drops rows outside the 14-day window', () => {
    const result = formatChart({
      rows: [
        { day: '2026-04-01', eventType: 'page_view', count: 999, uniqueCount: 999, topReferrers: [] },
      ],
      today,
    });
    expect(result.maxCount).toBe(0);
  });

  it('aggregates rows from multiple profiles (caller filters before passing)', () => {
    const result = formatChart({
      rows: [
        { day: '2026-05-06', eventType: 'page_view', count: 5, uniqueCount: 4, topReferrers: [] },
        { day: '2026-05-06', eventType: 'page_view', count: 7, uniqueCount: 5, topReferrers: [] },
      ],
      today,
    });
    expect(result.bars[13]!.count).toBe(12);
  });
});
