'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

import { GalleryLightbox, type LightboxItem } from '../GalleryLightbox';

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
  decorative?: boolean;
  width?: number | null;
  height?: number | null;
};

/**
 * Hard Techno Underground gallery — uniform editorial portrait grid.
 *
 * Every tile is the same 4:5 portrait box. Two columns on mobile, three
 * on `md+`, with a 2px gap that reads as a precise mortar line between
 * frames (not a soft margin). The grid always forms a perfect rectangle:
 * "beautiful and symmetric" reads first, "underground" reads through
 * the accent-dodge hover and the darker `bg-surface` backdrop.
 *
 * Tiles delegate to `<GalleryLightbox>` so the click experience (full-
 * screen viewer, ESC, arrow nav, focus restore) is identical across
 * gallery variants. Server resolves `mediaUrl()` so the Supabase URL
 * never reaches the client bundle.
 */
export function PhotoGalleryMediakitProV1({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.gallery');
  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const entries = Array.isArray(raw)
    ? raw.filter(
        (entry): entry is GalleryEntry =>
          typeof entry === 'object' && entry !== null && 'id' in entry,
      )
    : [];
  const items: LightboxItem[] = entries.flatMap((entry) => {
    const src = mediaUrl({ bucket: entry.bucket, path: entry.path });
    if (!src) return [];
    return [
      {
        id: entry.id,
        src,
        alt: entry.decorative ? '' : entry.alt ?? '',
        width: entry.width ?? null,
        height: entry.height ?? null,
      },
    ];
  });
  if (items.length === 0) return null;

  return (
    <section
      id="galeria"
      className="border-b border-border bg-surface px-6 py-20 md:px-12 md:py-32"
    >
      <header className="mb-10 md:mb-14">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
          {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
        >
          {t('heading')}
        </h2>
      </header>
      <GalleryLightbox
        items={items}
        gridClassName="grid grid-cols-2 gap-[2px] md:grid-cols-3"
        tileClassName={() => 'aspect-[4/5]'}
      />
    </section>
  );
}
