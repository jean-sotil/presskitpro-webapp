import { validateSlugFormat } from '../slug/validator';

/**
 * Pure functions for the onboarding wizard. No DB, no Next, no Payload —
 * everything that touches I/O lives in `app/onboarding/actions.ts`. The
 * `nextStep` / `resumeStep` / `isComplete` predicates are also consumed
 * by the dashboard redirect guard.
 *
 * Wizard state is persisted on `Users.onboardingProgress` (json column).
 * The shape is intentionally permissive (all fields optional) so partial
 * progress is always a valid value to write back.
 */

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'soundcloud'
  | 'spotify'
  | 'youtube'
  | 'twitter'
  | 'bandcamp'
  | 'mixcloud'
  | 'apple-music'
  | 'beatport'
  | 'whatsapp'
  | 'email'
  | 'website';

export type OnboardingProgress = {
  step?: WizardStep;
  slug?: string;
  portraitId?: number | null;
  logoId?: number | null;
  taglinePtBR?: string;
  services?: string[];
  customServices?: string[];
  socialPlatform?: SocialPlatform;
  socialUrl?: string;
  completedAt?: string;
};

/**
 * Curated services catalog (PT-BR). Selections are stored verbatim and
 * become `ProfileContent.services[].title` rows on completion. The user
 * can add up to 3 customs via "+ Adicionar outro" in step 4.
 */
export const CURATED_SERVICES = [
  'DJ Set',
  'Live Set',
  'Produção',
  'Mixagem',
  'Masterização',
  'Sound Design',
  'Workshops',
  'Trilha Sonora',
  'Outro',
] as const;

const MAX_CUSTOM_SERVICES = 3;
const TAGLINE_MAX = 140;

const PLATFORMS: SocialPlatform[] = [
  'instagram', 'tiktok', 'soundcloud', 'spotify', 'youtube',
  'twitter', 'bandcamp', 'mixcloud', 'apple-music', 'beatport',
  'whatsapp', 'email', 'website',
];

// ---------- step navigation ---------------------------------------------

export function nextStep(progress: OnboardingProgress | null): WizardStep {
  const current = progress?.step;
  if (!current || current < 1 || current > 5) return 1;
  return Math.min(current + 1, 5) as WizardStep;
}

/**
 * The first step the user has NOT yet completed. Used by the
 * `/onboarding` root redirect.
 */
export function resumeStep(progress: OnboardingProgress | null): WizardStep {
  if (!progress) return 1;
  if (!progress.step || progress.step < 1 || progress.step > 5) return 1;
  return nextStep(progress);
}

export function isComplete(progress: OnboardingProgress | null): boolean {
  if (!progress) return false;
  return Boolean(progress.completedAt);
}

// ---------- per-step validation (pure) ----------------------------------

export type ValidateResult =
  | { ok: true }
  | {
      ok: false;
      field?: string;
      reason: string;
    };

export function validateStepData(
  step: WizardStep,
  data: Partial<OnboardingProgress>,
): ValidateResult {
  switch (step) {
    case 1:
      return validateSlug(data.slug);
    case 2:
      // Both fields optional — wizard explicitly allows skipping uploads.
      return { ok: true };
    case 3:
      return validateTagline(data.taglinePtBR);
    case 4:
      return validateServices(data.services, data.customServices);
    case 5:
      return validateSocial(data.socialPlatform, data.socialUrl);
    default:
      return { ok: false, reason: 'invalid-step' };
  }
}

function validateSlug(slug: string | undefined): ValidateResult {
  if (!slug) return { ok: false, field: 'slug', reason: 'too-short' };
  const result = validateSlugFormat(slug);
  if (!result.ok) return { ok: false, field: 'slug', reason: result.reason };
  return { ok: true };
}

function validateTagline(value: string | undefined): ValidateResult {
  if (!value || value.trim().length === 0) {
    return { ok: false, field: 'taglinePtBR', reason: 'required' };
  }
  if (value.length > TAGLINE_MAX) {
    return { ok: false, field: 'taglinePtBR', reason: 'too-long' };
  }
  return { ok: true };
}

function validateServices(
  services: string[] | undefined,
  customs: string[] | undefined,
): ValidateResult {
  if (!services || services.length === 0) {
    return { ok: false, field: 'services', reason: 'required' };
  }
  if ((customs?.length ?? 0) > MAX_CUSTOM_SERVICES) {
    return { ok: false, field: 'customServices', reason: 'too-many' };
  }
  const allowed = new Set<string>([...CURATED_SERVICES, ...(customs ?? [])]);
  const offender = services.find((s) => !allowed.has(s));
  if (offender) {
    return { ok: false, field: 'services', reason: 'unknown-value' };
  }
  return { ok: true };
}

function validateSocial(
  platform: SocialPlatform | undefined,
  url: string | undefined,
): ValidateResult {
  if (!platform || !PLATFORMS.includes(platform)) {
    return { ok: false, field: 'socialPlatform', reason: 'required' };
  }
  if (!url) {
    return { ok: false, field: 'socialUrl', reason: 'required' };
  }
  if (platform === 'email') {
    // Accept either a bare email or `mailto:`. Loose check — Supabase /
    // the editor will refine. Refuses anything with control chars.
    const stripped = url.replace(/^mailto:/, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stripped)) {
      return { ok: false, field: 'socialUrl', reason: 'invalid-email' };
    }
    return { ok: true };
  }
  // Default: require http(s).
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, field: 'socialUrl', reason: 'invalid-url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, field: 'socialUrl', reason: 'invalid-url' };
  }
  return { ok: true };
}
