import type { Metadata } from 'next';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { fontPairClasses } from '@/lib/design/fonts';
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // PRD §10 — PT-BR is the v1 locale. Task-29 (next-intl) will swap
    // this for a per-route value once the EN content lands.
    <html lang="pt-BR" className={allFontClasses}>
      <body className="font-body bg-bg text-text antialiased">
        <SkipToContent />
        <Providers>{children}</Providers>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
