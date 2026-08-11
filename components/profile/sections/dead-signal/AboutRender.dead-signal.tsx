'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Dead Signal biography section template
 *
 * Layout: Single column, dark cyberpunk aesthetic.
 * Styling: Glitchy header typography, stark mono tagline, readable body text
 * with high contrast.
 * Decorative elements: Red/cyan text shadows, corner brackets.
 */
export function AboutDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('profile.about');
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

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

      // 1. Header & Label Reveal
      tl.fromTo(
        '[data-section-label]',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6 }
      );

      tl.fromTo(
        '[data-section-heading]',
        { opacity: 0, y: 30, skewX: 10 },
        { 
          opacity: 1, 
          y: 0, 
          skewX: 0, 
          duration: 0.8,
          onComplete: () => {
            // Subtle persistent glitch for the heading shadow
            gsap.to('[data-heading-shadow]', {
              x: () => (Math.random() - 0.5) * 4,
              y: () => (Math.random() - 0.5) * 2,
              opacity: () => 0.4 + Math.random() * 0.4,
              duration: 0.1,
              repeat: -1,
              repeatRefresh: true,
              repeatDelay: Math.random() * 3,
            });
          }
        },
        '-=0.4'
      );

      // 2. Tagline Reveal
      tl.fromTo(
        '[data-tagline]',
        { opacity: 0, x: -30, borderLeftWidth: 0 },
        { opacity: 1, x: 0, borderLeftWidth: 2, duration: 0.8 },
        '-=0.4'
      );

      // 3. Bio Reveal
      tl.fromTo(
        '[data-bio-container]',
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 1 },
        '-=0.6'
      );

      tl.fromTo(
        '[data-bio-content] > *',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
        '-=0.8'
      );
    },
    { scope: containerRef }
  );

  if (!tagline && !hasBio) return null;

  return (
    <section
      ref={containerRef}
      id="sobre"
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 inline-flex items-center gap-3" data-section-label>
          <span className="h-px w-8 bg-red-500/80" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">
            01 // {t('label')}
          </p>
        </div>

        <h2
          className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          data-section-heading
        >
          {t('heading')}
          <span
            className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
            aria-hidden="true"
            data-heading-shadow
          >
            {t('heading')}
          </span>
        </h2>

        {tagline ? (
          <p 
            className="mt-8 border-l-2 border-red-500 pl-6 text-sm uppercase tracking-widest text-gray-200"
            data-tagline
          >
            {tagline}
          </p>
        ) : null}

        {hasBio ? (
          <div className="group relative mt-10 p-6 sm:p-8" data-bio-container>
            {/* Corner brackets */}
            <div className="absolute left-0 top-0 h-4 w-4 border-l border-t border-white/20 transition-colors group-hover:border-red-500/50" />
            <div className="absolute right-0 top-0 h-4 w-4 border-r border-t border-white/20 transition-colors group-hover:border-red-500/50" />
            <div className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/20 transition-colors group-hover:border-red-500/50" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/20 transition-colors group-hover:border-red-500/50" />

            <div data-bio-content>
              <RichTextRender
                state={bio}
                className="prose prose-invert max-w-none font-sans text-base leading-relaxed text-gray-400"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
