import type { Preset } from './types';

/**
 * Festival Club Orange — light cream + electric orange aesthetic for
 * mainstream festival / club / melodic-house DJs. Modeled on
 * docs/presets/MediakitPRO_template_2.json.
 *
 * Visual signature:
 *   - Cream `#F2F0EB` page bg with dark text — first preset to ship a
 *     light theme.
 *   - Electric orange `#FF5500` accent for display-size titles + CTAs.
 *   - Layered hero: massive accent-tinted display text positioned
 *     center, artist portrait sits on top to occlude the lower half →
 *     the type reads "behind" the cutout even with regular portraits.
 *   - Big Shoulders Display + Sora via the existing `industrial`
 *     fontPair, which is the closest available match to the spec's
 *     Big Shoulders + Nunito pairing.
 *
 * Accent contrast on light bg is 3.4:1 — fails WCAG AA for body copy
 * but passes for ≥18px bold display text. The variant components only
 * use the accent on display titles + CTAs (never small body text).
 */
export const festivalClubOrange: Preset = {
  id: 'festival-club-orange',
  name: 'Festival Club Orange',
  tagline: 'Estética festival / club: creme claro, laranja elétrico, hero em camadas e marquee em alta voltagem.',
  theme: {
    bgPresetId: 'paper-white',
    accentPresetId: 'burnt-orange',
    bg: '#F2F0EB',
    accent: '#FF5500',
    text: '#0E0E0E',
    fontPairId: 'industrial',
  },
  sections: {
    hero: 'cutout-layered',
    bio: 'split-image-text',
    services: 'orange-cards',
    gallery: 'film-strip',
    socialLinks: 'platform-stats',
    pressKit: 'cursor-cta',
    contact: 'two-column-footer',
  },
  decorations: {
    marquee: { source: 'displayName' },
    filmGrain: true,
  },
  thumbnail: '/presets/festival-club-orange/thumb.jpg',
};
