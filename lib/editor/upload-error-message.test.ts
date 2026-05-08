import { describe, expect, it } from 'vitest';

import { humanizeUploadError } from './upload-error-message';

describe('humanizeUploadError', () => {
  it('translates alt-required', () => {
    expect(humanizeUploadError({ ok: false, reason: 'alt-required' })).toMatch(
      /alternativo/i,
    );
  });

  it('translates the client pre-flight too-large with the size detail', () => {
    const msg = humanizeUploadError({
      ok: false,
      reason: 'too-large',
      detail: '12.5MB > 10.0MB',
    });
    expect(msg).toMatch(/12\.5MB/);
    expect(msg).toMatch(/10 MB/);
  });

  it('translates server "invalid size" sign-failed into the same too-large message', () => {
    const msg = humanizeUploadError({
      ok: false,
      reason: 'sign-failed',
      detail: 'invalid size',
    });
    expect(msg).toMatch(/menor que 10 MB/i);
  });

  it('translates server "unsupported mime type" sign-failed into a format hint', () => {
    const msg = humanizeUploadError({
      ok: false,
      reason: 'sign-failed',
      detail: 'unsupported mime type',
    });
    expect(msg).toMatch(/formato/i);
    expect(msg).toMatch(/JPEG/);
  });

  it('translates server "missing owner" into a session-expired hint', () => {
    expect(
      humanizeUploadError({ ok: false, reason: 'sign-failed', detail: 'missing owner' }),
    ).toMatch(/sessão/i);
  });

  it('falls back to the raw server detail on unknown sign-failed reasons', () => {
    const msg = humanizeUploadError({
      ok: false,
      reason: 'sign-failed',
      detail: 'rate limited',
    });
    expect(msg).toMatch(/rate limited/);
  });

  it('translates put-failed and register-failed to retry hints', () => {
    expect(humanizeUploadError({ ok: false, reason: 'put-failed' })).toMatch(/conexão/i);
    expect(humanizeUploadError({ ok: false, reason: 'register-failed' })).toMatch(
      /tente/i,
    );
  });
});
