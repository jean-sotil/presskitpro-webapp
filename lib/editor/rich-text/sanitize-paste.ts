/**
 * Strip styling cruft from pasted HTML before Lexical imports it.
 *
 * Word and Google Docs paste a lot of inline styles, classes, ids, and
 * proprietary tags (`<o:p>`, MS Office conditional comments, GDocs
 * `docs-internal-guid-*` ids). Lexical's `$generateNodesFromDOM` already
 * drops most non-supported tags, but it preserves `style=` attributes
 * which then leak into the editor's appearance.
 *
 * Strategy:
 *   1. Remove `<style>`, `<script>`, conditional comments wholesale.
 *   2. Drop `<font>`, `<o:p>`, `<svg>` and other non-content tags
 *      (keeping their inner text).
 *   3. Strip `style=`, `class=`, `id=` attributes from every remaining tag.
 *   4. Reject `javascript:` / `data:` schemes in `href=`.
 *
 * Pure string-level — runs in any environment.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'a',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
]);

const NON_CONTENT_TAGS_TO_DROP_KEEP_INNER = new Set(['font', 'span', 'div', 'section']);

const BLOCK_LEVEL_REPLACE_TAGS_REGEX =
  /<(style|script|svg|math|iframe|object|embed)[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_DROP_REGEX = /<(meta|link|img|source|track|input|svg|path)[^>]*\/?>/gi;
const MS_OFFICE_NAMESPACED_TAG_REGEX = /<\/?o:[a-z]+[^>]*>/gi;
const MS_CONDITIONAL_COMMENT_REGEX = /<!--\[if[\s\S]*?\[endif\]-->/gi;
const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;

const ATTR_STRIP_LIST = ['style', 'class', 'id', 'lang', 'dir', 'align', 'color', 'face', 'size'];

const TAG_RE = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;

export function sanitizePastedHtml(input: string): string {
  if (!input) return '';
  let html = input;

  // 1. Whole-block removals.
  html = html.replace(BLOCK_LEVEL_REPLACE_TAGS_REGEX, '');
  html = html.replace(SELF_CLOSING_DROP_REGEX, '');
  html = html.replace(MS_CONDITIONAL_COMMENT_REGEX, '');
  html = html.replace(HTML_COMMENT_REGEX, '');
  html = html.replace(MS_OFFICE_NAMESPACED_TAG_REGEX, '');

  // 2. Drop non-allowlisted block tags but keep inner content.
  for (const tag of NON_CONTENT_TAGS_TO_DROP_KEEP_INNER) {
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }

  // 3. For each remaining tag, strip disallowed attrs (style/class/id/...).
  //    For unknown tags, drop the tag entirely (keep inner content).
  html = html.replace(TAG_RE, (match, tagName: string, attrs: string) => {
    const lower = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) {
      // Drop the tag, keep inner text.
      return '';
    }
    const cleanAttrs = stripAttrs(attrs);
    return `<${lower}${cleanAttrs}>`;
  });
  // Closing tags too — normalize case + drop disallowed.
  html = html.replace(/<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/g, (m, t: string) => {
    const lower = t.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return '';
    return `</${lower}>`;
  });

  return html.trim();
}

function stripAttrs(attrs: string): string {
  if (!attrs.trim()) return '';
  // Match attr="value", attr='value', or attr=value (no quotes), or boolean.
  const ATTR_RE = /([a-zA-Z:][a-zA-Z0-9:-]*)(\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrs)) !== null) {
    const name = m[1]!.toLowerCase();
    if (ATTR_STRIP_LIST.includes(name)) continue;
    if (name.startsWith('on')) continue; // event handlers
    if (name.startsWith('data-')) continue; // GDocs data-* cruft
    if (name.startsWith('aria-')) {
      // Allowed.
      const raw = m[3] ?? '';
      out.push(raw ? `${name}=${raw}` : name);
      continue;
    }
    // Reject unsafe schemes on href / src.
    if (name === 'href' || name === 'src') {
      const value = (m[4] ?? m[5] ?? m[6] ?? '').trim().toLowerCase();
      if (value.startsWith('javascript:') || value.startsWith('data:') || value.startsWith('vbscript:')) {
        continue;
      }
    }
    if (name === 'href' || name === 'src' || name === 'alt' || name === 'title' || name === 'target' || name === 'rel') {
      const raw = m[3] ?? '';
      out.push(raw ? `${name}=${raw}` : name);
    }
    // Else drop unknown attribute silently.
  }
  return out.length ? ` ${out.join(' ')}` : '';
}
