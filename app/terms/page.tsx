import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';

import { LegalPage } from '@/components/legal/LegalPage';
import { isSupportedLocale, type SupportedLocale } from '@/lib/i18n/locale';
import { buildMarketingMetadata } from '@/lib/seo/build-marketing-metadata';

const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://presskit.pro';

export async function generateMetadata(): Promise<Metadata> {
  const rawLocale = await getLocale();
  const locale: SupportedLocale = isSupportedLocale(rawLocale) ? rawLocale : 'pt';
  const t = await getTranslations();
  return buildMarketingMetadata({
    origin: SITE_ORIGIN,
    path: '/terms',
    locale,
    title: t('terms.title'),
    description: t('seo.terms.description'),
  });
}

type LegalSection = { heading: string; body: string };

export default async function TermsPage() {
  const t = await getTranslations('terms');
  const sections = t.raw('sections') as LegalSection[];
  return (
    <LegalPage
      title={t('title')}
      intro={t('intro')}
      updatedLabel={t('updatedLabel')}
      updatedAt={t('updatedAt')}
      draftBadge={t('draftBadge')}
      sections={sections}
    />
  );
}
