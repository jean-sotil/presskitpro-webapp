'use client';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Nuclear Winter Services
 * Desolate cards with toxic-glow borders and survivalist-metadata.
 */
export function ServicesNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const services =
    (bundle.content?.services as Array<{ title: string; description?: string }> | undefined) ?? [];

  if (services.length === 0) return null;

  return (
    <section id="servicos" className="relative border-b border-[#39ff14]/10 bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex items-center gap-6">
          <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-7xl">
            SVR<span className="text-[#39ff14]">.</span>MODULES
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[#39ff14]/30 to-transparent" />
        </div>

        <ul className="grid gap-6 md:grid-cols-2">
          {services.map((s, i) => (
            <li key={`${s.title}-${i}`} className="group relative border border-[#39ff14]/20 bg-[#050705] p-8 transition-all hover:border-[#39ff14] hover:shadow-[0_0_15px_rgba(57,255,20,0.1)]">
              <div className="absolute top-4 right-4 text-[9px] font-bold text-[#222] transition-colors group-hover:text-[#39ff14]/40">
                MOD_{i.toString().padStart(2, '0')}
              </div>
              
              <p className="font-display text-2xl uppercase tracking-[0.1em] text-white transition-colors group-hover:text-[#39ff14]">
                {s.title}
              </p>
              
              {s.description ? (
                <div className="mt-6 border-t border-[#39ff14]/10 pt-6">
                  <p className="text-xs leading-relaxed tracking-wider text-[#666] uppercase">
                    {s.description}
                  </p>
                </div>
              ) : null}

              {/* Status indicator */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                 <span className="text-[8px] font-bold text-[#111] uppercase group-hover:text-[#39ff14]/30">Active_Status</span>
                 <div className="h-1.5 w-1.5 rounded-full bg-[#111] transition-colors group-hover:bg-[#39ff14]" />
              </div>
            </li>
          ))}
        </ul>

        {/* Section metadata */}
        <div className="mt-16 flex justify-start">
           <div className="border-l-2 border-[#39ff14]/40 pl-6">
              <span className="text-[9px] tracking-[0.3em] text-[#333] uppercase leading-relaxed">
                Resource_Optimization: Maximum<br />
                Protocol_v4: Survival_Priority
              </span>
           </div>
        </div>
      </div>
    </section>
  );
}
