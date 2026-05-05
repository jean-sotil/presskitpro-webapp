import type { EditorBundle } from '@/lib/editor/bundle';

export function FeaturedTrackRender({ bundle }: { bundle: EditorBundle }) {
  const url = (bundle.featuredTrack?.url as string | undefined) ?? null;
  if (!url) return null;
  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Faixa em destaque</h2>
      <p className="mt-4 break-all text-sm text-text-muted">
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {url}
        </a>
      </p>
      {/* oEmbed-rendered player lands in task-16. */}
    </section>
  );
}
