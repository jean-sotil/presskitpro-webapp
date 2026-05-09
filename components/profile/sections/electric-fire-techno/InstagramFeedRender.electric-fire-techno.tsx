import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * Electric Fire Techno instagram feed — 3-up grid of oembed posts on
 * a dark surface, each tile wearing the same cyan glow border the
 * gallery uses. Numbered "06 — INSTAGRAM" mono marker + display
 * gradient heading match the rest of the preset's section rhythm.
 *
 * The embeds themselves are owned by Instagram's iframe (LazyEmbed
 * handles the load). The fire-techno chrome lives only in the
 * surrounding `<li>` border + glow + dark gradient overlay so the
 * styling never tries to override the embed's interior.
 */
export function InstagramElectricFireTechno({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  if (posts.length === 0) return null;

  return (
    <section
      data-glow-feed
      className="relative border-b border-border bg-bg px-6 py-20 md:px-12 md:py-28"
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
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
          06 — Instagram
        </p>
        <h2
          data-fire-section-title
          className="mt-6 text-center font-display uppercase leading-none tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          Instagram
        </h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) =>
            post.oembedHtml ? (
              <li
                key={String(post.id)}
                className="relative overflow-hidden border bg-surface transition-transform duration-base motion-safe:hover:-translate-y-1"
              >
                <LazyEmbed html={post.oembedHtml} />
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
