import { editorialNightlifeV1 } from './editorial-nightlife-v1';
import { festivalClubOrange } from './festival-club-orange';
import { mediakitProV1 } from './mediakit-pro-v1';
import type { Preset } from './types';

export type {
  BioVariant,
  ContactVariant,
  GalleryVariant,
  HeroVariant,
  Preset,
  PresetDecorations,
  PresetSections,
  PresetTheme,
  PressKitVariant,
  ServicesVariant,
  SocialVariant,
} from './types';

/**
 * Order is load-bearing for the editor's Design tab — the first card the
 * artist sees should be the new flagship preset, then the legacy default.
 */
export const PRESETS: readonly Preset[] = [
  mediakitProV1,
  festivalClubOrange,
  editorialNightlifeV1,
] as const;

/**
 * Onboarding writes this id into `Themes.presetId` for new profiles;
 * existing profiles get backfilled to `editorial-nightlife-v1` instead.
 */
export const DEFAULT_PRESET_ID = mediakitProV1.id;

export function getPresetById(id: string | null | undefined): Preset | null {
  if (!id) return null;
  return PRESETS.find((p) => p.id === id) ?? null;
}

export function getDefaultPreset(): Preset {
  return mediakitProV1;
}
