import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * [PRESET-NAME] Instagram feed section template
 *
 * Replace this description with your preset's Instagram-feed design
 * philosophy. Instagram's iframe owns the post interior — only the
 * tile border / spacing / hover treatment belong to the preset.
 *
 * Key points to document:
 *   - Grid columns and gap at each breakpoint
 *   - Tile chrome (border, glow, shadow, none)
 *   - Hover/lift behavior (motion-safe only)
 *   - Any CSS data attributes used for styling
 *
 * Code pattern:
 *   - Pull `bundle.instagramPosts`, sort by `displayOrder`
 *   - Return null when the list is empty (spec AC: section hides)
 *   - Render `<LazyEmbed>` for posts with oEmbed HTML; skip those without
 *   - This template is a server component — drop `'use client'` unless
 *     hooks (`useTranslations` etc.) are added
 */
export function InstagramFeed_TEMPLATE_PRESET({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );

  if (posts.length === 0) return null;

  return (
    <section className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          06 — Instagram
        </p>
        <h2
          className="mt-6 font-display uppercase leading-none tracking-tight text-text"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          Instagram
        </h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) =>
            post.oembedHtml ? (
              <li key={String(post.id)} className="border border-border bg-surface">
                <LazyEmbed html={post.oembedHtml} />
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
