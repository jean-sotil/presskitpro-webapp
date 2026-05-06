import { deriveThemeTokens } from '@/lib/design/derive-theme-tokens';
import type { EditorBundle } from '@/lib/editor/bundle';
import {
  DEFAULT_SECTION_ORDER,
  mergeOrder,
  type SectionKey,
} from '@/lib/editor/section-order';

import { AboutRender } from './sections/AboutRender';
import { ContactRender } from './sections/ContactRender';
import { FeaturedTrackRender } from './sections/FeaturedTrackRender';
import { HeroRender } from './sections/HeroRender';
import { InstagramFeedRender } from './sections/InstagramFeedRender';
import { PhotoGalleryRender } from './sections/PhotoGalleryRender';
import { PressKitLinkRender } from './sections/PressKitLinkRender';
import { ServicesRender } from './sections/ServicesRender';
import { SocialLinksRender } from './sections/SocialLinksRender';

const SECTION_RENDERERS: Record<
  SectionKey,
  (props: { bundle: EditorBundle }) => React.ReactNode
> = {
  hero: HeroRender,
  about: AboutRender,
  services: ServicesRender,
  featuredTrack: FeaturedTrackRender,
  instagramFeed: InstagramFeedRender,
  photoGallery: PhotoGalleryRender,
  pressKitLink: PressKitLinkRender,
  socialLinks: SocialLinksRender,
  contact: ContactRender,
};

export interface ProfileRendererProps {
  bundle: EditorBundle;
  /**
   * `preview` runs inside the editor's right pane (against draft data).
   * `public` runs at `/${slug}`. Today the only difference is that
   * `preview` keeps an empty hero visible even when no data exists yet
   * (so the user knows where the slug came out); `public` would 404 in
   * that case (handled by the public route — task-19).
   */
  mode: 'preview' | 'public';
}

/**
 * Same RSC tree shared by the editor preview pane (this task) and the
 * public profile route (task-19). The order comes from `Themes.sectionOrder`,
 * reconciled with the registry defaults.
 */
export function ProfileRenderer({ bundle, mode: _mode }: ProfileRendererProps) {
  const persisted = bundle.theme?.sectionOrder as
    | Array<{ key: string }>
    | undefined;
  const order = mergeOrder(
    persisted?.map((entry) => entry.key as SectionKey) ?? [...DEFAULT_SECTION_ORDER],
  );

  const tokens = deriveThemeTokens(bundle.theme as never);
  // Scope the override to a per-profile data-attr so previews of multiple
  // profiles on the same page (e.g. dashboard cards) don't collide.
  const scopeId = `pp-${String(bundle.profile.id ?? 'preview')}`;
  const themeCss = `[data-theme-scope="${scopeId}"] {
  --bg: ${tokens.bg};
  --accent: ${tokens.accent};
  --accent-contrast: ${tokens.accentContrast};
  --text: ${tokens.text};
}`;

  return (
    <>
      <style data-theme-scope={scopeId}>{themeCss}</style>
      <article data-theme-scope={scopeId} className="bg-bg text-text">
        {order.map((key) => {
          const Render = SECTION_RENDERERS[key];
          return <Render key={key} bundle={bundle} />;
        })}
      </article>
    </>
  );
}
