'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { copy } from '@/lib/marketing/copy';
import type { LiveExample } from '@/lib/marketing/fetch-live-examples';
import { mediaUrl } from '@/lib/media/url';

const AUTOPLAY_INTERVAL_MS = 5_000;

export interface LiveExamplesCarouselProps {
  examples: LiveExample[];
}

export function LiveExamplesCarousel({ examples }: LiveExamplesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (examples.length === 0) return;
    if (typeof window === 'undefined') return;
    // Spec: autoplay only when prefers-reduced-motion is no-preference.
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (reducedMotion?.matches) return;

    const track = trackRef.current;
    if (!track) return;

    const interval = setInterval(() => {
      const card = track.firstElementChild as HTMLElement | null;
      if (!card) return;
      const cardWidth = card.getBoundingClientRect().width + 16; // gap-4
      const max = track.scrollWidth - track.clientWidth;
      const next =
        track.scrollLeft + cardWidth >= max ? 0 : track.scrollLeft + cardWidth;
      track.scrollTo({ left: next, behavior: 'smooth' });
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [examples]);

  if (examples.length === 0) {
    return (
      <section className="border-b border-border px-6 py-20 md:px-12 md:py-32">
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          {copy.examples.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-3xl uppercase tracking-tight md:text-5xl">
          {copy.examples.title}
        </h2>
        <p className="mt-6 max-w-prose text-text-muted">{copy.examples.empty}</p>
      </section>
    );
  }

  return (
    <section className="border-b border-border py-20 md:py-32">
      <div className="px-6 md:px-12">
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          {copy.examples.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-3xl uppercase tracking-tight md:text-5xl">
          {copy.examples.title}
        </h2>
      </div>
      <ul
        ref={trackRef as never}
        aria-label="Exemplos de press kits publicados"
        className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:px-12"
        style={{ scrollbarWidth: 'thin' }}
      >
        {examples.map((ex) => {
          const portraitUrl = ex.portrait ? mediaUrl(ex.portrait) : null;
          return (
            <li key={ex.slug} className="snap-start">
              <Link
                href={`/${ex.slug}`}
                className="group flex w-64 flex-shrink-0 flex-col gap-3 border border-border bg-surface p-3"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-bg">
                  {portraitUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={portraitUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-base group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div aria-hidden="true" className="h-full w-full bg-bg" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-display text-base uppercase tracking-tight">
                    {ex.displayName}
                  </p>
                  <p className="text-xs text-text-muted">presskit.pro/{ex.slug}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
