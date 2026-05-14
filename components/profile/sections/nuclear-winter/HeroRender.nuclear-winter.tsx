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
 * Nuclear Winter Hero
 * Cold, desolate, and monochromatic. CRT scanlines, cold signal glow, and high-contrast portrait.
 */
export function HeroNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;
  const containerRef = useRef<HTMLDivElement>(null);

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
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // 1. Portrait Entrance (Glitchy)
      tl.fromTo(
        '[data-portrait-container]',
        { opacity: 0, scale: 0.95, filter: 'blur(10px) brightness(2)' },
        { opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)', duration: 1.5, ease: 'expo.out' }
      );

      // 2. Name Staggered Reveal
      tl.fromTo(
        '[data-name-word]',
        { opacity: 0, y: 40, skewY: 7 },
        { opacity: 1, y: 0, skewY: 0, duration: 1, stagger: 0.2 },
        '-=1'
      );

      // 3. Tagline & HUD Elements
      tl.fromTo(
        ['[data-tagline]', '[data-hud-line]', '[data-metadata-item]'],
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.1 },
        '-=0.5'
      );

      // 4. CTA Button
      tl.fromTo(
        '[data-cta-button]',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6 },
        '-=0.4'
      );

      // 5. Geiger dots random flickering (Infinite)
      gsap.to('[data-geiger-dot]', {
        opacity: () => Math.random() * 0.5 + 0.1,
        duration: () => Math.random() * 0.5 + 0.2,
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.1,
          from: 'random',
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <header 
      ref={containerRef}
      className="relative min-h-[110vh] w-full overflow-hidden bg-[#050505] font-mono selection:bg-[#e0eaff] selection:text-black"
    >
      {/* Cold Signal Background Element */}
      <div className="absolute top-16 right-16 flex flex-col items-end gap-2 opacity-20">
        <div className="flex gap-1.5">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="h-6 w-0.5 bg-[#e0eaff]" 
              data-geiger-dot
            />
          ))}
        </div>
        <span className="text-[10px] font-bold tracking-[0.5em] text-[#e0eaff]">SIGNAL_STATUS: WEAK</span>
      </div>

      <div className="relative z-10 flex min-h-[110vh] flex-col items-center justify-center p-12 md:p-24 lg:p-32">
        <div className="grid w-full max-w-7xl gap-24 lg:grid-cols-2 lg:items-center">
          
          {/* Portrait with desaturated documentary feel */}
          <div className="relative order-2 lg:order-1" data-portrait-container>
            <div className="absolute -inset-8 border border-[#e0eaff]/5 opacity-20" />
            <div className="absolute -inset-4 border border-[#e0eaff]/10 opacity-30" />
            
            <div className="fractured-border relative aspect-[3/4] overflow-hidden bg-black">
              {portraitUrl ? (
                <>
                  <Image
                    src={portraitUrl}
                    alt={portraitMedia?.alt ?? ''}
                    width={portraitWidth}
                    height={portraitHeight}
                    priority
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="h-full w-full object-cover grayscale contrast-[1.4] brightness-[0.6] transition-all duration-[3000ms]"
                  />
                  {/* Cold Overlay */}
                  <div className="absolute inset-0 bg-[#e0eaff]/5 mix-blend-color" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs tracking-[1em] text-[#e0eaff]/10">SIGNAL_LOST</span>
                </div>
              )}
              
              {/* Internal HUD elements */}
              <div className="absolute left-6 top-6 text-[9px] font-bold text-[#e0eaff]/40 uppercase tracking-widest">
                DOC_REF: {profile.slug.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="order-1 lg:order-2">
            <div className="mb-8 flex items-center gap-6" data-hud-line>
               <div className="h-px w-12 bg-[#e0eaff]/30" />
               <span className="text-xs font-bold tracking-[0.6em] text-[#e0eaff]/60 uppercase">Wasteland_Archive // Vault_00</span>
            </div>

            <h1 className="font-display text-7xl uppercase leading-[0.8] tracking-tighter text-white sm:text-9xl lg:text-[11rem]">
              {displayName.split(' ').map((word, i) => (
                <span key={i} data-name-word className="block first:text-white last:text-[#e0eaff]/90">
                  {word}
                </span>
              ))}
            </h1>

            {tagline ? (
              <div className="mt-12 max-w-lg border-l border-[#e0eaff]/10 pl-10" data-tagline>
                <p className="text-lg font-medium leading-relaxed tracking-[0.2em] text-[#888] uppercase">
                  {tagline}
                </p>
              </div>
            ) : null}

            {ctaLabel && ctaUrl ? (
              <div className="mt-16" data-cta-button>
                <a
                  href={ctaUrl}
                  data-fallout-glitch
                  className="relative inline-flex items-center gap-6 border border-[#e0eaff]/30 bg-[#e0eaff]/5 px-10 py-5 text-sm font-bold uppercase tracking-[0.4em] text-[#e0eaff] transition-all hover:bg-[#e0eaff] hover:text-black"
                >
                  {ctaLabel}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            ) : null}

            {/* Bottom Metadata */}
            <div className="mt-24 flex flex-wrap gap-12 text-[10px] font-bold tracking-[0.3em] text-[#333] uppercase">
               <div className="flex flex-col gap-2" data-metadata-item>
                  <span>LOC: UNKNOWN_WASTELAND</span>
                  <span>STATUS: END_OF_WORLD</span>
               </div>
               <div className="flex flex-col gap-2" data-metadata-item>
                  <span>SYS: NUCLEAR_WINTER_v4.5</span>
                  <span>TIME: 00:00:00</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
