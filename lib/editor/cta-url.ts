/**
 * Loose CTA URL validation. Accepts the schemes real artists actually
 * paste:
 *   - https:// (booking pages, websites)
 *   - http://  (legacy; we don't strip)
 *   - mailto:  (press@x.com)
 *   - tel:     (international phone)
 *   - https://wa.me/ (WhatsApp deep links — already covered by https://)
 *
 * Rejects javascript:, file://, ftp://, bare domains, etc. Phishing /
 * XSS is the load-bearing concern; the renderer also sets `rel="noopener"`.
 */

const ALLOWED_PREFIXES = ['https://', 'http://', 'mailto:', 'tel:'];

export function isValidCtaUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (!ALLOWED_PREFIXES.some((p) => lower.startsWith(p))) return false;
  // mailto + tel are accepted on prefix alone (loose).
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return true;
  // For http(s), require a parsable URL with a non-empty host.
  try {
    const url = new URL(trimmed);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function normalizeCtaUrl(input: string): string {
  return input.trim();
}
