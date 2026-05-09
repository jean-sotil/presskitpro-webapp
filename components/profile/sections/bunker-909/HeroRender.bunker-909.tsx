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
 * Bunker 909 Hero
 * Industrial, brutalist design with high-contrast orange/black.
 */
export function HeroBunker909({ bundle }: { bundle: EditorBundle }) {
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
    <header className="relative min-h-[80vh] overflow-hidden bg-black font-mono selection:bg-orange-500 selection:text-black">
      {/* Structural Industrial Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="relative z-10 grid h-full md:grid-cols-12">
        {/* Left Column: Vertical Branding */}
        <div className="hidden border-r-4 border-[#1a1a1a] p-4 md:col-span-1 md:flex md:flex-col md:items-center md:justify-between">
          <span className="origin-left -rotate-90 whitespace-nowrap text-[10px] tracking-[0.5em] text-[#333]">
            SYSTEM_TYPE // B909-PRO
          </span>
          <div className="h-32 w-1 bg-[#ff5c00]" />
          <span className="origin-left -rotate-90 whitespace-nowrap text-[10px] tracking-[0.5em] text-[#333]">
            {new Date().getFullYear()} // PKP_CORE
          </span>
        </div>

        {/* Center: Main Content */}
        <div className="flex flex-col border-r-4 border-[#1a1a1a] p-6 md:col-span-6 md:p-12 lg:p-20">
          <div className="flex-1">
            <div className="mb-12 inline-flex items-center gap-4 border-l-4 border-[#ff5c00] pl-6">
              <span className="text-xs tracking-[0.3em] text-[#ff5c00]">BUNKER_PROTOCOL // ACTIVE</span>
            </div>

            <h1 className="font-display text-6xl uppercase leading-[0.85] tracking-tighter text-white md:text-8xl lg:text-[10rem]">
              {displayName.split(' ').map((word, i) => (
                <span key={i} className="block">
                  {word}
                  {i === 0 && <span className="text-[#ff5c00]">.</span>}
                </span>
              ))}
            </h1>

            {tagline ? (
              <div className="mt-12 max-w-md border-t border-[#1a1a1a] pt-8">
                <p className="text-sm leading-relaxed tracking-widest text-[#888] uppercase">
                  {tagline}
                </p>
              </div>
            ) : null}
          </div>

          {ctaLabel && ctaUrl ? (
            <div className="mt-12">
              <a
                href={ctaUrl}
                className="group relative inline-flex items-center gap-6 bg-[#ff5c00] px-10 py-5 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-white"
              >
                {ctaLabel}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:translate-x-2">
                  <path d="M4 10H16M16 10L12 6M16 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
                </svg>
              </a>
            </div>
          ) : null}
        </div>

        {/* Right Column: Visual Component */}
        <div className="relative min-h-[400px] md:col-span-5">
          {portraitUrl ? (
            <div className="absolute inset-0 h-full w-full grayscale contrast-125 transition-all duration-700 hover:grayscale-0">
              <Image
                src={portraitUrl}
                alt={portraitMedia?.alt ?? ''}
                width={portraitWidth}
                height={portraitHeight}
                priority
                sizes="(min-width: 768px) 40vw, 100vw"
                className="h-full w-full object-cover"
              />
              {/* Scanline / Texture overlay */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-30" />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#111]">
              <div className="h-32 w-32 border-4 border-[#1a1a1a] p-4 opacity-20">
                <div className="h-full w-full border-2 border-dashed border-[#ff5c00]" />
              </div>
            </div>
          )}

          {/* Industrial "Caution" Bar */}
          <div className="absolute bottom-0 left-0 h-8 w-full bg-[repeating-linear-gradient(45deg,#ff5c00,#ff5c00_20px,#000_20px,#000_40px)]" />
        </div>
      </div>
    </header>
  );
}
