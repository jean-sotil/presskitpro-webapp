import { type Metadata } from 'next';
import { safeNext } from '@/lib/auth/next-param';
import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Entrar · PressKit Pro',
  description: 'Entre com seu e-mail para acessar seu painel.',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const error = params.error;

  return (
    <main id="main" className="flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl uppercase tracking-tight">Entrar</h1>
        <p className="mt-3 text-sm text-text-muted">
          Enviamos um link mágico para o seu e-mail. Sem senhas.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-6 border border-border bg-surface px-4 py-3 text-sm text-text"
          >
            Não conseguimos completar o login. Tente novamente.
          </p>
        ) : null}

        <LoginForm next={next} />

        <p className="mt-8 text-sm text-text-muted">
          Sem conta ainda?{' '}
          <a className="text-accent underline underline-offset-4" href="/signup">
            Criar press kit
          </a>
        </p>
      </div>
    </main>
  );
}
