import type { Metadata } from 'next';

import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { pricingCopy } from '@/lib/marketing/pricing-copy';
import { supabaseServer } from '@/lib/supabase/server';

import { PricingFaq } from './PricingFaq';
import { PricingTable } from './PricingTable';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Planos & preços — PressKit Pro',
  description: pricingCopy.hero.body,
};

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
