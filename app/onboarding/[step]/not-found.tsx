import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl uppercase tracking-tight">
        Passo inválido
      </h1>
      <p className="mt-3 max-w-prose text-sm text-text-muted">
        O onboarding tem 5 passos. Voltar para o início?
      </p>
      <Link
        href="/onboarding"
        className="mt-6 inline-flex items-center justify-center border border-border bg-transparent px-5 py-2 text-sm uppercase tracking-wider text-text hover:bg-surface focus-visible:outline-offset-2"
      >
        Recomeçar onboarding
      </Link>
    </main>
  );
}
