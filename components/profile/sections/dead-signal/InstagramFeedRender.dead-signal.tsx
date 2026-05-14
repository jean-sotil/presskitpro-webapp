'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * Dead Signal Instagram feed section template
 *
 * Layout: Grid, harsh lines, terminal aesthetic markers.
 */
export function InstagramFeedDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

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

      // 2. Posts Staggered Reveal
      tl.fromTo(
        '[data-instagram-post]',
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.15 },
        '-=0.6'
      );
    },
    { scope: containerRef }
  );

  if (posts.length === 0) return null;

  return (
    <section 
      ref={containerRef}
      className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-start gap-3" data-header-group>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-red-500/80" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">06 // INSTAGRAM</p>
          </div>

          <h2
            className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            FEED
            <span
              className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
              aria-hidden="true"
            >
              FEED
            </span>
          </h2>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) =>
            post.oembedHtml ? (
              <li
                key={String(post.id)}
                className="group relative border border-white/10 bg-white/[0.02] p-1 transition-colors hover:border-red-500/50"
                data-instagram-post
              >
                {/* Tech Corners */}
                <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-transparent transition-colors group-hover:border-red-500/80" />
                <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-transparent transition-colors group-hover:border-cyan-400/80" />

                <div className="opacity-80 saturate-0 transition-all duration-500 group-hover:opacity-100 group-hover:saturate-100">
                  <LazyEmbed html={post.oembedHtml} />
                </div>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
