'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { Preset } from '@/lib/presets';

import { ServicesEditorialNightlifeV1 } from './editorial-nightlife-v1/ServicesRender.editorial-nightlife-v1';
import { ServicesElectricFireTechno } from './electric-fire-techno/ServicesRender.electric-fire-techno';
import { ServicesFestivalClubOrange } from './festival-club-orange/ServicesRender.festival-club-orange';
import { ServicesMediakitProV1 } from './mediakit-pro-v1/ServicesRender.mediakit-pro-v1';

export function ServicesRender({
  bundle,
  preset,
}: {
  bundle: EditorBundle;
  preset?: Preset | null;
}) {
  const t = useTranslations('profile.services');

  // Folder-owned preset dispatch.
  if (preset?.id === 'electric-fire-techno') return <ServicesElectricFireTechno bundle={bundle} />;
  if (preset?.id === 'mediakit-pro-v1') return <ServicesMediakitProV1 bundle={bundle} />;
  if (preset?.id === 'festival-club-orange') return <ServicesFestivalClubOrange bundle={bundle} />;
  if (preset?.id === 'editorial-nightlife-v1') return <ServicesEditorialNightlifeV1 bundle={bundle} />;

  // No preset → unstyled "classic" fallback for legacy profiles.
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
