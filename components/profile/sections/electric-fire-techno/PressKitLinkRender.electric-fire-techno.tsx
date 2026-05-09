'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

import { TrackedPressKitAnchor } from '../TrackedPressKitAnchor';

/**
 * Electric Fire Techno press-kit — centered single-CTA panel with a
 * neon fire-orange bordered button (the actual neon-pulse animation
 * comes from globals.css scoped to `section#press-kit a`). Per
 * docs/presets/MediakitPRO_template_3.json `pressKit.cta`.
 *
 * Decorative lightning bolts flank the CTA at small sizes; they fade
 * out on narrow viewports to keep the focus on the button. The
 * provider badge ("Hosted on Notion / Drive / etc.") still surfaces
 * below the CTA when the press kit is on a recognized provider.
 */
export function PressKitLinkElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.pressKit');
  const tProviders = useTranslations('profile.pressKit.providers');
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
  const badge =
    provider === 'unknown' || provider === 'other'
      ? null
      : (() => {
          try {
            return tProviders(provider);
          } catch {
            return null;
          }
        })();

  return (
    <section
      id="press-kit"
      className="relative isolate overflow-hidden border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,_rgba(255,69,0,0.35)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,140,0,0.28)_0%,_transparent_60%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[radial-gradient(ellipse_at_left,_rgba(255,69,0,0.22)_0%,_transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[radial-gradient(ellipse_at_right,_rgba(255,140,0,0.2)_0%,_transparent_70%)]"
      />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          07 — {t('label')}
        </p>
        <h2
          data-fire-section-title
          className="mt-6 font-display uppercase leading-[0.92] tracking-tight"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
        >
          {t('heading')}
        </h2>
        <div className="mt-12 flex items-center gap-5">
          <SideBolt className="hidden h-10 w-10 -rotate-12 sm:block" />
          <TrackedPressKitAnchor
            href={url}
            provider={provider}
            profileSlug={slug}
            className="inline-flex h-16 items-center border-2 bg-transparent px-10 font-display text-base font-bold uppercase tracking-[0.2em] text-text transition-transform duration-quick md:h-20 md:px-14 md:text-lg"
          >
            {t('ctaUnderground')}
          </TrackedPressKitAnchor>
          <SideBolt className="hidden h-10 w-10 rotate-12 sm:block" mirror />
        </div>
        {badge ? (
          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            {badge}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SideBolt({
  className,
  mirror = false,
}: {
  className?: string;
  mirror?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={{
        color: '#FF4500',
        filter: 'drop-shadow(0 0 10px rgba(255, 69, 0, 0.6))',
        transform: mirror ? 'scaleX(-1)' : undefined,
      }}
    >
      <path d="M14 2L4 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  );
}
