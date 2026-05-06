import Link from 'next/link';

import { getTrialStatus, type TrialUser } from '@/lib/billing/trial-status';

/**
 * Dashboard trial banner — countdown + CTA. Phases:
 *
 *   - pre-trial : no profiles yet; banner is hidden (the dashboard
 *     already nudges to onboarding).
 *   - active 3+ days: neutral countdown.
 *   - active <=2 days: warning palette (last-chance nudge).
 *   - expired : "trial encerrado" + CTA.
 *   - paid    : hidden.
 */
export function TrialBanner({ user }: { user: TrialUser }) {
  const status = getTrialStatus({ user, now: new Date() });

  if (status.kind === 'paid' || status.kind === 'pre-trial') return null;

  if (status.kind === 'expired') {
    return (
      <aside
        role="status"
        className="border border-border bg-bg p-6 text-text"
      >
        <p className="font-display text-xs uppercase tracking-widest">
          Período de teste encerrado
        </p>
        <p className="mt-3 max-w-prose text-base">
          Seu press kit foi pausado automaticamente. Reative a assinatura
          para voltar ao ar — o link público continua reservado.
        </p>
        <Link
          href="/checkout/pro-monthly"
          className="mt-6 inline-flex h-11 items-center bg-text px-5 font-display text-xs uppercase tracking-widest text-bg"
        >
          Reativar agora
        </Link>
      </aside>
    );
  }

  const urgent = status.daysRemaining <= 2;
  return (
    <aside
      role="status"
      className={`border p-6 ${urgent ? 'border-border bg-bg' : 'border-border bg-surface'}`}
    >
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        Período de teste
      </p>
      <p className="mt-3 max-w-prose text-base text-text">
        {urgent
          ? `Restam ${status.daysRemaining} dia${status.daysRemaining === 1 ? '' : 's'}. Garanta seu plano antes que o press kit pause.`
          : `Você tem ${status.daysRemaining} dias gratuitos. Convertendo agora, sua URL e seu conteúdo permanecem ativos.`}
      </p>
      <Link
        href="/checkout/pro-monthly"
        className={`mt-6 inline-flex h-11 items-center px-5 font-display text-xs uppercase tracking-widest ${urgent ? 'bg-text text-bg' : 'border border-border text-text hover:bg-bg'}`}
      >
        Continuar para o checkout
      </Link>
    </aside>
  );
}
