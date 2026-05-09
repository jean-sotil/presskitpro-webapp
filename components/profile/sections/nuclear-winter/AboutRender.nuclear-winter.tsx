'use client';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * Nuclear Winter About
 * Desolate layout with terminal-style biography and radioactive framing.
 */
export function AboutNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      className="relative border-b border-[#39ff14]/10 bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Radioactive sidebar marker */}
          <div className="lg:col-span-4">
            <div className="sticky top-12">
               <div className="mb-6 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-[#39ff14] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#39ff14]">DATA_LOG // 01</span>
               </div>
               
               <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-white md:text-7xl">
                 ORIGIN<br />
                 <span className="text-[#39ff14]/80 text-shadow-glow">DOSSIER</span>
               </h2>

               <div className="mt-12 hidden space-y-4 border-l border-[#39ff14]/20 pl-6 text-[9px] font-bold tracking-[0.2em] text-[#39ff14]/30 uppercase lg:block">
                  <p>ENCRYPTION: LEVEL_5</p>
                  <p>USER: SURVIVOR_B9</p>
                  <p>TIMESTAMP: 2026.05.09</p>
               </div>
            </div>
          </div>

          {/* Bio Container */}
          <div className="lg:col-span-8">
            <div className="group relative border border-[#39ff14]/30 bg-[#050705] p-8 md:p-12 lg:p-16">
              {/* Corner Accents */}
              <div className="absolute -left-[1px] -top-[1px] h-6 w-6 border-l border-t border-[#39ff14]" />
              <div className="absolute -bottom-[1px] -right-[1px] h-6 w-6 border-b border-r border-[#39ff14]" />
              
              {tagline ? (
                <div className="mb-10">
                  <p className="text-xl font-bold uppercase leading-tight tracking-widest text-white md:text-2xl">
                    {tagline}
                  </p>
                  <div className="mt-4 h-px w-24 bg-[#39ff14]/60" />
                </div>
              ) : null}

              {hasBio ? (
                <div className="prose prose-invert max-w-none">
                  <RichTextRender
                    state={bio}
                    className="font-mono text-base leading-relaxed text-gray-400 selection:bg-[#39ff14] selection:text-black"
                  />
                </div>
              ) : null}

              <div className="mt-16 flex items-center justify-between border-t border-[#39ff14]/10 pt-8">
                 <div className="flex gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-1 w-4 bg-[#39ff14]/10" />
                    ))}
                 </div>
                 <span className="text-[9px] font-bold tracking-[0.3em] text-[#39ff14]/20 uppercase">EOF: END_OF_FILE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
