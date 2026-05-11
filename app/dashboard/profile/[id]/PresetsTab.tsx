'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { cn } from '@/lib/utils/cn';
import { PRESETS, type Preset } from '@/lib/presets';

import { applyPresetAction, type ApplyPresetResult } from './design-actions';

export function PresetsTab({
  profileId,
  profileSlug,
  activePresetId,
}: {
  profileId: number;
  profileSlug: string;
  activePresetId: string | null;
}) {
  const t = useTranslations('editor.design');
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [resetConfirm, setResetConfirm] = useState(false);

  function apply(preset: Preset) {
    if (preset.id === activePresetId || pending) return;
    startTransition(async () => {
      const result: ApplyPresetResult = await applyPresetAction(profileId, preset.id, profileSlug);
      if (!result.ok) return;
      await qc.invalidateQueries({ queryKey: ['editor', profileId] });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 px-3 pb-6 pt-4">
      <header className="mb-2">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#555]">
          Presets de Design
        </h2>
        <p className="mt-1 text-xs text-[#555]">
          Escolha um visual base. Isso substituirá suas cores e fontes atuais.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => apply(preset)}
            disabled={pending}
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-300",
              activePresetId === preset.id 
                ? "border-accent bg-accent/5 ring-4 ring-accent/10" 
                : "border-border bg-[#0D0D0D] hover:border-accent/40"
            )}
          >
            {/* Preview Area (140px for better visibility) */}
            <div className="h-[140px] w-full relative overflow-hidden bg-[#050505]">
               <PresetPlaceholderImage preset={preset} />
               
               {/* Selected Overlay */}
               {activePresetId === preset.id && (
                 <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
               )}
               
               {/* Active Badge */}
               {activePresetId === preset.id && (
                 <div className="absolute top-3 right-3 z-10">
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Ativo
                   </div>
                 </div>
               )}
            </div>

            {/* Info Area */}
            <div className="flex flex-col p-4 text-left border-t border-border">
               <span className={cn(
                 "text-[14px] font-bold transition-colors uppercase tracking-tight",
                 activePresetId === preset.id ? "text-accent" : "text-white"
               )}>
                 {preset.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
               </span>
               <span className="mt-1 text-[11px] text-[#555] line-clamp-1">
                 {preset.id.includes('v1') ? 'Legacy Classic' : 'Pro Architecture'}
               </span>
            </div>
            
            {/* Hover Indicator */}
            {activePresetId !== preset.id && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-t from-accent/20 to-transparent flex items-end justify-center pb-12">
                 <span className="bg-accent text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest shadow-xl">
                   Aplicar Layout
                 </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Reset Link Area */}
      <div className="mt-4 border-t border-[#1F1F1F] pt-6">
        {!resetConfirm ? (
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="text-[11px] text-[#555] underline uppercase tracking-widest hover:text-[#888] transition-colors"
          >
            Resetar para o padrão
          </button>
        ) : (
          <div className="flex flex-col gap-3 rounded-lg border border-red-900/30 bg-red-950/10 p-3">
             <p className="text-[11px] text-red-400 font-medium">
               Isso substituirá seu tema atual. Confirmar?
             </p>
             <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const defaultPreset = PRESETS.find(p => p.id === 'mediakit-pro-v1') || PRESETS[0];
                    apply(defaultPreset!);
                    setResetConfirm(false);
                  }}
                  className="text-[11px] font-bold text-red-500 uppercase tracking-widest hover:text-red-400 transition-colors"
                >
                  Sim, resetar
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="text-[11px] font-bold text-[#555] uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PresetPlaceholderImage({ preset }: { preset: Preset }) {
  const bg = preset.theme.bg;
  const accent = preset.theme.accent;
  
  return (
    <div className="relative h-full w-full" style={{ backgroundColor: bg }}>
       {/* Abstract Pattern / Grid */}
       <div className="absolute inset-0 opacity-20" style={{ 
         backgroundImage: `linear-gradient(${accent}10 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`,
         backgroundSize: '20px 20px'
       }} />
       
       <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
             {/* Mock Content */}
             <div className="h-16 w-12 border-2 rounded opacity-40 shadow-2xl" style={{ borderColor: accent }} />
             <div className="absolute -bottom-2 -right-4 h-12 w-16 border-2 rounded bg-black/40 backdrop-blur-sm shadow-xl" style={{ borderColor: accent }} />
             
             {/* Text Mark */}
             <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-[24px] font-black italic tracking-tighter opacity-80"
                  style={{ color: preset.theme.text || '#fff', fontFamily: `var(--font-${preset.theme.fontPairId}-display), system-ui` }}
                >
                  PK
                </span>
             </div>
          </div>
       </div>

       {/* Accent Gradient */}
       <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
}
