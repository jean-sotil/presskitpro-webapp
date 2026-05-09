'use client';

import { useTranslations } from 'next-intl';

import type { EditorBundle } from '@/lib/editor/bundle';

/**
 * Bunker 909 Press Kit Link
 * Heavy brutalist block with industrial warning styling.
 */
export function PressKitLinkBunker909({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.pressKit');
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;

  if (!url) return null;

  return (
    <section className="relative border-b-4 border-[#1a1a1a] bg-black px-6 py-20 font-mono text-gray-400 md:px-12 md:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="group relative overflow-hidden border-8 border-[#1a1a1a] bg-[#0a0a0a] p-1 transition-all hover:border-[#ff5c00]">
          {/* Diagonal Industrial Stripes Background */}
          <div className="absolute inset-0 z-0 opacity-5 bg-[repeating-linear-gradient(45deg,#ff5c00,#ff5c00_20px,transparent_20px,transparent_40px)]" />

          <div className="relative z-10 flex flex-col items-center justify-between gap-8 border-4 border-[#1a1a1a] bg-black p-12 text-center transition-colors group-hover:bg-[#050505] md:flex-row md:text-left">
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-center gap-3 md:justify-start">
                 <span className="h-2 w-2 rounded-full bg-[#ff5c00] animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#ff5c00]">
                    SECURE_DATA_PACKAGE // DL_909
                 </span>
              </div>
              <h2 className="font-display text-4xl uppercase leading-none tracking-tighter text-white md:text-6xl">
                DOWNLOAD<br />
                <span className="text-[#ff5c00]">PRESSKIT</span>
              </h2>
              <p className="mt-6 max-w-sm text-xs uppercase tracking-widest text-[#666] leading-relaxed">
                Contains high-resolution visual assets, technical riders, and full artist biography.
              </p>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative flex h-24 w-24 items-center justify-center bg-[#ff5c00] text-black transition-all hover:scale-110 hover:bg-white md:h-32 md:w-32"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover/btn:translate-y-1">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
              </svg>
              {/* Corner tech marks */}
              <div className="absolute top-2 left-2 h-2 w-2 border-l border-t border-black/30" />
              <div className="absolute bottom-2 right-2 h-2 w-2 border-r border-b border-black/30" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-12 opacity-20">
           <span className="text-[9px] tracking-tighter uppercase">Checksum: OK</span>
           <span className="text-[9px] tracking-tighter uppercase">Payload: Verified</span>
           <span className="text-[9px] tracking-tighter uppercase">Latency: 0ms</span>
        </div>
      </div>
    </section>
  );
}
