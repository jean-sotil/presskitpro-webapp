import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * Dead Signal Instagram feed section template
 *
 * Layout: Grid, harsh lines, terminal aesthetic markers.
 */
export function InstagramFeedDeadSignal({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (posts.length === 0) return null;

  return (
    <section className="relative border-t border-white/10 bg-black/80 px-6 py-20 font-mono text-gray-300 backdrop-blur-md md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 inline-flex items-center gap-3">
          <span className="h-px w-8 bg-red-500/80" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-red-500/80">06 // INSTAGRAM</p>
        </div>

        <h2
          className="relative font-display uppercase leading-none tracking-tight text-white drop-shadow-[2px_2px_0px_rgba(239,68,68,0.8)]"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
        >
          FEED
          <span
            className="absolute -left-[2px] top-[1px] -z-10 text-cyan-400 opacity-60"
            aria-hidden="true"
          >
            FEED
          </span>
        </h2>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((post) =>
            post.oembedHtml ? (
              <li
                key={String(post.id)}
                className="group relative border border-white/10 bg-white/[0.02] p-1 transition-colors hover:border-red-500/50"
              >
                {/* Tech Corners */}
                <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-transparent transition-colors group-hover:border-red-500/80" />
                <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-transparent transition-colors group-hover:border-cyan-400/80" />

                <div className="opacity-80 saturate-0 transition-all duration-500 group-hover:opacity-100 group-hover:saturate-100">
                  <LazyEmbed html={post.oembedHtml} />
                </div>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
