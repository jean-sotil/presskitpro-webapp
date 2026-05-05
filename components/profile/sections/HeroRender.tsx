import type { EditorBundle } from '@/lib/editor/bundle';

export function HeroRender({ bundle }: { bundle: EditorBundle }) {
  const { profile, content } = bundle;
  const tagline = (content?.tagline as string | undefined) ?? null;
  return (
    <header className="border-b border-border px-6 py-16 md:px-12 md:py-24">
      <p className="font-display text-xs uppercase tracking-widest text-text-muted">
        presskit.pro/{profile.slug}
      </p>
      <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-7xl">
        {profile.slug.replace(/-/g, ' ')}
      </h1>
      {tagline ? (
        <p className="mt-6 max-w-prose text-lg text-text-muted">{tagline}</p>
      ) : null}
    </header>
  );
}
