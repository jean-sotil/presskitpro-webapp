import type { EditorBundle } from '@/lib/editor/bundle';
import type { Preset } from '@/lib/presets';

import { InstagramFeedEditorialNightlifeV1 } from './editorial-nightlife-v1/InstagramFeedRender.editorial-nightlife-v1';
import { InstagramElectricFireTechno } from './electric-fire-techno/InstagramFeedRender.electric-fire-techno';
import { InstagramFeedFestivalClubOrange } from './festival-club-orange/InstagramFeedRender.festival-club-orange';
import { InstagramFeedMediakitProV1 } from './mediakit-pro-v1/InstagramFeedRender.mediakit-pro-v1';
import { LazyEmbed } from './LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

export function InstagramFeedRender({
  bundle,
  preset,
}: {
  bundle: EditorBundle;
  preset?: Preset | null;
}) {
  // Folder-owned preset dispatch.
  if (preset?.id === 'electric-fire-techno') return <InstagramElectricFireTechno bundle={bundle} />;
  if (preset?.id === 'mediakit-pro-v1') return <InstagramFeedMediakitProV1 bundle={bundle} />;
  if (preset?.id === 'festival-club-orange') return <InstagramFeedFestivalClubOrange bundle={bundle} />;
  if (preset?.id === 'editorial-nightlife-v1') return <InstagramFeedEditorialNightlifeV1 bundle={bundle} />;

  // No preset → unstyled "classic" fallback for legacy profiles.
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
