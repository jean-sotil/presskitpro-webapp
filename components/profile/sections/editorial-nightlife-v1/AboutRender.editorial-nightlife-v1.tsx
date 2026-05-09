'use client';

import { useTranslations } from 'next-intl';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * Editorial Nightlife v1 biography — the "classic" rendering
 * extracted from the root dispatcher's default branch. Single-column
 * label + tagline + rich-text bio, no preset-specific chrome. Theme
 * tokens carry the full visual.
 */
export function AboutEditorialNightlifeV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
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
