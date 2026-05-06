'use client';

import { useMemo, useState } from 'react';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';
import {
  accentPresets,
  bgPresets,
  fontPairs,
  type FontPairId,
} from '@/lib/design/tokens';
import {
  deriveThemeTokens,
  type DerivedTokens,
} from '@/lib/design/derive-theme-tokens';
import { validateThemeContrast } from '@/lib/design/validate-theme-contrast';

const HERO_STYLES = [
  { id: 'full-bleed-portrait', label: 'Full-bleed portrait' },
  { id: 'split-portrait-text', label: 'Split portrait + texto' },
  { id: 'centered-logo', label: 'Centered logo' },
] as const;

const GALLERY_LAYOUTS = [
  { id: 'mosaic', label: 'Mosaic' },
  { id: 'uniform-grid', label: 'Uniform grid' },
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
  const theme = (bundle.theme ?? {}) as ThemeRow;
  const tokens = useMemo(() => deriveThemeTokens(theme as never), [theme]);
  const contrast = useMemo(() => validateThemeContrast(tokens), [tokens]);

  return (
    <div className="flex flex-col gap-8 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Tema
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          Cores, tipografia e layout
        </h2>
        <p className="mt-3 text-sm text-text-muted">
          Mudanças aparecem no preview em tempo real. Publicar exige
          contraste WCAG AA — qualquer combinação validada nos últimos
          30 dias libera o botão de publicar.
        </p>
      </header>

      <ContrastIndicator contrast={contrast} tokens={tokens} />

      <BgSection
        active={(theme.colorPresetId as string | null | undefined) ?? null}
        customHex={(theme.bg as string | null | undefined) ?? ''}
        onMutate={onMutate}
      />

      <AccentSection
        active={(theme.accentPresetId as string | null | undefined) ?? null}
        customHex={(theme.accent as string | null | undefined) ?? ''}
        onMutate={onMutate}
      />

      <CustomTextSection
        customHex={(theme.text as string | null | undefined) ?? ''}
        onMutate={onMutate}
      />

      <FontSection
        active={(theme.fontPairId as FontPairId | null | undefined) ?? 'editorial-nightlife'}
        onMutate={onMutate}
      />

      <HeroStyleSection
        active={(theme.heroStyle as string | null | undefined) ?? 'full-bleed-portrait'}
        onMutate={onMutate}
      />

      <GalleryLayoutSection
        active={(theme.galleryLayout as string | null | undefined) ?? 'mosaic'}
        onMutate={onMutate}
      />
    </div>
  );
}

// ----- Contrast indicator -----------------------------------------------

function ContrastIndicator({
  contrast,
  tokens,
}: {
  contrast: ReturnType<typeof validateThemeContrast>;
  tokens: DerivedTokens;
}) {
  const fmt = (n: number) => `${n.toFixed(2)}:1`;
  return (
    <div className="flex flex-col gap-2 border border-border bg-bg p-3">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="uppercase tracking-wider text-text-muted">Contraste</span>
        <span>
          text / bg:{' '}
          <strong
            className={
              contrast.failures.includes('text-bg')
                ? 'text-text'
                : 'text-text'
            }
          >
            {fmt(contrast.ratios.textBg)}
          </strong>{' '}
          ({contrast.failures.includes('text-bg') ? 'falha · mín. 4.5:1' : 'AA'})
        </span>
        <span>
          accent / bg:{' '}
          <strong>{fmt(contrast.ratios.accentBg)}</strong>{' '}
          ({contrast.failures.includes('accent-bg') ? 'falha · mín. 3:1' : 'AA'})
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Swatch hex={tokens.bg} label="bg" />
        <Swatch hex={tokens.text} label="text" />
        <Swatch hex={tokens.accent} label="accent" />
      </div>
      {!contrast.ok ? (
        <p role="alert" className="text-sm text-text">
          Contraste insuficiente. Ajuste os valores acima ou escolha um
          preset que cumpra WCAG AA — senão a publicação fica bloqueada.
        </p>
      ) : null}
    </div>
  );
}

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 border border-border"
        style={{ backgroundColor: hex }}
      />
      {label} {hex}
    </span>
  );
}

// ----- Bg / Accent / Text sections --------------------------------------

function BgSection({
  active,
  customHex,
  onMutate,
}: {
  active: string | null;
  customHex: string;
  onMutate: ThemeTabProps['onMutate'];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-widest text-text-muted">
        BG (fundo)
      </h3>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {bgPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            aria-pressed={active === preset.id}
            onClick={() => onMutate('theme', { colorPresetId: preset.id, bg: '' })}
            className={`flex flex-col items-stretch border bg-bg p-2 text-xs ${
              active === preset.id ? 'border-accent' : 'border-border'
            }`}
          >
            <span
              aria-hidden="true"
              className="block h-8 w-full border border-border"
              style={{ backgroundColor: preset.hex }}
            />
            <span aria-hidden="true" className="mt-1 text-text">
              {preset.label}
            </span>
            <span aria-hidden="true" className="text-text-muted">
              {preset.hex}
            </span>
          </button>
        ))}
      </div>
      <CustomHexRow
        label="bg"
        value={customHex}
        onCommit={(hex) => onMutate('theme', { colorPresetId: '', bg: hex })}
      />
    </section>
  );
}

function AccentSection({
  active,
  customHex,
  onMutate,
}: {
  active: string | null;
  customHex: string;
  onMutate: ThemeTabProps['onMutate'];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-widest text-text-muted">
        Accent
      </h3>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
        {accentPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            aria-pressed={active === preset.id}
            onClick={() =>
              onMutate('theme', { accentPresetId: preset.id, accent: '' })
            }
            className={`flex flex-col items-stretch border bg-bg p-2 text-xs ${
              active === preset.id ? 'border-accent' : 'border-border'
            }`}
          >
            <span
              aria-hidden="true"
              className="block h-8 w-full border border-border"
              style={{ backgroundColor: preset.hex }}
            />
            <span aria-hidden="true" className="mt-1 text-text">
              {preset.label}
            </span>
            <span aria-hidden="true" className="text-text-muted">
              {preset.hex}
            </span>
          </button>
        ))}
      </div>
      <CustomHexRow
        label="accent"
        value={customHex}
        onCommit={(hex) =>
          onMutate('theme', { accentPresetId: '', accent: hex })
        }
      />
    </section>
  );
}

function CustomTextSection({
  customHex,
  onMutate,
}: {
  customHex: string;
  onMutate: ThemeTabProps['onMutate'];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-widest text-text-muted">
        Text (override)
      </h3>
      <p className="text-xs text-text-muted">
        Por padrão, a cor do texto é derivada do BG. Defina apenas se quiser
        forçar um valor específico.
      </p>
      <CustomHexRow
        label="text"
        value={customHex}
        onCommit={(hex) => onMutate('theme', { text: hex })}
      />
    </section>
  );
}

function CustomHexRow({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === '' || /^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i.test(trimmed)) {
      onCommit(trimmed.startsWith('#') || trimmed === '' ? trimmed : `#${trimmed}`);
    }
  }

  return (
    <label className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-xs uppercase tracking-wider text-text-muted">
        {label} (hex)
      </span>
      <input
        type="color"
        value={draft.length === 7 ? draft : '#000000'}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        aria-label={`${label} (color picker)`}
        className="h-8 w-10 cursor-pointer border border-border bg-bg p-0"
      />
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder="#000000"
        aria-label={`${label} (hex)`}
        className="h-8 w-28 border border-border bg-bg px-2 font-mono text-xs outline-none focus:border-accent"
      />
    </label>
  );
}

// ----- Font / Hero / Gallery sections -----------------------------------

function FontSection({
  active,
  onMutate,
}: {
  active: FontPairId;
  onMutate: ThemeTabProps['onMutate'];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-widest text-text-muted">
        Tipografia
      </h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {fontPairs.map((id) => (
          <button
            key={id}
            type="button"
            aria-label={FONT_PAIR_LABELS[id]}
            aria-pressed={active === id}
            onClick={() => onMutate('theme', { fontPairId: id })}
            className={`flex flex-col gap-1 border bg-bg p-3 text-left text-xs ${
              active === id ? 'border-accent' : 'border-border'
            }`}
          >
            <span aria-hidden="true" className="font-display text-sm uppercase tracking-tight">
              {FONT_PAIR_LABELS[id]}
            </span>
            <span aria-hidden="true" className="text-text-muted">
              Display + serif/sans pair
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function HeroStyleSection({
  active,
  onMutate,
}: {
  active: string;
  onMutate: ThemeTabProps['onMutate'];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-widest text-text-muted">
        Estilo do Hero
      </h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {HERO_STYLES.map((style) => (
          <button
            key={style.id}
            type="button"
            aria-pressed={active === style.id}
            onClick={() => onMutate('theme', { heroStyle: style.id })}
            className={`border bg-bg p-3 text-left text-xs ${
              active === style.id ? 'border-accent' : 'border-border'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function GalleryLayoutSection({
  active,
  onMutate,
}: {
  active: string;
  onMutate: ThemeTabProps['onMutate'];
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-widest text-text-muted">
        Layout da galeria
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {GALLERY_LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            aria-pressed={active === layout.id}
            onClick={() => onMutate('theme', { galleryLayout: layout.id })}
            className={`border bg-bg p-3 text-left text-xs ${
              active === layout.id ? 'border-accent' : 'border-border'
            }`}
          >
            {layout.label}
          </button>
        ))}
      </div>
    </section>
  );
}
