import { useTranslations } from 'next-intl';

export function WhatIsPressKit() {
  const t = useTranslations('marketing.whatIsPressKit');
  return (
    <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        {t('eyebrow')}
      </p>
      <h2 className="mt-4 max-w-3xl font-display text-3xl uppercase tracking-tight md:text-5xl">
        {t('title')}
      </h2>
      <p className="mt-6 max-w-2xl font-editorial text-lg italic text-text-muted md:text-xl">
        {t('body')}
      </p>
    </section>
  );
}
