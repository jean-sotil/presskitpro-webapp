import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">PressKit Pro</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Scaffold ready. Visit{' '}
          <Link className="underline underline-offset-4" href="/admin" prefetch={false}>
            /admin
          </Link>{' '}
          to bootstrap Payload.
        </p>
      </div>
    </main>
  );
}
