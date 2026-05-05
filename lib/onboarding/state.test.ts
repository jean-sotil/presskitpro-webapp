import { describe, expect, it } from 'vitest';

import {
  CURATED_SERVICES,
  type OnboardingProgress,
  type WizardStep,
  isComplete,
  nextStep,
  resumeStep,
  validateStepData,
} from './state';

describe('nextStep', () => {
  it('returns step 1 when no progress', () => {
    expect(nextStep(null)).toBe(1);
    expect(nextStep({} as OnboardingProgress)).toBe(1);
  });

  it('advances by 1 from each completed step', () => {
    expect(nextStep({ step: 1, slug: 'mariana-luz' })).toBe(2);
    expect(nextStep({ step: 2, slug: 'mariana-luz' })).toBe(3);
    expect(nextStep({ step: 3, slug: 'mariana-luz', taglinePtBR: 'House SP' })).toBe(4);
    expect(nextStep({ step: 4, slug: 'mariana-luz', taglinePtBR: 'House SP', services: ['DJ Set'] })).toBe(5);
  });

  it('caps at 5 (last step)', () => {
    const at5 = { step: 5, slug: 'a', taglinePtBR: 't', services: ['DJ Set'] } as OnboardingProgress;
    expect(nextStep(at5)).toBe(5);
  });
});

describe('resumeStep (where to land when the user opens /onboarding)', () => {
  it('starts at step 1 when nothing saved', () => {
    expect(resumeStep(null)).toBe(1);
  });

  it('lands at the first incomplete step', () => {
    expect(resumeStep({ step: 1, slug: 'mariana' })).toBe(2);
    expect(resumeStep({ step: 2, slug: 'mariana' })).toBe(3);
  });

  it('lands at step 5 when 4 is the last completed', () => {
    expect(
      resumeStep({
        step: 4,
        slug: 'mariana',
        taglinePtBR: 't',
        services: ['DJ Set'],
      }),
    ).toBe(5);
  });

  it('lands at step 1 when state is malformed', () => {
    expect(resumeStep({ step: 99 } as never)).toBe(1);
  });
});

describe('isComplete', () => {
  it('false when no progress', () => {
    expect(isComplete(null)).toBe(false);
    expect(isComplete({} as OnboardingProgress)).toBe(false);
  });

  it('false when not at step 5', () => {
    expect(
      isComplete({
        step: 4,
        slug: 's',
        taglinePtBR: 't',
        services: ['DJ Set'],
      }),
    ).toBe(false);
  });

  it('true only when completedAt is set', () => {
    expect(
      isComplete({
        step: 5,
        slug: 's',
        taglinePtBR: 't',
        services: ['DJ Set'],
        socialPlatform: 'instagram',
        socialUrl: 'https://instagram.com/x',
      }),
    ).toBe(false);

    expect(
      isComplete({
        step: 5,
        slug: 's',
        taglinePtBR: 't',
        services: ['DJ Set'],
        socialPlatform: 'instagram',
        socialUrl: 'https://instagram.com/x',
        completedAt: '2026-05-05T00:00:00.000Z',
      }),
    ).toBe(true);
  });
});

describe('validateStepData', () => {
  describe('step 1 (slug)', () => {
    it('rejects empty', () => {
      expect(validateStepData(1, { slug: '' })).toEqual({
        ok: false,
        field: 'slug',
        reason: 'too-short',
      });
    });

    it('rejects format failures (uses task-07 validator)', () => {
      expect(validateStepData(1, { slug: 'Bad Slug' })).toMatchObject({
        ok: false,
        field: 'slug',
        reason: 'invalid-chars',
      });
    });

    it('accepts a valid slug', () => {
      expect(validateStepData(1, { slug: 'mariana-luz' })).toEqual({ ok: true });
    });
  });

  describe('step 2 (media — both optional)', () => {
    it('accepts empty (skip)', () => {
      expect(validateStepData(2, {})).toEqual({ ok: true });
    });
    it('accepts portrait only', () => {
      expect(validateStepData(2, { portraitId: 9 })).toEqual({ ok: true });
    });
  });

  describe('step 3 (tagline)', () => {
    it('rejects empty', () => {
      expect(validateStepData(3, { taglinePtBR: '' })).toEqual({
        ok: false,
        field: 'taglinePtBR',
        reason: 'required',
      });
    });
    it('rejects > 140 chars (PRD ProfileContent.tagline.maxLength)', () => {
      expect(validateStepData(3, { taglinePtBR: 'x'.repeat(141) })).toMatchObject({
        ok: false,
        field: 'taglinePtBR',
        reason: 'too-long',
      });
    });
    it('accepts a valid tagline', () => {
      expect(validateStepData(3, { taglinePtBR: 'House melódico de São Paulo' })).toEqual({ ok: true });
    });
  });

  describe('step 4 (services)', () => {
    it('rejects empty selection', () => {
      expect(validateStepData(4, { services: [] })).toEqual({
        ok: false,
        field: 'services',
        reason: 'required',
      });
    });
    it('rejects selections not in the curated catalog (and not in customServices)', () => {
      expect(validateStepData(4, { services: ['Forbidden Genre'] })).toMatchObject({
        ok: false,
        field: 'services',
        reason: 'unknown-value',
      });
    });
    it('accepts a curated catalog entry', () => {
      const valid = CURATED_SERVICES[0]!;
      expect(validateStepData(4, { services: [valid] })).toEqual({ ok: true });
    });
    it('accepts a custom value when also present in customServices', () => {
      expect(
        validateStepData(4, {
          services: ['Vinyl-only Sets'],
          customServices: ['Vinyl-only Sets'],
        }),
      ).toEqual({ ok: true });
    });
    it('rejects > 3 customs', () => {
      expect(
        validateStepData(4, {
          services: ['A', 'B', 'C', 'D'],
          customServices: ['A', 'B', 'C', 'D'],
        }),
      ).toMatchObject({ ok: false, field: 'customServices', reason: 'too-many' });
    });
  });

  describe('step 5 (social link)', () => {
    it('rejects empty platform', () => {
      expect(
        validateStepData(5, {
          socialPlatform: '' as never,
          socialUrl: 'https://instagram.com/x',
        }),
      ).toMatchObject({ ok: false, field: 'socialPlatform' });
    });
    it('rejects malformed URLs', () => {
      expect(
        validateStepData(5, { socialPlatform: 'instagram', socialUrl: 'not a url' }),
      ).toMatchObject({ ok: false, field: 'socialUrl', reason: 'invalid-url' });
    });
    it('rejects non-http(s)', () => {
      expect(
        validateStepData(5, {
          socialPlatform: 'instagram',
          socialUrl: 'javascript:alert(1)',
        }),
      ).toMatchObject({ ok: false, field: 'socialUrl', reason: 'invalid-url' });
    });
    it('rejects email in url field for non-email platforms', () => {
      expect(
        validateStepData(5, {
          socialPlatform: 'instagram',
          socialUrl: 'mailto:x@y.com',
        }),
      ).toMatchObject({ ok: false, field: 'socialUrl' });
    });
    it('accepts a valid http URL', () => {
      expect(
        validateStepData(5, {
          socialPlatform: 'instagram',
          socialUrl: 'https://instagram.com/marianaluz',
        }),
      ).toEqual({ ok: true });
    });
    it('email platform accepts mailto: or bare emails', () => {
      expect(
        validateStepData(5, {
          socialPlatform: 'email',
          socialUrl: 'press@artist.com',
        }),
      ).toEqual({ ok: true });
    });
  });

  it('rejects an out-of-range step', () => {
    expect(validateStepData(0 as WizardStep, {})).toMatchObject({
      ok: false,
      reason: 'invalid-step',
    });
    expect(validateStepData(6 as WizardStep, {})).toMatchObject({
      ok: false,
      reason: 'invalid-step',
    });
  });
});
