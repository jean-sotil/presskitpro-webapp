import { describe, expect, it } from 'vitest';

import { derivePressKitProvider } from './derive-press-kit-provider';

describe('derivePressKitProvider', () => {
  it.each([
    ['https://drive.google.com/file/d/abc/view', 'google-drive'],
    ['https://www.dropbox.com/scl/fi/foo/bar.zip', 'dropbox'],
    ['https://onedrive.live.com/?cid=xyz', 'onedrive'],
    ['https://1drv.ms/u/s!Abc', 'onedrive'],
    ['https://wetransfer.com/downloads/abc', 'wetransfer'],
    ['https://www.notion.so/My-Press-Kit-abc123', 'notion'],
    ['https://acme.notion.site/Press-Kit-abc', 'notion'],
    ['https://www.mediafire.com/file/abc/kit.zip', 'mediafire'],
    ['https://example.com/my-press-kit', 'other'],
  ] as const)('derives %s -> %s', (url, expected) => {
    expect(derivePressKitProvider(url)).toBe(expected);
  });

  it('returns "unknown" for an empty value', () => {
    expect(derivePressKitProvider('')).toBe('unknown');
    expect(derivePressKitProvider(undefined)).toBe('unknown');
    expect(derivePressKitProvider(null)).toBe('unknown');
  });

  it('returns "unknown" for a malformed URL', () => {
    expect(derivePressKitProvider('not a url')).toBe('unknown');
  });
});
