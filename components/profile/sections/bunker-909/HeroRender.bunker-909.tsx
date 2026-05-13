'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

gsap.registerPlugin(useGSAP);

type PortraitMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Bunker 909 Hero
 * Refined industrial brutalism. Focused on legibility and structural hierarchy.
 */
export function HeroBunker909({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;
  const headerRef = useRef<HTMLHeadElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;

  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // Sidebar slides in from left with fade
      if (sidebarRef.current) {
        tl.fromTo(
          sidebarRef.current,
          { opacity: 0, x: -80 },
          { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' },
          0
        );
      }

      // Status indicator pulses in
      if (statusRef.current) {
        tl.fromTo(
          statusRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out' },
          0.2
        );
      }

      // Title words cascade in with stagger
      if (titleRef.current) {
        const words = titleRef.current.querySelectorAll('span');
        tl.fromTo(
          words,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' },
          0.3
        );
      }

      // Tagline slides in from left with fade
      if (taglineRef.current) {
        tl.fromTo(
          taglineRef.current,
          { opacity: 0, x: -40 },
          { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' },
          0.7
        );
      }

      // CTA button: line draws + text fades
      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, scaleX: 0 },
          { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power2.inOut', transformOrigin: 'left' },
          0.9
        );
      }

      // Portrait reveals with scanlines effect
      if (portraitRef.current) {
        tl.fromTo(
          portraitRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.8, ease: 'power2.out' },
          0.5
        );
      }
    },
    { scope: headerRef }
  );

  return (
    <header
      ref={headerRef}
      className="relative min-h-[90vh] w-full overflow-hidden bg-[#050505] font-mono selection:bg-[#ff5c00] selection:text-black">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 z-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', backgroundSize: '60px 60px' }} 
      />

      <div className="relative z-10 flex min-h-[90vh] flex-col md:flex-row">
        
        {/* Left: Industrial Sidebar (Vertical Branding) */}
        <div ref={sidebarRef} className="hidden w-20 flex-col items-center justify-between border-r-4 border-[#1a1a1a] py-12 md:flex">
          <div className="flex flex-col items-center gap-12">
             <div className="h-12 w-12 border-2 border-[#1a1a1a] p-1">
                <div className="h-full w-full bg-[#ff5c00]" />
             </div>
             <span className="origin-left -rotate-90 whitespace-nowrap text-[10px] font-bold tracking-[0.5em] text-[#333]">
               BUNKER_CORE_V1.0
             </span>
          </div>
          <span className="origin-left -rotate-90 whitespace-nowrap text-[10px] font-bold tracking-[0.5em] text-[#333]">
            {new Date().getFullYear()} {'//'} PKP_SYS
          </span>        </div>

        {/* Center/Main: Two-Panel Layout */}
        <div className="flex flex-1 flex-col md:flex-row">
          
          {/* Main Info Panel */}
          <div className="flex flex-1 flex-col justify-center border-r-4 border-[#1a1a1a] p-8 md:p-16 lg:p-24">
            <div ref={statusRef} className="mb-8 inline-flex items-center gap-4">
               <span className="h-0.5 w-12 bg-[#ff5c00]" />
               <span className="text-xs font-bold tracking-[0.4em] text-[#ff5c00]">ESTABLISHED // ACTIVE</span>
            </div>

            <h1 ref={titleRef} className="font-display text-5xl uppercase leading-[0.9] tracking-tighter text-white sm:text-7xl lg:text-9xl">
              {displayName.split(' ').map((word, i) => (
                <span key={i} className="block last:text-[#ff5c00]">
                  {word}
                </span>
              ))}
            </h1>

            {tagline ? (
              <div ref={taglineRef} className="mt-12 max-w-lg border-l-4 border-[#1a1a1a] pl-8">
                <p className="text-sm font-medium leading-relaxed tracking-widest text-gray-400 uppercase">
                  {tagline}
                </p>
              </div>
            ) : null}

            {ctaLabel && ctaUrl ? (
              <div className="mt-16">
                <a
                  ref={ctaRef}
                  href={ctaUrl}
                  className="group relative inline-flex items-center gap-6 overflow-hidden border-2 border-[#ff5c00] bg-transparent px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] text-[#ff5c00] transition-all hover:bg-[#ff5c00] hover:text-black"
                >
                  <span className="relative z-10 flex items-center gap-4">
                    {ctaLabel}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:translate-x-2">
                      <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
                    </svg>
                  </span>
                </a>
              </div>
            ) : null}
          </div>

          {/* Portrait Panel */}
          <div ref={portraitRef} className="relative h-[60vh] overflow-hidden border-b-4 border-[#1a1a1a] md:h-auto md:w-[40%] md:border-b-0">
             {portraitUrl ? (
               <>
                 <Image
                   src={portraitUrl}
                   alt={portraitMedia?.alt ?? ''}
                   width={portraitWidth}
                   height={portraitHeight}
                   priority
                   sizes="(min-width: 768px) 40vw, 100vw"
                   className="h-full w-full object-cover grayscale contrast-125 transition-all duration-1000 group-hover:grayscale-0"
                 />
                 {/* Decorative Overlays */}
                 <div className="absolute inset-0 bg-[#ff5c00]/5 mix-blend-overlay" />
                 <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
                 
                 {/* Technical Specs Overlay */}
                 <div className="absolute bottom-12 left-8 right-8 flex items-end justify-between border-t border-white/20 pt-4 text-[9px] font-bold tracking-[0.2em] text-white/40 uppercase">
                    <span>UNIT_SPEC: {portraitWidth}x{portraitHeight}</span>
                    <span>OP_LVL: STABLE</span>
                 </div>
               </>
             ) : (
               <div className="flex h-full w-full items-center justify-center bg-[#111]">
                 <div className="h-24 w-24 border-2 border-dashed border-[#1a1a1a] flex items-center justify-center">
                    <span className="text-[10px] text-[#333]">NO_FEED</span>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Industrial Warning Bar (Bottom) */}
      <div className="h-10 w-full bg-[repeating-linear-gradient(45deg,#ff5c00,#ff5c00_30px,#000_30px,#000_60px)] opacity-80" />
    </header>
  );
}
