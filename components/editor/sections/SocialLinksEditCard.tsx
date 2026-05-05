'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemo } from 'react';

import { Button } from '@/components/ui/Button';
import type { EditorBundle } from '@/lib/editor/bundle';
import {
  MAX_SOCIAL_LINKS,
  PLATFORMS,
  type Platform,
  parseAndCanonicalize,
} from '@/lib/editor/social-link-validate';
import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  youtube: 'YouTube',
  twitter: 'Twitter / X',
  bandcamp: 'Bandcamp',
  mixcloud: 'Mixcloud',
  'apple-music': 'Apple Music',
  beatport: 'Beatport',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  website: 'Website',
};

const HELP_LINK: Record<Platform, string> = {
  instagram: 'https://help.instagram.com/155833707900388',
  tiktok: 'https://support.tiktok.com/en/account-and-privacy/personal-information-and-ads',
  soundcloud: 'https://help.soundcloud.com/hc/en-us/articles/360009999153',
  spotify: 'https://support.spotify.com/us/article/find-share-music-podcasts/',
  youtube: 'https://support.google.com/youtube/answer/3250431',
  twitter: 'https://help.twitter.com/en/managing-your-account/how-to-find-your-username',
  bandcamp: 'https://get.bandcamp.help/hc/en-us/articles/23020693374103',
  mixcloud: 'https://help.mixcloud.com/hc/en-us/articles/360003291839',
  'apple-music': 'https://support.apple.com/guide/music/share-music-mus19ad77b8b/web',
  beatport: 'https://support.beatport.com/hc/en-us/articles/4406261148308',
  whatsapp: 'https://faq.whatsapp.com/5913398998672934',
  email: '#',
  website: '#',
};

type EditableLink = {
  id?: number;
  platform: Platform;
  url: string;
};

export interface SocialLinksEditCardProps {
  bundle: EditorBundle;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

function normalize(raw: EditorBundle['socialLinks']): EditableLink[] {
  return (raw ?? []).map((row) => ({
    id: typeof row.id === 'number' ? row.id : undefined,
    platform: ((row as { platform?: string }).platform ?? 'instagram') as Platform,
    url: String((row as { url?: string }).url ?? ''),
  }));
}

function pickFirstAvailablePlatform(taken: Set<Platform>): Platform {
  for (const p of PLATFORMS) if (!taken.has(p)) return p;
  return 'website';
}

export function SocialLinksEditCard({
  bundle,
  onMutate,
}: SocialLinksEditCardProps) {
  const links = useMemo(() => normalize(bundle.socialLinks), [bundle.socialLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const validations = useMemo(
    () => links.map((l) => parseAndCanonicalize(l.platform, l.url)),
    [links],
  );
  const anyInvalid = validations.some((v) => !v.ok);

  function commit(next: EditableLink[]) {
    onMutate('socialLinks', { links: next });
  }

  function patchAt(index: number, partial: Partial<EditableLink>) {
    commit(links.map((l, i) => (i === index ? { ...l, ...partial } : l)));
  }

  function removeAt(index: number) {
    commit(links.filter((_, i) => i !== index));
  }

  function add() {
    if (links.length >= MAX_SOCIAL_LINKS) return;
    const taken = new Set(links.map((l) => l.platform));
    const platform = pickFirstAvailablePlatform(taken);
    commit([...links, { platform, url: '' }]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = links.findIndex((_, i) => `sl-${i}` === active.id);
    const toIdx = links.findIndex((_, i) => `sl-${i}` === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...links];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved!);
    commit(next);
  }

  return (
    <div className="flex flex-col gap-6 border border-border bg-surface p-6">
      <header>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          Editando · Redes sociais
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">
          Redes sociais
        </h2>
      </header>

      {anyInvalid ? (
        <p role="alert" className="border border-border bg-bg p-3 text-sm text-text">
          Algumas linhas precisam de atenção antes de salvar. Corrija ou remova-as.
        </p>
      ) : null}

      {links.length === 0 ? (
        <p className="border border-dashed border-border p-4 text-sm text-text-muted">
          Nenhum link cadastrado. Adicione o primeiro abaixo.
        </p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={links.map((_, i) => `sl-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="flex flex-col gap-3">
              {links.map((link, i) => (
                <SortableLinkRow
                  key={`sl-${i}`}
                  id={`sl-${i}`}
                  link={link}
                  invalid={!validations[i]!.ok}
                  onChange={(partial) => patchAt(i, partial)}
                  onRemove={() => removeAt(i)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div>
        <Button
          type="button"
          onClick={add}
          disabled={links.length >= MAX_SOCIAL_LINKS}
        >
          + Adicionar link
        </Button>
        {links.length >= MAX_SOCIAL_LINKS ? (
          <p className="mt-2 text-xs text-text-muted">
            Máximo {MAX_SOCIAL_LINKS} links por perfil.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SortableLinkRow({
  id,
  link,
  invalid,
  onChange,
  onRemove,
}: {
  id: string;
  link: EditableLink;
  invalid: boolean;
  onChange: (partial: Partial<EditableLink>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-stretch border border-border bg-bg ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Reordenar link"
        {...attributes}
        {...listeners}
        className="grid w-8 cursor-grab place-items-center border-r border-border text-text-muted hover:text-text active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3 md:flex-row md:items-start">
        <select
          value={link.platform}
          onChange={(e) => onChange({ platform: e.target.value as Platform })}
          aria-label="Plataforma"
          className="h-9 border border-border bg-bg px-2 text-sm outline-none focus:border-accent"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </option>
          ))}
        </select>
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="text"
            value={link.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder={placeholderFor(link.platform)}
            aria-invalid={invalid}
            className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
          />
          {invalid ? (
            <span role="alert" className="text-xs text-text-muted">
              URL inválida.{' '}
              <a
                href={HELP_LINK[link.platform]}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Como encontrar a URL do {PLATFORM_LABELS[link.platform]}?
              </a>
            </span>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover link"
        className="grid w-10 cursor-pointer place-items-center border-l border-border text-text-muted hover:text-text"
      >
        ×
      </button>
    </li>
  );
}

function placeholderFor(platform: Platform): string {
  switch (platform) {
    case 'instagram':
    case 'tiktok':
    case 'twitter':
      return '@usuario ou URL completa';
    case 'whatsapp':
      return '+55 11 99999-9999';
    case 'email':
      return 'voce@dominio.com';
    case 'website':
      return 'https://seusite.com';
    default:
      return 'URL completa';
  }
}
