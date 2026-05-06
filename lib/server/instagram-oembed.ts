/**
 * Hybrid embed dispatcher (decision-doc 0002).
 *
 * - With `accessToken`: hits Meta's Graph oEmbed endpoint, sanitizes
 *   the returned `<iframe>` (must be on `www.instagram.com`), and
 *   returns it.
 * - Without (or on any failure of the graph path): falls back to a
 *   server-built `<blockquote class="instagram-media">` that embed.js
 *   will hydrate client-side.
 *
 * The fallback is the source of truth — even with a token configured,
 * any rejection (404, malformed JSON, host mismatch) gracefully degrades
 * rather than failing the save.
 *
 * Pure-ish — DI fetch + DI now.
 */

import { buildInstagramBlockquote } from './build-instagram-blockquote';
import { parseInstagramPostUrl } from './instagram-validate';

const GRAPH_BASE = 'https://graph.facebook.com/v18.0/instagram_oembed';
const GRAPH_TIMEOUT_MS = 8_000;
const IFRAME_SRC_RE = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/i;

export type OembedSource = 'graph' | 'blockquote-fallback';

export type InstagramOembedReason =
  | 'empty'
  | 'invalid-url'
  | 'wrong-host'
  | 'invalid-path';

export type InstagramOembedResult =
  | {
      ok: true;
      oembedHtml: string;
      fetchedAt: string;
      source: OembedSource;
    }
  | { ok: false; reason: InstagramOembedReason };

export interface InstagramOembedDeps {
  url: string;
  fetch?: typeof fetch;
  now?: () => number;
  accessToken?: string;
  abortSignal?: AbortSignal;
}

export async function fetchInstagramOembed(
  deps: InstagramOembedDeps,
): Promise<InstagramOembedResult> {
  const parsed = parseInstagramPostUrl(deps.url);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  const now = deps.now ?? Date.now;
  const fetchedAt = new Date(now()).toISOString();

  // Try graph first when a token is set; on ANY failure, drop to fallback.
  if (deps.accessToken) {
    const graphHtml = await tryGraphOembed({
      canonical: parsed.canonical,
      accessToken: deps.accessToken,
      fetch: deps.fetch ?? globalThis.fetch,
      abortSignal: deps.abortSignal,
    });
    if (graphHtml) {
      return {
        ok: true,
        oembedHtml: graphHtml,
        fetchedAt,
        source: 'graph',
      };
    }
  }

  // Fallback: server-built blockquote. embed.js hydrates it client-side.
  const html = buildInstagramBlockquote({
    canonical: parsed.canonical,
    shortcode: parsed.shortcode,
  });
  return { ok: true, oembedHtml: html, fetchedAt, source: 'blockquote-fallback' };
}

async function tryGraphOembed(args: {
  canonical: string;
  accessToken: string;
  fetch: typeof fetch;
  abortSignal?: AbortSignal;
}): Promise<string | null> {
  const url = `${GRAPH_BASE}?url=${encodeURIComponent(args.canonical)}&access_token=${encodeURIComponent(
    args.accessToken,
  )}`;
  const timeoutSignal = AbortSignal.timeout(GRAPH_TIMEOUT_MS);
  const signal = args.abortSignal
    ? anyAbortSignal([args.abortSignal, timeoutSignal])
    : timeoutSignal;
  let res: Response;
  try {
    res = await args.fetch(url, { method: 'GET', signal });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let body: { html?: unknown };
  try {
    body = (await res.json()) as { html?: unknown };
  } catch {
    return null;
  }
  if (typeof body.html !== 'string') return null;
  return rebuildSafeIframe(body.html, args.canonical);
}

function rebuildSafeIframe(rawHtml: string, canonical: string): string | null {
  const match = IFRAME_SRC_RE.exec(rawHtml);
  if (!match) return null;
  const rawSrc = decodeHtmlEntities(match[1]!);
  let src: URL;
  try {
    src = new URL(rawSrc);
  } catch {
    return null;
  }
  if (src.protocol !== 'https:') return null;
  if (
    src.host !== 'www.instagram.com' &&
    src.host !== 'instagram.com'
  ) {
    return null;
  }
  const safeSrc = escapeAttr(src.toString());
  const safeTitle = escapeAttr(`Instagram post — ${canonical}`);
  return [
    `<iframe`,
    ` src="${safeSrc}"`,
    ` width="100%"`,
    ` height="540"`,
    ` frameborder="0"`,
    ` allowtransparency="true"`,
    ` allowfullscreen="true"`,
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

function anyAbortSignal(signals: AbortSignal[]): AbortSignal {
  const anyOf = (
    AbortSignal as unknown as {
      any?: (s: AbortSignal[]) => AbortSignal;
    }
  ).any;
  if (anyOf) return anyOf(signals);
  const ctrl = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      ctrl.abort(s.reason);
      break;
    }
    s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
  }
  return ctrl.signal;
}
