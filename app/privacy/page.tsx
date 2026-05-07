import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { legalCopy } from '@/lib/legal/copy';

export const metadata: Metadata = {
  title: 'Política de Privacidade — PressKit Pro',
  description:
    'Como a PressKit Pro coleta, usa e protege seus dados pessoais.',
};

export default function PrivacyPage() {
  const c = legalCopy.privacy;
  return (
    <LegalPage
      title={c.title}
      intro={c.intro}
      updatedLabel={c.updatedLabel}
      updatedAt={c.updatedAt}
      draftBadge={c.draftBadge}
      sections={c.sections}
    />
  );
}
