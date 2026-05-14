'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Nuclear Winter About
 * Desolate layout with terminal-style biography and cold signal framing.
 */
export function AboutNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
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

      // 1. Sidebar Reveal
      tl.fromTo(
        '[data-sidebar]',
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 1 }
      );

      tl.fromTo(
        '[data-sidebar-item]',
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.1 },
        '-=0.6'
      );

      // 2. Bio Container Reveal
      tl.fromTo(
        '[data-bio-container]',
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2 },
        '-=0.8'
      );

      tl.fromTo(
        '[data-bio-content]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2 },
        '-=0.6'
      );

      // 3. Geiger dot flickering
      gsap.to('[data-geiger-dot]', {
        opacity: () => Math.random() * 0.6 + 0.2,
        duration: () => Math.random() * 0.4 + 0.2,
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: containerRef }
  );

  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      ref={containerRef}
      className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-24 lg:grid-cols-12">
          {/* Cold sidebar marker */}
          <div className="lg:col-span-4" data-sidebar>
            <div className="sticky top-20">
               <div className="mb-8 flex items-center gap-4" data-sidebar-item>
                  <div className="h-3 w-3 bg-[#e0eaff]" data-geiger-dot />
                  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#e0eaff]/60">LOG_ARCHIVE // 01</span>
               </div>
               
               <h2 className="font-display text-6xl uppercase leading-none tracking-tighter text-white md:text-8xl" data-sidebar-item>
                 ORIGIN<br />
                 <span className="text-[#e0eaff]/70 text-shadow-glow">DOSSIER</span>
               </h2>

               <div className="mt-16 hidden space-y-6 border-l border-[#e0eaff]/10 pl-8 text-[9px] font-bold tracking-[0.3em] text-[#333] uppercase lg:block" data-sidebar-item>
                  <p>ENCRYPTION: MAX_SECURE</p>
                  <p>SUBJECT: {bundle.profile.slug.toUpperCase()}</p>
                  <p>EXPIRY: NEVER</p>
               </div>
            </div>
          </div>

          {/* Bio Container */}
          <div className="lg:col-span-8" data-bio-container>
            <div className="fractured-border group relative bg-black/40 p-10 md:p-16 lg:p-20">
              {tagline ? (
                <div className="mb-12" data-bio-content>
                  <p className="text-2xl font-bold uppercase leading-tight tracking-[0.2em] text-white md:text-3xl">
                    {tagline}
                  </p>
                  <div className="mt-6 h-px w-32 bg-[#e0eaff]/20" />
                </div>
              ) : null}

              {hasBio ? (
                <div className="prose prose-invert max-w-none" data-bio-content>
                  <RichTextRender
                    state={bio}
                    className="font-mono text-lg leading-relaxed text-gray-400 selection:bg-[#e0eaff] selection:text-black"
                  />
                </div>
              ) : null}

              <div className="mt-20 flex items-center justify-between border-t border-[#e0eaff]/5 pt-10" data-bio-content>
                 <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-0.5 w-6 bg-[#e0eaff]/5" />
                    ))}
                 </div>
                 <span className="text-[9px] font-bold tracking-[0.4em] text-[#222] uppercase">EOF // END_OF_TRANSMISSION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
