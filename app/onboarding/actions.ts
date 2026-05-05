'use server';

import { revalidatePath } from 'next/cache';

import {
  advanceStepImpl,
  type AdvanceResult,
  cancelWizardImpl,
  type CancelResult,
  completeWizardImpl,
  type CompleteResult,
  type WizardDeps,
} from '@/lib/onboarding/actions-impl';
import {
  type OnboardingProgress,
  type SocialPlatform,
  type WizardStep,
} from '@/lib/onboarding/state';
import { track } from '@/lib/analytics/track';
import { payload as getPayloadInstance } from '@/lib/payload';
import { reserveSlug, releaseSlug } from '@/lib/slug/operations';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Wires the live Supabase + Payload clients into the testable
 * `actions-impl` core. The shim is intentionally thin — every branch and
 * error path is unit-tested at the impl layer.
 */
function buildDeps(): WizardDeps {
  return {
    async getSupabaseUser() {
      const sb = await supabaseServer();
      const { data, error } = await sb.auth.getUser();
      if (error || !data.user) return null;
      return { id: data.user.id, email: data.user.email ?? null };
    },

    async getPayloadUser(supabaseUserId) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'users',
        where: { supabaseUserId: { equals: supabaseUserId } },
        limit: 1,
        depth: 0,
      });
      const doc = result.docs[0];
      if (!doc) return null;
      return {
        id: doc.id,
        supabaseUserId: doc.supabaseUserId,
        onboardingProgress: (doc.onboardingProgress ?? null) as OnboardingProgress | null,
      };
    },

    async saveProgress(userId, progress) {
      const p = await getPayloadInstance();
      await p.update({
        collection: 'users',
        id: userId,
        data: { onboardingProgress: progress },
      });
    },

    async findExistingProfile(ownerId) {
      const p = await getPayloadInstance();
      const result = await p.find({
        collection: 'profiles',
        where: { owner: { equals: ownerId } },
        limit: 1,
        depth: 0,
      });
      const doc = result.docs[0];
      return doc ? { id: doc.id } : null;
    },

    async createProfileBundle(args) {
      const p = await getPayloadInstance();
      // Atomic semantics aren't free in Payload v3 (no exposed transaction
      // boundary across collections), so we sequence with a best-effort
      // cleanup on failure.
      const profile = await p.create({
        collection: 'profiles',
        data: {
          // Payload's relationship field accepts the id directly; the type
          // narrows to `number | Doc`, but at write-time we just hand it
          // the numeric id.
          owner: args.ownerId as number,
          slug: args.slug,
          status: 'draft',
          defaultLocale: 'pt-BR',
          localesAvailable: ['pt-BR'],
          ...(args.portraitId ? { portrait: args.portraitId } : {}),
          ...(args.logoId ? { logo: args.logoId } : {}),
        },
      });
      try {
        await p.create({
          collection: 'profile-content',
          locale: 'pt-BR',
          data: {
            profile: profile.id,
            tagline: args.taglinePtBR,
            services: args.services.map((title) => ({ title, description: '' })),
          },
        });
        await p.create({
          collection: 'social-links',
          data: {
            profile: profile.id,
            platform: args.socialPlatform,
            url: args.socialUrl,
            displayOrder: 0,
          } as never,
        });
      } catch (err) {
        // Roll back the partial profile so the wizard can retry without
        // tripping on a unique-slug collision.
        await p
          .delete({ collection: 'profiles', id: profile.id })
          .catch(() => {});
        throw err;
      }
      return { id: profile.id };
    },

    async reserveSlug(args) {
      await reserveSlug(supabaseAdmin(), args);
    },

    async releaseSlug(args) {
      await releaseSlug(supabaseAdmin(), args);
    },

    track,
  };
}

// ---------------------------- exported actions --------------------------

export async function advanceStep(
  step: WizardStep,
  data: {
    slug?: string;
    portraitId?: number | null;
    logoId?: number | null;
    taglinePtBR?: string;
    services?: string[];
    customServices?: string[];
    socialPlatform?: SocialPlatform;
    socialUrl?: string;
  },
): Promise<AdvanceResult> {
  return advanceStepImpl(buildDeps(), { step, data });
}

export async function completeWizard(): Promise<CompleteResult> {
  const result = await completeWizardImpl(buildDeps());
  if (result.ok) {
    // Warm the freshly-created profile's public route (it's still draft,
    // but the dashboard editor renders the same RSC tree under a flag).
    revalidatePath('/dashboard');
  }
  return result;
}

export async function cancelWizard(): Promise<CancelResult> {
  return cancelWizardImpl(buildDeps());
}
