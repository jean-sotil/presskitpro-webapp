'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
  decorative?: boolean;
};

/**
 * Editorial Nightlife v1 gallery — the "mosaic" rendering extracted
 * from the root dispatcher's default branch. Asymmetric grid where
 * every 5th item spans 2 columns + 2 rows for visual rhythm.
 */
export function PhotoGalleryEditorialNightlifeV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.gallery');
  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const items = Array.isArray(raw)
    ? raw.filter(
        (entry): entry is GalleryEntry =>
          typeof entry === 'object' && entry !== null && 'id' in entry,
      )
    : [];
  if (items.length === 0) return null;

  return (
    <section id="galeria" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      <ul className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:auto-rows-[200px] md:gap-4">
        {items.map((item) => {
          const src = mediaUrl({ bucket: item.bucket, path: item.path });
          if (!src) return null;
          const alt = item.decorative ? '' : item.alt ?? '';
          return (
            <li
              key={item.id}
              // Every 5th item spans 2 columns + 2 rows for visual rhythm.
              className="relative aspect-square overflow-hidden md:[&:nth-child(5n+1)]:row-span-2 md:[&:nth-child(5n+1)]:col-span-2 md:[&:nth-child(5n+1)]:aspect-auto"
            >
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
