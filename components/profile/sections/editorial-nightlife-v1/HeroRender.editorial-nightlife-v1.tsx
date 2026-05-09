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

type LogoMedia = PortraitMedia;

/**
 * Editorial Nightlife v1 hero — the "full-bleed-portrait" classic
 * extracted from the root dispatcher's default branch when this
 * preset moved to folder-owned dispatch. Portrait runs across the top
 * at 70vh, then the logo, slug, display title, optional tagline and
 * CTA stack underneath. Theme tokens carry the entire color story —
 * no preset-specific decoration.
 */
export function HeroEditorialNightlifeV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
  const { profile, content } = bundle;
  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const logoMedia = profile.logo as LogoMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const logoUrl = mediaUrl(logoMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;
  const logoWidth = (logoMedia?.width ?? 480) || 480;
  const logoHeight = (logoMedia?.height ?? 160) || 160;

  const displayName = profile.slug.replace(/-/g, ' ');

  return (
    <header className="relative border-b border-border">
      {portraitUrl ? (
        <Image
          src={portraitUrl}
          alt={portraitMedia?.alt ?? ''}
          width={portraitWidth}
          height={portraitHeight}
          priority
          sizes="100vw"
          className="h-[70vh] w-full object-cover"
        />
      ) : null}
      <div className="px-6 py-16 md:px-12 md:py-24">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={logoMedia?.alt ?? ''}
            width={logoWidth}
            height={logoHeight}
            sizes="192px"
            className="mb-6 h-12 w-auto"
          />
        ) : null}
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          presskit.pro/{profile.slug}
        </p>
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-7xl">
          {displayName}
        </h1>
        {tagline ? (
          <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
        ) : null}
        {ctaUrl ? (
          <p className="mt-8">
            <a
              href={ctaUrl}
              target={ctaUrl.startsWith('http') ? '_blank' : undefined}
              rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex h-12 items-center border border-accent bg-accent px-6 text-sm uppercase tracking-wider text-accent-contrast"
            >
              {ctaLabel ?? t('ctaDefault')}
            </a>
          </p>
        ) : null}
      </div>
    </header>
  );
}
