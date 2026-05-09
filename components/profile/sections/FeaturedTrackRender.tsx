'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { Preset } from '@/lib/presets';

import { FeaturedTrackEditorialNightlifeV1 } from './editorial-nightlife-v1/FeaturedTrackRender.editorial-nightlife-v1';
import { FeaturedTrackElectricFireTechno } from './electric-fire-techno/FeaturedTrackRender.electric-fire-techno';
import { FeaturedTrackFestivalClubOrange } from './festival-club-orange/FeaturedTrackRender.festival-club-orange';
import { FeaturedTrackMediakitProV1 } from './mediakit-pro-v1/FeaturedTrackRender.mediakit-pro-v1';
import { LazyIframe } from './LazyIframe';

export function FeaturedTrackRender({
  bundle,
  preset,
}: {
  bundle: EditorBundle;
  preset?: Preset | null;
}) {
  const t = useTranslations('profile.featuredTrack');

  // Folder-owned preset dispatch.
  if (preset?.id === 'electric-fire-techno') return <FeaturedTrackElectricFireTechno bundle={bundle} />;
  if (preset?.id === 'mediakit-pro-v1') return <FeaturedTrackMediakitProV1 bundle={bundle} />;
  if (preset?.id === 'festival-club-orange') return <FeaturedTrackFestivalClubOrange bundle={bundle} />;
  if (preset?.id === 'editorial-nightlife-v1') return <FeaturedTrackEditorialNightlifeV1 bundle={bundle} />;

  // No preset → unstyled "classic" fallback for legacy profiles.
  const track = bundle.featuredTrack as
    | { url?: string; oembedHtml?: string | null }
    | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;
  if (!url) return null;

  return (
    <section id="faixa" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">
        {t('label')}
      </h2>
      <div className="mt-6">
        {oembedHtml ? (
          <LazyIframe html={oembedHtml} />
        ) : (
          <p className="break-all text-sm text-text-muted">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {url}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
