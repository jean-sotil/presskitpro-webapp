'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

type Service = { title: string; description?: string };

/**
 * Festival Club Orange services — three white cards on the preset's
 * cream backdrop, each with a heavy 6px accent left-bar that ties the
 * card to the orange brand color without breaking the WCAG accent-on-
 * cream contrast rule (the bar is a visual, not a text element).
 *
 * Hover state inverts the card: bg flips to dark, text to white, the
 * orange bar grows to a full-width top-border. The flip gives this
 * preset a kinetic, festival-program feel rather than the brutalist
 * static cards of the techno preset's `rail-cards`.
 *
 * 3-column grid on `md+`, single-column stack on mobile (no horizontal
 * scroll — the festival preset's body is in light theme so a snap-rail
 * would feel out of place against the cream page rhythm).
 */
export function ServicesOrangeCards({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as Service[] | undefined) ?? [];
  if (services.length === 0) return null;
  const padded = String(services.length).padStart(2, '0');

  return (
    <section
      id="servicos"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <header className="mb-10 flex items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            03 — {t('label')}
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
      <ul className="grid gap-4 md:grid-cols-3">
        {services.map((service, idx) => (
          <li
            key={`${service.title}-${idx}`}
            className="group relative flex flex-col border-2 border-accent bg-transparent p-8 transition-colors duration-quick hover:bg-accent"
          >
            <p className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-accent transition-colors duration-quick group-hover:text-accent-contrast">
              {String(idx + 1).padStart(2, '0')}
            </p>
            <h3
              className="mt-6 font-display uppercase leading-tight tracking-tight text-text transition-colors duration-quick group-hover:text-accent-contrast"
              style={{ fontSize: 'clamp(1.25rem, 2vw, 1.625rem)' }}
            >
              {service.title}
            </h3>
            {service.description ? (
              <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-text-muted transition-colors duration-quick group-hover:text-accent-contrast/85">
                {service.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
