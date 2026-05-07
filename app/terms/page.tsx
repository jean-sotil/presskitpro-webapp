import type { Metadata } from 'next';

import { LegalPage } from '@/components/legal/LegalPage';
import { legalCopy } from '@/lib/legal/copy';

export const metadata: Metadata = {
  title: 'Termos de Uso — PressKit Pro',
  description:
    'Termos que regulam o uso da PressKit Pro.',
};

export default function TermsPage() {
  const c = legalCopy.terms;
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
