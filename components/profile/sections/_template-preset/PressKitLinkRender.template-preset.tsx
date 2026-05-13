'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

import { TrackedPressKitAnchor } from '../TrackedPressKitAnchor';

gsap.registerPlugin(useGSAP);

/**
 * [PRESET-NAME] press kit link section template
 *
 * Replace this description with your preset's press-kit CTA design
 * philosophy. Click-tracking is owned by `<TrackedPressKitAnchor>`.
 * The provider badge ("Hosted on Notion / Drive / …") is a localized
 * label — only surfaces for recognized providers.
 *
 * Key points to document:
 *   - CTA shape (full button, inline link, square panel, cursor-followed)
 *   - Provider badge placement
 *   - Hover/active treatment
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Pull `bundle.profile.pressKitUrl`; return null when missing
 *   - Hide the section when `pressKitHealthStatus === 'broken'`
 *     (task-30 — daily cron flips after 3 consecutive failures)
 *   - Resolve the provider via `bundle.profile.pressKitProvider`
 *   - Translate the badge with `tProviders(provider)`; null for unknown/other
 */
export function PressKitLink_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.pressKit');
  const tProviders = useTranslations('profile.pressKit.providers');
  const containerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);

  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  if (!url) return null;
  const health = (bundle.profile.pressKitHealthStatus ?? 'unknown') as
    | 'unknown'
    | 'healthy'
    | 'warning'
    | 'broken';
  if (health === 'broken') return null;
  const provider = (bundle.profile.pressKitProvider ?? 'unknown') as PressKitProvider;
  const slug = String(bundle.profile.slug ?? '');
  const badge = providerBadge(tProviders, provider);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      const p = containerRef.current?.querySelector('p:first-of-type');
      const h2 = containerRef.current?.querySelector('h2');

      if (p) {
        tl.fromTo(
          p,
          { opacity: 0 },
          { opacity: 1, duration: 0.6, ease: 'power3.out' }
        );
      }

      if (h2) {
        tl.fromTo(
          h2,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
          '-=0.3'
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out' },
          '-=0.3'
        );
      }

      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power3.out' },
          '-=0.2'
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      id="press-kit"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div ref={containerRef} className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          07 — {t('label')}
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          {t('heading')}
        </h2>
        <p ref={ctaRef} className="mt-12">
          <TrackedPressKitAnchor
            href={url}
            provider={provider}
            profileSlug={slug}
            className="inline-flex h-12 items-center border border-border bg-transparent px-6 text-sm uppercase tracking-wider text-text hover:bg-surface"
          >
            {t('ctaLegacy')}
          </TrackedPressKitAnchor>
        </p>
        {badge ? (
          <p
            ref={badgeRef}
            className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted"
          >
            {badge}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function providerBadge(t: (key: string) => string, provider: PressKitProvider): string | null {
  if (provider === 'unknown' || provider === 'other') return null;
  try {
    return t(provider);
  } catch {
    return null;
  }
}
