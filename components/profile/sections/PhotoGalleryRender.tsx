'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';
import type { GalleryVariant } from '@/lib/presets';

import { PhotoGalleryEditorialGrid } from './PhotoGalleryRender.editorial-grid';

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
  decorative?: boolean;
};

type GalleryLayout = 'mosaic' | 'uniform-grid' | 'carousel';

export function PhotoGalleryRender({
  bundle,
  variant,
}: {
  bundle: EditorBundle;
  variant?: GalleryVariant;
}) {
  const t = useTranslations('profile.gallery');
  if (variant === 'editorial-grid') {
    return <PhotoGalleryEditorialGrid bundle={bundle} />;
  }
  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const items = Array.isArray(raw)
    ? raw.filter((entry): entry is GalleryEntry => typeof entry === 'object' && entry !== null && 'id' in entry)
    : [];
  if (items.length === 0) return null;

  const fallback = (bundle.theme?.galleryLayout as GalleryLayout | undefined) ?? 'mosaic';
  const layout: GalleryLayout = variant ?? fallback;

  return (
    <section id="galeria" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      <ul className={gridClassFor(layout)}>
        {items.map((item) => {
          const src = mediaUrl({ bucket: item.bucket, path: item.path });
          if (!src) return null;
          const alt = item.decorative ? '' : item.alt ?? '';
          return (
            <li key={item.id} className={itemClassFor(layout)}>
              <Image
                src={src}
                alt={alt}
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function gridClassFor(layout: GalleryLayout): string {
  switch (layout) {
    case 'uniform-grid':
      return 'mt-6 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4';
    case 'carousel':
      // No-JS horizontal scroll. Task-19 polish replaces with a real carousel.
      return 'mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2';
    case 'mosaic':
    default:
      return 'mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:auto-rows-[200px] md:gap-4';
  }
}

function itemClassFor(layout: GalleryLayout): string {
  // `relative` is required so the inner `<Image fill>` positions against
  // the item box. `aspect-*` classes give that box intrinsic height.
  switch (layout) {
    case 'uniform-grid':
      return 'relative aspect-square overflow-hidden';
    case 'carousel':
      return 'relative aspect-[3/4] w-64 flex-shrink-0 snap-start overflow-hidden';
    case 'mosaic':
    default:
      // Every 5th item spans 2 columns + 2 rows for visual rhythm.
      return 'relative aspect-square overflow-hidden md:[&:nth-child(5n+1)]:row-span-2 md:[&:nth-child(5n+1)]:col-span-2 md:[&:nth-child(5n+1)]:aspect-auto';
  }
}
