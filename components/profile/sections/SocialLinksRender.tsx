import type { EditorBundle } from '@/lib/editor/bundle';

const PLATFORM_LABELS: Record<string, string> = {
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

type LinkRow = {
  id: number | string;
  platform: string;
  url: string;
  displayOrder?: number;
};

export function SocialLinksRender({ bundle }: { bundle: EditorBundle }) {
  const raw = (bundle.socialLinks ?? []) as unknown as LinkRow[];
  if (!raw.length) return null;
  const links = [...raw].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">
        Redes sociais
      </h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {links.map((link) => {
          const href = hrefFor(link);
          const label = PLATFORM_LABELS[link.platform] ?? link.platform;
          const external =
            link.platform !== 'email' && link.platform !== 'whatsapp';
          return (
            <li key={String(link.id)}>
              <a
                href={href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="inline-flex h-10 items-center border border-border px-4 text-xs uppercase tracking-wider text-text-muted hover:text-text"
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** The canonical URL stored by the editor is already in the right shape
 *  (`mailto:...`, `https://wa.me/...`, etc.) — but data from older saves
 *  or admin tweaks might not be, so we coerce defensively. */
function hrefFor(link: LinkRow): string {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`;
  }
  if (link.platform === 'whatsapp') {
    if (link.url.startsWith('http')) return link.url;
    const digits = link.url.replace(/\D/g, '');
    return `https://wa.me/${digits}`;
  }
  return link.url;
}
