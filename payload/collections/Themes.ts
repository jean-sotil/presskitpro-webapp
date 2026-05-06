import type { CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsViaProfile,
} from '../../lib/payload/access/predicates';

/**
 * One theme record per Profile (1:1, enforced by `unique: true` on `profile`).
 *
 * Per PRD §12.2, only color + font + layout vary per profile. Spacing /
 * type scale / motion are locked by the design system (`tailwind.config.ts`).
 * `contrastValidatedAt` is the gate for publish (task-18 sets it after
 * the editor's contrast check passes; this collection just stores the value).
 */
export const Themes: CollectionConfig = {
  slug: 'themes',
  admin: {
    useAsTitle: 'profile',
    defaultColumns: ['profile', 'colorPresetId', 'fontPairId', 'updatedAt'],
  },
  access: {
    read: ownsViaProfile,
    update: ownsViaProfile,
    delete: ownsViaProfile,
    create: canCreateForOwnedProfile,
  },
  fields: [
    {
      name: 'profile',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      unique: true,
      index: true,
    },
    // ----- Color -----
    {
      name: 'colorPresetId',
      type: 'text',
      admin: {
        description:
          "BG preset id (e.g. 'editorial-night'). Empty when overriding via custom hex.",
      },
    },
    {
      name: 'accentPresetId',
      type: 'text',
      admin: {
        description:
          "Accent preset id (e.g. 'electric-green'). Empty when overriding via custom hex.",
      },
    },
    { name: 'bg',     type: 'text', admin: { description: 'Hex value, present when overriding the preset bg.' } },
    { name: 'accent', type: 'text', admin: { description: 'Hex value, present when overriding the preset accent.' } },
    { name: 'text',   type: 'text', admin: { description: 'Hex value; auto-derived if empty.' } },

    // ----- Typography -----
    {
      name: 'fontPairId',
      type: 'select',
      required: true,
      defaultValue: 'editorial-nightlife',
      options: [
        { label: 'Editorial Nightlife', value: 'editorial-nightlife' },
        { label: 'Magazine',           value: 'magazine'             },
        { label: 'Brutalist',          value: 'brutalist'            },
        { label: 'Refined',            value: 'refined'              },
        { label: 'Industrial',         value: 'industrial'           },
        { label: 'Soft Pop',           value: 'soft-pop'             },
        { label: 'Retro Future',       value: 'retro-future'         },
        { label: 'Classic Press',      value: 'classic-press'        },
      ],
    },

    // ----- Layout -----
    {
      name: 'heroStyle',
      type: 'select',
      required: true,
      defaultValue: 'full-bleed-portrait',
      options: [
        { label: 'Full-bleed portrait', value: 'full-bleed-portrait' },
        { label: 'Split portrait + text', value: 'split-portrait-text' },
        { label: 'Centered logo',         value: 'centered-logo'       },
      ],
    },
    {
      name: 'galleryLayout',
      type: 'select',
      required: true,
      defaultValue: 'mosaic',
      options: [
        { label: 'Mosaic',      value: 'mosaic'        },
        { label: 'Uniform grid', value: 'uniform-grid' },
        { label: 'Carousel',    value: 'carousel'      },
      ],
    },
    {
      name: 'sectionOrder',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      fields: [{ name: 'key', type: 'text', required: true }],
      admin: { description: 'Order of editor-managed sections on the public profile.' },
    },

    // ----- Validation gate -----
    {
      name: 'contrastValidatedAt',
      type: 'date',
      admin: {
        description: 'Updated by the editor when the contrast gate passes. Profile publish is blocked if null or stale.',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};
