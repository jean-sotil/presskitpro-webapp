'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';

gsap.registerPlugin(useGSAP);

/**
 * Bunker 909 Press Kit Link
 * Heavy brutalist block with industrial warning styling.
 */
export function PressKitLinkBunker909({ bundle }: { bundle: EditorBundle }) {
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // Outer container fades in
      if (containerRef.current) {
        tl.fromTo(
          containerRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' },
          0
        );
      }

      // Label pulses in
      if (labelRef.current) {
        tl.fromTo(
          labelRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out' },
          0.1
        );
      }

      // Title slides in from left
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, x: -60 },
          { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' },
          0.2
        );
      }

      // Description fades in
      if (descriptionRef.current) {
        tl.fromTo(
          descriptionRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          0.3
        );
      }

      // Download button bounces in
      if (buttonRef.current) {
        tl.fromTo(
          buttonRef.current,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' },
          0.5
        );
      }

      // Footer checklist fades in
      if (footerRef.current) {
        tl.fromTo(
          footerRef.current,
          { opacity: 0 },
          { opacity: 0.2, duration: 0.5, ease: 'power2.out' },
          0.8
        );
      }

      // Hover effect on button
      if (buttonRef.current) {
        const btn = buttonRef.current;
        const onHover = () => {
          gsap.to(btn, { scale: 1.1, duration: 0.3, ease: 'power2.out' });
          gsap.to(btn, { backgroundColor: '#ffffff', duration: 0.3, ease: 'power2.out' });
        };

        const onHoverOut = () => {
          gsap.to(btn, { scale: 1, duration: 0.3, ease: 'power2.out' });
          gsap.to(btn, { backgroundColor: '#ff5c00', duration: 0.3, ease: 'power2.out' });
        };

        btn.addEventListener('mouseenter', onHover);
        btn.addEventListener('mouseleave', onHoverOut);

        return () => {
          btn.removeEventListener('mouseenter', onHover);
          btn.removeEventListener('mouseleave', onHoverOut);
        };
      }
    },
    { scope: sectionRef }
  );

  if (!url) return null;

  return (
    <section ref={sectionRef} className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-4xl">
        <div ref={containerRef} className="group relative overflow-hidden border-8 border-[#1a1a1a] bg-[#0a0a0a] p-1 transition-all hover:border-[#ff5c00]">
          {/* Diagonal Industrial Stripes Background */}
          <div className="absolute inset-0 z-0 opacity-5 bg-[repeating-linear-gradient(45deg,#ff5c00,#ff5c00_20px,transparent_20px,transparent_40px)]" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-8 border-4 border-[#1a1a1a] bg-black p-12 text-center transition-colors group-hover:bg-[#050505] md:flex-row md:text-left">
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-center gap-3 md:justify-start">
                 <span className="h-2 w-2 rounded-full bg-[#ff5c00] animate-pulse" />
                 <span ref={labelRef} className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ff5c00]">
                    SECURE_DATA_PACKAGE // DL_909
                 </span>
              </div>
              <h2 ref={titleRef} className="font-display text-4xl uppercase leading-none tracking-tighter text-white md:text-6xl">
                DOWNLOAD<br />
                <span className="text-[#ff5c00]">PRESSKIT</span>
              </h2>
              <p ref={descriptionRef} className="mt-6 max-w-sm text-xs uppercase tracking-widest text-[#666] leading-relaxed">
                Contains high-resolution visual assets, technical riders, and full artist biography.
              </p>
            </div>

            <a
              ref={buttonRef}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative flex h-24 w-24 items-center justify-center bg-[#ff5c00] text-black transition-all hover:scale-110 hover:bg-white md:h-32 md:w-32"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover/btn:translate-y-1">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
              </svg>
              {/* Corner tech marks */}
              <div className="absolute top-2 left-2 h-2 w-2 border-l border-t border-black/30" />
              <div className="absolute bottom-2 right-2 h-2 w-2 border-r border-b border-black/30" />
            </a>
          </div>
        </div>

        <div ref={footerRef} className="mt-8 flex justify-center gap-12 opacity-20">
           <span className="text-[9px] tracking-tighter uppercase">Checksum: OK</span>
           <span className="text-[9px] tracking-tighter uppercase">Payload: Verified</span>
           <span className="text-[9px] tracking-tighter uppercase">Latency: 0ms</span>
        </div>
      </div>
    </section>
  );
}
