'use client';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { FeaturedTrack } from '@/payload-types';

import { LazyEmbed } from '../LazyEmbed';

/**
 * Nuclear Winter Featured Track
 * Cold terminal aesthetic for the embedded player.
 */
export function FeaturedTrackNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const track = bundle.featuredTrack as unknown as FeaturedTrack;
  if (!track?.oembedHtml) return null;

  return (
    <section className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-20 font-mono text-gray-400 md:px-16 md:py-32" data-reveal>
      <div className="mx-auto max-w-5xl">
        <div className="fractured-border relative bg-black/40 p-10 md:p-12">
          {/* Header with signal-strength feel */}
          <div className="mb-10 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-[0.5em] text-[#e0eaff]/60 mb-3">
                 SIGNAL_RELAY // SIG_01
               </p>
               <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-7xl">
                 AUDIO<span className="text-[#e0eaff]">.</span>RECEP
               </h2>
            </div>
            <div className="flex items-end gap-2 h-16 opacity-30">
               {[...Array(8)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-[#e0eaff]" 
                   style={{ height: `${20 + Math.random() * 80}%`, animation: 'equalizer-bar 3s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} 
                 />
               ))}
            </div>
          </div>

          <div className="relative overflow-hidden bg-black/60 p-1 transition-all">
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#e0eaff]/5 to-transparent" />
            
            <div className="relative z-0 opacity-60 grayscale transition-all duration-[2000ms] hover:opacity-100 hover:grayscale-0">
               <LazyEmbed html={track.oembedHtml} />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-[#e0eaff]/5 pt-8">
             <div className="flex items-center gap-6">
                <span className="h-2 w-2 bg-[#e0eaff] shadow-[0_0_12px_rgba(224,234,255,0.4)]" data-geiger-dot />
                <span className="text-[9px] tracking-[0.4em] uppercase text-[#333]">STABILITY: UNCERTAIN</span>
             </div>
             <span className="text-[9px] tracking-[0.4em] uppercase text-[#333]">NODE: COLD_RELAY_v1</span>
          </div>
        </div>
      </div>
    </section>
  );
}
