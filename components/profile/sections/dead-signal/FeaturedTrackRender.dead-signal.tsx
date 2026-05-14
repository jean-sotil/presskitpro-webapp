'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyIframe } from '../LazyIframe';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Dead Signal featured track section template
 *
 * Layout: Red borders, glitch offset text, embedded iframe inside a terminal-like frame.
 */
export function FeaturedTrackDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.featuredTrack');
  const track = bundle.featuredTrack as { url?: string; oembedHtml?: string | null } | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;

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

      // 1. Header Reveal
      tl.fromTo(
        '[data-header-group] > *',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.2 }
      );

      // 2. Player Frame Reveal
      tl.fromTo(
        '[data-player-frame]',
        { opacity: 0, scale: 0.98, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1 },
        '-=0.4'
      );

      // 3. Flickering Corner Markers (Continuous)
      const corners = containerRef.current?.querySelectorAll('[data-corner]');
      corners?.forEach((corner) => {
        gsap.to(corner, {
          opacity: () => Math.random() * 0.6 + 0.4,
          duration: () => Math.random() * 0.3 + 0.1,
          repeat: -1,
          yoyo: true,
          ease: 'none',
        });
      });
    },
    { scope: containerRef }
  );

  if (!url) return null;

  return (
    <section
      ref={containerRef}
      id="faixa"
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col items-start gap-3" data-header-group>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-red-500/80" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
              07 // {t('heading')}
            </p>
          </div>

          <h2
            className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {t('label')}
            <span
              className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
              aria-hidden="true"
            >
              {t('label')}
            </span>
          </h2>
        </div>

        <div className="relative mt-12 overflow-hidden border border-white/20 bg-white/[0.02] p-2" data-player-frame>
          {/* Decorative Corner Elements */}
          <div 
            className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-red-500/80" 
            data-corner
          />
          <div 
            className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-cyan-400/80" 
            data-corner
          />
          <div 
            className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-cyan-400/80" 
            data-corner
          />
          <div 
            className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-red-500/80" 
            data-corner
          />

          {oembedHtml ? (
            <div className="opacity-90 contrast-125 saturate-50 transition-all duration-700 hover:opacity-100 hover:saturate-100">
              <LazyIframe html={oembedHtml} />
            </div>
          ) : (
            <p className="break-all p-6 text-center text-sm text-gray-500">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-red-400"
              >
                [ {t('openExternal')} ] ↗
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
