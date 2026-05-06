/**
 * Builds Instagram's standard `instagram-media` blockquote for the
 * fallback path (no Facebook app token configured). Once mounted in
 * the page and `https://www.instagram.com/embed.js` is loaded, IG's
 * script hydrates the blockquote into a real iframe.
 *
 * Pure module; safe for server + client.
 */

export interface BlockquoteInput {
  canonical: string;
  shortcode: string;
}

export function buildInstagramBlockquote(input: BlockquoteInput): string {
  const safeUrl = escapeAttr(input.canonical);
  const safeShortcode = escapeAttr(input.shortcode);
  return [
    `<blockquote class="instagram-media"`,
    ` data-instgrm-captioned`,
    ` data-instgrm-permalink="${safeUrl}"`,
    ` data-instgrm-version="14"`,
    ` style="background:#fff;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin: 1px;max-width:540px;min-width:326px;padding:0;width:99.375%;width:-webkit-calc(100% - 2px);width:calc(100% - 2px);"`,
    `>`,
    `<div style="padding:16px;">`,
    `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="background:#FFFFFF;line-height:0;padding:0 0;text-align:center;text-decoration:none;width:100%;">`,
    `Ver no Instagram (${safeShortcode})`,
    `</a>`,
    `</div>`,
    `</blockquote>`,
  ].join('');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
