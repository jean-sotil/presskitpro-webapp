import { describe, expect, it, vi } from 'vitest';

import { fetchInstagramOembed } from './instagram-oembed';

const POST_URL = 'https://www.instagram.com/p/CxYzAbc123/';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchInstagramOembed', () => {
  it('rejects an invalid URL without a network call', async () => {
    const fetchMock = vi.fn();
    const result = await fetchInstagramOembed({
      url: 'https://example.com/nope',
      fetch: fetchMock,
    });
    expect(result).toEqual({ ok: false, reason: 'wrong-host' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('fallback path (no token)', () => {
    it('builds a blockquote locally — no network call', async () => {
      const fetchMock = vi.fn();
      const result = await fetchInstagramOembed({
        url: POST_URL,
        fetch: fetchMock,
        now: () => 1_700_000_000_000,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.oembedHtml).toContain('class="instagram-media"');
        expect(result.oembedHtml).toContain(POST_URL);
        expect(result.fetchedAt).toBe(
          new Date(1_700_000_000_000).toISOString(),
        );
        expect(result.source).toBe('blockquote-fallback');
      }
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('graph path (with token)', () => {
    const validIframeHtml =
      '<iframe class="instagram-media" src="https://www.instagram.com/p/CxYzAbc123/embed/captioned/" width="540" height="700"></iframe>';

    it('hits the graph endpoint and stores the iframe', async () => {
      const fetchMock = vi.fn(async () =>
        jsonResponse({ html: validIframeHtml, author_name: 'dj_x' }),
      );
      const result = await fetchInstagramOembed({
        url: POST_URL,
        fetch: fetchMock,
        accessToken: 'TOKEN',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.oembedHtml).toContain('iframe');
        expect(result.source).toBe('graph');
      }
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com'),
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('access_token=TOKEN'),
        expect.any(Object),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`url=${encodeURIComponent(POST_URL)}`),
        expect.any(Object),
      );
    });

    it('falls back to the blockquote when the graph endpoint 404s', async () => {
      const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
      const result = await fetchInstagramOembed({
        url: POST_URL,
        fetch: fetchMock,
        accessToken: 'TOKEN',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.source).toBe('blockquote-fallback');
        expect(result.oembedHtml).toContain('instagram-media');
      }
    });

    it('falls back when the graph response is malformed', async () => {
      const fetchMock = vi.fn(async () =>
        jsonResponse({ author_name: 'no html field' }),
      );
      const result = await fetchInstagramOembed({
        url: POST_URL,
        fetch: fetchMock,
        accessToken: 'TOKEN',
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.source).toBe('blockquote-fallback');
    });

    it('falls back when fetch throws (network failure)', async () => {
      const fetchMock = vi.fn(async () => {
        throw new TypeError('fetch failed');
      });
      const result = await fetchInstagramOembed({
        url: POST_URL,
        fetch: fetchMock,
        accessToken: 'TOKEN',
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.source).toBe('blockquote-fallback');
    });

    it('rejects iframe whose src is not on instagram.com', async () => {
      const fetchMock = vi.fn(async () =>
        jsonResponse({
          html: '<iframe src="https://evil.example.com/fake/"></iframe>',
        }),
      );
      const result = await fetchInstagramOembed({
        url: POST_URL,
        fetch: fetchMock,
        accessToken: 'TOKEN',
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.source).toBe('blockquote-fallback');
    });
  });
});
