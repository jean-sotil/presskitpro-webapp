import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { LocaleToggle } from '@/components/marketing/LocaleToggle';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { fontPairClasses } from '@/lib/design/fonts';
import {
  isSupportedLocale,
  toBcp47,
  DEFAULT_LOCALE,
} from '@/lib/i18n/locale';
import { buildOrganizationJsonLd } from '@/lib/seo/build-organization-jsonld';
import { Providers } from './providers';
import './globals.css';

/**
 * Root layout.
 *
 * We declare every `next/font` pair's variable className here so the browser
 * has every @font-face available — but the public profile (task-19) will
 * narrow this to just the chosen pair to honor the per-pair byte budget.
 * For task-03 (the design-system foundation) it's correct to load all.
 *
 * The semantic `--font-display`/`--font-body`/`--font-editorial` CSS vars
 * default to the "Editorial Nightlife" pair via globals.css; the preview
 * route and per-profile renderers override them inline.
 */

const allFontClasses = Object.values(fontPairClasses)
  .flatMap((c) => c.split(' '))
  // de-dupe shared fonts (Manrope appears in two pairs, etc.)
  .filter((c, i, arr) => arr.indexOf(c) === i)
  .join(' ');

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

/**
 * Site-wide metadata. Locale-aware via `getTranslations`. Per-route
 * pages (home, privacy, terms, pricing, profile) override these
 * defaults via their own `generateMetadata`.
 *
 * `metadataBase` is required by Next.js 14+ for relative URLs in OG /
 * Twitter / canonical to resolve correctly.
 *
 * `title.template` brands every child route's title with " | PressKit
 * Pro" — child routes set just the page-specific segment.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('seo');
  const siteTitle = t('siteTitle');
  const siteDescription = t('siteDescription');
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: {
      default: `${siteTitle} | PressKit Pro`,
      template: '%s | PressKit Pro',
    },
    description: siteDescription,
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      type: 'website',
      siteName: 'PressKit Pro',
      title: `${siteTitle} | PressKit Pro`,
      description: siteDescription,
      images: [
        { url: '/og-image.png', width: 1200, height: 630, alt: 'PressKit Pro' },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteTitle} | PressKit Pro`,
      description: siteDescription,
      images: ['/og-image.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Task-29 — locale negotiated in `i18n/request.ts` (cookie wins,
  // Accept-Language fallback, default `pt`). The `<html lang>` mirrors
  // the active locale in BCP-47.
  const rawLocale = await getLocale();
  const locale = isSupportedLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const messages = await getMessages();
  // Task-27 — CSP nonce minted in middleware. Required on every inline
  // <script> so the browser doesn't reject the JSON-LD payload.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const orgLd = buildOrganizationJsonLd({ origin: SITE_ORIGIN });
  return (
    <html lang={toBcp47(locale)} className={allFontClasses}>
      <body className="font-body bg-bg text-text antialiased">
        <SkipToContent />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <header className="flex justify-end border-b border-border px-6 py-2 md:px-12">
              <LocaleToggle />
            </header>
            {children}
          </Providers>
          <CookieConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
