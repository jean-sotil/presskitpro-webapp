import { describe, expect, it } from 'vitest';

import {
  MAX_SOCIAL_LINKS,
  parseAndCanonicalize,
  validateLinks,
} from './social-link-validate';

describe('parseAndCanonicalize', () => {
  it('rejects empty input', () => {
    expect(parseAndCanonicalize('instagram', '')).toEqual({
      ok: false,
      reason: 'empty',
    });
    expect(parseAndCanonicalize('instagram', '   ')).toEqual({
      ok: false,
      reason: 'empty',
    });
  });

  describe('instagram', () => {
    it('normalizes @handle to canonical URL', () => {
      expect(parseAndCanonicalize('instagram', '@dj_x')).toEqual({
        ok: true,
        canonical: 'https://www.instagram.com/dj_x',
      });
    });

    it('strips query/hash from a full URL', () => {
      expect(
        parseAndCanonicalize(
          'instagram',
          'https://instagram.com/dj_x?utm_source=foo#bar',
        ),
      ).toEqual({
        ok: true,
        canonical: 'https://www.instagram.com/dj_x',
      });
    });

    it('rejects a non-instagram host', () => {
      expect(
        parseAndCanonicalize('instagram', 'https://evil.example.com/dj_x'),
      ).toEqual({ ok: false, reason: 'wrong-host' });
    });

    it('rejects an empty handle', () => {
      expect(parseAndCanonicalize('instagram', '@')).toEqual({
        ok: false,
        reason: 'invalid',
      });
    });
  });

  describe('tiktok', () => {
    it('normalizes @handle', () => {
      expect(parseAndCanonicalize('tiktok', '@dj_x')).toEqual({
        ok: true,
        canonical: 'https://www.tiktok.com/@dj_x',
      });
    });

    it('parses a full URL', () => {
      expect(
        parseAndCanonicalize('tiktok', 'https://www.tiktok.com/@dj_x?lang=en'),
      ).toEqual({ ok: true, canonical: 'https://www.tiktok.com/@dj_x' });
    });
  });

  describe('twitter', () => {
    it('normalizes @handle to x.com', () => {
      expect(parseAndCanonicalize('twitter', '@dj_x')).toEqual({
        ok: true,
        canonical: 'https://x.com/dj_x',
      });
    });

    it('accepts both twitter.com and x.com hosts', () => {
      expect(
        parseAndCanonicalize('twitter', 'https://twitter.com/dj_x'),
      ).toEqual({ ok: true, canonical: 'https://x.com/dj_x' });
      expect(parseAndCanonicalize('twitter', 'https://x.com/dj_x')).toEqual({
        ok: true,
        canonical: 'https://x.com/dj_x',
      });
    });
  });

  describe('spotify', () => {
    it('keeps a canonical artist URL', () => {
      expect(
        parseAndCanonicalize(
          'spotify',
          'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY?si=foo',
        ),
      ).toEqual({
        ok: true,
        canonical: 'https://open.spotify.com/artist/4dpARuHxo51G3z768sgnrY',
      });
    });

    it('rejects a non-open.spotify.com host', () => {
      expect(
        parseAndCanonicalize('spotify', 'https://spotify.com/artist/foo'),
      ).toEqual({ ok: false, reason: 'wrong-host' });
    });
  });

  describe('youtube', () => {
    it('keeps an @handle channel URL', () => {
      expect(
        parseAndCanonicalize('youtube', 'https://www.youtube.com/@djx'),
      ).toEqual({
        ok: true,
        canonical: 'https://www.youtube.com/@djx',
      });
    });

    it('keeps a youtu.be short URL', () => {
      expect(
        parseAndCanonicalize('youtube', 'https://youtu.be/abc123'),
      ).toEqual({ ok: true, canonical: 'https://youtu.be/abc123' });
    });

    it('rejects a non-youtube host', () => {
      expect(
        parseAndCanonicalize('youtube', 'https://vimeo.com/foo'),
      ).toEqual({ ok: false, reason: 'wrong-host' });
    });
  });

  describe('whatsapp', () => {
    it('accepts an E.164 number with country code', () => {
      expect(parseAndCanonicalize('whatsapp', '+5511999999999')).toEqual({
        ok: true,
        canonical: 'https://wa.me/5511999999999',
      });
    });

    it('accepts digits without the + prefix', () => {
      expect(parseAndCanonicalize('whatsapp', '5511999999999')).toEqual({
        ok: true,
        canonical: 'https://wa.me/5511999999999',
      });
    });

    it('strips spaces, dashes, and parens before validating', () => {
      expect(parseAndCanonicalize('whatsapp', '+55 (11) 99999-9999')).toEqual({
        ok: true,
        canonical: 'https://wa.me/5511999999999',
      });
    });

    it('rejects a number without a country code', () => {
      expect(parseAndCanonicalize('whatsapp', '999999999')).toEqual({
        ok: false,
        reason: 'invalid',
      });
    });

    it('rejects non-digit input', () => {
      expect(parseAndCanonicalize('whatsapp', 'not-a-number')).toEqual({
        ok: false,
        reason: 'invalid',
      });
    });

    it('parses an existing wa.me URL', () => {
      expect(
        parseAndCanonicalize('whatsapp', 'https://wa.me/5511999999999'),
      ).toEqual({ ok: true, canonical: 'https://wa.me/5511999999999' });
    });
  });

  describe('email', () => {
    it('accepts user@host and returns mailto:', () => {
      expect(parseAndCanonicalize('email', 'dj@example.com')).toEqual({
        ok: true,
        canonical: 'mailto:dj@example.com',
      });
    });

    it('strips an existing mailto: prefix before re-canonicalizing', () => {
      expect(parseAndCanonicalize('email', 'mailto:dj@example.com')).toEqual({
        ok: true,
        canonical: 'mailto:dj@example.com',
      });
    });

    it('rejects strings without @', () => {
      expect(parseAndCanonicalize('email', 'not-an-email')).toEqual({
        ok: false,
        reason: 'invalid',
      });
    });
  });

  describe('website', () => {
    it('rebuilds origin + pathname (drops auth, query, hash)', () => {
      expect(
        parseAndCanonicalize(
          'website',
          'https://user:pwd@example.com/path?q=1#frag',
        ),
      ).toEqual({ ok: true, canonical: 'https://example.com/path' });
    });

    it('rejects non-http(s) schemes', () => {
      expect(parseAndCanonicalize('website', 'javascript:alert(1)')).toEqual({
        ok: false,
        reason: 'invalid',
      });
      expect(parseAndCanonicalize('website', 'ftp://example.com')).toEqual({
        ok: false,
        reason: 'invalid',
      });
    });

    it('rejects bare strings without a scheme', () => {
      expect(parseAndCanonicalize('website', 'example.com')).toEqual({
        ok: false,
        reason: 'invalid',
      });
    });
  });
});

describe('validateLinks', () => {
  it('passes a valid list', () => {
    expect(
      validateLinks([
        { platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
        { platform: 'whatsapp', url: 'https://wa.me/5511999999999' },
      ]),
    ).toEqual({ ok: true });
  });

  it('flags the first invalid row', () => {
    const result = validateLinks([
      { platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
      { platform: 'whatsapp', url: 'not-a-number' },
    ]);
    expect(result).toEqual({
      ok: false,
      reason: 'item-invalid',
      index: 1,
      itemReason: 'invalid',
    });
  });

  it(`rejects a list above the cap of ${MAX_SOCIAL_LINKS}`, () => {
    const items = Array.from({ length: MAX_SOCIAL_LINKS + 1 }, () => ({
      platform: 'instagram' as const,
      url: 'https://www.instagram.com/dj_x',
    }));
    expect(validateLinks(items)).toEqual({ ok: false, reason: 'too-many' });
  });

  it('rejects duplicate platforms', () => {
    expect(
      validateLinks([
        { platform: 'instagram', url: 'https://www.instagram.com/dj_x' },
        { platform: 'instagram', url: 'https://www.instagram.com/dj_y' },
      ]),
    ).toEqual({ ok: false, reason: 'duplicate-platform', index: 1 });
  });
});
