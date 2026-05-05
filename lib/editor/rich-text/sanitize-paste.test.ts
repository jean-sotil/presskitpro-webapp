import { describe, expect, it } from 'vitest';

import { sanitizePastedHtml } from './sanitize-paste';

describe('sanitizePastedHtml', () => {
  it('strips inline style attributes', () => {
    const out = sanitizePastedHtml('<p style="color:red; font-family:Arial">hi</p>');
    expect(out).toBe('<p>hi</p>');
  });

  it('strips class attributes', () => {
    const out = sanitizePastedHtml('<p class="docs-style-1">hi</p>');
    expect(out).toBe('<p>hi</p>');
  });

  it('removes <style> blocks entirely (CSS shouldn\'t survive paste)', () => {
    const out = sanitizePastedHtml(
      '<style>p { color: red }</style><p>hi</p>',
    );
    expect(out).not.toContain('<style');
    expect(out).toContain('<p>hi</p>');
  });

  it('removes <script> blocks', () => {
    const out = sanitizePastedHtml('<script>alert(1)</script><p>hi</p>');
    expect(out).not.toContain('<script');
    expect(out).toContain('<p>hi</p>');
  });

  it('removes <font> tags but keeps the text', () => {
    const out = sanitizePastedHtml('<p><font color="red">hi</font></p>');
    expect(out).toBe('<p>hi</p>');
  });

  it('removes Word/Office <o:p> + namespaced cruft', () => {
    const out = sanitizePastedHtml(
      '<p>real text<o:p></o:p></p><!--[if !supportLists]-->•<!--[endif]-->',
    );
    expect(out).toContain('real text');
    expect(out).not.toContain('o:p');
    expect(out).not.toContain('supportLists');
  });

  it('strips MS Office mso-* style tokens (defensive — they shouldn\'t exist after style= strip but pasted spans are weird)', () => {
    const out = sanitizePastedHtml(
      '<p style="mso-fareast-language:EN-US;mso-list:l0 level1 lfo1">hi</p>',
    );
    expect(out).toBe('<p>hi</p>');
  });

  it('preserves the allowlisted HTML structure (paragraphs, headings, lists, link, bold, italic)', () => {
    const input = `
      <h2>Heading 2</h2>
      <h3>Heading 3</h3>
      <p><strong>bold</strong> <em>italic</em> <a href="https://x.com">link</a></p>
      <ul><li>one</li><li>two</li></ul>
      <ol><li>first</li></ol>
    `;
    const out = sanitizePastedHtml(input);
    expect(out).toContain('<h2>Heading 2</h2>');
    expect(out).toContain('<h3>Heading 3</h3>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em>italic</em>');
    expect(out).toContain('<a href="https://x.com">link</a>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<ol>');
  });

  it('drops non-allowlisted tags but keeps their text content', () => {
    const out = sanitizePastedHtml('<p>before<svg><path/></svg>after</p>');
    expect(out).toContain('before');
    expect(out).toContain('after');
    expect(out).not.toContain('<svg');
    expect(out).not.toContain('<path');
  });

  it('strips href= javascript: URLs', () => {
    const out = sanitizePastedHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).toContain('click');
    expect(out).not.toContain('javascript');
  });

  it('strips href= data: URLs', () => {
    const out = sanitizePastedHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>');
    expect(out).not.toContain('data:');
  });

  it('preserves plain text with no markup verbatim', () => {
    const out = sanitizePastedHtml('Just some text — with em-dashes & ampersands.');
    expect(out).toBe('Just some text — with em-dashes & ampersands.');
  });

  it('handles empty input', () => {
    expect(sanitizePastedHtml('')).toBe('');
  });

  it('strips id attributes (GDocs spreads them aggressively)', () => {
    const out = sanitizePastedHtml('<p id="docs-internal-guid-x">hi</p>');
    expect(out).toBe('<p>hi</p>');
  });
});
