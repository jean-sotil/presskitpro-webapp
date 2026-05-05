import type { EditorBundle } from '@/lib/editor/bundle';

export function SocialLinksRender({ bundle }: { bundle: EditorBundle }) {
  const links = bundle.socialLinks;
  if (!links?.length) return null;
  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Redes sociais</h2>
      <ul className="mt-6 flex flex-wrap gap-3">
        {links.map((link) => {
          const url = link.url as string;
          const platform = link.platform as string;
          return (
            <li key={String(link.id)}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center border border-border px-4 text-xs uppercase tracking-wider text-text-muted hover:text-text"
              >
                {platform}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
