import type { PayloadUserDoc } from '../auth/payload-user-from-request';

/**
 * Pure (DI-style) editor bundle ops. The thin REST handlers in
 * `app/api/profiles/[id]/*` wire the live Payload Local API into these
 * deps; tests inject mocks. Same pattern as the wizard `actions-impl`.
 */

export type ProfileLite = {
  id: number | string;
  owner: number | string;
  slug: string;
  status: 'draft' | 'published' | 'unpublished';
  defaultLocale: 'pt-BR' | 'en';
  [key: string]: unknown;
};

export type EditorBundle = {
  profile: ProfileLite;
  content: { id: number | string; profile: number | string; [key: string]: unknown } | null;
  theme: { id: number | string; profile: number | string; [key: string]: unknown } | null;
  socialLinks: Array<{ id: number | string; profile: number | string; [key: string]: unknown }>;
  featuredTrack: { id: number | string; profile: number | string; [key: string]: unknown } | null;
  instagramConnection: { id: number | string; profile: number | string; [key: string]: unknown } | null;
  instagramPosts: Array<{ id: number | string; profile: number | string; [key: string]: unknown }>;
};

export type BundleDeps = {
  findProfileById(
    id: number | string,
    user: PayloadUserDoc,
  ): Promise<ProfileLite | null>;
  findProfileContent(
    profileId: number | string,
    user: PayloadUserDoc,
  ): Promise<EditorBundle['content']>;
  findTheme(
    profileId: number | string,
    user: PayloadUserDoc,
  ): Promise<EditorBundle['theme']>;
  findSocialLinks(
    profileId: number | string,
    user: PayloadUserDoc,
  ): Promise<EditorBundle['socialLinks']>;
  findFeaturedTrack(
    profileId: number | string,
    user: PayloadUserDoc,
  ): Promise<EditorBundle['featuredTrack']>;
  findInstagramConnection(
    profileId: number | string,
    user: PayloadUserDoc,
  ): Promise<EditorBundle['instagramConnection']>;
  findInstagramPosts(
    profileId: number | string,
    user: PayloadUserDoc,
  ): Promise<EditorBundle['instagramPosts']>;
  updateProfileStatus(args: {
    profileId: number | string;
    status: 'published' | 'unpublished';
    user: PayloadUserDoc;
  }): Promise<ProfileLite>;
};

export async function loadBundle(
  deps: BundleDeps,
  args: { profileId: number | string; user: PayloadUserDoc },
): Promise<EditorBundle | null> {
  const profile = await deps.findProfileById(args.profileId, args.user);
  if (!profile) return null;
  const [
    content,
    theme,
    socialLinks,
    featuredTrack,
    instagramConnection,
    instagramPosts,
  ] = await Promise.all([
    deps.findProfileContent(profile.id, args.user),
    deps.findTheme(profile.id, args.user),
    deps.findSocialLinks(profile.id, args.user),
    deps.findFeaturedTrack(profile.id, args.user),
    deps.findInstagramConnection(profile.id, args.user),
    deps.findInstagramPosts(profile.id, args.user),
  ]);
  return {
    profile,
    content,
    theme,
    socialLinks,
    featuredTrack,
    instagramConnection,
    instagramPosts,
  };
}

// =====================================================================
// Public bundle (task-19)
// =====================================================================

/**
 * Public-facing bundle deps — no user threading, no Instagram-token
 * connection, no `updateProfileStatus`. The public route is read-only.
 *
 * `findPublishedProfileBySlug` MUST return null for non-published rows
 * (the gate for the route's `notFound()`); enforcing it inside the dep
 * keeps the loader simple.
 */
export type PublicBundleDeps = {
  findPublishedProfileBySlug(slug: string): Promise<ProfileLite | null>;
  findProfileContent(
    profileId: number | string,
  ): Promise<EditorBundle['content']>;
  findTheme(profileId: number | string): Promise<EditorBundle['theme']>;
  findSocialLinks(
    profileId: number | string,
  ): Promise<EditorBundle['socialLinks']>;
  findFeaturedTrack(
    profileId: number | string,
  ): Promise<EditorBundle['featuredTrack']>;
  findInstagramPosts(
    profileId: number | string,
  ): Promise<EditorBundle['instagramPosts']>;
};

export async function loadPublicBundle(
  deps: PublicBundleDeps,
  args: { slug: string },
): Promise<EditorBundle | null> {
  const profile = await deps.findPublishedProfileBySlug(args.slug);
  if (!profile) return null;
  const [content, theme, socialLinks, featuredTrack, instagramPosts] =
    await Promise.all([
      deps.findProfileContent(profile.id),
      deps.findTheme(profile.id),
      deps.findSocialLinks(profile.id),
      deps.findFeaturedTrack(profile.id),
      deps.findInstagramPosts(profile.id),
    ]);
  return {
    profile,
    content,
    theme,
    socialLinks,
    featuredTrack,
    // The public surface doesn't use the Graph-API connection.
    instagramConnection: null,
    instagramPosts,
  };
}

/** Per PRD §14 — fail publish when the contrast gate hasn't been
 *  re-validated within this window. The editor's Theme tab bumps
 *  `Themes.contrastValidatedAt` on every successful contrast pass.
 */
export const CONTRAST_STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export type PublishRefusal =
  | { kind: 'not-found' }
  | { kind: 'contrast-stale'; validatedAt: string | null };

export async function publishProfile(
  deps: BundleDeps,
  args: { profileId: number | string; user: PayloadUserDoc; now?: () => number },
): Promise<
  | { ok: true; profile: ProfileLite; publicPath: string }
  | { ok: false; refusal: PublishRefusal }
> {
  const existing = await deps.findProfileById(args.profileId, args.user);
  if (!existing) return { ok: false, refusal: { kind: 'not-found' } };

  const theme = await deps.findTheme(args.profileId, args.user);
  const validatedAtRaw = (theme as { contrastValidatedAt?: string | null } | null)
    ?.contrastValidatedAt;
  const validatedAt = typeof validatedAtRaw === 'string' ? validatedAtRaw : null;
  const now = args.now ? args.now() : Date.now();
  const fresh =
    validatedAt &&
    now - new Date(validatedAt).getTime() < CONTRAST_STALE_AFTER_MS;
  if (!fresh) {
    return {
      ok: false,
      refusal: { kind: 'contrast-stale', validatedAt },
    };
  }

  const updated = await deps.updateProfileStatus({
    profileId: args.profileId,
    status: 'published',
    user: args.user,
  });
  return { ok: true, profile: updated, publicPath: `/${updated.slug}` };
}

export async function unpublishProfile(
  deps: BundleDeps,
  args: { profileId: number | string; user: PayloadUserDoc },
): Promise<{ profile: ProfileLite } | null> {
  const existing = await deps.findProfileById(args.profileId, args.user);
  if (!existing) return null;
  const updated = await deps.updateProfileStatus({
    profileId: args.profileId,
    status: 'unpublished',
    user: args.user,
  });
  return { profile: updated };
}
