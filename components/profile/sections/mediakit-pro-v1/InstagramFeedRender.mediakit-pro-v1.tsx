import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * MediakitPRO Instagram feed — the unstyled "classic" rendering,
 * extracted from the root dispatcher's default branch. Instagram's
 * iframe owns each post's interior; this component supplies the
 * section header and the bare 3-up grid layout. Server component —
 * no `'use client'` because there are no hooks.
 */
export function InstagramFeedMediakitProV1({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  if (posts.length === 0) return null;

  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2
        className="mt-6 font-display uppercase leading-none tracking-tight text-text"
        style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
      >
        Instagram
      </h2>
      <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) =>
          post.oembedHtml ? (
            <li key={String(post.id)}>
              <LazyEmbed html={post.oembedHtml} />
            </li>
          ) : null,
        )}
      </ul>
    </section>
  );
}
