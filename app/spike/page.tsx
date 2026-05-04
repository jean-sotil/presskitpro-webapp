import { notFound } from 'next/navigation';

import { payload } from '@/lib/payload';
import { UploadWidget } from './upload-widget';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ spike?: string }>;

export default async function SpikePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  if (sp.spike !== '1') notFound();

  const p = await payload();
  const [users, media] = await Promise.all([
    p.find({ collection: 'users', limit: 20, sort: '-createdAt' }),
    p.find({ collection: 'media', limit: 20, sort: '-createdAt' }),
  ]);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Architecture spike (task-02)</h1>
      <p>
        Live evidence that Supabase Auth → Payload sync and Supabase Storage → Payload Media
        round-trips are wired correctly. See{' '}
        <a href="/docs/decisions/0001-payload-supabase-split.md">ADR-0001</a> for context.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>1. Synced users (latest 20)</h2>
        <p>Created via Supabase Auth → trigger → /api/webhooks/supabase-auth.</p>
        {users.docs.length === 0 ? (
          <p style={{ color: '#a33' }}>
            No users yet. Create one via Supabase Studio or the local CLI:
            <code> supabase auth admin create-user --email test@example.com</code>
          </p>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th align="left">supabaseUserId</th>
                <th align="left">email</th>
                <th align="left">role</th>
                <th align="left">plan</th>
              </tr>
            </thead>
            <tbody>
              {users.docs.map((u) => (
                <tr key={String(u.id)} style={{ borderTop: '1px solid #eee' }}>
                  <td><code>{u.supabaseUserId}</code></td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.plan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>2. Storage round-trip</h2>
        <UploadWidget />
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>3. Recent Media docs</h2>
        {media.docs.length === 0 ? (
          <p style={{ color: '#666' }}>No media yet — upload one above.</p>
        ) : (
          <ul>
            {media.docs.map((m) => (
              <li key={String(m.id)}>
                <code>{m.bucket}/{m.path}</code> · {m.mimeType} · {m.size} bytes · alt=&quot;{m.alt}&quot;
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
