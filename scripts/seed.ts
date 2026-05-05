/**
 * Idempotent demo-data seeder for task-08 acceptance + the marketing
 * carousel benchmark.
 *
 *   pnpm seed         # dev hosted Supabase / DATABASE_URI in .env
 *   bun scripts/seed.ts
 *
 * Creates 5 demo `Users` (synthetic UUIDs — no real Supabase auth users
 * needed for static demo content), one published `Profile` each with
 * PT-BR + EN `ProfileContent`, a `Theme`, two `SocialLinks`, and one
 * `FeaturedTrack`. Re-runs cleanly: deletes the demo set (matched by a
 * stable `supabaseUserId` prefix `seed-demo-`) before recreating it.
 *
 * Out of scope: `InstagramConnections` (requires a real IG token; the
 * encryption hook would refuse the placeholder) and Lighthouse evidence
 * (deferred to task-19 — the public profile route doesn't exist yet).
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const DEMO_PREFIX = 'seed-demo-';

type DemoSpec = {
  uid: string;
  email: string;
  displayName: string;
  slug: string;
  pressKitUrl: string;
  tagline: { 'pt-BR': string; en: string };
  bio: { 'pt-BR': string; en: string };
  services: { 'pt-BR': Array<{ title: string; description: string }>; en: Array<{ title: string; description: string }> };
  socials: Array<{ platform: string; url: string }>;
  track: string;
  theme: { fontPair: string; hero: string; gallery: string };
};

const DEMOS: DemoSpec[] = [
  {
    uid: `${DEMO_PREFIX}mariana-luz`,
    email: 'mariana@presskit.demo',
    displayName: 'Mariana Luz',
    slug: 'mariana-luz',
    pressKitUrl: 'https://drive.google.com/file/d/demo-mariana/view',
    tagline: {
      'pt-BR': 'House melódico de São Paulo',
      en: 'Melodic house out of São Paulo',
    },
    bio: {
      'pt-BR':
        'DJ e produtora paulistana. Residente em casas como D-Edge e Warung. Lançamentos pela Anjunadeep e Bedrock.',
      en:
        'São Paulo–based DJ and producer. Resident at D-Edge and Warung. Releases on Anjunadeep and Bedrock.',
    },
    services: {
      'pt-BR': [
        { title: 'DJ Set', description: 'Performances de 60 a 180 minutos.' },
        { title: 'Produção', description: 'Original tracks e remixes.' },
      ],
      en: [
        { title: 'DJ Set', description: '60–180 minute performances.' },
        { title: 'Production', description: 'Original tracks and remixes.' },
      ],
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/marianaluz' },
      { platform: 'soundcloud', url: 'https://soundcloud.com/marianaluz' },
    ],
    track: 'https://soundcloud.com/marianaluz/sample-track',
    theme: { fontPair: 'editorial-nightlife', hero: 'full-bleed-portrait', gallery: 'mosaic' },
  },
  {
    uid: `${DEMO_PREFIX}bruno-vasco`,
    email: 'bruno@presskit.demo',
    displayName: 'Bruno Vasco',
    slug: 'bruno-vasco',
    pressKitUrl: 'https://www.dropbox.com/scl/fo/demo-bruno/press-kit',
    tagline: {
      'pt-BR': 'Techno melódico do Rio',
      en: 'Melodic techno from Rio',
    },
    bio: {
      'pt-BR': 'Carioca radicado em Berlim. Apresentações em Tresor e Watergate.',
      en: 'Carioca based in Berlin. Performances at Tresor and Watergate.',
    },
    services: {
      'pt-BR': [{ title: 'Live Set', description: 'Hardware e modulares.' }],
      en: [{ title: 'Live Set', description: 'Hardware and modular.' }],
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/brunovasco' },
      { platform: 'spotify', url: 'https://spotify.com/artist/brunovasco' },
    ],
    track: 'https://soundcloud.com/brunovasco/live-tresor',
    theme: { fontPair: 'brutalist', hero: 'split-portrait-text', gallery: 'uniform-grid' },
  },
  {
    uid: `${DEMO_PREFIX}clara-naia`,
    email: 'clara@presskit.demo',
    displayName: 'Clara Naia',
    slug: 'clara-naia',
    pressKitUrl: 'https://wetransfer.com/downloads/demo-clara',
    tagline: {
      'pt-BR': 'Ambient + IDM, Belo Horizonte',
      en: 'Ambient + IDM, Belo Horizonte',
    },
    bio: {
      'pt-BR': 'Compositora e sound designer.',
      en: 'Composer and sound designer.',
    },
    services: {
      'pt-BR': [{ title: 'Trilha sonora', description: 'Filmes, jogos, instalações.' }],
      en: [{ title: 'Score', description: 'Film, games, installations.' }],
    },
    socials: [
      { platform: 'bandcamp', url: 'https://claranaia.bandcamp.com' },
      { platform: 'website', url: 'https://claranaia.com' },
    ],
    track: 'https://soundcloud.com/claranaia/dawn',
    theme: { fontPair: 'refined', hero: 'centered-logo', gallery: 'carousel' },
  },
  {
    uid: `${DEMO_PREFIX}dj-pivete`,
    email: 'pivete@presskit.demo',
    displayName: 'DJ Pivete',
    slug: 'dj-pivete',
    pressKitUrl: 'https://drive.google.com/drive/folders/demo-pivete',
    tagline: {
      'pt-BR': 'Funk + baile, Rio de Janeiro',
      en: 'Funk + baile, Rio de Janeiro',
    },
    bio: {
      'pt-BR': 'Residente em bailes do Complexo da Maré.',
      en: 'Resident at bailes in Complexo da Maré.',
    },
    services: {
      'pt-BR': [{ title: 'Baile', description: 'Funk e brega 5h+.' }],
      en: [{ title: 'Baile', description: 'Funk and brega 5h+.' }],
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/djpivete' },
      { platform: 'tiktok', url: 'https://tiktok.com/@djpivete' },
    ],
    track: 'https://soundcloud.com/djpivete/baile-mare',
    theme: { fontPair: 'soft-pop', hero: 'full-bleed-portrait', gallery: 'mosaic' },
  },
  {
    uid: `${DEMO_PREFIX}elea-sotomayor`,
    email: 'elea@presskit.demo',
    displayName: 'Elea Sotomayor',
    slug: 'elea-sotomayor',
    pressKitUrl: 'https://1drv.ms/u/demo-elea',
    tagline: {
      'pt-BR': 'Latin tech-house em turnê',
      en: 'Latin tech-house on tour',
    },
    bio: {
      'pt-BR': 'Argentina, baseada em Lisboa. Lançamentos pela Hot Creations.',
      en: 'Argentine, Lisbon-based. Releases on Hot Creations.',
    },
    services: {
      'pt-BR': [{ title: 'DJ Set', description: 'Tech-house e minimal.' }],
      en: [{ title: 'DJ Set', description: 'Tech-house and minimal.' }],
    },
    socials: [
      { platform: 'instagram', url: 'https://instagram.com/eleasotomayor' },
      { platform: 'beatport', url: 'https://beatport.com/artist/eleasotomayor' },
    ],
    track: 'https://soundcloud.com/eleasotomayor/lisboa-mix',
    theme: { fontPair: 'industrial', hero: 'split-portrait-text', gallery: 'uniform-grid' },
  },
];

async function main() {
  if (!process.env.DATABASE_URI) {
    console.error('seed: DATABASE_URI is required.');
    process.exit(1);
  }

  const payload = await getPayload({ config });

  // ----- Idempotency: nuke prior demo data (in dependency order) ---------
  const demoUserIds = (
    await payload.find({
      collection: 'users',
      where: { supabaseUserId: { like: `${DEMO_PREFIX}%` } },
      limit: DEMOS.length + 5,
      depth: 0,
    })
  ).docs.map((u) => u.id);

  if (demoUserIds.length) {
    const profiles = await payload.find({
      collection: 'profiles',
      where: { owner: { in: demoUserIds } },
      limit: 100,
      depth: 0,
    });
    const profileIds = profiles.docs.map((p) => p.id);

    for (const slug of [
      'profile-content',
      'social-links',
      'featured-tracks',
      'themes',
    ] as const) {
      if (profileIds.length === 0) break;
      await payload.delete({
        collection: slug,
        where: { profile: { in: profileIds } },
      });
    }
    await payload.delete({
      collection: 'profiles',
      where: { id: { in: profileIds } },
    });
    await payload.delete({
      collection: 'users',
      where: { id: { in: demoUserIds } },
    });
  }

  // ----- Recreate -------------------------------------------------------
  for (const d of DEMOS) {
    const user = await payload.create({
      collection: 'users',
      data: {
        supabaseUserId: d.uid,
        email: d.email,
        displayName: d.displayName,
        role: 'user',
        plan: 'pro',
      },
    });

    const profile = await payload.create({
      collection: 'profiles',
      data: {
        owner: user.id,
        slug: d.slug,
        status: 'published',
        pressKitUrl: d.pressKitUrl,
        defaultLocale: 'pt-BR',
        localesAvailable: ['pt-BR', 'en'],
      },
    });

    // Localized content: write PT-BR first, then EN (Payload merges per locale).
    const ptContent = await payload.create({
      collection: 'profile-content',
      locale: 'pt-BR',
      data: {
        profile: profile.id,
        tagline: d.tagline['pt-BR'],
        services: d.services['pt-BR'],
      },
    });
    await payload.update({
      collection: 'profile-content',
      id: ptContent.id,
      locale: 'en',
      data: {
        tagline: d.tagline.en,
        services: d.services.en,
      },
    });

    await payload.create({
      collection: 'themes',
      data: {
        profile: profile.id,
        fontPairId: d.theme.fontPair,
        heroStyle: d.theme.hero,
        galleryLayout: d.theme.gallery,
      } as never,
    });

    for (let i = 0; i < d.socials.length; i++) {
      await payload.create({
        collection: 'social-links',
        data: {
          profile: profile.id,
          platform: d.socials[i]!.platform,
          url: d.socials[i]!.url,
          displayOrder: i,
        } as never,
      });
    }

    await payload.create({
      collection: 'featured-tracks',
      data: {
        profile: profile.id,
        provider: 'soundcloud',
        url: d.track,
      },
    });

    console.log(`✓ ${d.slug}`);
  }

  console.log(`\nseed: ${DEMOS.length} demo profiles ready.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
