import Link from 'next/link';

import { copy } from '@/lib/marketing/copy';

export function PricingTeaser() {
  return (
    <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        {copy.pricingTeaser.eyebrow}
      </p>
      <div className="mt-8 grid gap-8 border border-border bg-surface p-8 md:grid-cols-[1fr_auto] md:p-12">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl uppercase tracking-tight md:text-5xl">
            {copy.pricingTeaser.title}
          </h2>
          <p className="max-w-xl text-text-muted">{copy.pricingTeaser.body}</p>
        </div>
        <div className="flex items-end md:items-center">
          <Link
            href={copy.pricingTeaser.href}
            className="inline-flex h-12 items-center border border-accent px-8 font-display text-sm uppercase tracking-wider text-accent transition-colors duration-quick hover:bg-accent hover:text-accent-contrast focus-visible:outline-offset-4"
          >
            {copy.pricingTeaser.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
