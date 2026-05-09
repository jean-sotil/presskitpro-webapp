'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

import { GalleryLightbox } from '../GalleryLightbox';

type PhotoMedia = {
  id: string;
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  displayOrder?: number;
};

/**
 * Bunker 909 Photo Gallery
 * Harsh industrial grid with heavy borders and structural annotations.
 */
export function PhotoGalleryBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.gallery');
  const raw = (bundle.photos ?? []) as unknown as PhotoMedia[];
  const photos = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (photos.length === 0) return null;

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

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, i) => {
            const url = mediaUrl(photo);
            if (!url) return null;
            return (
              <div key={photo.id} className="group relative aspect-square overflow-hidden border-4 border-[#1a1a1a] bg-[#050505] transition-all hover:border-[#ff5c00]">
                <Image
                  src={url}
                  alt={photo.alt ?? ''}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                />
                
                {/* ID Tag */}
                <div className="absolute bottom-2 left-2 z-10 bg-black/80 px-2 py-1 text-[9px] font-bold text-[#ff5c00] opacity-0 transition-opacity group-hover:opacity-100">
                  IMG_{i.toString().padStart(3, '0')}
                </div>

                {/* Lightbox trigger button */}
                <GalleryLightbox photos={photos} initialIndex={i} triggerClassName="absolute inset-0 z-20" />
              </div>
            );
          })}
        </div>

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
