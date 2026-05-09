'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Editorial Nightlife v1 services — the "classic" 2-up grid
 * extracted from the root dispatcher's default branch. Each service
 * is a thin-bordered card with a display title and muted description.
 */
export function ServicesEditorialNightlifeV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.services');
  const services = (bundle.content?.services as
    | Array<{ title: string; description?: string }>
    | undefined) ?? [];
  if (services.length === 0) return null;
  return (
    <section id="servicos" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {services.map((s, i) => (
          <li key={`${s.title}-${i}`} className="border border-border p-4">
            <p className="font-display uppercase tracking-wide">{s.title}</p>
            {s.description ? (
              <p className="mt-2 text-sm text-text-muted">{s.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
