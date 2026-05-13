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
 * Dead Signal hero section template
 *
 * Layout: Full-bleed with aggressive "broken" aesthetic.
 * Visual hierarchy: Disrupted, glitchy typography dominating the viewport, with
 * the portrait forced into a heavily processed, scanline-obscured background.
 * Responsive behavior: Scales typography aggressively to ensure it remains imposing.
 * Decorative elements: Scanlines, chromatic aberration (red/cyan text clones),
 * and heavy film grain / TV static simulate a failing transmission.
 */
export function HeroDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1024) || 1024;
  const portraitHeight = (portraitMedia?.height ?? 1365) || 1365;

  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  return (
    <header className="relative isolate overflow-hidden bg-black/80 font-mono backdrop-blur-md selection:bg-red-500/30">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
        @keyframes glitch-anim {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 1px); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, -1px); }
          40% { clip-path: inset(40% 0 50% 0); transform: translate(2px, 2px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, -2px); }
          80% { clip-path: inset(10% 0 70% 0); transform: translate(1px, 1px); }
          100% { clip-path: inset(30% 0 50% 0); transform: translate(-1px, -1px); }
        }
        .glitch-layer-1 {
          animation: glitch-anim 2.5s infinite linear alternate-reverse;
        }
        .glitch-layer-2 {
          animation: glitch-anim 3s infinite linear alternate-reverse;
        }
        @keyframes noise {
          0%, 100% { background-position: 0 0; }
          10% { background-position: -5% -10%; }
          20% { background-position: -15% 5%; }
          30% { background-position: 7% -25%; }
          40% { background-position: 20% 25%; }
          50% { background-position: -25% 10%; }
          60% { background-position: 15% 5%; }
          70% { background-position: 0% 15%; }
          80% { background-position: 25% 35%; }
          90% { background-position: -10% 10%; }
        }
        .animate-noise {
          animation: noise 0.2s infinite;
        }
      `,
        }}
      />

      <div className="relative min-h-[640px] md:min-h-[100vh]">
        {/* Background/portrait layer - Heavily processed */}
        {portraitUrl ? (
          <div className="absolute inset-0 z-0 bg-black">
            <Image
              src={portraitUrl}
              alt={portraitMedia?.alt ?? ''}
              width={portraitWidth}
              height={portraitHeight}
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1024px"
              className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-luminosity brightness-75 contrast-[1.2] grayscale filter"
            />
            {/* Color wash to simulate signal corruption */}
            <div className="absolute inset-0 bg-gradient-to-tr from-red-900/30 to-blue-900/30 mix-blend-color" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}

        {/* Static scanlines overlay (repeating pattern) */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-40 mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.9) 2px, rgba(0, 0, 0, 0.9) 4px)',
          }}
          aria-hidden="true"
        />

        {/* Moving thick scanline */}
        <div
          className="animate-scanline pointer-events-none absolute inset-0 z-10 h-[10vh] w-full bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-50 mix-blend-overlay"
          aria-hidden="true"
        />

        {/* Grain / Static overlay with noise animation */}
        <div
          className="animate-noise pointer-events-none absolute -inset-[200%] z-10 opacity-[0.15] mix-blend-screen"
          style={{ backgroundImage: 'url(/grain.png)', backgroundSize: '256px' }}
          aria-hidden="true"
        />

        {/* Vignette for cinematic focus */}
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-transparent to-black"
          aria-hidden="true"
        />

        {/* Content overlay */}
        <div className="relative z-20 flex h-full flex-col items-center justify-center px-6 py-20 md:px-12 md:py-32">
          {/* Status Indicator */}
          <div className="absolute left-8 top-8 flex items-center gap-3 font-mono text-xs tracking-widest text-red-500 md:left-12 md:top-12">
            <span className="h-2 w-2 animate-ping rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="opacity-80 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
              REC // NO_SIGNAL
            </span>
          </div>

          <div className="group relative">
            {/* Chromatic aberration layers */}
            <h1
              className="glitch-layer-1 absolute -left-[3px] top-[2px] z-0 text-center font-display text-6xl uppercase leading-[0.9] tracking-tighter text-cyan-400 opacity-80 mix-blend-screen md:text-8xl lg:text-9xl"
              aria-hidden="true"
            >
              {displayName}
            </h1>
            <h1
              className="glitch-layer-2 absolute -right-[3px] -top-[2px] z-0 text-center font-display text-6xl uppercase leading-[0.9] tracking-tighter text-red-500 opacity-80 mix-blend-screen md:text-8xl lg:text-9xl"
              aria-hidden="true"
            >
              {displayName}
            </h1>

            {/* Main Text */}
            <h1 className="relative z-10 text-center font-display text-6xl uppercase leading-[0.9] tracking-tighter text-gray-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] md:text-8xl lg:text-9xl">
              {displayName}
            </h1>
          </div>

          {tagline ? (
            <div className="mt-8 border-l border-red-500/50 pl-6 backdrop-blur-sm md:mt-12">
              <p className="max-w-prose text-left font-mono text-sm tracking-widest text-gray-400 drop-shadow-[0_0_2px_rgba(255,255,255,0.2)] md:text-base">
                {tagline}
              </p>
            </div>
          ) : null}

          {ctaLabel && ctaUrl ? (
            <a
              href={ctaUrl}
              className="group/cta relative mt-16 overflow-hidden border border-white/20 bg-black/40 px-8 py-4 font-mono text-xs uppercase tracking-[0.3em] text-white backdrop-blur-md transition-all hover:border-red-500/80 hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] md:text-sm"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span className="h-1 w-1 bg-red-500 transition-colors group-hover/cta:bg-red-400" />
                {ctaLabel}
              </span>

              {/* Hover scanline effect inside button */}
              <div
                className="absolute inset-0 z-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-in-out group-hover/cta:translate-x-full"
                aria-hidden="true"
              />

              {/* Corner brackets for tech feel */}
              <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-white/40 transition-colors group-hover/cta:border-red-500/80" />
              <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-white/40 transition-colors group-hover/cta:border-red-500/80" />
              <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-white/40 transition-colors group-hover/cta:border-red-500/80" />
              <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-white/40 transition-colors group-hover/cta:border-red-500/80" />
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
