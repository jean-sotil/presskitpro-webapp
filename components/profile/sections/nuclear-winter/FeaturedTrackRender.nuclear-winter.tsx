'use client';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { FeaturedTrack } from '@/payload-types';

import { LazyEmbed } from '../LazyEmbed';

/**
 * Nuclear Winter Featured Track
 * Glitchy terminal aesthetic for the embedded player.
 */
export function FeaturedTrackNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const track = bundle.featuredTrack as unknown as FeaturedTrack;
  if (!track?.oembedHtml) return null;

  return (
    <section className="relative border-b border-[#39ff14]/10 bg-[#050705] px-6 py-16 font-mono text-gray-400 md:px-12 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative border border-[#39ff14]/30 bg-black p-6 md:p-8">
          {/* Header with signal-strength feel */}
          <div className="mb-8 flex items-center justify-between">
            <div>
               <p className="text-[10px] uppercase tracking-[0.4em] text-[#39ff14] mb-2">
                 BROADCAST // SIG_01
               </p>
               <h2 className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
                 AUDIO<span className="text-[#39ff14]">.</span>WAVES
               </h2>
            </div>
            <div className="flex items-end gap-1.5 h-12">
               {[...Array(6)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-[#39ff14]/30" 
                   style={{ height: `${20 + Math.random() * 80}%`, animation: 'equalizer-bar 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} 
                 />
               ))}
            </div>
          </div>

          <div className="relative overflow-hidden border border-[#39ff14]/40 bg-black p-1 transition-all hover:border-[#39ff14]">
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#39ff14]/5 to-transparent" />
            
            <div className="relative z-0 opacity-80 transition-opacity hover:opacity-100">
               <LazyEmbed html={track.oembedHtml} />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[#39ff14]/10 pt-6">
             <div className="flex items-center gap-4">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] shadow-[0_0_8px_rgba(57,255,20,0.8)] animate-pulse" />
                <span className="text-[9px] tracking-[0.3em] uppercase text-[#444]">STREAM_STABILITY: 88%</span>
             </div>
             <span className="text-[9px] tracking-[0.3em] uppercase text-[#444]">NODE: FALLOUT_RELAY</span>
          </div>
        </div>
      </div>
    </section>
  );
}
