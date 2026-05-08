/**
 * The 3-step upload chain:
 *   1. POST /api/storage/sign-upload → signed Supabase Storage URL.
 *   2. PUT the file directly to Supabase.
 *   3. POST /api/media → register Payload Media doc.
 *
 * Centralized here so the wizard's MediaStep, the hero editor (task-10),
 * and the gallery editor (task-12) all share one tested pipeline. DI-style
 * for testability.
 */

/**
 * Hard ceiling for direct uploads — must mirror MAX_BYTES in
 * `app/api/storage/sign-upload/route.ts`. Enforced client-side as a
 * pre-flight so an oversize file never reaches the server (otherwise the
 * server returns a generic 400 "invalid size" that the user sees as an
 * opaque "sign-failed").
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadResult =
  | { ok: true; mediaId: number; path: string; bucket: string }
  | {
      ok: false;
      reason:
        | 'alt-required'
        | 'too-large'
        | 'sign-failed'
        | 'put-failed'
        | 'register-failed';
      detail?: string;
    };

export type UploadDeps = {
  sign(args: {
    bucket: string;
    mimeType: string;
    size: number;
    ownerSupabaseId: string;
  }): Promise<
    | { ok: true; signedUrl: string; path: string; bucket: string }
    | { ok: false; reason: string }
  >;
  putFile(args: { url: string; file: File }): Promise<{ ok: boolean }>;
  register(args: {
    bucket: string;
    path: string;
    mimeType: string;
    size: number;
    alt: string;
    ownerSupabaseId: string;
  }): Promise<
    | { ok: true; mediaId: number }
    | { ok: false; status?: number }
  >;
};

export async function uploadMedia(
  deps: UploadDeps,
  args: {
    file: File;
    bucket: 'avatars' | 'gallery';
    supabaseUserId: string;
    alt: string;
  },
): Promise<UploadResult> {
  if (!args.alt || args.alt.trim().length === 0) {
    return { ok: false, reason: 'alt-required' };
  }

  if (args.file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: 'too-large',
      detail: `${formatMB(args.file.size)} > ${formatMB(MAX_UPLOAD_BYTES)}`,
    };
  }

  const signed = await deps.sign({
    bucket: args.bucket,
    mimeType: args.file.type,
    size: args.file.size,
    ownerSupabaseId: args.supabaseUserId,
  });
  if (!signed.ok) {
    return { ok: false, reason: 'sign-failed', detail: signed.reason };
  }

  const put = await deps.putFile({ url: signed.signedUrl, file: args.file });
  if (!put.ok) {
    return { ok: false, reason: 'put-failed' };
  }

  const reg = await deps.register({
    bucket: args.bucket,
    path: signed.path,
    mimeType: args.file.type,
    size: args.file.size,
    alt: args.alt,
    ownerSupabaseId: args.supabaseUserId,
  });
  if (!reg.ok) {
    return { ok: false, reason: 'register-failed' };
  }

  return {
    ok: true,
    mediaId: reg.mediaId,
    path: signed.path,
    bucket: signed.bucket,
  };
}

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

// ---------- live wiring (browser-side) ----------------------------------

export const liveUploadDeps: UploadDeps = {
  async sign(args) {
    const res = await fetch('/api/storage/sign-upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, reason: text || `status ${res.status}` };
    }
    const body = (await res.json()) as {
      bucket: string;
      path: string;
      signedUrl: string;
    };
    return { ok: true, signedUrl: body.signedUrl, path: body.path, bucket: body.bucket };
  },

  async putFile({ url, file }) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'content-type': file.type },
      body: file,
    });
    return { ok: res.ok };
  },

  async register(args) {
    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const body = (await res.json()) as { id: number };
    return { ok: true, mediaId: body.id };
  },
};
