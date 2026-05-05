import { describe, expect, it, vi } from 'vitest';

import { validatePressKitUrl } from './press-kit-validate';

function mockResponse(
  init: {
    status?: number;
    url?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {},
): Response {
  const r = new Response(init.body ?? null, {
    status: init.status ?? 200,
    headers: init.headers,
  });
  if (init.url) Object.defineProperty(r, 'url', { value: init.url });
  return r;
}

describe('validatePressKitUrl', () => {
  it('rejects a non-http(s) scheme', async () => {
    const result = await validatePressKitUrl({
      url: 'javascript:alert(1)',
      fetch: vi.fn(),
    });
    expect(result).toEqual({ ok: false, reason: 'invalid-url' });
  });

  it('rejects a malformed URL', async () => {
    const result = await validatePressKitUrl({ url: 'not-a-url', fetch: vi.fn() });
    expect(result).toEqual({ ok: false, reason: 'invalid-url' });
  });

  it('returns ok with the derived provider on a 200 HEAD', async () => {
    const fetchMock = vi.fn(async () => mockResponse({ status: 200 }));
    const result = await validatePressKitUrl({
      url: 'https://www.dropbox.com/scl/fi/abc/kit.zip',
      fetch: fetchMock,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe('dropbox');
      expect(result.warning).toBeUndefined();
    }
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.dropbox.com/scl/fi/abc/kit.zip',
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('reports the final URL after redirects', async () => {
    const fetchMock = vi.fn(async () =>
      mockResponse({
        status: 200,
        url: 'https://www.dropbox.com/scl/fi/final/kit.zip',
      }),
    );
    const result = await validatePressKitUrl({
      url: 'https://dropbox.com/short/abc',
      fetch: fetchMock,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.finalUrl).toBe('https://www.dropbox.com/scl/fi/final/kit.zip');
    }
  });

  it('falls back to ranged GET when HEAD returns 405', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(mockResponse({ status: 405 }))
      .mockResolvedValueOnce(mockResponse({ status: 206 }));
    const result = await validatePressKitUrl({
      url: 'https://www.mediafire.com/file/abc/kit.zip',
      fetch: fetchMock,
    });
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]![1]).toMatchObject({
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    });
  });

  it('rejects a 404', async () => {
    const fetchMock = vi.fn(async () => mockResponse({ status: 404 }));
    const result = await validatePressKitUrl({
      url: 'https://example.com/missing',
      fetch: fetchMock,
    });
    expect(result).toMatchObject({ ok: false, reason: 'not-found', status: 404 });
  });

  it('rejects a 500', async () => {
    const fetchMock = vi.fn(async () => mockResponse({ status: 500 }));
    const result = await validatePressKitUrl({
      url: 'https://example.com/broken',
      fetch: fetchMock,
    });
    expect(result).toMatchObject({ ok: false, reason: 'server-error', status: 500 });
  });

  it('treats AbortError as a timeout', async () => {
    const fetchMock = vi.fn(async () => {
      const e: Error & { name: string } = new Error('aborted') as never;
      e.name = 'AbortError';
      throw e;
    });
    const result = await validatePressKitUrl({
      url: 'https://example.com/slow',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });

  it('treats other fetch errors as unreachable', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const result = await validatePressKitUrl({
      url: 'https://example.com/dead',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'unreachable' });
  });

  it('flags Google Drive 200 responses with the "Access denied" title as restricted', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // First HEAD: 200 from Drive.
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      )
      // Probe GET: returns the locked-down HTML body.
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          headers: { 'content-type': 'text/html' },
          body: '<html><head><title>Access denied</title></head></html>',
        }),
      );
    const result = await validatePressKitUrl({
      url: 'https://drive.google.com/file/d/abc/view',
      fetch: fetchMock,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe('google-drive');
      expect(result.warning).toBe('restrictive-access');
    }
  });

  it('does NOT flag a public Google Drive page', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
      )
      .mockResolvedValueOnce(
        mockResponse({
          status: 200,
          headers: { 'content-type': 'text/html' },
          body: '<html><head><title>Mariana Luz Press Kit – Google Drive</title></head></html>',
        }),
      );
    const result = await validatePressKitUrl({
      url: 'https://drive.google.com/file/d/abc/view',
      fetch: fetchMock,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warning).toBeUndefined();
  });
});
