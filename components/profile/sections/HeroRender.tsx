'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';
import type { HeroVariant } from '@/lib/presets';

import { HeroCutoutLayered } from './HeroRender.cutout-layered';
import { HeroTitleOverlayBroken } from './HeroRender.title-overlay-broken';

type HeroStyle = 'full-bleed-portrait' | 'split-portrait-text' | 'centered-logo';

type PortraitMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

export function HeroRender({
  bundle,
  variant,
}: {
  bundle: EditorBundle;
  /** Preset-driven variant. When set, wins over the legacy `heroStyle`
   *  field — task-35 plumbs this from `ProfileRenderer`. */
  variant?: HeroVariant;
}) {
  const t = useTranslations('profile');
  if (variant === 'title-overlay-broken') {
    return <HeroTitleOverlayBroken bundle={bundle} />;
  }
  if (variant === 'cutout-layered') {
    return <HeroCutoutLayered bundle={bundle} />;
  }
  const { profile, content } = bundle;
  const fallback = (bundle.theme?.heroStyle as HeroStyle | undefined) ?? 'full-bleed-portrait';
  const style: HeroStyle = variant ?? fallback;
  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const logoMedia = profile.logo as
    | { bucket: string; path: string; alt?: string; width?: number | null; height?: number | null }
    | null
    | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const logoUrl = mediaUrl(logoMedia ?? null);
  // Width/height come from `Media`'s exif fields when available; fall
  // back to a 3:4 portrait aspect when missing so `next/image` still
  // reserves space and avoids CLS.
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;
  // Logos vary wildly in aspect; default to a horizontal 3:1 box when
  // the upstream Media doc lacks dimensions. CSS sizes the rendered img.
  const logoWidth = (logoMedia?.width ?? 480) || 480;
  const logoHeight = (logoMedia?.height ?? 160) || 160;

  const displayName = profile.slug.replace(/-/g, ' ');

  if (style === 'centered-logo') {
    return (
      <header className="flex flex-col items-center border-b border-border px-6 py-16 text-center md:px-12 md:py-24">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={logoMedia?.alt ?? ''}
            width={logoWidth}
            height={logoHeight}
            priority
            sizes="(min-width: 768px) 256px, 192px"
            className="h-24 w-auto md:h-32"
          />
        ) : (
          <h1 className="font-display text-5xl uppercase tracking-tight md:text-7xl">
            {displayName}
          </h1>
        )}
        {tagline ? (
          <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
        ) : null}
        {ctaUrl ? <CtaButton url={ctaUrl} label={ctaLabel ?? t('ctaDefault')} /> : null}
      </header>
    );
  }

  if (style === 'split-portrait-text') {
    return (
      <header className="grid gap-8 border-b border-border px-6 py-16 md:grid-cols-2 md:px-12 md:py-24">
        {portraitUrl ? (
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-[3/4] w-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="aspect-[3/4] w-full bg-surface" />
        )}
        <div className="flex flex-col justify-center">
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
          <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-6xl">
            {displayName}
          </h1>
          {tagline ? (
            <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
          ) : null}
          {ctaUrl ? <CtaButton url={ctaUrl} label={ctaLabel ?? t('ctaDefault')} /> : null}
        </div>
      </header>
    );
  }

  // Default: full-bleed-portrait.
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
        {ctaUrl ? <CtaButton url={ctaUrl} label={ctaLabel ?? t('ctaDefault')} /> : null}
      </div>
    </header>
  );
}

function CtaButton({ url, label }: { url: string; label: string }) {
  return (
    <p className="mt-8">
      <a
        href={url}
        target={url.startsWith('http') ? '_blank' : undefined}
        rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="inline-flex h-12 items-center border border-accent bg-accent px-6 text-sm uppercase tracking-wider text-accent-contrast"
      >
        {label}
      </a>
    </p>
  );
}
