import type { Metadata } from 'next';

import { SUPPORTED_LOCALES, toBcp47, type SupportedLocale } from '@/lib/i18n/locale';

/**
 * Site-wide brand suffix used for OG/Twitter titles. The root layout's
 * `title.template` adds the same suffix to the `<title>` element, but
 * OG/Twitter titles bypass the template, so the helper has to brand
 * them explicitly.
 */
const BRAND_SUFFIX = 'PressKit Pro';

/**
 * Maps a supported short locale to the OG locale tag the social
 * scrapers expect (region-flavored). PT→pt_BR, EN→en_US, ES→es_ES.
 */
const OG_LOCALES: Record<SupportedLocale, string> = {
  pt: 'pt_BR',
  en: 'en_US',
  es: 'es_ES',
};

export interface BuildMarketingMetadataInput {
  /** Site origin without trailing slash (e.g. https://presskit.pro). */
  origin: string;
  /** URL path beginning with `/` (e.g. `/`, `/privacy`). */
  path: string;
  /** Active locale for the current request. */
  locale: SupportedLocale;
  /** Page title segment WITHOUT the brand suffix — the layout's title
   *  template will append " | PressKit Pro" automatically. */
  title: string;
  /** Meta description ≤160 chars. */
  description: string;
  /** Public path to the OG/Twitter image. Defaults to /og-image.png. */
  imagePath?: string;
}

/**
 * Builds a `Metadata` object for cookie-driven marketing routes.
 *
 * Locale negotiation lives in the cookie / Accept-Language header
 * rather than the URL path, so every supported locale maps to the
 * same canonical URL. Same-URL hreflang is valid per Google when the
 * server respects `Vary` headers — middleware does (task-29 PR-B).
 */
export function buildMarketingMetadata(
  input: BuildMarketingMetadataInput,
): Metadata {
  const cleanOrigin = input.origin.replace(/\/$/, '');
  const url = `${cleanOrigin}${input.path}`;
  const imagePath = input.imagePath ?? '/og-image.png';
  const fullImage = imagePath.startsWith('http')
    ? imagePath
    : `${cleanOrigin}${imagePath}`;

  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[toBcp47(loc)] = url;
  }
  languages['x-default'] = url;

  const alternateLocale = SUPPORTED_LOCALES
    .filter((l) => l !== input.locale)
    .map((l) => OG_LOCALES[l]);

  const brandedTitle = `${input.title} | ${BRAND_SUFFIX}`;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: BRAND_SUFFIX,
      title: brandedTitle,
      description: input.description,
      locale: OG_LOCALES[input.locale],
      alternateLocale,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: BRAND_SUFFIX,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description: input.description,
      images: [fullImage],
    },
  };
}
