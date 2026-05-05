import { describe, expect, it, vi } from 'vitest';

import { reconcileSocialLinks } from './social-links-reconcile';

type Existing = {
  id: number;
  profile: number;
  platform: string;
  url: string;
  displayOrder: number;
};

function setupDeps(existing: Omit<Existing, 'profile'>[], profileId = 1) {
  const withProfile: Existing[] = existing.map((e) => ({ ...e, profile: profileId }));
  const deleted: number[] = [];
  const updated: Array<{ id: number; data: Record<string, unknown> }> = [];
  const created: Array<Record<string, unknown>> = [];
  let nextId = Math.max(0, ...withProfile.map((e) => e.id)) + 1;
  const final = [...withProfile];

  const deps = {
    listExisting: vi.fn(async () => withProfile),
    deleteRow: vi.fn(async (id: number) => {
      deleted.push(id);
      const idx = final.findIndex((e) => e.id === id);
      if (idx >= 0) final.splice(idx, 1);
    }),
    updateRow: vi.fn(async (id: number, data: Record<string, unknown>) => {
      updated.push({ id, data });
      const row = final.find((e) => e.id === id);
      if (row) Object.assign(row, data);
    }),
    createRow: vi.fn(async (data: Record<string, unknown>) => {
      created.push(data);
      const row: Existing = { ...(data as Existing), id: nextId++ };
      final.push(row);
      return row;
    }),
  };

  return { deps, deleted, updated, created, final };
}

describe('reconcileSocialLinks', () => {
  it('creates rows for incoming items without ids', async () => {
    const { deps, created } = setupDeps([]);
    await reconcileSocialLinks(deps, {
      profileId: 1,
      incoming: [
        { platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
        { platform: 'whatsapp', url: 'https://wa.me/5511999999999' },
      ],
    });
    expect(created).toHaveLength(2);
    expect(created[0]).toMatchObject({
      profile: 1,
      platform: 'instagram',
      url: 'https://www.instagram.com/dj_x',
      displayOrder: 0,
    });
    expect(created[1]).toMatchObject({
      profile: 1,
      platform: 'whatsapp',
      displayOrder: 1,
    });
  });

  it('updates existing rows whose ids are still present', async () => {
    const existing = [
      { id: 10, platform: 'instagram', url: 'https://www.instagram.com/old', displayOrder: 0 },
    ];
    const { deps, updated, created, deleted } = setupDeps(existing);
    await reconcileSocialLinks(deps, {
      profileId: 1,
      incoming: [
        {
          id: 10,
          platform: 'instagram',
          url: 'https://www.instagram.com/new',
        },
      ],
    });
    expect(deleted).toEqual([]);
    expect(created).toEqual([]);
    expect(updated).toEqual([
      {
        id: 10,
        data: {
          platform: 'instagram',
          url: 'https://www.instagram.com/new',
          displayOrder: 0,
        },
      },
    ]);
  });

  it('deletes existing rows whose ids are absent from incoming', async () => {
    const existing = [
      { id: 10, platform: 'instagram', url: 'a', displayOrder: 0 },
      { id: 11, platform: 'whatsapp', url: 'b', displayOrder: 1 },
    ];
    const { deps, deleted } = setupDeps(existing);
    await reconcileSocialLinks(deps, {
      profileId: 1,
      incoming: [{ id: 10, platform: 'instagram', url: 'a' }],
    });
    expect(deleted).toEqual([11]);
  });

  it('rewrites displayOrder based on incoming array index', async () => {
    const existing = [
      { id: 10, platform: 'instagram', url: 'a', displayOrder: 0 },
      { id: 11, platform: 'whatsapp', url: 'b', displayOrder: 1 },
    ];
    const { deps, updated } = setupDeps(existing);
    await reconcileSocialLinks(deps, {
      profileId: 1,
      // Reverse the order in the incoming list.
      incoming: [
        { id: 11, platform: 'whatsapp', url: 'b' },
        { id: 10, platform: 'instagram', url: 'a' },
      ],
    });
    const orderById = new Map(updated.map((u) => [u.id, u.data.displayOrder]));
    expect(orderById.get(11)).toBe(0);
    expect(orderById.get(10)).toBe(1);
  });

  it('returns the final ordered list after reconciliation', async () => {
    const { deps } = setupDeps([]);
    const out = await reconcileSocialLinks(deps, {
      profileId: 1,
      incoming: [
        { platform: 'instagram', url: 'a' },
        { platform: 'whatsapp', url: 'b' },
      ],
    });
    expect(out.map((r) => r.platform)).toEqual(['instagram', 'whatsapp']);
    expect(out.map((r) => r.displayOrder)).toEqual([0, 1]);
  });
});
