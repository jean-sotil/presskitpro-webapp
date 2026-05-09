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
 * Bunker 909 Photo Gallery
 * Harsh industrial grid with heavy borders and structural annotations.
 */
export function PhotoGalleryBunker909({ bundle }: { bundle: EditorBundle }) {
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
        alt: entry.decorative ? '' : (entry.alt ?? ''),
        width: entry.width ?? null,
        height: entry.height ?? null,
      },
    ];
  });

  if (items.length === 0) return null;

  return (
    <section id="galeria" className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-4 w-4 bg-[#ff5c00]" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#ff5c00]">
                03 // {t('label')}
              </p>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-white md:text-8xl">
              VISUAL<span className="text-[#ff5c00]">.</span>ARCHIVE
            </h2>
          </div>
          <div className="border-l-4 border-[#ff5c00] pl-6">
             <p className="max-w-xs text-xs uppercase tracking-widest text-[#666] leading-relaxed">
               Structural documentation of live operations and press captures.
             </p>
          </div>
        </div>

        <GalleryLightbox 
          items={items}
          gridClassName="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4"
          tileClassName={() => "aspect-square border-4 border-[#1a1a1a] bg-[#050505] transition-all hover:border-[#ff5c00]"}
        />

        {/* Section Metadata Footer */}
        <div className="mt-16 flex items-center justify-between border-t border-[#1a1a1a] pt-8">
           <span className="text-[10px] tracking-widest text-[#333]">909_BUNKER_GALLERY_MODULE_V2</span>
           <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 w-1 bg-[#1a1a1a]" />
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
