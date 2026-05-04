'use client';

import { useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'signing' | 'uploading' | 'registering' | 'done' | 'error';

export function UploadWidget() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage('');
    setPreviewUrl(null);

    const sb = supabaseBrowser();
    const { data: session } = await sb.auth.getUser();
    if (!session.user) {
      setStatus('error');
      setMessage('Sign in via Supabase Auth first (Studio → Authentication → create user → copy magic link).');
      return;
    }
    const ownerSupabaseId = session.user.id;

    setStatus('signing');
    const signRes = await fetch('/api/storage/sign-upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bucket: 'avatars',
        mimeType: file.type,
        size: file.size,
        ownerSupabaseId,
      }),
    });
    if (!signRes.ok) {
      setStatus('error');
      setMessage(`sign-upload failed: ${await signRes.text()}`);
      return;
    }
    const { bucket, path, token } = (await signRes.json()) as {
      bucket: string;
      path: string;
      token: string;
    };

    setStatus('uploading');
    const upload = await sb.storage.from(bucket).uploadToSignedUrl(path, token, file);
    if (upload.error) {
      setStatus('error');
      setMessage(`upload failed: ${upload.error.message}`);
      return;
    }

    setStatus('registering');
    const mediaRes = await fetch('/api/media', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bucket,
        path,
        mimeType: file.type,
        size: file.size,
        alt: file.name,
        ownerSupabaseId,
      }),
    });
    if (!mediaRes.ok) {
      setStatus('error');
      setMessage(`media register failed: ${await mediaRes.text()}`);
      return;
    }
    const { publicUrl } = (await mediaRes.json()) as { id: string; publicUrl: string };
    setPreviewUrl(publicUrl);
    setStatus('done');
    setMessage('Round-trip succeeded.');
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFile}
        disabled={status === 'signing' || status === 'uploading' || status === 'registering'}
      />
      <p style={{ marginTop: 8 }}>
        Status: <strong>{status}</strong> {message && <>· {message}</>}
      </p>
      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="uploaded preview" style={{ maxWidth: 320, marginTop: 12 }} />
      )}
    </div>
  );
}
