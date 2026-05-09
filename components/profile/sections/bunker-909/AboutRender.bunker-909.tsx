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
      className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
          {/* Section ID and Structural Marker */}
          <div className="lg:col-span-4">
            <div className="sticky top-12">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-10 w-10 border-2 border-[#ff5c00] p-1">
                   <div className="h-full w-full bg-[#ff5c00]" />
                </div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#ff5c00]">
                  01 // {t('label')}
                </p>
              </div>

              <h2 className="font-display text-5xl uppercase leading-[0.9] tracking-tighter text-white md:text-7xl">
                INTEL <span className="block text-[#ff5c00]">REPORTS</span>
              </h2>

              <div className="mt-12 hidden border-t border-[#1a1a1a] pt-8 lg:block">
                <div className="space-y-4 text-[10px] tracking-widest text-[#333]">
                  <p>MODULE_ID: 909-ABT</p>
                  <p>ENCRYPTION: LEVEL_3_AES</p>
                  <p>STATUS: DECLASSIFIED</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Bio Content */}
          <div className="lg:col-span-8">
            <div className="relative border-4 border-[#1a1a1a] bg-[#050505] p-8 md:p-12 lg:p-16">
              {/* Technical Garnish */}
              <div className="absolute -top-4 -left-4 h-8 w-8 border-l-4 border-t-4 border-[#ff5c00]" />
              <div className="absolute -bottom-4 -right-4 h-8 w-8 border-b-4 border-r-4 border-[#ff5c00]" />

              {tagline ? (
                <div className="mb-12">
                  <p className="text-xl uppercase leading-tight tracking-widest text-[#ff5c00] md:text-2xl">
                    {tagline}
                  </p>
                  <div className="mt-6 h-1 w-24 bg-[#ff5c00]" />
                </div>
              ) : null}

              {hasBio ? (
                <div className="prose prose-invert max-w-none">
                  <RichTextRender
                    state={bio}
                    className="font-sans text-lg leading-relaxed text-[#bbb] selection:bg-[#ff5c00] selection:text-black"
                  />
                </div>
              ) : null}

              <div className="mt-16 flex items-center justify-between border-t border-[#1a1a1a] pt-8">
                 <div className="flex gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-1 w-8 bg-[#1a1a1a]" />
                    ))}
                 </div>
                 <span className="text-[10px] tracking-widest text-[#333]">909_BUNKER_CORE_V1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
