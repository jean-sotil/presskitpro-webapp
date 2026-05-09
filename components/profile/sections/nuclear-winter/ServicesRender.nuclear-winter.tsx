'use client';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Nuclear Winter Services
 * Desolate cards with cold signal borders and survivalist-metadata.
 */
export function ServicesNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const services =
    (bundle.content?.services as Array<{ title: string; description?: string }> | undefined) ?? [];

  if (services.length === 0) return null;

  return (
    <section id="servicos" className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-20 flex items-center gap-8" data-reveal>
          <h2 className="font-display text-6xl uppercase tracking-tighter text-white md:text-8xl">
            SVR<span className="text-[#e0eaff]">.</span>MOD
          </h2>
          <div className="h-0.5 flex-1 bg-gradient-to-r from-[#e0eaff]/20 to-transparent" />
        </div>

        <ul className="grid gap-8 md:grid-cols-2">
          {services.map((s, i) => (
            <li key={`${s.title}-${i}`} className="group" data-reveal style={{ '--reveal-index': i } as React.CSSProperties}>
              <div className="fractured-border relative bg-black/40 p-10 transition-all hover:bg-[#e0eaff]/5 hover:shadow-[0_0_25px_rgba(224,234,255,0.05)]">
                <div className="absolute top-6 right-6 text-[10px] font-bold text-[#1a1a1a] transition-colors group-hover:text-[#e0eaff]/40 uppercase tracking-widest">
                  MODULE_{i.toString().padStart(2, '0')}
                </div>
                
                <p className="font-display text-3xl uppercase tracking-[0.1em] text-white transition-colors group-hover:text-[#e0eaff]">
                  {s.title}
                </p>
                
                {s.description ? (
                  <div className="mt-8 border-t border-[#e0eaff]/5 pt-8">
                    <p className="text-sm leading-relaxed tracking-wider text-[#555] uppercase">
                      {s.description}
                    </p>
                  </div>
                ) : null}

                {/* Status indicator */}
                <div className="absolute bottom-6 right-6 flex items-center gap-3">
                   <span className="text-[9px] font-bold text-[#111] uppercase group-hover:text-[#333]">ACTIVE_LINK</span>
                   <div className="h-1.5 w-1.5 bg-[#111] transition-colors group-hover:bg-[#e0eaff]" data-geiger-dot />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Section metadata */}
        <div className="mt-20 flex justify-start" data-reveal>
           <div className="border-l border-[#e0eaff]/20 pl-8">
              <span className="text-[10px] tracking-[0.4em] text-[#222] uppercase leading-relaxed">
                RESOURCE_ALLOCATION: MINIMAL<br />
                PRIORITY_LEVEL: SURVIVAL
              </span>
           </div>
        </div>
      </div>
    </section>
  );
}
