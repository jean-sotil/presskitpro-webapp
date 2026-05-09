'use client';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Nuclear Winter Press Kit Link
 * Industrial cold block with glitchy hover and secure checksums.
 */
export function PressKitLinkNuclearWinter({ bundle }: { bundle: EditorBundle }) {
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;

  if (!url) return null;

  return (
    <section className="relative border-b border-[#e0eaff]/5 bg-[#050505] px-8 py-24 font-mono text-gray-400 md:px-16 md:py-40" data-reveal>
      <div className="mx-auto max-w-4xl">
        <div className="fractured-border group relative overflow-hidden bg-black/60 p-1 transition-all">
          {/* Cold pulse background */}
          <div className="absolute inset-0 z-0 opacity-0 bg-[radial-gradient(circle_at_50%_50%,#e0eaff_0%,transparent_70%)] group-hover:opacity-5 transition-opacity duration-[2000ms]" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-12 bg-black/20 p-12 text-center transition-colors md:flex-row md:text-left">
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-center gap-4 md:justify-start">
                 <span className="h-2 w-2 bg-[#e0eaff] shadow-[0_0_12px_rgba(224,234,255,0.4)]" data-geiger-dot />
                 <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#e0eaff]/60">
                    SECURE_DATA // DOC_PKG
                 </span>
              </div>
              <h2 className="font-display text-5xl uppercase leading-none tracking-tighter text-white md:text-8xl">
                DOWNLOAD<br />
                <span className="text-[#e0eaff]/80 text-shadow-glow">DOSSIER</span>
              </h2>
              <p className="mt-8 max-w-sm text-[10px] uppercase tracking-[0.3em] text-[#333] leading-relaxed">
                Contains verified assets, technical riders, and biography. Authorized use only.
              </p>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              data-fallout-glitch
              className="group/btn relative flex h-32 w-32 items-center justify-center border border-[#e0eaff]/20 bg-[#e0eaff]/5 text-[#e0eaff] transition-all hover:bg-[#e0eaff] hover:text-black md:h-40 md:w-40"
              style={{ animation: 'geiger-pulse 4s infinite' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" className="transition-transform group-hover/btn:scale-110">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
              </svg>
              {/* HUD markers */}
              <div className="absolute top-4 left-4 h-3 w-3 border-l border-t border-[#e0eaff]/20" />
              <div className="absolute bottom-4 right-4 h-3 w-3 border-r border-b border-[#e0eaff]/20" />
            </a>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center gap-16 opacity-10">
           <span className="text-[9px] tracking-[0.3em] uppercase">ID: 8B-F2-12</span>
           <span className="text-[9px] tracking-[0.3em] uppercase">STATUS: ARCHIVED</span>
           <span className="text-[9px] tracking-[0.3em] uppercase">SIG: VALID</span>
        </div>
      </div>
    </section>
  );
}
