'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { setLocaleAction } from '@/lib/i18n/server-actions';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/locale';
import { cn } from '@/lib/utils/cn';

export function LocaleToggle() {
  const t = useTranslations('footer.lang');
  const active = useLocale() as SupportedLocale;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [target, setTarget] = useState<SupportedLocale | null>(null);

  function pick(locale: SupportedLocale) {
    if (locale === active || pending) return;
    setTarget(locale);
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
      setTarget(null);
    });
  }

  return (
    <nav
      aria-label={t('label')}
      className="inline-flex items-center gap-3 text-xs uppercase tracking-wider"
    >
      <GlobeIcon />
      <ul className="flex items-center gap-2">
        {SUPPORTED_LOCALES.map((locale, i) => {
          const isActive = locale === active;
          const isTarget = target === locale;
          return (
            <li key={locale} className="flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden="true" className="text-text-muted/60">
                  ·
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => pick(locale)}
                aria-current={isActive ? 'true' : undefined}
                disabled={pending && !isActive}
                lang={locale}
                className={cn(
                  'border-b pb-0.5 transition-colors duration-quick focus-visible:outline-offset-4',
                  isActive
                    ? 'border-accent text-text'
                    : 'border-transparent text-text-muted hover:text-text disabled:opacity-40',
                  isTarget && 'opacity-60',
                )}
              >
                {t(locale)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-text-muted"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0 -18" />
    </svg>
  );
}
