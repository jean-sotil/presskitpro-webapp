import { describe, expect, it, vi } from 'vitest';

import { loadLiveExamples } from './fetch-live-examples';

describe('loadLiveExamples', () => {
  it('returns up to `limit` published profiles, sorted by most-recently-updated', async () => {
    const find = vi.fn(async () => ({
      docs: [
        { slug: 'dj-1', portrait: { bucket: 'avatars', path: 'a/1.jpg', alt: 'DJ 1' } },
        { slug: 'dj-2', portrait: null },
        { slug: 'dj-3', portrait: { bucket: 'avatars', path: 'a/3.jpg' } },
      ],
    }));
    const out = await loadLiveExamples({ find, limit: 8 });
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual({
      slug: 'dj-1',
      displayName: 'dj 1',
      portrait: { bucket: 'avatars', path: 'a/1.jpg', alt: 'DJ 1' },
    });
    expect(out[1]?.portrait).toBeNull();
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { equals: 'published' } },
        sort: '-updatedAt',
        limit: 8,
      }),
    );
  });

  it('returns the empty list when no profiles are published', async () => {
    const find = vi.fn(async () => ({ docs: [] }));
    expect(await loadLiveExamples({ find, limit: 5 })).toEqual([]);
  });

  it('caps the limit at a reasonable max (16) so a runaway caller cannot DOS the page', async () => {
    const find = vi.fn(async () => ({ docs: [] }));
    await loadLiveExamples({ find, limit: 999 });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 16 }),
    );
  });
});
