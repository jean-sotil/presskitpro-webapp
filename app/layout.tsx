import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { LocaleToggle } from '@/components/marketing/LocaleToggle';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { fontPairClasses } from '@/lib/design/fonts';
import {
  isSupportedLocale,
  toBcp47,
  DEFAULT_LOCALE,
} from '@/lib/i18n/locale';
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

export const metadata: Metadata = {
  title: 'PressKit Pro',
  description: 'Press kits, done right.',
};

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
  return (
    <html lang={toBcp47(locale)} className={allFontClasses}>
      <body className="font-body bg-bg text-text antialiased">
        <SkipToContent />
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
