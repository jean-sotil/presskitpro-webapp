'use client';

import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

type PortraitMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Nuclear Winter Hero
 * Cold, desolate, and radioactive. CRT scanlines, toxic glow, and high-contrast portrait.
 */
export function HeroNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1200) || 1200;
  const portraitHeight = (portraitMedia?.height ?? 1600) || 1600;

  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  return (
    <header className="relative min-h-[100vh] w-full overflow-hidden bg-[#050705] font-mono selection:bg-[#39ff14] selection:text-black">
      {/* Geiger Counter Background Element */}
      <div className="absolute top-12 right-12 flex flex-col items-end gap-2 opacity-40">
        <div className="flex gap-1">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="h-4 w-1 bg-[#39ff14]" 
              data-geiger-dot
              style={{ '--geiger-delay': `${i * 0.15}s` } as React.CSSProperties}
            />
          ))}
        </div>
        <span className="text-[10px] font-bold tracking-[0.3em] text-[#39ff14]">RADIATION_LEVEL: STABLE</span>
      </div>

      <div className="relative z-10 flex min-h-[100vh] flex-col items-center justify-center p-8 md:p-16">
        <div className="grid w-full max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Portrait with Glitch/Distortion feel */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 border border-[#39ff14]/20 opacity-40" />
            <div className="absolute -inset-2 border border-[#39ff14]/40 opacity-60" />
            
            <div className="relative aspect-[3/4] overflow-hidden border-2 border-[#39ff14] bg-black">
              {portraitUrl ? (
                <>
                  <Image
                    src={portraitUrl}
                    alt={portraitMedia?.alt ?? ''}
                    width={portraitWidth}
                    height={portraitHeight}
                    priority
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="h-full w-full object-cover grayscale contrast-150 brightness-75 transition-all duration-1000"
                  />
                  {/* Toxic Overlay */}
                  <div className="absolute inset-0 bg-[#39ff14]/10 mix-blend-color" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs tracking-[0.5em] text-[#39ff14]/30">NO_SIGNAL</span>
                </div>
              )}
              
              {/* Internal HUD elements */}
              <div className="absolute left-4 top-4 text-[9px] font-bold text-[#39ff14] opacity-80">
                CAM_REF: {profile.slug.toUpperCase()}_v01
              </div>
              <div className="absolute right-4 bottom-4 flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-[#39ff14] animate-pulse" />
                 <span className="text-[9px] font-bold text-[#39ff14]">REC</span>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="order-1 lg:order-2">
            <div className="mb-6 flex items-center gap-4">
               <div className="h-0.5 w-8 bg-[#39ff14]" />
               <span className="text-xs font-bold tracking-[0.5em] text-[#39ff14]">VAULT_13 // ARCHIVE</span>
            </div>

            <h1 className="font-display text-6xl uppercase leading-[0.85] tracking-tighter text-white sm:text-8xl lg:text-[10rem]">
              {displayName.split(' ').map((word, i) => (
                <span key={i} className="block first:text-white last:text-[#39ff14] last:opacity-80">
                  {word}
                </span>
              ))}
            </h1>

            {tagline ? (
              <div className="mt-8 max-w-lg border-l-2 border-[#39ff14]/30 pl-8">
                <p className="text-base font-medium leading-relaxed tracking-widest text-gray-400 uppercase">
                  {tagline}
                </p>
              </div>
            ) : null}

            {ctaLabel && ctaUrl ? (
              <div className="mt-12">
                <a
                  href={ctaUrl}
                  data-fallout-glitch
                  className="relative inline-flex items-center gap-4 border border-[#39ff14] bg-[#39ff14]/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.3em] text-[#39ff14] transition-all hover:bg-[#39ff14] hover:text-black"
                >
                  {ctaLabel}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
            ) : null}

            {/* Bottom Metadata */}
            <div className="mt-20 flex flex-wrap gap-8 text-[9px] font-bold tracking-[0.2em] text-[#39ff14]/40 uppercase">
               <div className="flex flex-col gap-1">
                  <span>LOCATION: DESOLATE_WASTELAND</span>
                  <span>COORDINATES: 34.0522 N, 118.2437 W</span>
               </div>
               <div className="flex flex-col gap-1">
                  <span>SYSTEM: NUCLEAR_WINTER_v4.2</span>
                  <span>STATUS: SURVIVAL_MODE</span>
               </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
