'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Electric Fire Techno services — sharp dark cards with cyan glow
 * border, oversized fire-orange index numbers, and gradient-text
 * titles. Each card sits on a `surface` panel so the cyan halo reads
 * even on the article's near-black bg.
 *
 * Layout: numbered "04 — SERVICES" mono marker, centered display
 * heading, then a 2-up grid of cards. Each card carries its index
 * (01 / 02 / 03) as a giant sci-fi numeral in fire-orange — keeps the
 * "infernal techno booking menu" feel even when descriptions are
 * short (the grid never feels empty).
 */
type Service = { title: string; description?: string };

export function ServicesFireCards({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as Service[] | undefined) ?? [];
  if (services.length === 0) return null;

  return (
    <section
      id="servicos"
      data-fire-cards
      className="relative isolate border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          04 — {t('label')}
        </p>
        <h2
          data-fire-section-title
          className="mt-6 text-center font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
        >
          {t('label')}
        </h2>
        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {services.map((service, idx) => (
            <li
              key={`${service.title}-${idx}`}
              className="group relative overflow-hidden border bg-surface p-6 transition-transform duration-base motion-safe:hover:-translate-y-1"
            >
              <p
                aria-hidden="true"
                className="absolute right-4 top-2 select-none font-display leading-none tracking-tight"
                style={{
                  fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                  color: 'rgba(255, 69, 0, 0.18)',
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </p>
              <p
                className="relative font-mono text-[10px] uppercase tracking-[0.25em]"
                style={{ color: '#FF8C00' }}
              >
                {String(idx + 1).padStart(2, '0')} / SERVICE
              </p>
              <h3 className="relative mt-4 font-display text-2xl uppercase tracking-tight md:text-3xl">
                {service.title}
              </h3>
              {service.description ? (
                <p className="relative mt-4 max-w-prose text-sm leading-[1.7] text-text-muted">
                  {service.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
