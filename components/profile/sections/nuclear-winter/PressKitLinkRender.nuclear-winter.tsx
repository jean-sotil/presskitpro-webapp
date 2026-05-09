'use client';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Nuclear Winter Press Kit Link
 * Industrial radioactive block with glitchy hover and secure checksums.
 */
export function PressKitLinkNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;

  if (!url) return null;

  return (
    <section className="relative border-b border-[#39ff14]/10 bg-[#050705] px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="group relative overflow-hidden border border-[#39ff14]/30 bg-black p-1 transition-all hover:border-[#39ff14]">
          {/* Radioactive pulse background */}
          <div className="absolute inset-0 z-0 opacity-5 bg-[radial-gradient(circle_at_50%_50%,#39ff14_0%,transparent_70%)] group-hover:opacity-10 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-8 border border-[#39ff14]/10 bg-black p-10 text-center transition-colors group-hover:bg-[#050705] md:flex-row md:text-left">
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-center gap-3 md:justify-start">
                 <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#39ff14]">
                    SECURE_DATA_PKG // RAD_FREE
                 </span>
              </div>
              <h2 className="font-display text-4xl uppercase leading-none tracking-tighter text-white md:text-6xl">
                DOWNLOAD<br />
                <span className="text-[#39ff14] text-shadow-glow">PRESSKIT</span>
              </h2>
              <p className="mt-6 max-w-sm text-[10px] uppercase tracking-widest text-[#555] leading-relaxed">
                Contains verified assets, technical riders, and biography. Decrypt before use.
              </p>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              data-fallout-glitch
              className="group/btn relative flex h-24 w-24 items-center justify-center border border-[#39ff14] bg-[#39ff14]/10 text-[#39ff14] transition-all hover:bg-[#39ff14] hover:text-black md:h-32 md:w-32"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" className="transition-transform group-hover/btn:scale-110">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
              </svg>
              {/* HUD markers */}
              <div className="absolute top-2 left-2 h-2 w-2 border-l border-t border-[#39ff14]/30" />
              <div className="absolute bottom-2 right-2 h-2 w-2 border-r border-b border-[#39ff14]/30" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-12 opacity-20">
           <span className="text-[9px] tracking-[0.2em] uppercase">Checksum: 8B-F2-12</span>
           <span className="text-[9px] tracking-[0.2em] uppercase">Status: Encrypted</span>
           <span className="text-[9px] tracking-[0.2em] uppercase">TTL: 24H</span>
        </div>
      </div>
    </section>
  );
}
