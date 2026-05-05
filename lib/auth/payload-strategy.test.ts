import { describe, expect, it, vi } from 'vitest';

import { supabaseStrategy } from './payload-strategy';

function makePayload(findResult: { docs: unknown[]; totalDocs: number }) {
  return {
    find: vi.fn().mockResolvedValue(findResult),
  };
}

const HEADERS = new Headers({ cookie: 'sb-access-token=tok' });

describe('supabaseStrategy', () => {
  it('has a stable name', () => {
    expect(supabaseStrategy({ verifySession: vi.fn() }).name).toBe('supabase');
  });

  it('returns null when verifySession returns null (no session)', async () => {
    const verifySession = vi.fn().mockResolvedValue(null);
    const strategy = supabaseStrategy({ verifySession });
    const result = await strategy.authenticate({
      headers: HEADERS,
      payload: makePayload({ docs: [], totalDocs: 0 }),
    } as never);
    expect(result).toEqual({ user: null });
    expect(verifySession).toHaveBeenCalledWith(HEADERS);
  });

  it('returns null when no Payload Users row matches the supabaseUserId (mirror lag)', async () => {
    const verifySession = vi
      .fn()
      .mockResolvedValue({ supabaseUserId: 'uuid-x', email: 'a@b.com' });
    const payload = makePayload({ docs: [], totalDocs: 0 });
    const strategy = supabaseStrategy({ verifySession });
    const result = await strategy.authenticate({
      headers: HEADERS,
      payload,
    } as never);
    expect(result).toEqual({ user: null });
    expect(payload.find).toHaveBeenCalledWith({
      collection: 'users',
      where: { supabaseUserId: { equals: 'uuid-x' } },
      limit: 1,
      depth: 0,
    });
  });

  it('returns the Payload user with collection + _strategy stamps when matched', async () => {
    const verifySession = vi
      .fn()
      .mockResolvedValue({ supabaseUserId: 'uuid-y', email: 'a@b.com' });
    const userDoc = { id: 42, email: 'a@b.com', supabaseUserId: 'uuid-y', role: 'user' };
    const strategy = supabaseStrategy({ verifySession });
    const result = await strategy.authenticate({
      headers: HEADERS,
      payload: makePayload({ docs: [userDoc], totalDocs: 1 }),
    } as never);
    expect(result.user).toMatchObject({
      ...userDoc,
      collection: 'users',
      _strategy: 'supabase',
    });
  });

  it('returns null when verifySession throws', async () => {
    const verifySession = vi.fn().mockRejectedValue(new Error('boom'));
    const strategy = supabaseStrategy({ verifySession });
    const result = await strategy.authenticate({
      headers: HEADERS,
      payload: makePayload({ docs: [], totalDocs: 0 }),
    } as never);
    expect(result).toEqual({ user: null });
  });
});
