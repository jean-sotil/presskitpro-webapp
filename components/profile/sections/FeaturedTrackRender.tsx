'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { FeaturedTrackVariant } from '@/lib/presets';

import { FeaturedTrackGlowTrack } from './FeaturedTrackRender.glow-track';
import { LazyIframe } from './LazyIframe';

export function FeaturedTrackRender({
  bundle,
  variant,
}: {
  bundle: EditorBundle;
  variant?: FeaturedTrackVariant;
}) {
  const t = useTranslations('profile.featuredTrack');
  if (variant === 'glow-track') {
    return <FeaturedTrackGlowTrack bundle={bundle} />;
  }
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
