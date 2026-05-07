import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { LiveExamplesCarousel } from '@/components/marketing/LiveExamplesCarousel';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { PricingTeaser } from '@/components/marketing/PricingTeaser';
import { WhatIsPressKit } from '@/components/marketing/WhatIsPressKit';
import {
  loadLiveExamples,
  type LiveExample,
} from '@/lib/marketing/fetch-live-examples';
import { payload as getPayloadInstance } from '@/lib/payload';

// Task-29 — locale negotiation reads cookies + Accept-Language per
// request, which makes this route dynamic. The previous `revalidate`
// was a cross-locale cache trap (first render's locale stuck for an
// hour). PR-B will introduce per-locale ISR keying.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.hero');
  return {
    title: 'PressKit Pro',
    description: t('tagline'),
  };
}

async function fetchExamples(): Promise<LiveExample[]> {
  try {
    const p = await getPayloadInstance();
    return await loadLiveExamples({
      limit: 8,
      async find(args) {
        const result = await p.find({
          collection: 'profiles',
          where: args.where,
          sort: args.sort,
          limit: args.limit,
          depth: args.depth,
          overrideAccess: args.overrideAccess,
        });
        return { docs: result.docs as never };
      },
    });
  } catch {
    // The marketing page must never crash because Payload is unavailable
    // (e.g. during a brief deploy gap). Empty examples is the same UX
    // the page shows on a fresh dev DB — the empty-state copy nudges
    // the user to seed.
    return [];
  }
}

export default async function MarketingHome() {
  const examples = await fetchExamples();
  return (
    <>
      <main id="main">
        <MarketingHero />
        <WhatIsPressKit />
        <HowItWorks />
        <LiveExamplesCarousel examples={examples} />
        <PricingTeaser />
        <FaqAccordion />
      </main>
      <MarketingFooter />
    </>
  );
}
