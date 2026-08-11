'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

gsap.registerPlugin(useGSAP);

type ImageMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Electric Fire Techno hero — full-bleed portrait with a glitched RGB
 * chromatic-aberration drop-shadow, gold→amber→fire gradient artist
 * title overlaid at the bottom, decorative cyan lightning bolts and
 * radial fire-edge glows. Per docs/presets/MediakitPRO_template_3.json.
 */
export function HeroElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
  const profile = bundle.profile;
  const content = bundle.content;
  const portraitMedia = profile.portrait as ImageMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1600) || 1600;
  const portraitHeight = (portraitMedia?.height ?? 2000) || 2000;

  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // 1. Portrait entrance
      tl.fromTo(
        '[data-fire-hero-portrait]',
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' }
      );

      // 2. Metadata entrance
      tl.fromTo(
        '[data-fire-metadata]',
        { opacity: 0, x: 20 },
        { opacity: 0.6, x: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
        '-=0.8'
      );

      // 3. Lightning bolts "strike" entrance
      tl.fromTo(
        '[data-fire-lightning]',
        { opacity: 0, scale: 0, rotation: 45 },
        {
          opacity: 1,
          scale: 1,
          rotation: (i, el) => {
            const currentRotation = gsap.getProperty(el, 'rotation') as number;
            return currentRotation;
          },
          duration: 0.4,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        },
        '-=0.4'
      );

      // 4. Title staggered reveal
      tl.fromTo(
        '[data-fire-hero-title]',
        { opacity: 0, y: 30, skewX: -5 },
        { opacity: 1, y: 0, skewX: 0, duration: 0.8, ease: 'power4.out' },
        '-=0.2'
      );

      // 5. CTA entrance
      if (ctaUrl) {
        tl.fromTo(
          '[data-fire-cta]',
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' },
          '-=0.4'
        );
      }

      // Continuous flickering for lightning
      gsap.to('[data-fire-lightning]', {
        opacity: 0.4,
        repeat: -1,
        yoyo: true,
        duration: 0.1,
        repeatDelay: Math.random() * 2,
        ease: 'rough({ template: none.out, strength: 2, points: 20, taper: none, randomize: true, clamp:  false})',
      });
    },
    { scope: containerRef }
  );

  return (
    <header
      ref={containerRef}
      data-fire-hero
      className="relative isolate overflow-hidden border-b border-border bg-bg"
    >
      <div className="relative h-[78vh] min-h-[560px] w-full md:h-[88vh]">
        {portraitUrl ? (
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1024px"
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            data-fire-hero-portrait
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-surface to-bg"
          />
        )}
        {/* Bottom dark overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg via-bg/70 to-transparent"
        />
        <LightningBolt
          data-fire-lightning
          className="pointer-events-none absolute right-[8%] top-[12%] h-20 w-20 rotate-[-12deg] md:h-28 md:w-28"
        />
        <LightningBolt
          data-fire-lightning
          variant="small"
          className="pointer-events-none absolute left-[10%] top-[22%] h-10 w-10 rotate-[18deg] opacity-80"
        />
        <LightningBolt
          data-fire-lightning
          variant="small"
          className="pointer-events-none absolute bottom-[40%] right-[18%] h-8 w-8 rotate-[-26deg] opacity-70"
        />
        {/* Sci-fi corner metadata strings */}
        <span
          aria-hidden="true"
          data-fire-metadata
          className="pointer-events-none absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.25em] text-text-muted opacity-60"
        >
          0xFF4500 · 09090F
        </span>
        <span
          aria-hidden="true"
          data-fire-metadata
          className="pointer-events-none absolute bottom-4 right-4 font-mono text-[9px] uppercase tracking-[0.25em] text-text-muted opacity-50"
        >
          {`LAT 23°33'S · LON 46°38'W`}
        </span>
        {/* Title overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-12 md:px-12 md:pb-20">
          <p
            data-fire-metadata
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted"
          >
            presskit.pro/{profile.slug}
          </p>
          <h1
            data-fire-hero-title
            className="mt-3 whitespace-pre-line font-display uppercase leading-[0.88] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(3rem, 11vw, 9rem)' }}
          >
            {displayName}
          </h1>
          {ctaUrl ? (
            <p className="mt-8">
              <a
                href={ctaUrl}
                target={ctaUrl.startsWith('http') ? '_blank' : undefined}
                rel={ctaUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                data-fire-cta
                className="inline-flex h-12 items-center border-2 border-accent bg-transparent px-8 text-xs font-bold uppercase tracking-[0.2em] text-text transition-transform duration-quick hover:scale-[1.02]"
              >
                {ctaLabel ?? t('ctaDefault')}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function LightningBolt({
  className,
  variant = 'large',
  ...props
}: {
  className?: string;
  variant?: 'large' | 'small';
  [key: string]: unknown;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
      style={{
        color: variant === 'large' ? '#00BFFF' : '#FFD700',
        filter: `drop-shadow(0 0 ${variant === 'large' ? '12px' : '8px'} currentColor)`,
      }}
    >
      <path d="M14 2L4 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  );
}
