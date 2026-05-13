'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';

import type { FeaturedTrack } from '@/payload-types';

import { LazyEmbed } from '../LazyEmbed';

gsap.registerPlugin(useGSAP);

/**
 * Bunker 909 Featured Track
 * Industrial terminal aesthetic for the embedded player.
 */
export function FeaturedTrackBunker909({ bundle }: { bundle: EditorBundle }) {
  const track = bundle.featuredTrack as unknown as FeaturedTrack;
  const sectionRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // Label pulses in
      if (labelRef.current) {
        tl.fromTo(
          labelRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out' },
          0
        );
      }

      // Title slides in from left
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, x: -60 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
          0.1
        );
      }

      // Audio visualizer bars bounce in with randomized heights
      if (visualizerRef.current) {
        const bars = visualizerRef.current.querySelectorAll('div');
        bars.forEach((bar, i) => {
          tl.fromTo(
            bar,
            { opacity: 0, scaleY: 0, transformOrigin: 'bottom' },
            { opacity: 1, scaleY: 1, duration: 0.5, ease: 'back.out' },
            0.15 + i * 0.05
          );
        });
      }

      // Embed container fades and scales in
      if (embedContainerRef.current) {
        tl.fromTo(
          embedContainerRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' },
          0.5
        );
      }

      // Footer fades in
      if (footerRef.current) {
        tl.fromTo(
          footerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' },
          0.8
        );
      }

      // Hover effect on embed container
      if (embedContainerRef.current) {
        const container = embedContainerRef.current;
        const onHover = () => {
          gsap.to(container, { borderColor: '#ff5c00', duration: 0.3, ease: 'power2.out' });
        };

        const onHoverOut = () => {
          gsap.to(container, { borderColor: '#1a1a1a', duration: 0.3, ease: 'power2.out' });
        };

        container.addEventListener('mouseenter', onHover);
        container.addEventListener('mouseleave', onHoverOut);

        return () => {
          container.removeEventListener('mouseenter', onHover);
          container.removeEventListener('mouseleave', onHoverOut);
        };
      }
    },
    { scope: sectionRef }
  );

  if (!track?.oembedHtml) return null;

  return (
    <section ref={sectionRef} className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-16 font-mono text-gray-400 md:px-12 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative border-4 border-[#1a1a1a] bg-[#050505] p-6 md:p-8">
          {/* Section Header with technical feel */}
          <div className="mb-8 flex items-center justify-between">
            <div>
               <p ref={labelRef} className="text-[10px] uppercase tracking-[0.4em] text-[#ff5c00] mb-2">
                 SIGNAL_STREAM // AUDIO_O1
               </p>
               <h2 ref={titleRef} className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
                 CORE<span className="text-[#ff5c00]">.</span>AUDIO
               </h2>
            </div>
            <div ref={visualizerRef} className="hidden items-end gap-1 md:flex">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="h-8 w-1 bg-[#ff5c00]/40" style={{ height: `${20 + Math.random() * 40}px` }} />
               ))}
            </div>
          </div>

          <div ref={embedContainerRef} className="group relative border-2 border-[#1a1a1a] p-1 transition-all hover:border-[#ff5c00]">
            <div className="absolute inset-0 z-10 pointer-events-none border border-white/5" />

            <div className="relative z-0 overflow-hidden opacity-90 transition-opacity group-hover:opacity-100">
               <LazyEmbed html={track.oembedHtml} />
            </div>

            {/* Industrial Garnish */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-12 w-1 bg-[#ff5c00]" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-12 w-1 bg-[#ff5c00]" />
          </div>

          <div ref={footerRef} className="mt-6 flex items-center justify-between border-t border-[#1a1a1a] pt-6">
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
