/**
 * Compose a Supabase Storage public URL from a Media doc's `bucket` +
 * `path`. Both buckets we use today (`avatars`, `gallery`) are public
 * (per task-02 spike), so signed URLs are unnecessary at render time.
 *
 * If task-27 (RLS hardening) flips a bucket private, this helper's
 * caller must switch to `supabase.storage.from(bucket).createSignedUrl()`.
 */

type MediaRef = { bucket: string; path: string } | null | undefined;

export function mediaUrl(media: MediaRef): string | null {
  if (!media || !media.bucket || !media.path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${media.bucket}/${media.path}`;
}
