'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils/cn';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';
import { accentPresets, bgPresets, fontPairs, type FontPairId } from '@/lib/design/tokens';
import { deriveThemeTokens } from '@/lib/design/derive-theme-tokens';
import { validateThemeContrast } from '@/lib/design/validate-theme-contrast';
import { fontPairCssVars } from '@/lib/design/font-pair-css-vars';

const HERO_STYLES = [
  { id: 'full-bleed-portrait', label: 'Full Bleed' },
  { id: 'split-portrait-text', label: 'Split' },
  { id: 'centered-logo', label: 'Centered' },
] as const;

const GALLERY_LAYOUTS = [
  { id: 'mosaic', label: 'Mosaic' },
  { id: 'uniform-grid', label: 'Grid' },
  { id: 'carousel', label: 'Carousel' },
] as const;

const FONT_PAIR_LABELS: Record<FontPairId, string> = {
  'editorial-nightlife': 'Editorial Nightlife',
  magazine: 'Magazine',
  brutalist: 'Brutalist',
  refined: 'Refined',
  industrial: 'Industrial',
  'soft-pop': 'Soft Pop',
  'retro-future': 'Retro Future',
  'classic-press': 'Classic Press',
};

export interface ThemeTabProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

type ThemeRow = {
  colorPresetId?: string | null;
  accentPresetId?: string | null;
  bg?: string | null;
  accent?: string | null;
  text?: string | null;
  fontPairId?: FontPairId | null;
  heroStyle?: string | null;
  galleryLayout?: string | null;
};

export function ThemeTab({ bundle, onMutate }: ThemeTabProps) {
  const theme = useMemo(() => (bundle.theme ?? {}) as ThemeRow, [bundle.theme]);
  const tokens = useMemo(() => deriveThemeTokens(theme as never), [theme]);
  const contrast = useMemo(() => validateThemeContrast(tokens), [tokens]);

  return (
    <div className="space-y-6 px-3 pb-6 pt-4">
      {/* COLORS GROUP */}
      <div>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Colors
        </h3>
        
        <div className="space-y-6">
          {/* Background */}
          <div>
            <div className="mb-2 block text-[10px] uppercase text-text-muted/60">
              Background
            </div>
            <div className="flex flex-wrap items-start gap-3">
              {bgPresets.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    title={p.label}
                    onClick={() => onMutate('theme', { colorPresetId: p.id, bg: '' })}
                    className={cn(
                      "h-8 w-8 rounded transition-all hover:scale-105",
                      "border border-white/10",
                      theme.colorPresetId === p.id && "ring-2 ring-white ring-offset-2 ring-offset-black"
                    )}
                    style={{ backgroundColor: p.hex }}
                  />
                  <span className="text-[10px] text-text-muted">{p.label.split(' ')[0]}</span>
                </div>
              ))}
              
              <CustomHexPill
                value={(theme.bg as string) ?? ''}
                onCommit={(hex) => onMutate('theme', { colorPresetId: '', bg: hex })}
              />
            </div>
          </div>

          {/* Accent */}
          <div>
            <div className="mb-2 block text-[10px] uppercase text-text-muted/60">
              Accent
            </div>
            <div className="grid grid-cols-6 gap-2">
              {accentPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.label}
                  onClick={() => onMutate('theme', { accentPresetId: p.id, accent: '' })}
                  className={cn(
                    "h-8 w-full rounded border border-white/10 transition-all hover:scale-105",
                    theme.accentPresetId === p.id && "ring-2 ring-white ring-offset-1 ring-offset-black"
                  )}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>

            {/* Contrast Feedback */}
            <div className="mt-3">
              <ContrastFeedback contrast={contrast} />
            </div>
          </div>
        </div>
      </div>

      <hr className="my-3 border-border" />

      {/* FONTS GROUP */}
      <div>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Fonts
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {fontPairs.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onMutate('theme', { fontPairId: id })}
              className={cn(
                "flex h-[72px] flex-col justify-between rounded border border-border bg-surface p-2.5 text-left transition-all",
                "hover:border-accent/40",
                theme.fontPairId === id && "border-[1.5px] border-accent bg-accent/5"
              )}
              style={fontPairCssVars[id] as React.CSSProperties}
            >
              <div className="flex flex-1 flex-col justify-center gap-0.5 overflow-hidden">
                <span className="truncate text-[18px] leading-tight text-white font-display">
                  HEADLINE
                </span>
                <span className="truncate text-[11px] leading-tight text-text-muted font-body">
                  Body text sample
                </span>
              </div>
              <span className="mt-1 block text-[10px] text-text-muted/60">
                {FONT_PAIR_LABELS[id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <hr className="my-3 border-border" />

      {/* LAYOUT GROUP */}
      <div>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">
          Layout
        </h3>
        
        <div className="space-y-5">
          {/* Hero Style */}
          <div>
            <div className="mb-2 block text-[11px] text-text-muted">Hero Style</div>
            <div className="flex gap-3">
              {HERO_STYLES.map((style) => (
                <div key={style.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onMutate('theme', { heroStyle: style.id })}
                    className={cn(
                      "flex h-[52px] w-full items-center justify-center rounded border border-border bg-surface transition-all",
                      theme.heroStyle === style.id ? "border-accent" : "hover:border-border/60"
                    )}
                  >
                    <HeroWireframe id={style.id} active={theme.heroStyle === style.id} />
                  </button>
                  <span className={cn(
                    "text-[11px] text-text-muted",
                    theme.heroStyle === style.id && "text-accent"
                  )}>
                    {style.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Layout */}
          <div>
            <div className="mb-2 block text-[11px] text-text-muted">Gallery Layout</div>
            <div className="flex gap-3">
              {GALLERY_LAYOUTS.map((layout) => (
                <div key={layout.id} className="flex flex-1 flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onMutate('theme', { galleryLayout: layout.id })}
                    className={cn(
                      "flex h-[52px] w-full items-center justify-center rounded-lg border border-border bg-surface transition-all duration-300",
                      theme.galleryLayout === layout.id 
                        ? "border-accent bg-accent/5" 
                        : "hover:border-border/60 hover:-translate-y-0.5 hover:shadow-lg"
                    )}
                  >
                    <GalleryWireframe id={layout.id} active={theme.galleryLayout === layout.id} />
                  </button>
                  <span className={cn(
                    "text-[11px] text-text-muted",
                    theme.galleryLayout === layout.id && "text-accent"
                  )}>
                    {layout.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomHexPill({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState(value);
  
  return (
    <div className="flex flex-col items-center gap-1.5">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (/^#?([0-9a-f]{3}){1,2}$/i.test(draft)) {
             onCommit(draft.startsWith('#') ? draft : `#${draft}`);
          }
        }}
        placeholder="#"
        className="h-8 w-9 rounded border border-white/10 bg-surface px-0.5 text-center text-[10px] text-text outline-none focus:border-accent/40"
      />
      <span className="text-[10px] text-text-muted">Custom</span>
    </div>
  );
}

function ContrastFeedback({ contrast }: { contrast: ReturnType<typeof validateThemeContrast> }) {
  const ratio = contrast.ratios.accentBg.toFixed(1);
  const pass = !contrast.failures.includes('accent-bg');
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-[11px]",
      pass ? "text-accent" : "text-red-500"
    )}>
      {pass ? (
        <>
          <span aria-hidden="true">✓</span>
          <span>AA contrast passed</span>
        </>
      ) : (
        <>
          <span aria-hidden="true">✕</span>
          <span>Contrast too low ({ratio}:1) — pick lighter or darker</span>
        </>
      )}
    </div>
  );
}

function HeroWireframe({ id, active }: { id: string; active: boolean }) {
  const stroke = active ? "currentColor" : "#444";
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" className="text-accent">
      {id === 'full-bleed-portrait' && (
        <rect x="2" y="2" width="36" height="26" rx="1" stroke={stroke} strokeWidth="1" />
      )}
      {id === 'split-portrait-text' && (
        <>
          <rect x="2" y="2" width="16" height="26" rx="1" stroke={stroke} strokeWidth="1" />
          <rect x="22" y="6" width="16" height="2" rx="0.5" fill={stroke} />
          <rect x="22" y="10" width="12" height="2" rx="0.5" fill={stroke} />
          <rect x="22" y="14" width="16" height="2" rx="0.5" fill={stroke} />
        </>
      )}
      {id === 'centered-logo' && (
        <>
          <rect x="2" y="2" width="36" height="26" rx="1" stroke={stroke} strokeWidth="1" />
          <rect x="14" y="8" width="12" height="12" rx="1" stroke={stroke} strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

function GalleryWireframe({ id, active }: { id: string; active: boolean }) {
  const stroke = active ? "currentColor" : "#444";
  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" className="text-accent">
      {id === 'mosaic' && (
        <>
          <rect x="2" y="2" width="22" height="26" rx="1" stroke={stroke} strokeWidth="1" />
          <rect x="26" y="2" width="12" height="12" rx="1" stroke={stroke} strokeWidth="1" />
          <rect x="26" y="16" width="12" height="12" rx="1" stroke={stroke} strokeWidth="1" />
        </>
      )}
      {id === 'uniform-grid' && (
        <>
          <rect x="2" y="2" width="10" height="12" rx="0.5" stroke={stroke} strokeWidth="1" />
          <rect x="14" y="2" width="10" height="12" rx="0.5" stroke={stroke} strokeWidth="1" />
          <rect x="26" y="2" width="10" height="12" rx="0.5" stroke={stroke} strokeWidth="1" />
          <rect x="2" y="16" width="10" height="12" rx="0.5" stroke={stroke} strokeWidth="1" />
          <rect x="14" y="16" width="10" height="12" rx="0.5" stroke={stroke} strokeWidth="1" />
          <rect x="26" y="16" width="10" height="12" rx="0.5" stroke={stroke} strokeWidth="1" />
        </>
      )}
      {id === 'carousel' && (
        <>
          <rect x="6" y="2" width="28" height="26" rx="1" stroke={stroke} strokeWidth="1" />
          <path d="M2 15L4 13M2 15L4 17" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
          <path d="M38 15L36 13M38 15L36 17" stroke={stroke} strokeWidth="1" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
