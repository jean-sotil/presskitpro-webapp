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
 * Desolate terminal blocks for social feeds with radioactive framing.
 */
export function InstagramFeedNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.instagramPosts ?? []) as unknown as InstagramPost[];
  if (!raw.length) return null;

  const posts = [...raw].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <section className="relative border-b border-[#39ff14]/10 bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between">
           <h2 className="font-display text-4xl uppercase tracking-tighter text-white md:text-6xl">
             INTEL<span className="text-[#39ff14]">.</span>FEED
           </h2>
           <div className="text-right text-[10px] tracking-[0.3em] text-[#333] uppercase">
              IG_RELAY: ACTIVE<br />
              BUFFER: {posts.length.toString().padStart(2, '0')}
           </div>
        </div>

        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={String(post.id)} className="group relative border border-[#39ff14]/20 bg-[#050705] p-2 transition-all hover:border-[#39ff14]/50">
              <div className="absolute top-0 left-0 h-4 w-4 border-l border-t border-[#39ff14] opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-0 right-0 h-4 w-4 border-r border-b border-[#39ff14] opacity-0 transition-opacity group-hover:opacity-100" />
              
              <div className="relative overflow-hidden grayscale contrast-125 transition-all duration-700 group-hover:grayscale-0 group-hover:contrast-100">
                {post.oembedHtml ? (
                  <LazyEmbed html={post.oembedHtml} />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-black/50 text-[10px] uppercase tracking-widest text-[#222]">
                    SIG_LOST
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
