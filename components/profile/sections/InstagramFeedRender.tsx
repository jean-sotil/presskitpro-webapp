import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from './LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

export function InstagramFeedRender({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  // Spec AC: removing all posts hides the section entirely.
  if (posts.length === 0) return null;

  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Instagram</h2>
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
