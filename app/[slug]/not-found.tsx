import Link from 'next/link';

import { Section } from '@/components/ui/Section';

/**
 * Branded 404 for missing or unpublished public profiles. Triggered by
 * `notFound()` inside `app/[slug]/page.tsx`.
 */
export default function PublicProfileNotFound() {
  return (
    <main>
      <Section>
        <p className="font-display text-xs uppercase tracking-widest text-text-muted">
          404
        </p>
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight md:text-7xl">
          Perfil não encontrado
        </h1>
        <p className="mt-6 max-w-prose text-text-muted">
          Este perfil não existe ou ainda não foi publicado pelo artista.
          Confira o link e tente novamente.
        </p>
        <p className="mt-8">
          <Link
            href="/"
            className="inline-flex h-12 items-center border border-border bg-transparent px-6 text-xs uppercase tracking-wider hover:bg-surface focus-visible:outline-offset-2"
          >
            Voltar para o início
          </Link>
        </p>
      </Section>
    </main>
  );
}
