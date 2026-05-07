/**
 * Locale resolution — pure helpers. No I/O. Used by `i18n/request.ts`
 * (next-intl's `getRequestConfig`) and the `<LocaleToggle />` server
 * action.
 *
 * Cookie wins → Accept-Language matches → default `pt`. Per PRD §10
 * and Appendix B's fallback matrix.
 */

export const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'pt';
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

export type NegotiationInput = {
  cookie?: string | null;
  acceptLanguage?: string | null;
};

export function negotiateLocale(input: NegotiationInput): SupportedLocale {
  if (isSupportedLocale(input.cookie)) return input.cookie;
  const fromHeader = pickFromAcceptLanguage(input.acceptLanguage ?? '');
  if (fromHeader) return fromHeader;
  return DEFAULT_LOCALE;
}

function pickFromAcceptLanguage(header: string): SupportedLocale | null {
  if (!header) return null;
  // Parse `lang[;q=0.x]` items into [lang, quality] pairs and pick the
  // highest-quality entry whose base language is supported.
  const items = header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tag, ...attrs] = part.split(';').map((p) => p.trim());
      const qAttr = attrs.find((a) => a.startsWith('q='));
      const q = qAttr ? Number(qAttr.slice(2)) : 1;
      return {
        base: (tag ?? '').toLowerCase().split('-')[0] ?? '',
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .sort((a, b) => b.q - a.q);
  for (const { base } of items) {
    if (isSupportedLocale(base)) return base;
  }
  return null;
}

const BCP47: Record<SupportedLocale, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
};

export function toBcp47(locale: SupportedLocale): string {
  return BCP47[locale];
}

/**
 * Payload's `localization.locales` config uses the same BCP-47 codes
 * as our HTML `lang` attribute. The mapping is currently the identity
 * function on top of `toBcp47` — kept as a separate symbol so future
 * Payload-side renames (e.g. `pt-BR` → `pt`) only require touching
 * this helper, not every call site.
 */
export type PayloadLocale = 'pt-BR' | 'en' | 'es';

export function toPayloadLocale(locale: SupportedLocale): PayloadLocale {
  return BCP47[locale] as PayloadLocale;
}

/**
 * Inverse of `toPayloadLocale` — given a Payload locale string from a
 * Profile's `defaultLocale` or `localesAvailable`, return the matching
 * supported short code. Returns `null` for any unknown value.
 */
export function fromPayloadLocale(payloadLocale: string): SupportedLocale | null {
  if (payloadLocale === 'pt-BR') return 'pt';
  if (payloadLocale === 'en') return 'en';
  if (payloadLocale === 'es') return 'es';
  return null;
}
