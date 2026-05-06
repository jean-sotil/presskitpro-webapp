import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { Section } from '@/components/ui/Section';
import { supabaseServer } from '@/lib/supabase/server';

import { CheckoutCard } from './CheckoutCard';

export const dynamic = 'force-dynamic';

const PLAN_LABELS: Record<string, { label: string; priceCopy: string }> = {
  'pro-monthly': {
    label: 'Pro — mensal',
    priceCopy: 'US$ 12 / mês. Sem fidelidade.',
  },
  'pro-annual': {
    label: 'Pro — anual',
    priceCopy: 'US$ 10 / mês, cobrado anualmente. Você economiza 17%.',
  },
  agency: {
    label: 'Agency',
    priceCopy: 'US$ 39 / mês. Até 10 perfis.',
  },
};

type Params = { planId: string };

export const metadata: Metadata = {
  title: 'Confirmar plano — PressKit Pro',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { planId } = await params;
  const meta = PLAN_LABELS[planId];
  if (!meta) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout/${planId}`);

  return (
    <main>
      <Section className="max-w-3xl">
        <CheckoutCard
          planId={planId}
          planLabel={meta.label}
          priceCopy={meta.priceCopy}
        />
      </Section>
    </main>
  );
}
