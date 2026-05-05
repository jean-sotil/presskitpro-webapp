import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifySupabaseSession } from './verify-supabase-session';

const ENV = {
  url: 'https://example.supabase.co',
  key: 'anon-key',
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', ENV.url);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', ENV.key);
});

function makeHeaders(cookie?: string): Headers {
  const h = new Headers();
  if (cookie) h.set('cookie', cookie);
  return h;
}

describe('verifySupabaseSession', () => {
  it('returns null when no cookie header is present', async () => {
    const getUser = vi.fn();
    const result = await verifySupabaseSession(makeHeaders(), {
      createClient: () => ({ auth: { getUser } }) as never,
    });
    expect(result).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('returns null when env vars are missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const getUser = vi.fn();
    const result = await verifySupabaseSession(makeHeaders('sb-access-token=abc'), {
      createClient: () => ({ auth: { getUser } }) as never,
    });
    expect(result).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });

  it('returns null when getUser errors', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid' },
    });
    const result = await verifySupabaseSession(makeHeaders('sb-access-token=abc'), {
      createClient: () => ({ auth: { getUser } }) as never,
    });
    expect(result).toBeNull();
  });

  it('returns null when getUser succeeds but user is null', async () => {
    const getUser = vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: null });
    const result = await verifySupabaseSession(makeHeaders('sb-access-token=abc'), {
      createClient: () => ({ auth: { getUser } }) as never,
    });
    expect(result).toBeNull();
  });

  it('returns the user summary on a verified session', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'uuid-1', email: 'a@b.com' } },
      error: null,
    });
    const result = await verifySupabaseSession(makeHeaders('sb-access-token=abc'), {
      createClient: () => ({ auth: { getUser } }) as never,
    });
    expect(result).toEqual({ supabaseUserId: 'uuid-1', email: 'a@b.com' });
  });

  it('passes parsed cookies into the client factory via getAll()', async () => {
    let captured: Array<{ name: string; value: string }> = [];
    const getUser = vi
      .fn()
      .mockResolvedValue({ data: { user: { id: 'u1', email: null } }, error: null });
    await verifySupabaseSession(
      makeHeaders('sb-access-token=tok; sb-refresh-token=ref; foo=bar'),
      {
        createClient: (_url, _key, opts) => {
          captured = (opts as { cookies: { getAll: () => typeof captured } }).cookies.getAll();
          return { auth: { getUser } } as never;
        },
      },
    );
    expect(captured).toEqual([
      { name: 'sb-access-token', value: 'tok' },
      { name: 'sb-refresh-token', value: 'ref' },
      { name: 'foo', value: 'bar' },
    ]);
  });

  it('handles a getUser that throws', async () => {
    const getUser = vi.fn().mockRejectedValue(new Error('network'));
    const result = await verifySupabaseSession(makeHeaders('sb-access-token=abc'), {
      createClient: () => ({ auth: { getUser } }) as never,
    });
    expect(result).toBeNull();
  });
});
