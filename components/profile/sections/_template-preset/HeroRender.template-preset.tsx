'use client';

import { useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';
import { mediaUrl } from '@/lib/media/url';

gsap.registerPlugin(useGSAP);

type PortraitMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

/**
 * [PRESET-NAME] hero section template
 *
 * Replace this description with your preset's hero design philosophy.
 * Key points to document:
 *   - Layout (full-bleed, split, centered, etc.)
 *   - Visual hierarchy and key design elements
 *   - Responsive behavior
 *   - Decorative elements and their purpose
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Use `mediaUrl()` to resolve portrait URLs
 *   - Extract data from `bundle.profile` and `bundle.content`
 *   - Include fallback content when media is missing
 *   - Mark decorative elements with `aria-hidden="true"`
 */
export function Hero_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const portraitMedia = profile.portrait as PortraitMedia | null | undefined;
  const portraitUrl = mediaUrl(portraitMedia ?? null);
  const portraitWidth = (portraitMedia?.width ?? 1024) || 1024;
  const portraitHeight = (portraitMedia?.height ?? 1365) || 1365;

  const tagline = (content?.tagline as string | undefined) ?? null;
  const ctaLabel = (content?.ctaLabel as string | undefined) ?? null;
  const ctaUrl = (content?.ctaUrl as string | undefined) ?? null;

  const displayName = profile.slug.replace(/-/g, ' ');

  useGSAP(
    () => {
      const tl = gsap.timeline();

      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        );
      }

      if (taglineRef.current) {
        tl.fromTo(
          taglineRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.4'
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out' },
          '-=0.3'
        );

        const onHoverCta = () => {
          gsap.to(ctaRef.current, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
        };

        const onHoverCtaOut = () => {
          gsap.to(ctaRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
        };

        ctaRef.current.addEventListener('mouseenter', onHoverCta);
        ctaRef.current.addEventListener('mouseleave', onHoverCtaOut);

        return () => {
          ctaRef.current?.removeEventListener('mouseenter', onHoverCta);
          ctaRef.current?.removeEventListener('mouseleave', onHoverCtaOut);
        };
      }
    },
    { scope: containerRef }
  );

  return (
    <header
      ref={containerRef}
      className="relative isolate overflow-hidden border-b border-border bg-bg"
    >
      <div className="relative min-h-[640px] md:min-h-[100vh]">
        {/* Background/portrait layer */}
        {portraitUrl ? (
          <Image
            src={portraitUrl}
            alt={portraitMedia?.alt ?? ''}
            width={portraitWidth}
            height={portraitHeight}
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 90vw, 1024px"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-surface to-bg" />
        )}

        {/* Content overlay */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-20 md:px-12 md:py-32">
          <h1
            ref={titleRef}
            className="text-center font-display uppercase leading-none tracking-tight text-text"
          >
            {displayName}
          </h1>
          {tagline ? (
            <p ref={taglineRef} className="mt-4 max-w-prose text-center text-text">
              {tagline}
            </p>
          ) : null}
          {ctaLabel && ctaUrl ? (
            <a
              ref={ctaRef}
              href={ctaUrl}
              className="mt-6 border border-text px-6 py-3 text-sm uppercase tracking-wider hover:bg-text hover:text-bg"
            >
              {ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
