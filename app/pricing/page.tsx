import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { isSupportedLocale, type SupportedLocale } from '@/lib/i18n/locale';
import { pricingCopy } from '@/lib/marketing/pricing-copy';
import { buildMarketingMetadata } from '@/lib/seo/build-marketing-metadata';
import { supabaseServer } from '@/lib/supabase/server';

import { PricingFaq } from './PricingFaq';
import { PricingTable } from './PricingTable';

// Task-29 — locale negotiation reads cookies + Accept-Language per
// request, which makes this route dynamic. The earlier `revalidate=3600`
// was a cross-locale cache trap (first render's locale stuck for an
// hour). The middleware's CDN cache + `Vary: Cookie, Accept-Language`
// still reuses entries per locale.
export const dynamic = 'force-dynamic';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : 'pt';
  const t = await getTranslations('seo.pricing');
  return buildMarketingMetadata({
    origin: SITE_ORIGIN,
    path: '/pricing',
    locale,
    title: t('title'),
    description: t('description'),
  });
}

export default async function PricingPage() {
  // Server-side session check so the CTA hrefs render with the right
  // shape on first paint — no flicker from a client-side toggle.
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const loggedIn = Boolean(user);

  return (
    <>
      <main id="main">
        <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
          <p className="font-display text-xs uppercase tracking-widest text-text-muted">
            {pricingCopy.hero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl uppercase tracking-tight md:text-7xl">
            {pricingCopy.hero.title}
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-text-muted md:text-xl">
            {pricingCopy.hero.body}
          </p>
        </section>
        <PricingTable loggedIn={loggedIn} />
        <PricingFaq />
      </main>
      <MarketingFooter />
    </>
  );
}
