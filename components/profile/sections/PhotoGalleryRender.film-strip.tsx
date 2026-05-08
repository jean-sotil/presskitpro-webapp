'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

import { GalleryLightbox, type LightboxItem } from './GalleryLightbox';

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
 * Festival Club Orange gallery — horizontal "film strip" on the
 * preset's cream surface (theme tokens, no hardcoded color overrides).
 *
 * - Theme-driven bg + text → adapts to whichever preset uses this
 *   variant. On festival cream, reads as a contact-sheet roll; on a
 *   dark preset it would render as a dark film strip.
 * - Horizontal snap-x scroll on every viewport. Each tile is a 2:3
 *   portrait box, ~72vw on mobile capped at 320px on desktop.
 * - Tile borders use the accent color so the orange identity threads
 *   through the section without needing a dark band.
 * - Tap a tile to open the existing lightbox; nav (ESC/arrows) cycles
 *   through the whole set.
 */
export function PhotoGalleryFilmStrip({ bundle }: { bundle: EditorBundle }) {
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
      className="border-y border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <header className="mb-10 flex items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            05 — {t('label')}
          </p>
          <h2
            className="mt-6 font-display uppercase leading-none tracking-tight text-text"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {t('heading')}
          </h2>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-accent md:block">
          {String(items.length).padStart(2, '0')} frames
        </p>
      </header>
      <div className="-mx-6 overflow-x-auto md:-mx-12">
        <div className="px-6 md:px-12">
          <GalleryLightbox
            items={items}
            gridClassName="flex snap-x snap-mandatory gap-2"
            tileClassName={() =>
              'aspect-[2/3] shrink-0 snap-start [width:min(72vw,320px)]'
            }
          />
        </div>
      </div>
    </section>
  );
}
