import type { EditorBundle } from '@/lib/editor/bundle';

export function PressKitLinkRender({ bundle }: { bundle: EditorBundle }) {
  const url = (bundle.profile.pressKitUrl as string | undefined) ?? null;
  if (!url) return null;
  return (
    <section className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Press kit</h2>
      <p className="mt-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center border border-border bg-transparent px-6 text-sm uppercase tracking-wider hover:bg-surface focus-visible:outline-offset-2"
        >
          Baixar press kit
        </a>
      </p>
    </section>
  );
}
