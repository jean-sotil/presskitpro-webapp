import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Section } from '@/components/ui/Section';
import { payload } from '@/lib/payload';
import { supabaseServer } from '@/lib/supabase/server';

import { PrivacyForms } from './PrivacyForms';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacySettings');
  return { title: `${t('title')} — PressKit Pro`, robots: { index: false } };
}

export default async function PrivacySettingsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) {
    redirect('/login?next=/dashboard/settings/privacy');
  }

  const p = await payload();
  const userResult = await p.find({
    collection: 'users',
    where: { supabaseUserId: { equals: supabaseUser.id } },
    limit: 1,
    depth: 0,
  });
  const userDoc = userResult.docs[0];
  const email =
    typeof userDoc?.email === 'string' ? userDoc.email : supabaseUser.email ?? '';

  const t = await getTranslations('privacySettings');

  return (
    <main id="main">
      <Section className="max-w-4xl">
        <h1 className="font-display text-4xl uppercase tracking-tight md:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-text-muted md:text-base">
          {t('intro')}
        </p>
        <div className="mt-10">
          <PrivacyForms userEmail={email} />
        </div>
      </Section>
    </main>
  );
}
