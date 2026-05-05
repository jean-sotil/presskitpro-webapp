import { describe, expect, it } from 'vitest';

import { isValidCtaUrl, normalizeCtaUrl } from './cta-url';

describe('isValidCtaUrl', () => {
  it.each([
    'https://wa.me/5511999999999',
    'https://example.com/contact',
    'http://example.com',
    'mailto:press@artist.com',
    'tel:+5511999999999',
  ])('accepts %s', (url) => {
    expect(isValidCtaUrl(url)).toBe(true);
  });

  it.each([
    '',
    'not a url',
    'javascript:alert(1)',
    'ftp://example.com',
    'file:///etc/passwd',
    '   ',
  ])('rejects %s', (url) => {
    expect(isValidCtaUrl(url)).toBe(false);
  });

  it('treats a bare domain as invalid (forces explicit scheme)', () => {
    expect(isValidCtaUrl('example.com')).toBe(false);
  });
});

describe('normalizeCtaUrl', () => {
  it('trims whitespace', () => {
    expect(normalizeCtaUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('preserves valid URLs verbatim (no canonicalization beyond trim)', () => {
    expect(normalizeCtaUrl('mailto:Press@Artist.com')).toBe('mailto:Press@Artist.com');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeCtaUrl('')).toBe('');
    expect(normalizeCtaUrl('   ')).toBe('');
  });
});
