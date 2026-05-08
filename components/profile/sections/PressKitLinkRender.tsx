'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';
import type { PressKitVariant } from '@/lib/presets';

import { PressKitLinkSquarePanel } from './PressKitLinkRender.square-panel';
import { TrackedPressKitAnchor } from './TrackedPressKitAnchor';

export function PressKitLinkRender({
  bundle,
  variant,
}: {
  bundle: EditorBundle;
  variant?: PressKitVariant;
}) {
  const t = useTranslations('profile.pressKit');
  const tProviders = useTranslations('profile.pressKit.providers');
  if (variant === 'square-panel') {
    return <PressKitLinkSquarePanel bundle={bundle} />;
  }
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  if (!url) return null;
  // Task-30 — hide the public CTA when the daily cron has flipped the
  // health status to `broken` (3 consecutive failures).
  const health = (bundle.profile.pressKitHealthStatus ?? 'unknown') as
    | 'unknown'
    | 'healthy'
    | 'warning'
    | 'broken';
  if (health === 'broken') return null;
  const provider = (bundle.profile.pressKitProvider ?? 'unknown') as PressKitProvider;
  const slug = String(bundle.profile.slug ?? '');
  const badge = providerBadge(tProviders, provider);

  return (
    <section id="press-kit" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">{t('label')}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TrackedPressKitAnchor
          href={url}
          provider={provider}
          profileSlug={slug}
          className="inline-flex h-12 items-center border border-border bg-transparent px-6 text-sm uppercase tracking-wider hover:bg-surface focus-visible:outline-offset-2"
        >
          {t('ctaLegacy')}
        </TrackedPressKitAnchor>
        {badge ? (
          <span className="text-xs uppercase tracking-wider text-text-muted">
            {badge}
          </span>
        ) : null}
      </div>
    </section>
  );
}

/** Returns the localized "Hosted on …" badge for known providers,
 *  null for `unknown` / `other` / unrecognized values. */
function providerBadge(
  t: (key: string) => string,
  provider: PressKitProvider,
): string | null {
  if (provider === 'unknown' || provider === 'other') return null;
  try {
    return t(provider);
  } catch {
    return null;
  }
}
