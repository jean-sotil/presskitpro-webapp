/**
 * Pure builder for the public profile page's Next `Metadata` object.
 *
 * Outputs:
 *   - `title`       — `metaTitle` ?? auto-fallback `${displayName} — Press Kit & EPK`
 *   - `description` — `metaDescription` ?? `tagline` ?? undefined
 *   - `openGraph` + `twitter` — copy mirrors title/description; `summary_large_image` when an image is supplied.
 *   - `alternates.canonical` — bare `${origin}/${slug}` (never carries a locale).
 *   - `alternates.languages` — one entry per `localesAvailable`, plus `x-default = defaultLocale`. All values are the same canonical URL — same-URL hreflang is valid per Google.
 *
 * Pure module — task-19's `app/[slug]/page.tsx generateMetadata` calls
 * this and resolves the imageUrl outside (since `mediaUrl` reads
 * `process.env.NEXT_PUBLIC_SUPABASE_URL`).
 */

import type { Metadata } from 'next';

import type { EditorBundle } from '@/lib/editor/bundle';

export interface BuildMetadataOptions {
  imageUrl?: string;
  /** Localized "Press Kit & EPK" title suffix. Page must pass the
   *  translation from `getTranslations('profile.metaTitleSuffix')`;
   *  defaults to the English form when omitted (test convenience). */
  titleSuffix?: string;
}

export function buildProfileMetadata(
  bundle: EditorBundle,
  origin: string,
  options: BuildMetadataOptions = {},
): Metadata {
  const profile = bundle.profile as {
    slug: string;
    defaultLocale?: string;
    localesAvailable?: string[];
  };
  const content = bundle.content as
    | { metaTitle?: string; metaDescription?: string; tagline?: string }
    | null;

  const cleanOrigin = origin.replace(/\/$/, '');
  const canonical = `${cleanOrigin}/${profile.slug}`;
  const displayName = displayFromSlug(profile.slug);
  const titleSuffix = options.titleSuffix ?? 'Press Kit & EPK';
  const title = content?.metaTitle?.trim() || `${displayName} — ${titleSuffix}`;
  const description =
    content?.metaDescription?.trim() || content?.tagline?.trim() || undefined;
  const image = options.imageUrl;

  const locales = profile.localesAvailable ?? [profile.defaultLocale ?? 'pt-BR'];
  const defaultLocale = profile.defaultLocale ?? locales[0] ?? 'pt-BR';
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = canonical;
  }
  languages['x-default'] = canonical;

  return {
    // `absolute` opts out of the root layout's `title.template` so the
    // `<title>` reads `Mariana Luz — Press Kit & EPK` rather than
    // `Mariana Luz — Press Kit & EPK | PressKit Pro` (the brand suffix
    // is already inside the title via "Press Kit & EPK" — adding it
    // twice is brand-stuffing).
    title: { absolute: title },
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'profile',
      locale: defaultLocale.replace('-', '_'),
      siteName: 'PressKit Pro',
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function displayFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ');
}
