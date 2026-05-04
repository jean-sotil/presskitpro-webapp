import type { Metadata } from 'next';
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
    <html lang="en" className={allFontClasses}>
      <body className="font-body bg-bg text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
