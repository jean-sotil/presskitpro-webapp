import { RichTextRender } from '@/components/profile/rich-text/RichTextRender';
import type { EditorBundle } from '@/lib/editor/bundle';
import { isEmptyLexicalState } from '@/lib/editor/rich-text/is-empty';

export function AboutRender({ bundle }: { bundle: EditorBundle }) {
  const tagline = (bundle.content?.tagline as string | undefined) ?? null;
  const bio = (bundle.content?.bio as never) ?? null;
  const hasBio = !isEmptyLexicalState(bio);
  if (!tagline && !hasBio) return null;
  return (
    <section id="sobre" className="border-b border-border px-6 py-16 md:px-12">
      <h2 className="font-display text-2xl uppercase tracking-tight">Sobre</h2>
      {tagline ? <p className="mt-4 max-w-prose text-text">{tagline}</p> : null}
      {hasBio ? (
        <RichTextRender state={bio} className="mt-6 max-w-prose text-text" />
      ) : null}
    </section>
  );
}
