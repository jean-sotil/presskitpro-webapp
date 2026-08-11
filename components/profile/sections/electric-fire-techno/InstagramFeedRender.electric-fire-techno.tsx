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
 * Electric Fire Techno instagram feed — 3-up grid of oembed posts on
 * a dark surface, each tile wearing the same cyan glow border the
 * gallery uses.
 */
export function InstagramElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      });

      // 1. Header reveal
      tl.fromTo(
        '[data-fire-ig-header] > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );

      // 2. Posts staggered reveal
      tl.fromTo(
        '[data-fire-ig-post]',
        { opacity: 0, scale: 0.95, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
        },
        '-=0.4'
      );

      // 3. Fire glow pulse
      gsap.to('[data-fire-glow]', {
        opacity: 0.6,
        duration: 2,
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.4,
          from: 'random',
        },
        ease: 'sine.inOut',
      });
    },
    { scope: containerRef }
  );

  if (posts.length === 0) return null;

  return (
    <section
      ref={containerRef}
      data-glow-feed
      className="relative border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,_rgba(255,69,0,0.35)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,140,0,0.28)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(ellipse_at_left,_rgba(255,69,0,0.22)_0%,_transparent_70%)]"
      />
      <span
        aria-hidden="true"
        data-fire-glow
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(ellipse_at_right,_rgba(255,140,0,0.2)_0%,_transparent_70%)]"
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div data-fire-ig-header className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            06 — Instagram
          </p>
          <h2
            data-fire-section-title
            className="mt-6 font-display uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Instagram
          </h2>
        </div>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) =>
            post.oembedHtml ? (
              <li
                key={String(post.id)}
                data-fire-ig-post
                className="relative overflow-hidden border bg-surface transition-transform duration-base motion-safe:hover:-translate-y-1"
              >
                <LazyEmbed html={post.oembedHtml} />
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
