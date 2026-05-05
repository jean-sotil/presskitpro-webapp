import type { EditorBundle } from '@/lib/editor/bundle';

export function AboutRender({ bundle }: { bundle: EditorBundle }) {
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  // Real bio (rich text) lands in task-11; for now we surface what we have.
  if (!tagline) return null;
  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Sobre</h2>
      <p className="mt-4 max-w-prose text-text">{tagline}</p>
    </section>
  );
}
