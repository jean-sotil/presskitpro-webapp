import { describe, expect, it } from 'vitest';

import { parseInstagramPostUrl } from './instagram-validate';

describe('parseInstagramPostUrl', () => {
  it('rejects empty input', () => {
    expect(parseInstagramPostUrl('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseInstagramPostUrl('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects malformed URLs', () => {
    expect(parseInstagramPostUrl('not-a-url')).toEqual({
      ok: false,
      reason: 'invalid-url',
    });
  });

  it('rejects non-https schemes', () => {
    expect(
      parseInstagramPostUrl('ftp://www.instagram.com/p/abc/'),
    ).toEqual({ ok: false, reason: 'invalid-url' });
  });

  it('rejects non-instagram hosts', () => {
    expect(
      parseInstagramPostUrl('https://example.com/p/abc/'),
    ).toEqual({ ok: false, reason: 'wrong-host' });
  });

  it('canonicalizes a /p/ post URL', () => {
    const result = parseInstagramPostUrl(
      'https://www.instagram.com/p/CxYzAbc123/?utm_source=ig_web_copy_link',
    );
    expect(result).toEqual({
      ok: true,
      kind: 'post',
      shortcode: 'CxYzAbc123',
      canonical: 'https://www.instagram.com/p/CxYzAbc123/',
    });
  });

  it('canonicalizes a /reel/ URL', () => {
    expect(
      parseInstagramPostUrl('https://instagram.com/reel/Rabc987/?si=foo'),
    ).toEqual({
      ok: true,
      kind: 'reel',
      shortcode: 'Rabc987',
      canonical: 'https://www.instagram.com/reel/Rabc987/',
    });
  });

  it('canonicalizes a /tv/ URL', () => {
    expect(
      parseInstagramPostUrl('https://www.instagram.com/tv/Tabc/'),
    ).toEqual({
      ok: true,
      kind: 'tv',
      shortcode: 'Tabc',
      canonical: 'https://www.instagram.com/tv/Tabc/',
    });
  });

  it('rejects an instagram URL that is not a post/reel/tv', () => {
    expect(
      parseInstagramPostUrl('https://www.instagram.com/dj_x/'),
    ).toEqual({ ok: false, reason: 'invalid-path' });
    expect(
      parseInstagramPostUrl('https://www.instagram.com/explore/'),
    ).toEqual({ ok: false, reason: 'invalid-path' });
  });

  it('rejects when the shortcode is empty', () => {
    expect(
      parseInstagramPostUrl('https://www.instagram.com/p//'),
    ).toEqual({ ok: false, reason: 'invalid-path' });
  });
});
