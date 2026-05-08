'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { PRESETS, type Preset } from '@/lib/presets';

import { applyPresetAction, type ApplyPresetResult } from './design-actions';

/**
 * Editor's Design tab — preset card grid with two-step apply (click to
 * select, click Apply to commit). The two-step is intentional: applying
 * overwrites the artist's custom color/font tokens AND clears the
 * contrast-validated timestamp, so a single accidental click could
 * silently delete a tuned palette.
 */
export function DesignTab({
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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function apply(preset: Preset) {
    if (preset.id === activePresetId || pending) return;
    setPendingId(preset.id);
    setErrorId(null);
    startTransition(async () => {
      const result: ApplyPresetResult = await applyPresetAction(
        profileId,
        preset.id,
        profileSlug,
      );
      if (!result.ok) {
        setErrorId(preset.id);
        setPendingId(null);
        return;
      }
      setPendingId(null);
      // The editor reads `bundle` from a TanStack Query cache; without
      // this invalidate the Design tab's "Selected" indicator and the
      // PreviewPane both keep showing the old preset's tokens until
      // the next save flushes the bundle.
      await qc.invalidateQueries({ queryKey: ['editor', profileId] });
      router.refresh();
    });
  }

  return (
    <div className="px-6 py-10 md:px-12">
      <header className="max-w-prose">
        <h2 className="font-display text-2xl uppercase tracking-tight">
          {t('heading')}
        </h2>
        <p className="mt-3 text-sm text-text-muted">{t('description')}</p>
        <p className="mt-3 text-xs uppercase tracking-wider text-text-muted">
          {t('applyHint')}
        </p>
      </header>
      <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((preset) => {
          const isActive = preset.id === activePresetId;
          const isPending = pendingId === preset.id;
          const hasError = errorId === preset.id;
          return (
            <li key={preset.id}>
              <PresetCard
                preset={preset}
                isActive={isActive}
                isPending={isPending}
                hasError={hasError}
                disabled={pending && !isPending}
                onApply={() => apply(preset)}
                t={t}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PresetCard({
  preset,
  isActive,
  isPending,
  hasError,
  disabled,
  onApply,
  t,
}: {
  preset: Preset;
  isActive: boolean;
  isPending: boolean;
  hasError: boolean;
  disabled: boolean;
  onApply: () => void;
  t: (key: string) => string;
}) {
  const tPresets = useTranslations('presets');
  const localizedName = tPresets(`${preset.id}.name`);
  const localizedTagline = tPresets(`${preset.id}.tagline`);

  return (
    <article
      data-preset-id={preset.id}
      data-active={isActive ? 'true' : undefined}
      className={cn(
        'flex h-full flex-col border bg-bg transition-colors duration-quick',
        isActive
          ? 'border-accent'
          : 'border-border hover:border-text-muted',
      )}
    >
      <PresetPreview preset={preset} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg uppercase tracking-tight">
            {localizedName}
          </h3>
          {isActive ? (
            <span className="inline-flex items-center border border-accent px-2 py-0.5 text-xs uppercase tracking-wider text-accent">
              {t('activeBadge')}
            </span>
          ) : null}
        </div>
        <p className="mt-3 flex-1 text-sm text-text-muted">{localizedTagline}</p>
        <div className="mt-6">
          {isActive ? null : (
            <Button
              type="button"
              onClick={onApply}
              disabled={disabled || isPending}
            >
              {isPending ? t('pendingCta') : t('applyCta')}
            </Button>
          )}
          {hasError ? (
            <p className="mt-3 text-xs text-red-400" role="alert">
              {t('errorMessage')}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Synthetic 4:3 preview using the preset's own theme tokens — avoids
 * shipping a JPG asset until designers capture real screenshots. The
 * accent stripe + display-font wordmark match the brutalist editorial
 * vocabulary so previews feel like a one-screen press-kit teaser.
 */
function PresetPreview({ preset }: { preset: Preset }) {
  const text = preset.theme.text ?? '#f0ede6';
  return (
    <div
      aria-hidden="true"
      className="aspect-[4/3] w-full p-4"
      style={{ background: preset.theme.bg }}
    >
      <div className="flex h-full flex-col justify-between">
        <p
          className="font-display text-[10px] uppercase tracking-widest"
          style={{ color: text, opacity: 0.7 }}
        >
          presskit.pro/dj
        </p>
        <div>
          <div
            className="h-1 w-12"
            style={{ background: preset.theme.accent }}
          />
          <p
            className="mt-2 font-display text-xl uppercase leading-none"
            style={{ color: text }}
          >
            {preset.name}
          </p>
        </div>
      </div>
    </div>
  );
}
