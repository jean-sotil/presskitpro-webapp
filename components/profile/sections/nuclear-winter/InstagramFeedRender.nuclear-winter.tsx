'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type InstagramPost = {
  id: number | string;
  url: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * Nuclear Winter Instagram Feed
 * Desolate terminal blocks for social feeds with cold signal framing.
 */
export function InstagramFeedNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPost[];

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
        '[data-header] > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2 }
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

  if (!raw.length) return null;

  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <section ref={containerRef} className="relative border-b border-[#e0eaff]/5 bg-black px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex items-center justify-between" data-header>
           <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-8xl">
             INTEL<span className="text-[#e0eaff]">.</span>FEED
           </h2>
           <div className="text-right text-[10px] tracking-[0.4em] text-[#222] uppercase">
              IG_RELAY: ACTIVE<br />
              NODES: {posts.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <li key={String(post.id)} className="group relative" data-instagram-post>
              <div className="fractured-border bg-black/40 p-3 transition-all group-hover:bg-[#e0eaff]/5">
                <div className="relative overflow-hidden grayscale contrast-[1.3] transition-all duration-[1500ms] group-hover:grayscale-0 group-hover:contrast-100">
                  {post.oembedHtml ? (
                    <LazyEmbed html={post.oembedHtml} />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-black/50 text-[10px] uppercase tracking-[0.5em] text-[#111]">
                      SIG_LOST
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
