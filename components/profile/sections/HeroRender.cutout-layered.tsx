'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

type PortraitMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Festival Club Orange hero — light cream backdrop with three layered
 * elements:
 *
 *   1. Giant accent-colored display title ("MEDIAKIT" or the artist's
 *      display name) absolutely positioned center, opacity 85%.
 *   2. Artist portrait anchored bottom-center, sitting ON TOP of the
 *      title so the lower half of the type is occluded — creates the
 *      "behind-the-cutout" depth effect even when the user uploads a
 *      regular (non-cutout) portrait.
 *   3. A small "MEDIAKIT" pill badge + handle in the top-left.
 *
 * Layer stacking is z-index based; no clip-path / mask required so it
 * works with any uploaded image.
 */
export function HeroCutoutLayered({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
  const { profile, content } = bundle;
  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;

  const displayName = profile.slug.replace(/-/g, ' ');
  const heroLabel = 'MEDIAKIT';

  return (
    <header
      className="relative isolate flex items-end justify-center overflow-hidden border-b border-border bg-bg"
      style={{ minHeight: 'max(600px, 100svh)' }}
    >
      <div className="absolute left-6 top-6 z-30 flex items-center gap-3 md:left-12 md:top-12">
        <span className="bg-text px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.08em] text-bg">
          {heroLabel}
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-text-muted">
          presskit.pro/{profile.slug}
        </span>
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center font-display uppercase leading-[0.82] tracking-[-0.03em] text-accent"
        style={{
          fontSize: 'clamp(5rem, 22vw, 16rem)',
          opacity: 0.85,
          wordBreak: 'break-word',
        }}
      >
        {displayName}
      </p>
      {portraitUrl ? (
        <div className="relative z-20 w-full">
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="100vw"
            className="block h-auto w-full object-contain"
            // Three CSS techniques stacked for a "fake transparency"
            // that works on arbitrary uploads — no transparent PNG
            // required:
            //
            //   1. `mix-blend-mode: multiply` merges dark pixels into
            //      the cream bg (perfect for dark studio backdrops).
            //   2. `filter: contrast(1.15) saturate(1.1)` pushes the
            //      backdrop toward pure black so the multiply step
            //      removes more of it cleanly.
            //   3. `mask-image: radial-gradient(...)` feathers the
            //      photo's outer edges to fully transparent — even
            //      light/colored backdrops fade into the cream so the
            //      subject reads as a centered silhouette.
            //
            // For pixel-perfect bg removal the artist still has to
            // upload a transparent PNG; this is the no-asset-upload
            // path that handles the common case (dark concert
            // photography on cream press-kit pages).
            style={{
              mixBlendMode: 'multiply',
              filter: 'contrast(1.15) saturate(1.1)',
              maskImage:
                'radial-gradient(ellipse 75% 95% at 50% 55%, black 55%, transparent 95%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 75% 95% at 50% 55%, black 55%, transparent 95%)',
            }}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="relative z-20 w-full bg-surface"
          style={{ aspectRatio: '3 / 4' }}
        />
      )}
      <h1 className="sr-only">{displayName}</h1>
      {tagline || ctaUrl ? (
        <div className="absolute bottom-6 right-6 z-30 flex max-w-md flex-col items-end gap-3 text-right md:bottom-12 md:right-12">
          {tagline ? (
            <p className="text-sm font-semibold text-text-muted md:text-base">
              {tagline}
            </p>
          ) : null}
          {ctaUrl ? (
            <a
              href={ctaUrl}
              target={ctaUrl.startsWith('http') ? '_blank' : undefined}
              rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex h-10 items-center bg-accent px-6 text-[11px] font-bold uppercase tracking-[0.15em] text-accent-contrast transition-colors duration-quick hover:bg-text hover:text-bg"
            >
              {ctaLabel ?? t('ctaUnderground')}
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
