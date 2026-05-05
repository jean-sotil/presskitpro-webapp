import { describe, expect, it, vi } from 'vitest';

import { resolvePayloadUser, type ResolveDeps } from './payload-user-from-request';

function makeDeps(overrides: Partial<ResolveDeps> = {}): ResolveDeps {
  return {
    verifySession: vi.fn().mockResolvedValue({
      supabaseUserId: 'sb-1',
      email: 'a@b.com',
    }),
    findPayloadUser: vi.fn().mockResolvedValue({
      id: 42,
      supabaseUserId: 'sb-1',
      collection: 'users',
    }),
    ...overrides,
  };
}

const HEADERS = new Headers({ cookie: 'sb-access-token=tok' });

describe('resolvePayloadUser', () => {
  it('returns null when no Supabase session is attached', async () => {
    const deps = makeDeps({
      verifySession: vi.fn().mockResolvedValue(null),
    });
    expect(await resolvePayloadUser(HEADERS, deps)).toBeNull();
    expect(deps.findPayloadUser).not.toHaveBeenCalled();
  });

  it('returns null when no Payload mirror exists yet', async () => {
    const deps = makeDeps({
      findPayloadUser: vi.fn().mockResolvedValue(null),
    });
    expect(await resolvePayloadUser(HEADERS, deps)).toBeNull();
  });

  it('returns the resolved Payload user with `collection` stamped', async () => {
    const deps = makeDeps();
    const result = await resolvePayloadUser(HEADERS, deps);
    expect(result).toMatchObject({
      id: 42,
      supabaseUserId: 'sb-1',
      collection: 'users',
    });
    expect(deps.findPayloadUser).toHaveBeenCalledWith('sb-1');
  });

  it('returns null and swallows verifySession throws (defensive)', async () => {
    const deps = makeDeps({
      verifySession: vi.fn().mockRejectedValue(new Error('boom')),
    });
    expect(await resolvePayloadUser(HEADERS, deps)).toBeNull();
  });

  it('returns null and swallows findPayloadUser throws', async () => {
    const deps = makeDeps({
      findPayloadUser: vi.fn().mockRejectedValue(new Error('db down')),
    });
    expect(await resolvePayloadUser(HEADERS, deps)).toBeNull();
  });
});
