'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

import { TrackedPressKitAnchor } from './TrackedPressKitAnchor';

/**
 * Hard Techno Underground press-kit panel — full-bleed centered block
 * with a numbered "06 — PRESSKIT" marker, an oversized title, and a
 * retro-pointer cursor SVG that points at the download CTA. A radial
 * ink-splatter sits behind the content as a watermark; the splatter
 * is `aria-hidden` and pointer-events:none so it never blocks clicks.
 */
export function PressKitLinkSquarePanel({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile');
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
          try { return tProviders(provider); } catch { return null; }
        })();

  return (
    <section
      id="press-kit"
      className="relative isolate overflow-hidden border-b border-border bg-bg px-6 py-24 text-center md:px-12 md:py-32"
    >
      <RadialSplatter className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 text-accent opacity-[0.18]" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
          06 — {t('pressKit.label')}
        </p>
        <h2
          className="mt-6 whitespace-pre-line font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2.75rem, 7vw, 5.5rem)' }}
        >
          {t('pressKit.heading')}
        </h2>
        {badge ? (
          <p className="mt-6 text-xs uppercase tracking-[0.18em] text-text-muted">
            {badge}
          </p>
        ) : null}
        <div className="mt-12 flex items-center justify-center gap-4">
          <RetroPointer className="h-12 w-12 -rotate-12 text-text" />
          <TrackedPressKitAnchor
            href={url}
            provider={provider}
            profileSlug={slug}
            className="inline-flex h-12 items-center bg-accent px-10 text-xs font-bold uppercase tracking-[0.18em] text-accent-contrast transition-colors duration-quick hover:bg-text hover:text-bg"
          >
            {t('ctaUnderground')}
          </TrackedPressKitAnchor>
        </div>
      </div>
    </section>
  );
}

function RadialSplatter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="200" cy="200" r="80" />
      <path d="M200 60c8 22 28 38 50 42-22 8-38 28-42 50-8-22-28-38-50-42 22-8 38-28 42-50z" />
      <path d="M340 200c-22 8-38 28-42 50-8-22-28-38-50-42 22-8 38-28 42-50 8 22 28 38 50 42z" />
      <path d="M200 340c-8-22-28-38-50-42 22-8 38-28 42-50 8 22 28 38 50 42-22 8-38 28-42 50z" />
      <path d="M60 200c22-8 38-28 42-50 8 22 28 38 50 42-22 8-38 28-42 50-8-22-28-38-50-42z" />
      <circle cx="120" cy="120" r="6" />
      <circle cx="280" cy="120" r="4" />
      <circle cx="280" cy="280" r="8" />
      <circle cx="120" cy="280" r="5" />
      <circle cx="60" cy="200" r="3" />
      <circle cx="340" cy="200" r="3" />
    </svg>
  );
}

function RetroPointer({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M32 8v28" />
      <path d="M22 36c0-3 4-6 10-6s10 3 10 6v18c0 3-3 4-6 4H28c-3 0-6-1-6-4V36z" fill="currentColor" stroke="none" opacity="0.95" />
      <path d="M28 40v14M32 40v14M36 40v14" stroke="#000" strokeWidth="1.5" />
      <path d="M14 40h6" />
      <path d="M44 40h6" />
    </svg>
  );
}
