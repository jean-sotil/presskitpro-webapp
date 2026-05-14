'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { FeaturedTrack } from '@/payload-types';

import { LazyEmbed } from '../LazyEmbed';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Nuclear Winter Featured Track
 * Cold terminal aesthetic for the embedded player.
 */
export function FeaturedTrackNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const track = bundle.featuredTrack as unknown as FeaturedTrack;

  useGSAP(
    () => {
      const scroller = document.querySelector('[data-preview-scroller]') || window;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          scroller: scroller,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        defaults: { ease: 'power4.out' },
      });

      // 1. Container Reveal
      tl.fromTo(
        '[data-main-container]',
        { opacity: 0, scale: 0.98, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1.2 }
      );

      // 2. Header Content Reveal
      tl.fromTo(
        '[data-header-content] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.2 },
        '-=0.8'
      );

      // 3. Player Reveal
      tl.fromTo(
        '[data-player-wrapper]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1 },
        '-=0.6'
      );

      // 4. Footer Reveal
      tl.fromTo(
        '[data-footer-content] > *',
        { opacity: 0 },
        { opacity: 1, duration: 0.6, stagger: 0.2 },
        '-=0.4'
      );

      // 5. Equalizer Animation (Randomized GSAP)
      const bars = containerRef.current?.querySelectorAll('[data-eq-bar]');
      bars?.forEach((bar) => {
        gsap.to(bar, {
          height: () => `${20 + Math.random() * 80}%`,
          duration: () => 0.2 + Math.random() * 0.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      // 6. Geiger dot flickering
      gsap.to('[data-geiger-dot]', {
        opacity: () => Math.random() * 0.7 + 0.3,
        duration: () => Math.random() * 0.3 + 0.1,
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: containerRef }
  );

  if (!track?.oembedHtml) return null;

  return (
    <section 
      ref={containerRef}
      className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-20 font-mono text-gray-400 md:px-16 md:py-32"
    >
      <div className="mx-auto max-w-5xl" data-main-container>
        <div className="fractured-border relative bg-black/40 p-10 md:p-12">
          {/* Header with signal-strength feel */}
          <div className="mb-10 flex items-center justify-between">
            <div data-header-content>
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
                   data-eq-bar
                   style={{ height: '40%' }} 
                 />
               ))}
            </div>
          </div>

          <div className="relative overflow-hidden bg-black/60 p-1 transition-all" data-player-wrapper>
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#e0eaff]/5 to-transparent" />
            
            <div className="relative z-0 opacity-60 grayscale transition-all duration-[2000ms] hover:opacity-100 hover:grayscale-0">
               <LazyEmbed html={track.oembedHtml} />
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-[#e0eaff]/5 pt-8" data-footer-content>
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
