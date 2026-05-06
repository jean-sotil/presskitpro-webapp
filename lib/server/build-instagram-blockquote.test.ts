import { describe, expect, it } from 'vitest';

import { buildInstagramBlockquote } from './build-instagram-blockquote';

describe('buildInstagramBlockquote', () => {
  it('builds the canonical blockquote for a post URL', () => {
    const html = buildInstagramBlockquote({
      canonical: 'https://www.instagram.com/p/CxYzAbc123/',
      shortcode: 'CxYzAbc123',
    });
    expect(html).toContain('<blockquote class="instagram-media"');
    expect(html).toContain(
      'data-instgrm-permalink="https://www.instagram.com/p/CxYzAbc123/"',
    );
    expect(html).toContain('data-instgrm-version="14"');
    expect(html).toContain('data-instgrm-captioned');
    expect(html).toContain('CxYzAbc123');
  });

  it('escapes HTML entities in the URL to block injection', () => {
    const html = buildInstagramBlockquote({
      canonical: 'https://www.instagram.com/p/abc"<script>/',
      shortcode: 'abc"<script>',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&quot;');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes a fallback link inside the blockquote so JS-disabled visitors still see it', () => {
    const html = buildInstagramBlockquote({
      canonical: 'https://www.instagram.com/p/CxYzAbc123/',
      shortcode: 'CxYzAbc123',
    });
    expect(html).toContain('<a href="https://www.instagram.com/p/CxYzAbc123/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
