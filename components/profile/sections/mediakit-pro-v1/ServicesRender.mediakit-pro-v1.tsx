'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

type Service = { title: string; description?: string };

/**
 * Hard Techno Underground services — numbered "set-list" cards.
 *
 * Mobile: a horizontal snap-rail (each card 80vw, snap-start) so the
 * cards feel like flipping through a printed program. The accent-colored
 * index numbers anchor the eye like setlist tracks.
 *
 * Desktop (md+): 3-column grid that wraps to additional rows when there
 * are more than three services. Avoids forcing horizontal scroll on a
 * mouse where it's awkward.
 *
 * Each card: pure-black surface, 1px border that flips to accent on
 * hover, oversized index in the accent color, uppercase display title,
 * muted description with a soft 4-line clamp so heights stay close.
 */
export function ServicesMediakitProV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as Service[] | undefined) ?? [];
  if (services.length === 0) return null;
  const padded = String(services.length).padStart(2, '0');

  return (
    <section
      id="servicos"
      className="border-b border-border bg-surface px-6 py-20 md:px-12 md:py-32"
    >
      <header className="mb-10 flex items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            {t('label')}
          </p>
          <h2
            className="mt-6 font-display uppercase leading-none tracking-tight text-text"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {t('heading')}
          </h2>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted md:block">
          {t('setsLabel', { count: padded })}
        </p>
      </header>
      <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {services.map((service, idx) => (
          <li
            key={`${service.title}-${idx}`}
            className="group flex w-[80vw] shrink-0 snap-start flex-col border border-border bg-bg p-8 transition-colors duration-quick hover:border-accent md:w-auto md:shrink"
          >
            <p
              aria-hidden="true"
              className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-accent"
            >
              {String(idx + 1).padStart(2, '0')}
            </p>
            <h3
              className="mt-6 font-display uppercase leading-tight tracking-tight text-text"
              style={{ fontSize: 'clamp(1.25rem, 2vw, 1.625rem)' }}
            >
              {service.title}
            </h3>
            {service.description ? (
              <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-text-muted">
                {service.description}
              </p>
            ) : null}
            <span
              aria-hidden="true"
              className="mt-auto block h-px w-12 bg-border transition-colors duration-quick group-hover:bg-accent group-hover:w-full"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
