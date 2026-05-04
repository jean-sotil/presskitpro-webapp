import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="font-display text-4xl uppercase tracking-tight">PressKit Pro</h1>
        <p className="mt-4 text-sm text-text">
          Scaffold ready. Visit{' '}
          <Link
            className="text-accent underline underline-offset-4"
            href="/admin"
            prefetch={false}
          >
            /admin
          </Link>{' '}
          to bootstrap Payload.
        </p>
      </div>
    </main>
  );
}
