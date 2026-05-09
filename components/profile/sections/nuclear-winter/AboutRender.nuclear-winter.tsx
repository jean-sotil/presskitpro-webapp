'use client';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

/**
 * Nuclear Winter About
 * Desolate layout with terminal-style biography and cold signal framing.
 */
export function AboutNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  if (!tagline && !hasBio) return null;

  return (
    <section
      id="sobre"
      className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-24 lg:grid-cols-12">
          {/* Cold sidebar marker */}
          <div className="lg:col-span-4" data-reveal>
            <div className="sticky top-20">
               <div className="mb-8 flex items-center gap-4">
                  <div className="h-3 w-3 bg-[#e0eaff]" data-geiger-dot />
                  <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#e0eaff]/60">LOG_ARCHIVE // 01</span>
               </div>
               
               <h2 className="font-display text-6xl uppercase leading-none tracking-tighter text-white md:text-8xl">
                 ORIGIN<br />
                 <span className="text-[#e0eaff]/70 text-shadow-glow">DOSSIER</span>
               </h2>

               <div className="mt-16 hidden space-y-6 border-l border-[#e0eaff]/10 pl-8 text-[9px] font-bold tracking-[0.3em] text-[#333] uppercase lg:block">
                  <p>ENCRYPTION: MAX_SECURE</p>
                  <p>SUBJECT: {bundle.profile.slug.toUpperCase()}</p>
                  <p>EXPIRY: NEVER</p>
               </div>
            </div>
          </div>

          {/* Bio Container */}
          <div className="lg:col-span-8" data-reveal>
            <div className="fractured-border group relative bg-black/40 p-10 md:p-16 lg:p-20">
              {tagline ? (
                <div className="mb-12">
                  <p className="text-2xl font-bold uppercase leading-tight tracking-[0.2em] text-white md:text-3xl">
                    {tagline}
                  </p>
                  <div className="mt-6 h-px w-32 bg-[#e0eaff]/20" />
                </div>
              ) : null}

              {hasBio ? (
                <div className="prose prose-invert max-w-none">
                  <RichTextRender
                    state={bio}
                    className="font-mono text-lg leading-relaxed text-gray-400 selection:bg-[#e0eaff] selection:text-black"
                  />
                </div>
              ) : null}

              <div className="mt-20 flex items-center justify-between border-t border-[#e0eaff]/5 pt-10">
                 <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-0.5 w-6 bg-[#e0eaff]/5" />
                    ))}
                 </div>
                 <span className="text-[9px] font-bold tracking-[0.4em] text-[#222] uppercase">EOF // END_OF_TRANSMISSION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
