'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import type { BgPreset, ColorPreset, FontPairId } from '@/lib/design/tokens';
import { autoText, DEFAULT_FONT_PAIR } from '@/lib/design/tokens';
import { fontPairCssVars } from '@/lib/design/fonts';
import { cn } from '@/lib/utils/cn';

export interface ThemeSwitcherProps {
  bgPresets: readonly BgPreset[];
  accentPresets: readonly ColorPreset[];
  fontPairs: FontPairId[];
}

/**
 * Sticky control panel that mutates :root CSS variables to live-preview the
 * design system without re-rendering anything in React. Demonstrates the AC:
 * "Switching --bg and --accent at the document level recolors the entire app
 *  without re-rendering React."
 */
export function ThemeSwitcher({ bgPresets, accentPresets, fontPairs }: ThemeSwitcherProps) {
  const [bgId, setBgId] = useState<string>(bgPresets[0]!.id);
  const [accentId, setAccentId] = useState<string>(accentPresets[0]!.id);
  const [pair, setPair] = useState<FontPairId>(DEFAULT_FONT_PAIR);

  useEffect(() => {
    const bg = bgPresets.find((b) => b.id === bgId);
    const accent = accentPresets.find((a) => a.id === accentId);
    if (!bg || !accent) return;

    const root = document.documentElement;
    root.style.setProperty('--bg', bg.oklch);
    root.style.setProperty('--text', autoText[bg.mode].oklch);
    root.style.setProperty('--accent', accent.oklch);
    // accent-contrast: dark accents get light contrast text and vice versa.
    root.style.setProperty(
      '--accent-contrast',
      autoText[bg.mode === 'dark' ? 'light' : 'dark'].oklch,
    );
    root.dataset.bgMode = bg.mode;

    const fontVars = fontPairCssVars[pair];
    for (const [k, v] of Object.entries(fontVars)) {
      root.style.setProperty(k, v);
    }
  }, [accentId, accentPresets, bgId, bgPresets, pair]);

  const panelStyle: CSSProperties = {
    backgroundColor: 'oklch(var(--surface))',
    color: 'oklch(var(--text))',
    borderColor: 'oklch(var(--border))',
  };

  return (
    <aside
      className="fixed right-4 top-4 z-50 max-h-[90vh] w-72 overflow-auto border p-4 text-xs"
      style={panelStyle}
    >
      <p className="font-display text-sm uppercase tracking-wider">Theme switcher</p>
      <p className="mt-1 text-[0.7rem] text-text-muted">Dev-only · /_internal/preview</p>

      <Group label="Background">
        {bgPresets.map((b) => (
          <Swatch
            key={b.id}
            color={b.hex}
            label={b.label}
            active={b.id === bgId}
            onClick={() => setBgId(b.id)}
          />
        ))}
      </Group>

      <Group label="Accent">
        {accentPresets.map((a) => (
          <Swatch
            key={a.id}
            color={a.hex}
            label={a.label}
            active={a.id === accentId}
            onClick={() => setAccentId(a.id)}
          />
        ))}
      </Group>

      <Group label="Font pair">
        {fontPairs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setPair(id)}
            className={cn(
              'block w-full px-2 py-1 text-left uppercase tracking-wider',
              id === pair ? 'bg-accent text-accent-contrast' : 'hover:bg-bg/30',
            )}
          >
            {id}
          </button>
        ))}
      </Group>
    </aside>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <div className="mt-2 grid gap-1">{children}</div>
    </div>
  );
}

function Swatch({
  color,
  label,
  active,
  onClick,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 border px-2 py-1 text-left',
        active ? 'border-accent' : 'border-border',
      )}
    >
      <span
        className="block h-4 w-4 border border-border"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </button>
  );
}
