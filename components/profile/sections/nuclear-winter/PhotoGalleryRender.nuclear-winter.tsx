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
 * Nuclear Winter Photo Gallery
 * Desaturated grid with radioactive toxic-glow hover effects and technical metadata.
 */
export function PhotoGalleryNuclearWinter({ bundle }: { bundle: EditorBundle }) {
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
    <section id="galeria" className="relative border-b border-[#39ff14]/10 bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-4 w-4 border border-[#39ff14] bg-[#39ff14]/20" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#39ff14]">
                03 // {t('label')}
              </p>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-white md:text-8xl">
              RECON<span className="text-[#39ff14]">.</span>VISUALS
            </h2>
          </div>
          <div className="border-l border-[#39ff14]/30 pl-6">
             <p className="max-w-xs text-[10px] uppercase tracking-widest text-[#555] leading-relaxed">
               Visual records of survival zones and high-radiation events.
             </p>
          </div>
        </div>

        <GalleryLightbox 
          items={items}
          gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4"
          tileClassName={() => "aspect-square border border-[#39ff14]/20 bg-[#050705] transition-all hover:border-[#39ff14] hover:shadow-[0_0_20px_rgba(57,255,20,0.2)]"}
        />

        {/* Technical Footer */}
        <div className="mt-16 flex items-center justify-between border-t border-[#39ff14]/10 pt-8">
           <span className="text-[9px] tracking-widest text-[#333] uppercase">SCAN_ARCHIVE_v1.0 // CACHE_VALID</span>
           <div className="flex gap-2 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-1 w-6 bg-[#39ff14]" />
              ))}
           </div>
        </div>
      </div>
    </section>
  );
}
