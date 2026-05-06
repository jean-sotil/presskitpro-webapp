import Link from 'next/link';

import { copy } from '@/lib/marketing/copy';

export function MarketingHero() {
  return (
    <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        {copy.hero.eyebrow}
      </p>
      <h1 className="mt-6 max-w-4xl font-display text-5xl uppercase tracking-tight md:text-7xl lg:text-8xl">
        {copy.hero.title}
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-text-muted md:text-xl">
        {copy.hero.tagline}
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/signup"
          className="inline-flex h-12 items-center justify-center bg-accent px-8 font-display text-lg uppercase tracking-wider text-accent-contrast transition-colors duration-quick hover:brightness-110 focus-visible:outline-offset-4 active:scale-[0.97] motion-reduce:active:scale-100"
        >
          {copy.hero.cta}
        </Link>
        <span className="text-xs uppercase tracking-wider text-text-muted">
          {copy.hero.ctaHint}
        </span>
      </div>
    </section>
  );
}
