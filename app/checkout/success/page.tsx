import type { Metadata } from 'next';
import Link from 'next/link';

import { Section } from '@/components/ui/Section';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plano ativado — PressKit Pro',
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <main id="main">
      <Section>
        <SectionMarker number={1} label="PLANO ATIVADO" />
        <h1 className="mt-4 max-w-2xl font-display text-5xl uppercase tracking-tight md:text-7xl">
          Pronto. Seu plano está ativo.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-text-muted">
          O pagamento foi confirmado e o seu press kit segue público sem
          interrupções. Continue de onde parou.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center bg-text px-6 font-display text-xs uppercase tracking-widest text-bg"
          >
            Ir para o painel
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center border border-border px-6 font-display text-xs uppercase tracking-widest text-text hover:bg-bg"
          >
            Ver planos
          </Link>
        </div>
      </Section>
    </main>
  );
}
