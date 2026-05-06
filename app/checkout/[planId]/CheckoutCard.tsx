'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { startCheckout } from './actions';

type Props = {
  planId: string;
  planLabel: string;
  priceCopy: string;
};

export function CheckoutCard({ planId, planLabel, priceCopy }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(planId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Stripe Checkout lives off-domain — push instead of using a server
      // redirect so the action's pending state stays attached to the click.
      router.push(result.redirectUrl);
    });
  }

  return (
    <div className="border border-border bg-surface p-8 md:p-12">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        Plano selecionado
      </p>
      <h1 className="mt-4 font-display text-4xl uppercase tracking-tight md:text-5xl">
        {planLabel}
      </h1>
      <p className="mt-3 text-lg text-text-muted">{priceCopy}</p>

      <ul className="mt-8 space-y-3 text-sm text-text-muted">
        <li>• Pagamento seguro via Stripe Checkout.</li>
        <li>• Cobrança a partir de hoje — sem dias adicionais de teste.</li>
        <li>• Cancele a qualquer momento direto pelo painel.</li>
      </ul>

      {error ? (
        <p
          role="alert"
          className="mt-6 border border-border bg-bg p-4 text-sm text-text"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="inline-flex h-12 items-center justify-center bg-text px-6 font-display text-xs uppercase tracking-widest text-bg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Redirecionando…' : 'Continuar para o checkout seguro'}
        </button>
        <Link
          href="/pricing"
          className="inline-flex h-12 items-center justify-center border border-border px-6 font-display text-xs uppercase tracking-widest text-text hover:bg-bg"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
