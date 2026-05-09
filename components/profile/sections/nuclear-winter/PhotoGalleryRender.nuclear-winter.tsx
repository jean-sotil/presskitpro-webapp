'use client';

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
 * Nuclear Winter Photo Gallery
 * Desaturated grid with cold signal hover effects and technical metadata.
 */
export function PhotoGalleryNuclearWinter({ bundle }: { bundle: EditorBundle }) {
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
    <section id="galeria" className="relative border-b border-[#e0eaff]/5 bg-black px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-20 flex flex-col justify-between gap-12 md:flex-row md:items-end" data-reveal>
          <div>
            <div className="mb-6 flex items-center gap-4">
              <div className="h-4 w-4 bg-[#e0eaff]/20 border border-[#e0eaff]/40" />
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#e0eaff]/60">
                RECON // 03
              </p>
            </div>
            <h2 className="font-display text-6xl uppercase leading-none tracking-tighter text-white md:text-9xl">
              VISUAL<span className="text-[#e0eaff]">.</span>LOG
            </h2>
          </div>
          <div className="border-l border-[#e0eaff]/10 pl-8">
             <p className="max-w-xs text-[10px] uppercase tracking-[0.3em] text-[#333] leading-relaxed">
               Documentary evidence of survival operations and perimeter scouting.
             </p>
          </div>
        </div>

        <div data-reveal>
          <GalleryLightbox 
            items={items}
            gridClassName="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            tileClassName={() => "fractured-border aspect-square bg-black/40 grayscale contrast-125 transition-all duration-700 hover:grayscale-0 hover:contrast-100 hover:shadow-[0_0_30px_rgba(224,234,255,0.1)]"}
          />
        </div>

        {/* Technical Footer */}
        <div className="mt-20 flex items-center justify-between border-t border-[#e0eaff]/5 pt-10" data-reveal>
           <span className="text-[9px] tracking-[0.4em] text-[#222] uppercase">ARCHIVE_SECURE // SIG_VALID // 2026</span>
           <div className="flex gap-3 opacity-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-1 w-8 bg-[#e0eaff]" />
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
