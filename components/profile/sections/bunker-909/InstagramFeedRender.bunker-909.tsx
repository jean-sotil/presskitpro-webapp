import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

type InstagramPostRow = {
  id: number | string;
  url?: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * Bunker 909 Instagram Feed
 * Brutalist grid with high-contrast borders and heavy industrial feel.
 */
export function InstagramFeedBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.instagram');
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPostRow[];
  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  if (posts.length === 0) return null;

  return (
    <section className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="h-2 w-10 bg-[#ff5c00]" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#ff5c00]">
                06 // {t('label')}
              </p>
            </div>
            <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-white md:text-7xl">
              FEED<span className="text-[#ff5c00]">.</span>MAP
            </h2>
          </div>
          <div className="hidden border-l-2 border-[#1a1a1a] pl-6 text-[10px] tracking-widest text-[#333] md:block">
            DATA_STREAM: INSTAGRAM_REELS_V2<br />
            CACHED: {new Date().toLocaleDateString()}<br />
            STATUS: SYNCHRONIZED
          </div>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) =>
            post.oembedHtml ? (
              <li
                key={String(post.id)}
                className="group relative border-4 border-[#1a1a1a] bg-[#050505] p-2 transition-all hover:border-[#ff5c00]"
              >
                <div className="absolute left-2 top-2 z-10 text-[9px] font-bold text-[#333] opacity-0 transition-opacity group-hover:opacity-100">
                  REF_{i.toString().padStart(3, '0')}
                </div>
                
                <div className="grayscale contrast-[1.1] transition-all duration-500 group-hover:grayscale-0 group-hover:contrast-100">
                  <LazyEmbed html={post.oembedHtml} />
                </div>
                
                {/* Visual Garnish on Hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity group-hover:opacity-10">
                   <div className="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#ff5c00_10px,#ff5c00_11px)]" />
                </div>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    </section>
  );
}
