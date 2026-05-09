'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';
import { mediaUrl } from '@/lib/media/url';

type ImageMedia = {
  bucket: string;
  path: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
};

type GalleryEntry = ImageMedia & { id: number; decorative?: boolean };

/**
 * Festival Club Orange biography panel — split 40/60 layout.
 *
 * Image column (40%): a 4:5 aspect-ratio bio photo at high contrast +
 * desaturated, with an accent ink-splatter overlay set to color-dodge.
 * Falls back to the profile portrait when no gallery images exist.
 *
 * Text column (60%): numbered "01 — Biography" marker, oversized
 * display heading, then the rich-text bio. Tagline gets the accent
 * left-border treatment.
 *
 * The mediakit-pro-v1 preset ships an identical visual; both are
 * folder-owned so each preset carries its own copy. Future divergence
 * (e.g. festival-specific palette tweaks) can land without churning
 * the other one.
 */
export function AboutFestivalClubOrange({ bundle }: { bundle: EditorBundle }) {
  const t = useTranslations('profile.about');
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);

  if (!tagline && !hasBio) return null;

  const bioImage = pickBioImage(bundle);
  const imageUrl = mediaUrl(bioImage ?? null);
  const imgWidth = (bioImage?.width ?? 1200) || 1200;
  const imgHeight = (bioImage?.height ?? 1500) || 1500;

  return (
    <section
      id="sobre"
      className="border-b border-border bg-bg px-6 py-20 md:px-12 md:py-32"
    >
      <div className="grid items-start gap-10 md:grid-cols-[40%_1fr] md:gap-16">
        <div className="md:col-start-2 md:row-start-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            {t('label')}
          </p>
          <h2
            className="mt-6 font-display uppercase leading-none tracking-tight text-text"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
          >
            {t('heading')}
          </h2>
          {tagline ? (
            <p className="mt-8 max-w-prose border-l-2 border-accent pl-5 text-base font-bold leading-relaxed text-text md:text-lg">
              {tagline}
            </p>
          ) : null}
          {hasBio ? (
            <RichTextRender
              state={bio}
              className="mt-6 max-w-prose text-sm leading-relaxed text-text-muted md:text-base"
            />
          ) : null}
        </div>
        {imageUrl ? (
          <figure className="relative md:col-start-1 md:row-start-1">
            <div className="aspect-[4/5] w-full overflow-hidden bg-surface">
              <Image
                src={imageUrl}
                alt={bioImage?.alt ?? ''}
                width={imgWidth}
                height={imgHeight}
                sizes="(min-width: 768px) 40vw, 100vw"
                className="h-full w-full object-cover"
                style={{ filter: 'contrast(1.3) saturate(0) brightness(0.85)' }}
              />
            </div>
            <BioInkSplatter className="pointer-events-none absolute -left-6 top-1/2 h-56 w-56 -translate-y-1/2 -rotate-12 text-accent opacity-30 mix-blend-color-dodge md:h-72 md:w-72" />
          </figure>
        ) : null}
      </div>
    </section>
  );
}

function pickBioImage(bundle: EditorBundle): ImageMedia | null {
  const gallery = bundle.profile.gallery as Array<GalleryEntry | number> | undefined;
  if (Array.isArray(gallery)) {
    const first = gallery.find(
      (entry): entry is GalleryEntry =>
        typeof entry === 'object' && entry !== null && 'bucket' in entry,
    );
    if (first) return first;
  }
  const portrait = bundle.profile.portrait as ImageMedia | null | undefined;
  return portrait ?? null;
}

function BioInkSplatter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M30 100c-8-10-12-22-10-34 8 8 18 12 28 10-4-12-2-24 6-32 6 10 14 16 24 18-2-12 4-22 14-26 4 12 12 20 22 22-4-12 2-24 12-30 6 14 16 22 28 24-6 12-14 22-24 26 12 4 22 14 26 26-14-2-26 4-34 14 8 8 12 20 8 32-12-6-24-4-32 4-2 12-10 22-22 26-2-14-10-24-22-28-12 8-26 8-38 0 6-12 14-22 24-22z" />
      <circle cx="65" cy="55" r="3" />
      <circle cx="145" cy="65" r="2" />
      <circle cx="155" cy="135" r="4" />
      <circle cx="50" cy="150" r="2" />
    </svg>
  );
}
