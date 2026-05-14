'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Nuclear Winter Press Kit Link
 * Industrial cold block with glitchy hover and secure checksums.
 */
export function PressKitLinkNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;

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

      // 2. Left Content Reveal
      tl.fromTo(
        '[data-content-left] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.2 },
        '-=0.8'
      );

      // 3. CTA Button Reveal
      tl.fromTo(
        '[data-cta-button]',
        { opacity: 0, scale: 0.8, rotate: -5 },
        { opacity: 1, scale: 1, rotate: 0, duration: 1 },
        '-=0.6'
      );

      // 4. Footer Reveal
      tl.fromTo(
        '[data-footer] > *',
        { opacity: 0 },
        { opacity: 1, duration: 0.8, stagger: 0.2 },
        '-=0.4'
      );

      // 5. Geiger dot flickering
      gsap.to('[data-geiger-dot]', {
        opacity: () => Math.random() * 0.7 + 0.3,
        duration: () => Math.random() * 0.3 + 0.1,
        repeat: -1,
        yoyo: true,
      });

      // 6. Subtle Pulse for CTA (managed by GSAP)
      gsap.to('[data-cta-button]', {
        boxShadow: '0 0 20px rgba(224, 234, 255, 0.1)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    },
    { scope: containerRef }
  );

  if (!url) return null;

  return (
    <section ref={containerRef} className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40">
      <div className="mx-auto max-w-4xl">
        <div className="fractured-border group relative overflow-hidden bg-black/60 p-1 transition-all" data-main-container>
          {/* Cold pulse background */}
          <div className="absolute inset-0 z-0 opacity-0 bg-[radial-gradient(circle_at_50%_50%,#e0eaff_0%,transparent_70%)] group-hover:opacity-5 transition-opacity duration-[2000ms]" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-12 bg-black/20 p-12 text-center transition-colors md:flex-row md:text-left">
            <div className="flex-1" data-content-left>
              <div className="mb-6 flex items-center justify-center gap-4 md:justify-start">
                 <span className="h-2 w-2 bg-[#e0eaff] shadow-[0_0_12px_rgba(224,234,255,0.4)]" data-geiger-dot />
                 <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#e0eaff]/60">
                    SECURE_DATA // DOC_PKG
                 </span>
              </div>
              <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-white md:text-8xl">
                DOWNLOAD<br />
                <span className="text-[#e0eaff]/80 text-shadow-glow">DOSSIER</span>
              </h2>
              <p className="mt-8 max-w-sm text-[10px] uppercase tracking-[0.3em] text-[#333] leading-relaxed">
                Contains verified assets, technical riders, and biography. Authorized use only.
              </p>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              data-fallout-glitch
              data-cta-button
              className="group/btn relative flex h-32 w-32 items-center justify-center border border-[#e0eaff]/20 bg-[#e0eaff]/5 text-[#e0eaff] transition-all hover:bg-[#e0eaff] hover:text-black md:h-40 md:w-40"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="transition-transform group-hover/btn:scale-110">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
              </svg>
              {/* HUD markers */}
              <div className="absolute top-4 left-4 h-3 w-3 border-l border-t border-[#e0eaff]/20" />
              <div className="absolute bottom-4 right-4 h-3 w-3 border-r border-b border-[#e0eaff]/20" />
            </a>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center gap-16 opacity-10" data-footer>
           <span className="text-[9px] tracking-[0.3em] uppercase">ID: 8B-F2-12</span>
           <span className="text-[9px] tracking-[0.3em] uppercase">STATUS: ARCHIVED</span>
           <span className="text-[9px] tracking-[0.3em] uppercase">SIG: VALID</span>
        </div>
      </div>
    </section>
  );
}
