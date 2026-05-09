'use client';

import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyEmbed } from '../LazyEmbed';

type InstagramPost = {
  id: number | string;
  url: string;
  oembedHtml?: string | null;
  displayOrder?: number;
};

/**
 * Nuclear Winter Instagram Feed
 * Desolate terminal blocks for social feeds with cold signal framing.
 */
export function InstagramFeedNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPost[];
  if (!raw.length) return null;

  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <section className="relative border-b border-[#e0eaff]/5 bg-black px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex items-center justify-between" data-reveal>
           <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-8xl">
             INTEL<span className="text-[#e0eaff]">.</span>FEED
           </h2>
           <div className="text-right text-[10px] tracking-[0.4em] text-[#222] uppercase">
              IG_RELAY: ACTIVE<br />
              NODES: {posts.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <li key={String(post.id)} className="group relative" data-reveal style={{ '--reveal-index': i } as React.CSSProperties}>
              <div className="fractured-border bg-black/40 p-3 transition-all group-hover:bg-[#e0eaff]/5">
                <div className="relative overflow-hidden grayscale contrast-[1.3] transition-all duration-[1500ms] group-hover:grayscale-0 group-hover:contrast-100">
                  {post.oembedHtml ? (
                    <LazyEmbed html={post.oembedHtml} />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-black/50 text-[10px] uppercase tracking-[0.5em] text-[#111]">
                      SIG_LOST
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
