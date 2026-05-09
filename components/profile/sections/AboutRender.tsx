'use client';

import { useTranslations } from 'next-intl';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';
import type { Preset } from '@/lib/presets';

import { AboutEditorialNightlifeV1 } from './editorial-nightlife-v1/AboutRender.editorial-nightlife-v1';
import { AboutElectricFireTechno } from './electric-fire-techno/AboutRender.electric-fire-techno';
import { AboutFestivalClubOrange } from './festival-club-orange/AboutRender.festival-club-orange';
import { AboutMediakitProV1 } from './mediakit-pro-v1/AboutRender.mediakit-pro-v1';

export function AboutRender({
  bundle,
  preset,
}: {
  bundle: EditorBundle;
  preset?: Preset | null;
}) {
  const t = useTranslations('profile.about');

  // Folder-owned preset dispatch.
  if (preset?.id === 'electric-fire-techno') return <AboutElectricFireTechno bundle={bundle} />;
  if (preset?.id === 'mediakit-pro-v1') return <AboutMediakitProV1 bundle={bundle} />;
  if (preset?.id === 'festival-club-orange') return <AboutFestivalClubOrange bundle={bundle} />;
  if (preset?.id === 'editorial-nightlife-v1') return <AboutEditorialNightlifeV1 bundle={bundle} />;

  // No preset → unstyled "classic" fallback for legacy profiles.
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);
  if (!tagline && !hasBio) return null;
  return (
    <section id="sobre" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      {tagline ? <p className="mt-4 max-w-prose text-text">{tagline}</p> : null}
      {hasBio ? (
        <RichTextRender state={bio} className="mt-6 max-w-prose text-text" />
      ) : null}
    </section>
  );
}
