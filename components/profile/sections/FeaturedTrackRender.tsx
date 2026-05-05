import type { EditorBundle } from '@/lib/editor/bundle';

import { LazyIframe } from './LazyIframe';

export function FeaturedTrackRender({ bundle }: { bundle: EditorBundle }) {
  const track = bundle.featuredTrack as
    | { url?: string; oembedHtml?: string | null }
    | null;
  const url = track?.url ?? null;
  const oembedHtml = track?.oembedHtml ?? null;
  if (!url) return null;

  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">
        Faixa em destaque
      </h2>
      <div className="mt-6">
        {oembedHtml ? (
          <LazyIframe html={oembedHtml} />
        ) : (
          <p className="break-all text-sm text-text-muted">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {url}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
