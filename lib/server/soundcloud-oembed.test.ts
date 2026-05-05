import { describe, expect, it, vi } from 'vitest';

import { fetchSoundcloudOembed } from './soundcloud-oembed';

const validIframeHtml =
  '<iframe width="100%" height="166" src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123"></iframe>';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchSoundcloudOembed', () => {
  it('rejects non-SoundCloud URLs without calling the network', async () => {
    const fetchMock = vi.fn();
    const result = await fetchSoundcloudOembed({
      url: 'https://example.com/song',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'invalid-host' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed URLs', async () => {
    const result = await fetchSoundcloudOembed({
      url: 'not-a-url',
      fetch: vi.fn(),
    });
    expect(result).toEqual({ ok: false, reason: 'invalid-url' });
  });

  it('returns sanitized html + fetchedAt on success', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        html: validIframeHtml,
        title: 'My Track',
      }),
    );
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/artist/track',
      fetch: fetchMock,
      now: () => 1_700_000_000_000,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.oembedHtml).toContain('w.soundcloud.com/player');
      expect(result.oembedHtml).toContain('loading="lazy"');
      expect(result.oembedHtml).toContain('title="My Track"');
      expect(result.fetchedAt).toBe(new Date(1_700_000_000_000).toISOString());
    }
    expect(fetchMock).toHaveBeenCalledWith(
      'https://soundcloud.com/oembed?url=https%3A%2F%2Fsoundcloud.com%2Fartist%2Ftrack&format=json',
      expect.any(Object),
    );
  });

  it('accepts on-soundcloud subdomains (m.soundcloud.com)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ html: validIframeHtml, title: 't' }),
    );
    const r = await fetchSoundcloudOembed({
      url: 'https://m.soundcloud.com/artist/track',
      fetch: fetchMock,
    });
    expect(r.ok).toBe(true);
  });

  it('returns not-found on 404', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/missing/track',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'not-found' });
  });

  it('returns upstream-error on 500', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 500 }));
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/x',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'upstream-error', status: 500 });
  });

  it('returns malformed-response on missing html field', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ title: 'no html' }));
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/x',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'malformed-response' });
  });

  it('returns sanitization-failed when the html is not a valid sc iframe', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        html: '<script>alert(1)</script>',
        title: 'evil',
      }),
    );
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/x',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'sanitization-failed' });
  });

  it('maps AbortError to timeout', async () => {
    const fetchMock = vi.fn(async () => {
      const e = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    });
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/slow',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'timeout' });
  });

  it('maps other fetch errors to network', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const result = await fetchSoundcloudOembed({
      url: 'https://soundcloud.com/x',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'network' });
  });
});
