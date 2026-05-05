/**
 * Strict, parser-free sanitizer for SoundCloud's oEmbed `html` field.
 *
 * The upstream returns a single `<iframe>` whose `src` points at
 * `https://w.soundcloud.com/player/?url=...`. We don't trust the
 * surrounding markup or attributes — we extract the `src`, validate
 * it's the expected origin over HTTPS, and rebuild the element with
 * our own attribute set (loading="lazy", descriptive title, our allow
 * policy). Same defensive posture as the URL canonicalizers in
 * tasks 13/14/15.
 *
 * Pure module — safe to import from server + client.
 */

const IFRAME_RE = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i;

/** Allowed embed host. SoundCloud serves the player from this host
 *  exclusively; tracks/playlists in the `url` query string can come
 *  from anywhere on `soundcloud.com`. */
const PLAYER_HOST = 'w.soundcloud.com';

const IFRAME_HEIGHT = 166;

export function extractSafeIframe(
  rawHtml: string,
  title: string,
): string | null {
  if (!rawHtml || typeof rawHtml !== 'string') return null;
  const match = IFRAME_RE.exec(rawHtml);
  if (!match) return null;
  const rawSrc = decodeHtmlEntities(match[1]!);
  let src: URL;
  try {
    src = new URL(rawSrc);
  } catch {
    return null;
  }
  if (src.protocol !== 'https:') return null;
  if (src.host !== PLAYER_HOST) return null;

  // Rebuild from parsed parts. Single quotes, escape everything.
  const safeSrc = escapeAttr(src.toString());
  const safeTitle = escapeAttr(
    (title ?? 'Faixa em destaque').slice(0, 200),
  );
  return [
    `<iframe`,
    ` src="${safeSrc}"`,
    ` width="100%"`,
    ` height="${IFRAME_HEIGHT}"`,
    ` frameborder="0"`,
    ` allow="autoplay; encrypted-media"`,
    ` loading="lazy"`,
    ` title="${safeTitle}"`,
    `></iframe>`,
  ].join('');
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
