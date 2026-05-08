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
 * Hard Techno Underground hero — full-bleed portrait at center-right
 * with a diagonal clip-path slice on its leading edge. The artist's
 * display name renders twice:
 *
 *   1. As a "ghost" outlined title in the accent color (massive
 *      `webkitTextStroke` glyphs with transparent fill), layered above
 *      the portrait — the core identity beat.
 *   2. As a solid white wordmark stacked underneath, smaller, holding
 *      the actual semantic <h1>.
 *
 * The portrait is the LCP element — `priority` + server-rendered. A
 * dual gradient overlay (left-to-right + bottom-to-top) keeps the
 * bottom-left text legible against any photo. An ink-splatter SVG sits
 * in the bottom-left as decoration.
 */
export function HeroTitleOverlayBroken({ bundle }: { bundle: EditorBundle }) {
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

  return (
    <header
      className="relative isolate flex min-h-[640px] items-end overflow-hidden border-b border-border bg-bg"
      style={{ minHeight: 'max(640px, 100svh)' }}
    >
      {portraitUrl ? (
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 hidden h-full md:block"
          style={{
            width: '55%',
            clipPath: 'polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        >
          <Image
            src={portraitUrl}
            alt=""
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="(min-width: 768px) 55vw, 0vw"
            className="h-full w-full object-cover"
            style={{ filter: 'contrast(1.1) saturate(0.15)' }}
          />
        </div>
      ) : null}
      {portraitUrl ? (
        <Image
          src={portraitUrl}
          alt={portraitMedia?.alt ?? ''}
          width={portraitWidth}
          height={portraitHeight}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover md:hidden"
          style={{ filter: 'contrast(1.1) saturate(0.15)' }}
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.95) 18%, rgba(0,0,0,0) 60%), linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 55%)',
        }}
      />
      <InkSplatter className="pointer-events-none absolute -left-12 bottom-8 h-72 w-72 text-accent opacity-25 md:h-96 md:w-96" />
      <div className="relative z-10 flex w-full flex-col gap-6 px-6 pb-16 pt-32 md:max-w-[60%] md:px-12 md:pb-24">
        <p className="font-mono text-xs lowercase tracking-widest text-text-muted">
          presskit.pro/{profile.slug}
        </p>
        <p
          aria-hidden="true"
          className="font-display uppercase leading-[0.85] tracking-tight text-accent"
          style={{
            fontSize: 'clamp(4rem, 14vw, 12rem)',
            WebkitTextStroke: '2px currentColor',
            WebkitTextFillColor: 'transparent',
            wordBreak: 'break-word',
          }}
        >
          {displayName}
        </p>
        <h1
          className="font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2.25rem, 6vw, 5rem)' }}
        >
          {displayName}
        </h1>
        {tagline ? (
          <p className="max-w-prose text-sm leading-relaxed text-text-muted md:text-base">
            {tagline}
          </p>
        ) : null}
        {ctaUrl ? (
          <p>
            <a
              href={ctaUrl}
              target={ctaUrl.startsWith('http') ? '_blank' : undefined}
              rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex h-12 items-center bg-accent px-8 text-xs font-bold uppercase tracking-[0.18em] text-accent-contrast transition-colors duration-quick hover:bg-text hover:text-bg"
            >
              {ctaLabel ?? t('ctaUnderground')}
            </a>
          </p>
        ) : null}
      </div>
    </header>
  );
}

function InkSplatter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M40 90c-12-4-22-14-26-26 6 4 14 5 22 4-6-8-9-18-7-28 8 10 18 16 30 18-2-10 0-20 6-28 4 12 12 22 22 28-2-12 2-24 12-32 2 12 8 22 18 28-2-12 4-24 14-30 0 14 6 26 16 34-12 2-22 8-28 18 14 0 26 6 32 18-12-2-24 0-32 8 12 6 20 16 22 28-14-6-28-4-40 4 6 12 4 26-4 36-4-12-14-22-26-26 0 14-8 26-20 32 0-12-6-22-16-28-12 8-26 8-38 0 4-12 14-22 26-26-12-4-22-14-26-26z" />
    </svg>
  );
}
