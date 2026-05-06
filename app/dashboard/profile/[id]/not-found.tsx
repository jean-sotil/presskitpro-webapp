import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl uppercase tracking-tight">
        Perfil não encontrado
      </h1>
      <p className="mt-3 max-w-prose text-sm text-text-muted">
        O perfil pode ter sido removido — ou você não tem acesso a ele.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center justify-center border border-border bg-transparent px-5 py-2 text-sm uppercase tracking-wider text-text hover:bg-surface focus-visible:outline-offset-2"
      >
        Voltar ao painel
      </Link>
    </main>
  );
}
