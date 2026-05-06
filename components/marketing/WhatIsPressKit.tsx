import { copy } from '@/lib/marketing/copy';

export function WhatIsPressKit() {
  return (
    <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        {copy.whatIsPressKit.eyebrow}
      </p>
      <h2 className="mt-4 max-w-3xl font-display text-3xl uppercase tracking-tight md:text-5xl">
        {copy.whatIsPressKit.title}
      </h2>
      <p className="mt-6 max-w-2xl font-editorial text-lg italic text-text-muted md:text-xl">
        {copy.whatIsPressKit.body}
      </p>
    </section>
  );
}
