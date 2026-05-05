'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { advanceStep } from '../actions';

export interface MediaStepProps {
  supabaseUserId: string;
  initialPortraitId?: number | null;
  initialLogoId?: number | null;
}

type Slot = 'portrait' | 'logo';

type SlotState = {
  uploading: boolean;
  mediaId: number | null;
  previewUrl: string | null;
  error: string | null;
};

const FRESH_SLOT: SlotState = {
  uploading: false,
  mediaId: null,
  previewUrl: null,
  error: null,
};

/**
 * Two side-by-side dropzones. Step is fully skippable per PRD §6.2.
 *
 * Upload flow (matches the editor's, per ADR-0001):
 *   1. POST /api/storage/sign-upload → signed Supabase Storage URL.
 *   2. PUT the file directly to Supabase.
 *   3. POST /api/media → register Payload Media doc, capture id.
 *   4. Hold ids in component state; advanceStep(2) persists them.
 */
export function MediaStep({
  supabaseUserId,
  initialPortraitId = null,
  initialLogoId = null,
}: MediaStepProps) {
  const router = useRouter();
  const [portrait, setPortrait] = useState<SlotState>({
    ...FRESH_SLOT,
    mediaId: initialPortraitId,
  });
  const [logo, setLogo] = useState<SlotState>({
    ...FRESH_SLOT,
    mediaId: initialLogoId,
  });
  const [submitting, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function uploadFile(file: File, slot: Slot) {
    const setter = slot === 'portrait' ? setPortrait : setLogo;
    setter((s) => ({ ...s, uploading: true, error: null }));
    try {
      // 1. Signed URL.
      const signRes = await fetch('/api/storage/sign-upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bucket: 'avatars',
          mimeType: file.type,
          size: file.size,
          ownerSupabaseId: supabaseUserId,
        }),
      });
      if (!signRes.ok) throw new Error('upload-sign-failed');
      const { token, path } = (await signRes.json()) as {
        token: string;
        path: string;
      };

      // 2. Direct PUT to Supabase Storage.
      const putRes = await fetch(token, { method: 'PUT', body: file });
      if (!putRes.ok) throw new Error('upload-put-failed');

      // 3. Register Media metadata in Payload.
      const mediaRes = await fetch('/api/media', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bucket: 'avatars',
          path,
          mimeType: file.type,
          size: file.size,
          alt: slot === 'portrait' ? 'Foto principal' : 'Logo',
          ownerSupabaseId: supabaseUserId,
        }),
      });
      if (!mediaRes.ok) throw new Error('media-register-failed');
      const { id } = (await mediaRes.json()) as { id: number };

      const previewUrl = URL.createObjectURL(file);
      setter({ uploading: false, mediaId: id, previewUrl, error: null });
    } catch (err) {
      setter({
        ...FRESH_SLOT,
        error: err instanceof Error ? err.message : 'upload failed',
      });
    }
  }

  function advance(skip: boolean) {
    setGlobalError(null);
    startTransition(async () => {
      const result = await advanceStep(2, {
        portraitId: skip ? null : portrait.mediaId,
        logoId: skip ? null : logo.mediaId,
      });
      if (result.ok) {
        router.push(`/onboarding/${result.nextStep}`);
      } else if ('reason' in result) {
        setGlobalError(result.reason);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Dropzone
          label="Foto principal"
          slot={portrait}
          onPick={(f) => uploadFile(f, 'portrait')}
        />
        <Dropzone
          label="Logo (opcional)"
          slot={logo}
          onPick={(f) => uploadFile(f, 'logo')}
        />
      </div>
      {globalError ? (
        <p role="alert" className="text-sm text-text-muted">
          {globalError}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => advance(false)}
          disabled={portrait.uploading || logo.uploading || submitting}
        >
          {submitting ? 'Salvando...' : 'Continuar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => advance(true)}
          disabled={submitting}
        >
          Pular por enquanto
        </Button>
      </div>
    </div>
  );
}

function Dropzone({
  label,
  slot,
  onPick,
}: {
  label: string;
  slot: SlotState;
  onPick: (file: File) => void;
}) {
  return (
    <label className="flex h-48 cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border bg-surface p-4 text-center transition-colors hover:border-accent">
      {slot.previewUrl ? (
        <img src={slot.previewUrl} alt="" className="h-32 w-auto object-contain" />
      ) : (
        <span className="font-display text-sm uppercase tracking-wider text-text-muted">
          {slot.uploading ? 'Enviando...' : `Adicionar ${label.toLowerCase()}`}
        </span>
      )}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
        className="sr-only"
      />
      {slot.error ? (
        <span role="status" className="mt-2 text-xs text-text-muted">
          {slot.error}
        </span>
      ) : null}
    </label>
  );
}
