'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import type { SocialPlatform } from '@/lib/onboarding/state';
import { advanceStep, completeWizard } from '../actions';

const PLATFORMS: Array<{ value: SocialPlatform; label: string; placeholder: string }> = [
  { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { value: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@...' },
  { value: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
  { value: 'spotify',   label: 'Spotify',   placeholder: 'https://open.spotify.com/artist/...' },
  { value: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@...' },
  { value: 'twitter',   label: 'Twitter / X', placeholder: 'https://x.com/...' },
  { value: 'bandcamp',  label: 'Bandcamp',  placeholder: 'https://artist.bandcamp.com' },
  { value: 'mixcloud',  label: 'Mixcloud',  placeholder: 'https://mixcloud.com/...' },
  { value: 'apple-music', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
  { value: 'beatport',  label: 'Beatport',  placeholder: 'https://beatport.com/artist/...' },
  { value: 'whatsapp',  label: 'WhatsApp',  placeholder: 'https://wa.me/55...' },
  { value: 'email',     label: 'E-mail',    placeholder: 'press@artist.com' },
  { value: 'website',   label: 'Site',      placeholder: 'https://...' },
];

export interface SocialStepProps {
  initialPlatform?: SocialPlatform;
  initialUrl?: string;
}

export function SocialStep({ initialPlatform, initialUrl }: SocialStepProps) {
  const router = useRouter();
  const [platform, setPlatform] = useState<SocialPlatform>(initialPlatform ?? 'instagram');
  const [url, setUrl] = useState(initialUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, startTransition] = useTransition();

  const placeholder = PLATFORMS.find((p) => p.value === platform)?.placeholder ?? '';
  const canSubmit = url.trim().length > 0 && !submitting;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const advanced = await advanceStep(5, {
        socialPlatform: platform,
        socialUrl: url.trim(),
      });
      if (!advanced.ok) {
        if ('reason' in advanced) setError(labelFor(advanced.reason));
        return;
      }
      const completion = await completeWizard();
      if (completion.ok) {
        router.push(`/dashboard/profile/${completion.profileId}`);
      } else {
        setError(labelFor(completion.reason));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label htmlFor="platform" className="text-sm uppercase tracking-wider text-text-muted">
        Plataforma
      </label>
      <select
        id="platform"
        value={platform}
        onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
        className="h-12 border border-border bg-surface px-3 text-base outline-none focus:border-accent"
      >
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <label htmlFor="url" className="mt-2 text-sm uppercase tracking-wider text-text-muted">
        URL ou contato
      </label>
      <input
        id="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        inputMode={platform === 'email' ? 'email' : 'url'}
        className="h-12 border border-border bg-surface px-3 text-base outline-none focus:border-accent"
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p role="alert" className="text-sm text-text-muted">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        <Button type="submit" disabled={!canSubmit}>
          {submitting ? 'Criando seu perfil...' : 'Concluir e abrir editor'}
        </Button>
      </div>
    </form>
  );
}

function labelFor(reason: string): string {
  switch (reason) {
    case 'invalid-url':   return 'URL inválida (precisa começar com http ou https).';
    case 'invalid-email': return 'E-mail inválido.';
    case 'required':      return 'Preencha este campo.';
    case 'incomplete':    return 'Algum passo anterior está incompleto.';
    case 'mirror-pending':return 'Sua conta ainda está sendo sincronizada — tenta de novo em alguns segundos.';
    default:              return reason;
  }
}
