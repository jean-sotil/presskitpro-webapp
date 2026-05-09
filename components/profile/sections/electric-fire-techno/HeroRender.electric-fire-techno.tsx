'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

type ImageMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Electric Fire Techno hero — full-bleed portrait with a glitched RGB
 * chromatic-aberration drop-shadow, gold→amber→fire gradient artist
 * title overlaid at the bottom, decorative cyan lightning bolts and
 * radial fire-edge glows. Per docs/presets/MediakitPRO_template_3.json.
 *
 * Why no `<img>` triple-stack for the chromatic aberration: drop-shadow
 * with red+cyan offsets gives the same RGB-split look at 1× the bytes
 * (next/image already serves WebP/AVIF). Only "almost real" — but close
 * enough at viewing distance and 1/3 the LCP cost.
 *
 * Lightning + fire edges are inline SVG / pseudo-element friendly so a
 * profile that lacks a portrait still feels alive: the gradient title +
 * lightning + fire chrome carry the section even with no Image at all.
 */
export function HeroElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
  const profile = bundle.profile;
  const content = bundle.content;
  const portraitMedia = profile.portrait as ImageMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1600) || 1600;
  const portraitHeight = (portraitMedia?.height ?? 2000) || 2000;

  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  return (
    <header
      data-fire-hero
      className="relative isolate overflow-hidden border-b border-border bg-bg"
    >
      <div className="relative h-[78vh] min-h-[560px] w-full md:h-[88vh]">
        {portraitUrl ? (
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            data-fire-hero-portrait
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-surface to-bg"
          />
        )}
        {/* Bottom dark overlay so the gradient title remains legible
            even on a bright portrait. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg via-bg/70 to-transparent"
        />
        <LightningBolt
          className="pointer-events-none absolute right-[8%] top-[12%] h-20 w-20 rotate-[-12deg] md:h-28 md:w-28"
        />
        <LightningBolt
          variant="small"
          className="pointer-events-none absolute left-[10%] top-[22%] h-10 w-10 rotate-[18deg] opacity-80"
        />
        <LightningBolt
          variant="small"
          className="pointer-events-none absolute right-[18%] bottom-[40%] h-8 w-8 rotate-[-26deg] opacity-70"
        />
        {/* Sci-fi corner metadata strings — purely decorative. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted opacity-60"
        >
          0xFF4500 · 09090F
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 bottom-4 font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted opacity-50"
        >
          {`LAT 23°33'S · LON 46°38'W`}
        </span>
        {/* Title overlay: lifted via z-index above the dark gradient. */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 md:px-12 md:pb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            presskit.pro/{profile.slug}
          </p>
          <h1
            data-fire-hero-title
            className="mt-3 whitespace-pre-line font-display uppercase leading-[0.88] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(3rem, 11vw, 9rem)' }}
          >
            {displayName}
          </h1>
          {ctaUrl ? (
            <p className="mt-8">
              <a
                href={ctaUrl}
                target={ctaUrl.startsWith('http') ? '_blank' : undefined}
                rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                data-fire-cta
                className="inline-flex h-12 items-center border-2 border-accent bg-transparent px-8 text-xs font-bold uppercase tracking-[0.2em] text-text transition-transform duration-quick hover:scale-[1.02]"
              >
                {ctaLabel ?? t('ctaDefault')}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function LightningBolt({
  className,
  variant = 'large',
}: {
  className?: string;
  variant?: 'large' | 'small';
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{
        color: variant === 'large' ? '#00BFFF' : '#FFD700',
        filter: `drop-shadow(0 0 ${variant === 'large' ? '12px' : '8px'} currentColor)`,
      }}
    >
      <path d="M14 2L4 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  );
}
