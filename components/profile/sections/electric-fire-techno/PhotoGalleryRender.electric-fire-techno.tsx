'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
  decorative?: boolean;
};

/**
 * Electric Fire Techno gallery — 3-up uniform grid where each card
 * carries a cyan-glow border, a dark gradient overlay from the bottom,
 * and a corner lightning bolt SVG.
 */
export function PhotoGalleryElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.gallery');
  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const items = Array.isArray(raw)
    ? raw.filter(
        (entry): entry is GalleryEntry =>
          typeof entry === 'object' && entry !== null && 'id' in entry,
      )
    : [];

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
      });

      // 1. Header entrance
      tl.fromTo(
        '[data-fire-gallery-header] > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );

      // 2. Gallery items staggered "pop" reveal
      tl.fromTo(
        '[data-fire-gallery-item]',
        { opacity: 0, scale: 0.8, rotation: () => Math.random() * 4 - 2 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          stagger: {
            each: 0.08,
            from: 'start',
            grid: 'auto',
          },
          ease: 'back.out(1.5)',
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

  if (items.length === 0) return null;

  return (
    <section
      ref={containerRef}
      id="galeria"
      data-glow-grid
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
        <div data-fire-gallery-header className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            02 — {t('label')}
          </p>
          <h2
            data-fire-section-title
            className="mt-6 font-display uppercase leading-none tracking-tight"
            style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
          >
            {t('label')}
          </h2>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {items.map((item) => {
            const src = mediaUrl({ bucket: item.bucket, path: item.path });
            if (!src) return null;
            const alt = item.decorative ? '' : (item.alt ?? '');
            return (
              <li
                key={item.id}
                data-fire-gallery-item
                className="group relative aspect-square overflow-hidden border bg-surface transition-transform duration-base motion-safe:hover:-translate-y-1.5"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-slow motion-safe:group-hover:scale-[1.04]"
                />
                {/* Bottom-up dark gradient */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg/85 to-transparent"
                />
                <CornerBolt className="pointer-events-none absolute right-2 top-2 h-5 w-5" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function CornerBolt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{
        color: '#00BFFF',
        filter: 'drop-shadow(0 0 6px rgba(0, 191, 255, 0.7))',
      }}
    >
      <path d="M14 2L4 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  );
}
