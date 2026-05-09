'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

/**
 * Bunker 909 Featured Track
 * Industrial terminal aesthetic for the embedded player.
 */
export function FeaturedTrackBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.featuredTrack');
  const track = bundle.featuredTrack;
  if (!track?.oembedHtml) return null;

  return (
    <section className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-16 font-mono text-gray-400 md:px-12 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative border-4 border-[#1a1a1a] bg-[#050505] p-6 md:p-8">
          {/* Section Header with technical feel */}
          <div className="mb-8 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-[0.4em] text-[#ff5c00] mb-2">
                 SIGNAL_STREAM // AUDIO_O1
               </p>
               <h2 className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
                 CORE<span className="text-[#ff5c00]">.</span>AUDIO
               </h2>
            </div>
            <div className="hidden items-end gap-1 md:flex">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="h-8 w-1 bg-[#ff5c00]/40" style={{ height: `${20 + Math.random() * 40}px` }} />
               ))}
            </div>
          </div>

          <div className="group relative border-2 border-[#1a1a1a] p-1 transition-all hover:border-[#ff5c00]">
            <div className="absolute inset-0 z-10 pointer-events-none border border-white/5" />
            
            <div className="relative z-0 overflow-hidden opacity-90 transition-opacity group-hover:opacity-100">
               <LazyEmbed html={track.oembedHtml} />
            </div>

            {/* Industrial Garnish */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-12 w-1 bg-[#ff5c00]" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-12 w-1 bg-[#ff5c00]" />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#1a1a1a] pt-6">
             <div className="flex items-center gap-4">
                <span className="h-2 w-2 rounded-full bg-[#ff5c00] animate-pulse" />
                <span className="text-[9px] tracking-[0.2em] uppercase text-[#444]">STREAM_LINK: ENCRYPTED_STABLE</span>
             </div>
             <span className="text-[9px] tracking-[0.2em] uppercase text-[#444]">SC_909_MOD_v1.2</span>
          </div>
        </div>
      </div>
    </section>
  );
}
