'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { ServicesVariant } from '@/lib/presets';

import { ServicesFireCards } from './ServicesRender.fire-cards';
import { ServicesOrangeCards } from './ServicesRender.orange-cards';
import { ServicesRailCards } from './ServicesRender.rail-cards';

export function ServicesRender({
  bundle,
  variant,
}: {
  bundle: EditorBundle;
  variant?: ServicesVariant;
}) {
  const t = useTranslations('profile.services');
  if (variant === 'rail-cards') {
    return <ServicesRailCards bundle={bundle} />;
  }
  if (variant === 'orange-cards') {
    return <ServicesOrangeCards bundle={bundle} />;
  }
  if (variant === 'fire-cards') {
    return <ServicesFireCards bundle={bundle} />;
  }
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
