'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

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
 * and a corner lightning bolt SVG. Per
 * docs/presets/MediakitPRO_template_3.json `discography.layout`.
 *
 * Cards are square (aspect-1/1 per the spec) and lift on hover via
 * `motion-safe:hover:-translate-y-1.5` plus a cyan-shadow halo bump.
 * Falls back gracefully on touch where there is no hover state.
 *
 * The cyan glow itself is supplied by globals.css scoped to
 * `[data-preset-electric-fire] [data-glow-grid] li` so the styling
 * stays out of this component and respects reduced-motion.
 */
export function PhotoGalleryGlowGrid({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.gallery');
  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const items = Array.isArray(raw)
    ? raw.filter((entry): entry is GalleryEntry =>
        typeof entry === 'object' && entry !== null && 'id' in entry,
      )
    : [];
  if (items.length === 0) return null;

  return (
    <section
      id="galeria"
      data-glow-grid
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          02 — {t('label')}
        </p>
        <h2
          data-fire-section-title
          className="mt-6 text-center font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2.25rem, 5.5vw, 4rem)' }}
        >
          {t('label')}
        </h2>
        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {items.map((item) => {
            const src = mediaUrl({ bucket: item.bucket, path: item.path });
            if (!src) return null;
            const alt = item.decorative ? '' : item.alt ?? '';
            return (
              <li
                key={item.id}
                className="group relative aspect-square overflow-hidden border bg-surface transition-transform duration-base motion-safe:hover:-translate-y-1.5"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover transition-transform duration-slow motion-safe:group-hover:scale-[1.04]"
                />
                {/* Bottom-up dark gradient so corner bolts and any future
                    title overlay stay legible. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg/85 to-transparent"
                />
                <CornerBolt
                  className="pointer-events-none absolute right-2 top-2 h-5 w-5"
                />
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
