'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

type Service = { title: string; description?: string };

/**
 * [PRESET-NAME] services section template
 *
 * Replace this description with your preset's services design philosophy.
 * Key points to document:
 *   - Card layout (grid, rail, etc.)
 *   - Typography and spacing
 *   - Hover states and transitions
 *   - Responsive behavior
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Extract services array from bundle.content.services
 *   - Return null if no services exist
 *   - Use indexed display for each service
 *   - Include section numbering/marker for consistency
 */
export function Services_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as Service[] | undefined) ?? [];

  if (services.length === 0) return null;

  return (
    <section
      id="servicos"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          03 — {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('heading')}
        </h2>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, idx) => (
            <li
              key={`${service.title}-${idx}`}
              className="border border-border bg-surface p-6 transition-all duration-quick hover:border-text"
            >
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                {String(idx + 1).padStart(2, '0')}
              </p>
              <h3 className="mt-4 font-display uppercase tracking-tight text-text">
                {service.title}
              </h3>
              {service.description ? (
                <p className="mt-3 text-sm leading-relaxed text-text-muted line-clamp-3">
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
