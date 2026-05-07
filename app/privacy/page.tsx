import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LegalPage } from '@/components/legal/LegalPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return { title: `${t('title')} — PressKit Pro` };
}

type LegalSection = { heading: string; body: string };

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
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
