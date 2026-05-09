'use client';

import { useTranslations } from 'next-intl';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * Bunker 909 About
 * Heavy brutalist layout with technical annotations and structural frames.
 */
export function AboutBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      className="relative border-b-4 border-[#1a1a1a] bg-[#050505] px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Section ID and Structural Marker */}
          <div className="lg:col-span-5">
            <div className="sticky top-12">
              <div className="mb-8 flex items-center gap-4">
                <div className="h-3 w-3 bg-[#ff5c00]" />
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ff5c00]">
                  SYSTEM_REPORT // 01
                </p>
              </div>

              <h2 className="font-display text-6xl uppercase leading-[0.85] tracking-tighter text-white md:text-8xl">
                INTEL<br />
                <span className="text-[#ff5c00]">ARCHIVE</span>
              </h2>

              <div className="mt-16 hidden border-l-2 border-[#1a1a1a] pl-8 lg:block">
                <div className="space-y-4 text-[10px] font-bold tracking-[0.2em] text-[#333] uppercase">
                  <p>MODULE: 909_BIO_STREAM</p>
                  <p>ACCESS: DECLASSIFIED</p>
                  <p>SOURCE: {bundle.profile.slug}.pkp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Bio Content */}
          <div className="lg:col-span-7">
            <div className="relative border-4 border-[#1a1a1a] bg-black p-8 md:p-12 lg:p-16">
              {/* Corner Accents */}
              <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-[#ff5c00]" />
              <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-[#ff5c00]" />

              {tagline ? (
                <div className="mb-12">
                  <p className="text-xl font-bold uppercase leading-tight tracking-widest text-white md:text-3xl">
                    {tagline}
                  </p>
                  <div className="mt-6 h-2 w-32 bg-[#ff5c00]" />
                </div>
              ) : null}

              {hasBio ? (
                <div className="prose prose-invert max-w-none">
                  <RichTextRender
                    state={bio}
                    className="font-sans text-lg leading-relaxed text-gray-300 selection:bg-[#ff5c00] selection:text-black"
                  />
                </div>
              ) : null}

              <div className="mt-16 flex items-center justify-between border-t border-[#1a1a1a] pt-8">
                 <div className="flex gap-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a]" />
                    ))}
                 </div>
                 <span className="text-[10px] font-bold tracking-widest text-[#222]">END_OF_TRANSMISSION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
