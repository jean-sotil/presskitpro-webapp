import { describe, expect, it } from 'vitest';

import { validateContactForm } from './contact-validate';

describe('validateContactForm', () => {
  const valid = {
    name: 'João',
    email: 'fan@example.com',
    message: 'Hi! Want to book you for a private event next month.',
    honeypot: '',
  };

  it('passes a well-formed submission', () => {
    expect(validateContactForm(valid)).toEqual({ ok: true });
  });

  it('flags the honeypot as caught (separate from validation failure)', () => {
    expect(
      validateContactForm({ ...valid, honeypot: 'i-am-a-bot' }),
    ).toEqual({ ok: false, reason: 'honeypot' });
  });

  it('rejects an empty name', () => {
    expect(validateContactForm({ ...valid, name: '   ' })).toEqual({
      ok: false,
      reason: 'name-required',
    });
  });

  it('rejects an oversized name', () => {
    expect(
      validateContactForm({ ...valid, name: 'x'.repeat(120) }),
    ).toEqual({ ok: false, reason: 'name-too-long' });
  });

  it('rejects an invalid email', () => {
    expect(
      validateContactForm({ ...valid, email: 'not-an-email' }),
    ).toEqual({ ok: false, reason: 'email-invalid' });
  });

  it('rejects an empty message', () => {
    expect(validateContactForm({ ...valid, message: '   ' })).toEqual({
      ok: false,
      reason: 'message-required',
    });
  });

  it('rejects an oversized message', () => {
    expect(
      validateContactForm({ ...valid, message: 'x'.repeat(2001) }),
    ).toEqual({ ok: false, reason: 'message-too-long' });
  });
});
