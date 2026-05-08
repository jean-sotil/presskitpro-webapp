'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

import { TrackedPressKitAnchor } from './TrackedPressKitAnchor';

type ImageMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

type GalleryEntry = ImageMedia & { id: number };

/**
 * Festival Club Orange press-kit — split layout.
 *
 * Left: numbered marker + giant "DOWNLOAD PRESSKIT" title + a wiggling
 * retro cursor SVG that points at the accent CTA. Pure festival-poster
 * energy: vintage hand-pointer + giant sans-serif type.
 *
 * Right: up to three artist photos arranged scatter-overlapping. The
 * photos pull from `gallery[]` first (the artist's curated press
 * shots), falling back to the portrait + variants. Each tile rotates
 * a few degrees to break the grid feel.
 *
 * Dark `#1A1A1A` band — second alternating-section beat in the
 * festival rhythm (after the gallery's `#0E0E0E` band).
 */
export function PressKitLinkCursorCta({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
  const tProviders = useTranslations('profile.pressKit.providers');
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  if (!url) return null;
  const health = (bundle.profile.pressKitHealthStatus ?? 'unknown') as
    | 'unknown'
    | 'healthy'
    | 'warning'
    | 'broken';
  if (health === 'broken') return null;
  const provider = (bundle.profile.pressKitProvider ?? 'unknown') as PressKitProvider;
  const slug = String(bundle.profile.slug ?? '');
  const badge =
    provider === 'unknown' || provider === 'other'
      ? null
      : (() => {
          try { return tProviders(provider); } catch { return null; }
        })();

  const photos = pickPhotos(bundle);

  return (
    <section
      id="press-kit"
      className="overflow-hidden border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            06 — {t('pressKit.label')}
          </p>
          <h2
            className="mt-6 whitespace-pre-line font-display uppercase leading-[0.9] tracking-[-0.01em] text-text"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {t('pressKit.heading')}
          </h2>
          {badge ? (
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-text-muted">
              {badge}
            </p>
          ) : null}
          <div className="mt-10 flex items-center gap-4">
            <CursorPointer className="h-10 w-10 -rotate-12 text-accent motion-safe:animate-[cursor-wiggle_1.5s_ease-in-out_infinite]" />
            <TrackedPressKitAnchor
              href={url}
              provider={provider}
              profileSlug={slug}
              className="inline-flex h-12 items-center bg-accent px-8 text-xs font-bold uppercase tracking-[0.15em] text-accent-contrast transition-colors duration-quick hover:bg-text hover:text-bg"
            >
              {t('ctaUnderground')}
            </TrackedPressKitAnchor>
          </div>
        </div>
        <ScatteredPhotos photos={photos} />
      </div>
    </section>
  );
}

function pickPhotos(bundle: EditorBundle): ImageMedia[] {
  const out: ImageMedia[] = [];
  const gallery = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  if (Array.isArray(gallery)) {
    for (const entry of gallery) {
      if (typeof entry === 'object' && entry && 'bucket' in entry) {
        out.push(entry);
        if (out.length >= 3) break;
      }
    }
  }
  if (out.length < 3) {
    const portrait = bundle.profile.portrait as ImageMedia | null | undefined;
    if (portrait) {
      while (out.length < 3) out.push(portrait);
    }
  }
  return out.slice(0, 3);
}

function ScatteredPhotos({ photos }: { photos: ImageMedia[] }) {
  if (photos.length === 0) return null;
  const layouts = [
    { rotate: '-4deg', translate: '0% 0%', z: 30 },
    { rotate: '6deg',  translate: '20% -8%', z: 20 },
    { rotate: '-2deg', translate: '40% 6%',  z: 10 },
  ];
  return (
    <div className="relative aspect-[4/3] w-full">
      {photos.map((photo, idx) => {
        const cfg = layouts[idx]!;
        const src = mediaUrl({ bucket: photo.bucket, path: photo.path });
        if (!src) return null;
        const w = (photo.width ?? 800) || 800;
        const h = (photo.height ?? 1000) || 1000;
        return (
          <div
            key={`${photo.bucket}-${photo.path}-${idx}`}
            className="absolute top-0 overflow-hidden border-2 border-border"
            style={{
              left: cfg.translate.split(' ')[0],
              top: cfg.translate.split(' ')[1],
              transform: `rotate(${cfg.rotate})`,
              width: '60%',
              zIndex: cfg.z,
            }}
          >
            <Image
              src={src}
              alt={photo.alt ?? ''}
              width={w}
              height={h}
              sizes="(min-width: 768px) 30vw, 60vw"
              className="block h-auto w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}

function CursorPointer({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M30 8v30" />
      <path d="M20 38c0-3 4-6 12-6s12 3 12 6v18c0 3-3 4-6 4H26c-3 0-6-1-6-4z" fill="currentColor" stroke="none" opacity="0.95" />
      <path d="M26 42v14M30 42v14M34 42v14M38 42v14" stroke="#1A1A1A" strokeWidth="1.5" />
    </svg>
  );
}
