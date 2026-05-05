import { revalidatePath as revalidatePathDefault } from 'next/cache';

/**
 * ISR cache invalidation on Profiles writes.
 *
 * Triggers:
 *   - status flips to/away from `published` → revalidate the slug.
 *   - slug changes on a published doc → revalidate BOTH old and new.
 *   - delete is a no-op: the public route 404s naturally on the next request.
 */

type Args = {
  operation: 'create' | 'update' | 'delete';
  doc: { slug?: string; status?: string };
  previousDoc?: { slug?: string; status?: string };
};

type Deps = {
  revalidatePath?: typeof revalidatePathDefault;
};

export function handleProfileRevalidate(args: Args, deps: Deps = {}): void {
  if (args.operation === 'delete') return;
  const fn = deps.revalidatePath ?? revalidatePathDefault;

  const newSlug = args.doc?.slug;
  const newStatus = args.doc?.status;
  const oldSlug = args.previousDoc?.slug;
  const oldStatus = args.previousDoc?.status;

  const safe = (path: string) => {
    try {
      fn(path);
    } catch (err) {
      // `revalidatePath` only works inside a Next request context. When
      // called from a seed script, a cron, or a CLI tool, Next throws
      // "Invariant: static generation store missing". Cache invalidation
      // is best-effort here — the next public request will populate the
      // cache fresh, so we swallow that specific error and re-throw
      // anything else.
      if (
        !(err instanceof Error) ||
        !err.message.includes('static generation store')
      ) {
        throw err;
      }
    }
  };

  // Old path needs busting if it was previously published OR slug rotated.
  if (oldStatus === 'published' && oldSlug && oldSlug !== newSlug) {
    safe(`/${oldSlug}`);
  }
  if (oldStatus === 'published' && oldSlug && newStatus !== 'published') {
    // published -> unpublished/draft: bust the old slug.
    safe(`/${oldSlug}`);
  }
  // New path needs warming if it's now published.
  if (newStatus === 'published' && newSlug) {
    safe(`/${newSlug}`);
  }
}
