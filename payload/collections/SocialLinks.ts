import type { CollectionConfig } from 'payload';

import {
  canCreateForOwnedProfile,
  ownsViaProfile,
} from '../../lib/payload/access/predicates';

const PLATFORMS = [
  { label: 'Instagram',  value: 'instagram'  },
  { label: 'TikTok',     value: 'tiktok'     },
  { label: 'SoundCloud', value: 'soundcloud' },
  { label: 'Spotify',    value: 'spotify'    },
  { label: 'YouTube',    value: 'youtube'    },
  { label: 'Twitter / X', value: 'twitter'   },
  { label: 'Bandcamp',   value: 'bandcamp'   },
  { label: 'Mixcloud',   value: 'mixcloud'   },
  { label: 'Apple Music', value: 'apple-music' },
  { label: 'Beatport',   value: 'beatport'   },
  { label: 'WhatsApp',   value: 'whatsapp'   },
  { label: 'Email',      value: 'email'      },
  { label: 'Website',    value: 'website'    },
] as const;

export const SocialLinks: CollectionConfig = {
  slug: 'social-links',
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['profile', 'platform', 'displayOrder', 'url'],
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
      index: true,
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [...PLATFORMS],
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      maxLength: 500,
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Lower = earlier on the public profile.' },
    },
  ],
  timestamps: true,
};
