'use client';

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
 * [PRESET-NAME] hero section template
 *
 * Replace this description with your preset's hero design philosophy.
 * Key points to document:
 *   - Layout (full-bleed, split, centered, etc.)
 *   - Visual hierarchy and key design elements
 *   - Responsive behavior
 *   - Decorative elements and their purpose
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Use `mediaUrl()` to resolve portrait URLs
 *   - Extract data from `bundle.profile` and `bundle.content`
 *   - Include fallback content when media is missing
 *   - Mark decorative elements with `aria-hidden="true"`
 */
export function Hero_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;

  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  return (
    <header className="relative isolate overflow-hidden border-b border-border bg-bg">
      <div className="relative min-h-[640px] md:min-h-[100vh]">
        {/* Background/portrait layer */}
        {portraitUrl ? (
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-surface to-bg" />
        )}

        {/* Content overlay */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-20 md:px-12 md:py-32">
          <h1 className="text-center font-display uppercase leading-none tracking-tight text-text">
            {displayName}
          </h1>
          {tagline ? (
            <p className="mt-4 max-w-prose text-center text-text">{tagline}</p>
          ) : null}
          {ctaLabel && ctaUrl ? (
            <a
              href={ctaUrl}
              className="mt-6 border border-text px-6 py-3 text-sm uppercase tracking-wider hover:bg-text hover:text-bg"
            >
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
