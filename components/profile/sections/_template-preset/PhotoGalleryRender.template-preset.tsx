'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

gsap.registerPlugin(useGSAP);

type GalleryEntry = {
  id: number;
  bucket: string;
  path: string;
  alt?: string;
  decorative?: boolean;
};

/**
 * [PRESET-NAME] photo gallery section template
 *
 * Replace this description with your preset's gallery design philosophy.
 * Key points to document:
 *   - Layout (mosaic, uniform grid, film strip, carousel)
 *   - Aspect ratio + intrinsic sizing strategy
 *   - Hover/focus treatment, motion-safe vs reduce-motion
 *   - Decorative overlays (gradients, borders, corner marks)
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Filter `bundle.profile.gallery` to keep only resolved Media rows
 *   - Return null when the gallery is empty
 *   - Use `mediaUrl()` to resolve src; alt is empty when `decorative`
 *   - Wrap each `<Image fill>` in a `relative` parent with intrinsic aspect
 */
export function PhotoGallery_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.gallery');
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLUListElement>(null);

  const raw = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  const items = Array.isArray(raw)
    ? raw.filter(
        (entry): entry is GalleryEntry =>
          typeof entry === 'object' && entry !== null && 'id' in entry,
      )
    : [];

  useGSAP(
    () => {
      const images = galleryRef.current?.querySelectorAll('li');
      if (!images) return;

      gsap.fromTo(
        images,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'back.out'
        }
      );
    },
    { scope: containerRef }
  );

  if (items.length === 0) return null;

  return (
    <section
      ref={containerRef}
      id="galeria"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          02 — {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('label')}
        </h2>
        <ul ref={galleryRef} className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {items.map((item) => {
            const src = mediaUrl({ bucket: item.bucket, path: item.path });
            if (!src) return null;
            const alt = item.decorative ? '' : (item.alt ?? '');
            return (
              <li
                key={item.id}
                className="relative aspect-square overflow-hidden border border-border bg-surface"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
