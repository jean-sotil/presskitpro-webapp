'use client';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Bunker 909 Services
 * Industrial cards with heavy borders and structural grid feel.
 */
export function ServicesBunker909({ bundle }: { bundle: EditorBundle }) {
  const services =
    (bundle.content?.services as Array<{ title: string; description?: string }> | undefined) ?? [];

  if (services.length === 0) return null;

  return (
    <section id="servicos" className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex items-center gap-6">
          <h2 className="font-display text-5xl uppercase tracking-tighter text-white md:text-7xl">
            OPS<span className="text-[#ff5c00]">.</span>CATALOG
          </h2>
          <div className="h-1 flex-1 bg-[repeating-linear-gradient(90deg,#1a1a1a,#1a1a1a_4px,transparent_4px,transparent_8px)]" />
        </div>

        <ul className="grid gap-6 md:grid-cols-2">
          {services.map((s, i) => (
            <li key={`${s.title}-${i}`} className="group relative border-4 border-[#1a1a1a] bg-[#050505] p-8 transition-all hover:border-[#ff5c00]">
              <div className="absolute top-4 right-4 text-[10px] font-bold text-[#333]">
                SRV_{i.toString().padStart(2, '0')}
              </div>
              
              <p className="font-display text-2xl uppercase tracking-widest text-white transition-colors group-hover:text-[#ff5c00]">
                {s.title}
              </p>
              
              {s.description ? (
                <div className="mt-6 border-t border-[#1a1a1a] pt-6">
                  <p className="text-sm leading-relaxed tracking-wider text-[#888] uppercase">
                    {s.description}
                  </p>
                </div>
              ) : null}

              {/* Functional industrial corner garnish */}
              <div className="absolute bottom-0 right-0 h-4 w-4 bg-[#1a1a1a] transition-colors group-hover:bg-[#ff5c00]" />
            </li>
          ))}
        </ul>

        {/* Technical metadata footer for the section */}
        <div className="mt-16 flex justify-end">
           <div className="border-r-4 border-[#ff5c00] pr-6 text-right">
              <span className="text-[10px] tracking-widest text-[#333] uppercase">
                Resource Allocation: Optimized<br />
                Delivery_Protocol: Industrial_Standard_V4
              </span>
           </div>
        </div>
      </div>
    </section>
  );
}
