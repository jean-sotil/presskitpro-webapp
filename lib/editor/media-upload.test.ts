import { describe, expect, it, vi } from 'vitest';

import { MAX_UPLOAD_BYTES, uploadMedia, type UploadDeps } from './media-upload';

function makeDeps(overrides: Partial<UploadDeps> = {}): UploadDeps {
  return {
    sign: vi.fn().mockResolvedValue({
      ok: true,
      signedUrl: 'https://signed.example/upload?token=abc',
      path: 'sb-1/file.jpg',
      bucket: 'avatars',
    }),
    putFile: vi.fn().mockResolvedValue({ ok: true }),
    register: vi.fn().mockResolvedValue({ ok: true, mediaId: 17 }),
    ...overrides,
  };
}

const FILE = new File([new Uint8Array(100)], 'hero.jpg', { type: 'image/jpeg' });

describe('uploadMedia', () => {
  it('runs the full sign → PUT → register chain', async () => {
    const deps = makeDeps();
    const result = await uploadMedia(deps, {
      file: FILE,
      bucket: 'avatars',
      supabaseUserId: 'sb-1',
      alt: 'Foto principal',
    });
    expect(result).toEqual({
      ok: true,
      mediaId: 17,
      path: 'sb-1/file.jpg',
      bucket: 'avatars',
    });
    expect(deps.sign).toHaveBeenCalledWith({
      bucket: 'avatars',
      mimeType: 'image/jpeg',
      size: 100,
      ownerSupabaseId: 'sb-1',
    });
    expect(deps.putFile).toHaveBeenCalledWith({
      url: 'https://signed.example/upload?token=abc',
      file: FILE,
    });
    expect(deps.register).toHaveBeenCalledWith({
      bucket: 'avatars',
      path: 'sb-1/file.jpg',
      mimeType: 'image/jpeg',
      size: 100,
      alt: 'Foto principal',
      ownerSupabaseId: 'sb-1',
    });
  });

  it('refuses an empty alt (Media collection has alt: required: true)', async () => {
    const deps = makeDeps();
    const result = await uploadMedia(deps, {
      file: FILE,
      bucket: 'avatars',
      supabaseUserId: 'sb-1',
      alt: '',
    });
    expect(result).toEqual({ ok: false, reason: 'alt-required' });
    expect(deps.sign).not.toHaveBeenCalled();
  });

  it('surfaces a sign failure', async () => {
    const deps = makeDeps({
      sign: vi.fn().mockResolvedValue({ ok: false, reason: 'unsupported mime type' }),
    });
    const result = await uploadMedia(deps, {
      file: FILE,
      bucket: 'avatars',
      supabaseUserId: 'sb-1',
      alt: 'x',
    });
    expect(result).toMatchObject({ ok: false, reason: 'sign-failed' });
    expect(deps.putFile).not.toHaveBeenCalled();
  });

  it('surfaces a PUT failure (does not register a phantom Media row)', async () => {
    const deps = makeDeps({
      putFile: vi.fn().mockResolvedValue({ ok: false }),
    });
    const result = await uploadMedia(deps, {
      file: FILE,
      bucket: 'avatars',
      supabaseUserId: 'sb-1',
      alt: 'x',
    });
    expect(result).toMatchObject({ ok: false, reason: 'put-failed' });
    expect(deps.register).not.toHaveBeenCalled();
  });

  it('refuses files larger than MAX_UPLOAD_BYTES before calling sign (server would 400)', async () => {
    const deps = makeDeps();
    const huge = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'studio.jpg', {
      type: 'image/jpeg',
    });
    const result = await uploadMedia(deps, {
      file: huge,
      bucket: 'gallery',
      supabaseUserId: 'sb-1',
      alt: 'Foto estúdio',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('too-large');
      // Detail should communicate the actual size vs the budget so the UI
      // can show a humanized message ("12.0MB > 10MB").
      expect(result.detail).toMatch(/MB.*>.*MB/i);
    }
    expect(deps.sign).not.toHaveBeenCalled();
    expect(deps.putFile).not.toHaveBeenCalled();
    expect(deps.register).not.toHaveBeenCalled();
  });

  it('exposes MAX_UPLOAD_BYTES = 10MB to match the server route', () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it('surfaces a register failure (treats it as recoverable — caller can retry)', async () => {
    const deps = makeDeps({
      register: vi.fn().mockResolvedValue({ ok: false, status: 409 }),
    });
    const result = await uploadMedia(deps, {
      file: FILE,
      bucket: 'avatars',
      supabaseUserId: 'sb-1',
      alt: 'x',
    });
    expect(result).toMatchObject({ ok: false, reason: 'register-failed' });
  });
});
