'use client';

import type { EditorBundle } from '@/lib/editor/bundle';
import type { SectionKey } from '@/lib/editor/section-order';
import { SECTIONS } from '@/lib/editor/sections';

import type { MutationScope } from '@/app/dashboard/profile/[id]/EditorClient';

import { AboutEditCard } from './sections/AboutEditCard';
import { ContactEditCard } from './sections/ContactEditCard';
import { HeroEditCard } from './sections/HeroEditCard';
import { PhotoGalleryEditCard } from './sections/PhotoGalleryEditCard';
import { PlaceholderEditCard } from './sections/PlaceholderEditCard';
import { ServicesEditCard } from './sections/ServicesEditCard';
import { SocialLinksEditCard } from './sections/SocialLinksEditCard';

export interface EditorPaneProps {
  active: SectionKey;
  bundle: EditorBundle;
  supabaseUserId: string;
  onMutate: (scope: MutationScope, patch: Record<string, unknown>) => void;
}

/**
 * Delegates to the active section's EditCard. Future tasks (11–17) add
 * a case + an import — the placeholder is the default.
 */
export function EditorPane({
  active,
  bundle,
  supabaseUserId,
  onMutate,
}: EditorPaneProps) {
  const meta = SECTIONS[active];
  if (!meta.hasEditor) return <PlaceholderEditCard meta={meta} />;

  switch (active) {
    case 'hero':
      return (
        <HeroEditCard
          bundle={bundle}
          supabaseUserId={supabaseUserId}
          onMutate={onMutate}
        />
      );
    case 'about':
      return <AboutEditCard bundle={bundle} onMutate={onMutate} />;
    case 'services':
      return <ServicesEditCard bundle={bundle} onMutate={onMutate} />;
    case 'photoGallery':
      return (
        <PhotoGalleryEditCard
          bundle={bundle}
          supabaseUserId={supabaseUserId}
          onMutate={onMutate}
        />
      );
    case 'socialLinks':
      return <SocialLinksEditCard bundle={bundle} onMutate={onMutate} />;
    case 'contact':
      return <ContactEditCard bundle={bundle} onMutate={onMutate} />;
    default:
      return <PlaceholderEditCard meta={meta} />;
  }
}
