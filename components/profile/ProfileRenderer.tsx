import { Fragment } from 'react';

import { deriveThemeTokens } from '@/lib/design/derive-theme-tokens';
import { fontPairCssVars } from '@/lib/design/font-pair-css-vars';
import {
  DEFAULT_FONT_PAIR,
  fontPairs,
  type FontPairId,
} from '@/lib/design/tokens';
import type { EditorBundle } from '@/lib/editor/bundle';
import {
  DEFAULT_SECTION_ORDER,
  mergeOrder,
  type SectionKey,
} from '@/lib/editor/section-order';
import { getPresetById, type Preset } from '@/lib/presets';

import { Marquee } from './sections/decorations/Marquee';
import { AboutRender } from './sections/AboutRender';
import { ContactRender } from './sections/ContactRender';
import { FeaturedTrackRender } from './sections/FeaturedTrackRender';
import { HeroRender } from './sections/HeroRender';
import { InstagramFeedRender } from './sections/InstagramFeedRender';
import { PhotoGalleryRender } from './sections/PhotoGalleryRender';
import { PressKitLinkRender } from './sections/PressKitLinkRender';
import { ServicesRender } from './sections/ServicesRender';
import { SocialLinksRender } from './sections/SocialLinksRender';

/**
 * Resolves each section key to a rendered ReactNode. Section
 * components are client components (they call `useTranslations` from
 * next-intl) so the renderer itself stays sync — works under both
 * server-side render (public profile) and client-side render (editor
 * PreviewPane).
 *
 * Every preset is folder-owned (`Preset.ownedSections: true`); each
 * dispatcher receives the `preset` object and short-circuits on
 * `preset.id`. When no preset is active, the dispatcher falls back to
 * its legacy `Themes.heroStyle` / `Themes.galleryLayout` rendering.
 */
function renderSection(
  key: SectionKey,
  bundle: EditorBundle,
  preset: Preset | null,
): React.ReactNode {
  switch (key) {
    case 'hero':
      return <HeroRender bundle={bundle} preset={preset} />;
    case 'about':
      return <AboutRender bundle={bundle} preset={preset} />;
    case 'services':
      return <ServicesRender bundle={bundle} preset={preset} />;
    case 'featuredTrack':
      return <FeaturedTrackRender bundle={bundle} preset={preset} />;
    case 'instagramFeed':
      return <InstagramFeedRender bundle={bundle} preset={preset} />;
    case 'photoGallery':
      return <PhotoGalleryRender bundle={bundle} preset={preset} />;
    case 'pressKitLink':
      return <PressKitLinkRender bundle={bundle} preset={preset} />;
    case 'socialLinks':
      return <SocialLinksRender bundle={bundle} preset={preset} />;
    case 'contact':
      return <ContactRender bundle={bundle} preset={preset} />;
  }
}

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
  /**
   * Per-request CSP nonce minted in middleware (task-27). When omitted
   * the inline `<style>` falls back to `'unsafe-inline'` in style-src
   * for older browsers; modern browsers rely on the nonce attribute.
   */
  nonce?: string;
}

/**
 * Same RSC tree shared by the editor preview pane (this task) and the
 * public profile route (task-19). The order comes from `Themes.sectionOrder`,
 * reconciled with the registry defaults.
 */
export function ProfileRenderer({ bundle, mode: _mode, nonce }: ProfileRendererProps) {
  const persisted = bundle.theme?.sectionOrder as
    | Array<{ key: string }>
    | undefined;
  const order = mergeOrder(
    persisted?.map((entry) => entry.key as SectionKey) ?? [...DEFAULT_SECTION_ORDER],
  );

  // Task-35 — resolve the active preset (null = legacy row, falls back
  // to Themes.heroStyle/galleryLayout via each section's own logic).
  const presetId = (bundle.theme as { presetId?: string | null } | null)
    ?.presetId;
  const preset = getPresetById(presetId ?? null);
  const marquee = preset?.decorations?.marquee ?? null;

  const tokens = deriveThemeTokens(bundle.theme as never);
  // Scope the override to a per-profile data-attr so previews of multiple
  // profiles on the same page (e.g. dashboard cards) don't collide.
  // Tailwind generates `oklch(var(--bg) / <alpha>)`, so the variable
  // values must be bare OKLCH triplets ("L C H") — not hex.
  const scopeId = `pp-${String(bundle.profile.id ?? 'preview')}`;

  const rawFontPairId = (bundle.theme as { fontPairId?: string } | null)
    ?.fontPairId;
  const fontPairId: FontPairId = (
    fontPairs as readonly string[]
  ).includes(rawFontPairId ?? '')
    ? (rawFontPairId as FontPairId)
    : DEFAULT_FONT_PAIR;
  const fontVars = fontPairCssVars[fontPairId];
  const fontDecls = Object.entries(fontVars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  const themeCss = `[data-theme-scope="${scopeId}"] {
  --bg: ${tokens.bgOklch};
  --accent: ${tokens.accentOklch};
  --accent-contrast: ${tokens.accentContrastOklch};
  --text: ${tokens.textOklch};
${fontDecls}
}`;

  const filmGrain = preset?.decorations?.filmGrain === true;
  const electricFire = preset?.decorations?.electricFire === true;
  const circuitBoard = preset?.decorations?.circuitBoard === true;

  return (
    <>
      <style data-theme-scope={scopeId} nonce={nonce}>{themeCss}</style>
      <article
        data-theme-scope={scopeId}
        data-preset-grain={filmGrain ? 'true' : undefined}
        data-preset-electric-fire={electricFire ? 'true' : undefined}
        data-preset-circuit-board={circuitBoard ? 'true' : undefined}
        className="bg-bg text-text"
      >
        {order.map((key) => (
          <Fragment key={key}>
            {renderSection(key, bundle, preset)}
            {key === 'hero' && marquee ? (
              <Marquee bundle={bundle} source={marquee.source} />
            ) : null}
          </Fragment>
        ))}
      </article>
    </>
  );
}
