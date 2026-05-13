'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('dashboard.trialBanner');
  const status = getTrialStatus({ user, now: new Date() });

  if (status.kind === 'paid' || status.kind === 'pre-trial') return null;

  if (status.kind === 'expired') {
    return (
      <aside role="status" className="border border-border bg-bg p-6 text-text">
        <p className="font-display text-xs uppercase tracking-widest">{t('expired.label')}</p>
        <p className="mt-3 max-w-prose text-base">{t('expired.message')}</p>
        <Link
          href="/checkout/pro-monthly"
          className="mt-6 inline-flex h-11 items-center bg-text px-5 font-display text-xs uppercase tracking-widest text-bg"
        >
          {t('expired.cta')}
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
        {t('active.label')}
      </p>
      <p className="mt-3 max-w-prose text-base text-text">
        {urgent
          ? t('active.messageUrgent', {
              days: status.daysRemaining,
              plural: status.daysRemaining === 1 ? '' : 's',
            })
          : t('active.messageActive', { days: status.daysRemaining })}
      </p>
      <Link
        href="/checkout/pro-monthly"
        className={`mt-6 inline-flex h-11 items-center px-5 font-display text-xs uppercase tracking-widest ${urgent ? 'bg-text text-bg' : 'border border-border text-text hover:bg-bg'}`}
      >
        {t('active.cta')}
      </Link>
    </aside>
  );
}
