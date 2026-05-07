import type { EditorBundle } from '@/lib/editor/bundle';
import type { PressKitProvider } from '@/lib/payload/hooks/derive-press-kit-provider';

import { TrackedPressKitAnchor } from './TrackedPressKitAnchor';

const PROVIDER_BADGE: Record<PressKitProvider, string | null> = {
  unknown: null,
  'google-drive': 'Hospedado no Google Drive',
  dropbox: 'Hospedado no Dropbox',
  onedrive: 'Hospedado no OneDrive',
  wetransfer: 'Hospedado no WeTransfer',
  notion: 'Hospedado no Notion',
  mediafire: 'Hospedado no MediaFire',
  // `other` covers self-hosted / unrecognized — no specific badge.
  other: null,
};

export function PressKitLinkRender({ bundle }: { bundle: EditorBundle }) {
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  if (!url) return null;
  // Task-30 — hide the public CTA when the daily cron has flipped the
  // health status to `broken` (3 consecutive failures). Bookers don't
  // get a dead download link; the artist still sees their broken state
  // in the editor.
  const health = (bundle.profile.pressKitHealthStatus ?? 'unknown') as
    | 'unknown'
    | 'healthy'
    | 'warning'
    | 'broken';
  if (health === 'broken') return null;
  const provider = (bundle.profile.pressKitProvider ?? 'unknown') as PressKitProvider;
  const slug = String(bundle.profile.slug ?? '');
  const badge = PROVIDER_BADGE[provider];

  return (
    <section id="press-kit" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Press kit</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TrackedPressKitAnchor
          href={url}
          provider={provider}
          profileSlug={slug}
          className="inline-flex h-12 items-center border border-border bg-transparent px-6 text-sm uppercase tracking-wider hover:bg-surface focus-visible:outline-offset-2"
        >
          Baixar press kit
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
