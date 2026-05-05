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
  const [content, theme, socialLinks, featuredTrack, instagramConnection] =
    await Promise.all([
      deps.findProfileContent(profile.id, args.user),
      deps.findTheme(profile.id, args.user),
      deps.findSocialLinks(profile.id, args.user),
      deps.findFeaturedTrack(profile.id, args.user),
      deps.findInstagramConnection(profile.id, args.user),
    ]);
  return { profile, content, theme, socialLinks, featuredTrack, instagramConnection };
}

export async function publishProfile(
  deps: BundleDeps,
  args: { profileId: number | string; user: PayloadUserDoc },
): Promise<{ profile: ProfileLite; publicPath: string } | null> {
  const existing = await deps.findProfileById(args.profileId, args.user);
  if (!existing) return null;
  const updated = await deps.updateProfileStatus({
    profileId: args.profileId,
    status: 'published',
    user: args.user,
  });
  return { profile: updated, publicPath: `/${updated.slug}` };
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
