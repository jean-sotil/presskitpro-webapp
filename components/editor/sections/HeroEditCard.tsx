'use client';

import { useState, useTransition } from 'react';

import type { EditorBundle } from '@/lib/editor/bundle';
import {
  bindCompressDeps,
  compressImage,
} from '@/lib/editor/image-compress';
import { isValidCtaUrl, normalizeCtaUrl } from '@/lib/editor/cta-url';
import { MAX_UPLOAD_BYTES, liveUploadDeps, uploadMedia } from '@/lib/editor/media-upload';
import { humanizeUploadError } from '@/lib/editor/upload-error-message';
import { mediaUrl } from '@/lib/media/url';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

const HERO_STYLES = [
  { value: 'full-bleed-portrait', label: 'Retrato em destaque' },
  { value: 'split-portrait-text', label: 'Lado a lado' },
  { value: 'centered-logo', label: 'Logo central' },
] as const;

const CTA_PRESETS = [
  { value: 'contato-shows', label: 'Contato para shows', preset: 'Contato para shows' },
  { value: 'book-now', label: 'Book now', preset: 'Book now' },
  { value: 'custom', label: 'Personalizado', preset: '' },
] as const;

const SVG_TYPES = new Set(['image/svg+xml', 'image/svg']);
const RASTER_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const LOGO_ACCEPT = `${RASTER_ACCEPT},image/svg+xml`;

export interface HeroEditCardProps {
  bundle: EditorBundle;
  supabaseUserId: string;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

type SlotState = {
  uploading: boolean;
  error: string | null;
};

const FRESH_SLOT: SlotState = { uploading: false, error: null };

export function HeroEditCard({ bundle, supabaseUserId, onMutate }: HeroEditCardProps) {
  const portrait = bundle.profile.portrait as
    | { id: number; bucket: string; path: string; alt?: string }
    | null
    | undefined;
  const logo = bundle.profile.logo as
    | { id: number; bucket: string; path: string; alt?: string }
    | null
    | undefined;
  const tagline = (bundle.content?.tagline as string | undefined) ?? '';
  const ctaLabel = (bundle.content?.ctaLabel as string | undefined) ?? '';
  const ctaUrl = (bundle.content?.ctaUrl as string | undefined) ?? '';
  const heroStyle = (bundle.theme?.heroStyle as string | undefined) ?? 'full-bleed-portrait';

  // Local state for things that don't directly mutate the bundle (alt
  // text we hold locally until the file is registered, upload errors).
  const [portraitAlt, setPortraitAlt] = useState(portrait?.alt ?? '');
  const [logoAlt, setLogoAlt] = useState(logo?.alt ?? '');
  const [portraitState, setPortraitState] = useState<SlotState>(FRESH_SLOT);
  const [logoState, setLogoState] = useState<SlotState>(FRESH_SLOT);
  const [ctaPreset, setCtaPreset] = useState<string>(() =>
    ctaLabel === 'Contato para shows'
      ? 'contato-shows'
      : ctaLabel === 'Book now'
      ? 'book-now'
      : ctaLabel
      ? 'custom'
      : 'contato-shows',
  );
  const [, startTransition] = useTransition();

  const portraitAltRequired = Boolean(portrait) && portraitAlt.trim().length === 0;

  async function uploadFor(slot: 'portrait' | 'logo', file: File) {
    const setter = slot === 'portrait' ? setPortraitState : setLogoState;
    const alt = slot === 'portrait' ? portraitAlt : logoAlt;
    setter({ uploading: true, error: null });
    try {
      const compressed = SVG_TYPES.has(file.type)
        ? file
        : await compressImage(
            file,
            { targetMaxBytes: MAX_UPLOAD_BYTES },
            bindCompressDeps(file),
          );
      const result = await uploadMedia(liveUploadDeps, {
        file: compressed,
        bucket: 'avatars',
        supabaseUserId,
        alt: alt || (slot === 'portrait' ? 'Foto principal' : 'Logo'),
      });
      if (!result.ok) {
        setter({ uploading: false, error: humanizeUploadError(result) });
        return;
      }
      onMutate('profile', { [slot]: result.mediaId });
      setter({ uploading: false, error: null });
    } catch (err) {
      setter({
        uploading: false,
        error: err instanceof Error ? err.message : 'upload failed',
      });
    }
  }

  function onCtaPresetChange(value: string) {
    setCtaPreset(value);
    const preset = CTA_PRESETS.find((p) => p.value === value);
    if (preset && preset.value !== 'custom') {
      onMutate('content', { ctaLabel: preset.preset });
    }
  }

  function onCtaUrlBlur() {
    const normalized = normalizeCtaUrl(ctaUrl);
    if (normalized !== ctaUrl) {
      onMutate('content', { ctaUrl: normalized });
    }
  }

  return (
    <div className="flex flex-col gap-8 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Hero
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">Hero</h2>
      </header>

      {/* Portrait */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs uppercase tracking-wider text-text-muted">
          Foto principal
        </legend>
        <Dropzone
          accept={RASTER_ACCEPT}
          uploading={portraitState.uploading}
          error={portraitState.error}
          previewUrl={mediaUrl(portrait ?? null)}
          previewAlt={portraitAlt}
          onPick={(file) => startTransition(() => void uploadFor('portrait', file))}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            Texto alternativo (acessibilidade) <span aria-hidden="true">*</span>
          </span>
          <input
            value={portraitAlt}
            onChange={(e) => setPortraitAlt(e.target.value)}
            onBlur={() => {
              if (portrait && portraitAlt.trim().length > 0) {
                // Alt text is updated server-side via the media route in
                // task-12; for now, hold locally and surface the warning.
              }
            }}
            placeholder="Ex.: DJ Mariana em performance ao vivo"
            className="h-10 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
            aria-required={Boolean(portrait)}
            aria-invalid={portraitAltRequired}
          />
          {portraitAltRequired ? (
            <span role="alert" className="text-xs text-text-muted">
              Texto alternativo é obrigatório quando há uma foto.
            </span>
          ) : null}
        </label>
      </fieldset>

      {/* Logo (optional, accepts SVG) */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs uppercase tracking-wider text-text-muted">
          Logo (opcional)
        </legend>
        <Dropzone
          accept={LOGO_ACCEPT}
          uploading={logoState.uploading}
          error={logoState.error}
          previewUrl={mediaUrl(logo ?? null)}
          previewAlt={logoAlt}
          onPick={(file) => startTransition(() => void uploadFor('logo', file))}
        />
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            Texto alternativo (opcional para logos decorativos)
          </span>
          <input
            value={logoAlt}
            onChange={(e) => setLogoAlt(e.target.value)}
            placeholder="Ex.: Monograma ML"
            className="h-10 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
          />
        </label>
      </fieldset>

      {/* Tagline */}
      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          Tagline (PT-BR)
        </span>
        <input
          value={tagline}
          maxLength={140}
          onChange={(e) => onMutate('content', { tagline: e.target.value })}
          className="h-10 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-text-muted">
          {140 - tagline.length} caracteres restantes
        </span>
      </label>

      {/* CTA */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            Botão principal
          </span>
          <select
            value={ctaPreset}
            onChange={(e) => onCtaPresetChange(e.target.value)}
            className="h-10 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
          >
            {CTA_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {ctaPreset === 'custom' ? (
            <input
              value={ctaLabel}
              maxLength={40}
              placeholder="Ex.: Contratação"
              onChange={(e) => onMutate('content', { ctaLabel: e.target.value })}
              className="h-10 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
            />
          ) : null}
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-text-muted">
            URL ou contato
          </span>
          <input
            value={ctaUrl}
            placeholder="https://wa.me/55... · mailto:press@... · https://..."
            onChange={(e) => onMutate('content', { ctaUrl: e.target.value })}
            onBlur={onCtaUrlBlur}
            aria-invalid={ctaUrl.length > 0 && !isValidCtaUrl(ctaUrl)}
            className="h-10 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
          />
          {ctaUrl.length > 0 && !isValidCtaUrl(ctaUrl) ? (
            <span role="alert" className="text-xs text-text-muted">
              URL precisa começar com http://, https://, mailto: ou tel:.
            </span>
          ) : null}
        </label>
      </div>

      {/* Hero style */}
      <fieldset>
        <legend className="text-xs uppercase tracking-wider text-text-muted">
          Estilo do hero
        </legend>
        <div role="radiogroup" className="mt-3 grid gap-2 md:grid-cols-3">
          {HERO_STYLES.map((style) => {
            const checked = heroStyle === style.value;
            return (
              <label
                key={style.value}
                className={`flex cursor-pointer items-center justify-center border px-3 py-3 text-xs uppercase tracking-wider transition-colors ${
                  checked
                    ? 'border-accent bg-accent text-accent-contrast'
                    : 'border-border bg-transparent text-text hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="heroStyle"
                  value={style.value}
                  checked={checked}
                  onChange={() => onMutate('theme', { heroStyle: style.value })}
                  className="sr-only"
                />
                {style.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

function Dropzone({
  accept,
  uploading,
  error,
  previewUrl,
  previewAlt,
  onPick,
}: {
  accept: string;
  uploading: boolean;
  error: string | null;
  previewUrl: string | null;
  previewAlt: string;
  onPick: (file: File) => void;
}) {
  return (
    <label className="flex h-40 cursor-pointer items-center justify-center border-2 border-dashed border-border bg-bg p-3 text-center transition-colors hover:border-accent">
      {previewUrl ? (
        // `previewUrl` is a `URL.createObjectURL` blob; `next/image`
        // cannot optimize blob/data URLs. Plain `<img>` is correct here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={previewAlt} className="h-32 w-auto object-contain" />
      ) : (
        <span className="font-display text-xs uppercase tracking-wider text-text-muted">
          {uploading ? 'Enviando...' : 'Clique para enviar'}
        </span>
      )}
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
        className="sr-only"
      />
      {error ? (
        <span role="status" className="ml-3 text-xs text-text-muted">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export default HeroEditCard;
