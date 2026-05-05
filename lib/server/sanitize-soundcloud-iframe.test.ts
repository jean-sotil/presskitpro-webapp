import { describe, expect, it } from 'vitest';

import { extractSafeIframe } from './sanitize-soundcloud-iframe';

const validHtml =
  '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123&color=%23ff5500&auto_play=false"></iframe>';

describe('extractSafeIframe', () => {
  it('rebuilds a safe iframe from a valid SoundCloud oEmbed html', () => {
    const result = extractSafeIframe(validHtml, 'My Track');
    expect(result).not.toBeNull();
    expect(result!).toContain(
      'src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F123&amp;color=%23ff5500&amp;auto_play=false"',
    );
    expect(result!).toContain('loading="lazy"');
    expect(result!).toContain('title="My Track"');
    expect(result!).toContain('allow="autoplay; encrypted-media"');
    expect(result!).toContain('frameborder="0"');
    // We never pass through the upstream attributes verbatim.
    expect(result!).not.toContain('scrolling="no"');
  });

  it('escapes HTML in the title to prevent injection', () => {
    const result = extractSafeIframe(validHtml, 'Naughty <img onerror=hax>"');
    expect(result).not.toBeNull();
    expect(result!).toContain(
      'title="Naughty &lt;img onerror=hax&gt;&quot;"',
    );
    // Raw payload must not appear unescaped.
    expect(result!).not.toContain('<img onerror');
  });

  it('rejects an iframe whose src is not w.soundcloud.com', () => {
    const html =
      '<iframe src="https://evil.example.com/player/?url=foo"></iframe>';
    expect(extractSafeIframe(html, 'x')).toBeNull();
  });

  it('rejects an iframe with an http (non-https) src', () => {
    const html =
      '<iframe src="http://w.soundcloud.com/player/?url=foo"></iframe>';
    expect(extractSafeIframe(html, 'x')).toBeNull();
  });

  it('rejects markup that is not an iframe at all', () => {
    expect(
      extractSafeIframe('<script>alert(1)</script>', 'x'),
    ).toBeNull();
  });

  it('rejects empty html', () => {
    expect(extractSafeIframe('', 'x')).toBeNull();
  });

  it('rejects an iframe missing src', () => {
    expect(extractSafeIframe('<iframe></iframe>', 'x')).toBeNull();
  });

  it('strips surrounding noise and finds the iframe', () => {
    // SoundCloud has historically wrapped iframes in their own HTML —
    // we should still find the iframe.
    const wrapped = `<div class="sc-embed">${validHtml}</div>`;
    expect(extractSafeIframe(wrapped, 'x')).not.toBeNull();
  });
});
