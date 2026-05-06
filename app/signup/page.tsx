import { type Metadata } from 'next';
import Link from 'next/link';
import { safeNext } from '@/lib/auth/next-param';
import { SignupForm } from './signup-form';

export const metadata: Metadata = {
  title: 'Criar conta · PressKit Pro',
  description: 'Comece seu press kit em segundos. Apenas e-mail — sem cartão.',
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);

  return (
    <main id="main" className="flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl uppercase tracking-tight">Crie seu press kit</h1>
        <p className="mt-3 text-sm text-text-muted">
          Sem cartão. Sem senha. Você está a um e-mail de começar.
        </p>

        <SignupForm next={next} />

        <p className="mt-8 text-sm text-text-muted">
          Já tem conta?{' '}
          <Link className="text-accent underline underline-offset-4" href="/login">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
