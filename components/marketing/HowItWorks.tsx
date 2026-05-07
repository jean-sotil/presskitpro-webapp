import { useTranslations } from 'next-intl';

type Step = { n: string; title: string; body: string };

export function HowItWorks() {
  const t = useTranslations('marketing.howItWorks');
  const steps = t.raw('steps') as Step[];
  return (
    <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        {t('eyebrow')}
      </p>
      <h2 className="mt-4 font-display text-3xl uppercase tracking-tight md:text-5xl">
        {t('title')}
      </h2>
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <li
            key={step.n}
            className="flex flex-col gap-3 border border-border bg-surface p-6"
          >
            <span className="font-display text-xs uppercase tracking-widest text-accent">
              {step.n}
            </span>
            <h3 className="font-display text-xl uppercase tracking-tight">
              {step.title}
            </h3>
            <p className="text-sm text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
