import { describe, expect, it, vi } from 'vitest';

import { collectPublishedProfiles } from './collect-published-profiles';

function paged(rows: Array<{ slug: string; updatedAt: string }>, pageSize: number) {
  return vi.fn(async ({ page }: { page?: number }) => {
    const p = page ?? 1;
    const start = (p - 1) * pageSize;
    const slice = rows.slice(start, start + pageSize);
    return {
      docs: slice,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
      page: p,
    };
  });
}

describe('collectPublishedProfiles', () => {
  it('returns the empty set when no profiles are published', async () => {
    const find = paged([], 100);
    const out = await collectPublishedProfiles({ find, pageSize: 100 });
    expect(out).toEqual([]);
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('collects across multiple pages', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      slug: `dj-${i + 1}`,
      updatedAt: '2026-05-01T00:00:00.000Z',
    }));
    const find = paged(rows, 10);
    const out = await collectPublishedProfiles({ find, pageSize: 10 });
    expect(out).toHaveLength(25);
    expect(out[0]?.slug).toBe('dj-1');
    expect(out[24]?.slug).toBe('dj-25');
    // Pages 1, 2, 3 — and we stop because page 3 returned fewer than pageSize.
    expect(find).toHaveBeenCalledTimes(3);
  });

  it('passes the published filter to the find dep', async () => {
    const find = paged([], 50);
    await collectPublishedProfiles({ find, pageSize: 50 });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { equals: 'published' } },
      }),
    );
  });
});
