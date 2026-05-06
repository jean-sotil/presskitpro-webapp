import type { Metadata } from 'next';
import Link from 'next/link';

import { Section } from '@/components/ui/Section';
import { SectionMarker } from '@/components/atmosphere/SectionMarker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Checkout cancelado — PressKit Pro',
  robots: { index: false, follow: false },
};

export default function CheckoutCanceledPage() {
  return (
    <main id="main">
      <Section>
        <SectionMarker number={1} label="CHECKOUT CANCELADO" />
        <h1 className="mt-4 max-w-2xl font-display text-5xl uppercase tracking-tight md:text-7xl">
          Sem cobrança. Quando quiser, é só voltar.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-text-muted">
          Seu período de avaliação continua rodando normalmente. Você pode
          retomar a assinatura na página de planos a qualquer momento.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center bg-text px-6 font-display text-xs uppercase tracking-widest text-bg"
          >
            Ver planos
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center border border-border px-6 font-display text-xs uppercase tracking-widest text-text hover:bg-bg"
          >
            Voltar ao painel
          </Link>
        </div>
      </Section>
    </main>
  );
}
