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
 * Dead Signal photo gallery section template
 *
 * Layout: Grid layout with harsh borders, scanline overlays on images,
 * and high-contrast, desaturated hover effects.
 */
export function PhotoGalleryDeadSignal({ bundle }: { bundle: EditorBundle }) {
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
    <section
      id="galeria"
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-3">
          <span className="h-px w-8 bg-red-500/80" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
            02 // {t('label')}
          </p>
        </div>

        <h2
          className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
          <span
            className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
            aria-hidden="true"
          >
            {t('label')}
          </span>
        </h2>

        <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {items.map((item) => {
            const src = mediaUrl({ bucket: item.bucket, path: item.path });
            if (!src) return null;
            const alt = item.decorative ? '' : (item.alt ?? '');
            return (
              <li
                key={item.id}
                className="group relative aspect-square overflow-hidden border border-white/10 bg-black"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover opacity-80 mix-blend-luminosity contrast-125 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:mix-blend-normal group-hover:contrast-100"
                />
                {/* Image Scanline Overlay */}
                <div
                  className="pointer-events-none absolute inset-0 z-10 opacity-30 mix-blend-overlay transition-opacity group-hover:opacity-10"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.8) 2px, rgba(0, 0, 0, 0.8) 4px)',
                  }}
                  aria-hidden="true"
                />

                {/* Hover bracket framing */}
                <div className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
