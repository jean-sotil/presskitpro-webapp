import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mediaUrl } from './url';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('mediaUrl', () => {
  it('composes a public storage URL from bucket + path', () => {
    expect(mediaUrl({ bucket: 'avatars', path: 'sb-1/abc.jpg' })).toBe(
      'https://abc.supabase.co/storage/v1/object/public/avatars/sb-1/abc.jpg',
    );
  });

  it('returns null when env is missing (lets callers no-op the <img> instead of crashing)', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    expect(mediaUrl({ bucket: 'avatars', path: 'x.jpg' })).toBeNull();
  });

  it('returns null when given null/undefined media', () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
  });

  it('handles paths with subdirectories', () => {
    expect(
      mediaUrl({ bucket: 'gallery', path: 'sb-1/2026/03/holi.jpg' }),
    ).toMatch(/gallery\/sb-1\/2026\/03\/holi\.jpg$/);
  });

  it('returns null on missing fields (defensive)', () => {
    expect(mediaUrl({ bucket: '', path: 'x' } as never)).toBeNull();
    expect(mediaUrl({ bucket: 'x', path: '' } as never)).toBeNull();
  });
});
