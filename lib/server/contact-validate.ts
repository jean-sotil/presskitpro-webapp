/**
 * Server-side validator for contact form submissions.
 *
 * Honeypot is checked first: a non-empty value is *never* a real user
 * (the field is hidden via CSS), so we treat it as a separate failure
 * mode from regular validation. Callers should respond with a silent
 * 200 in that case so bots don't learn they were caught.
 *
 * Pure module — safe to import from server + client. Email format is
 * the same pragmatic check used by `parseAndCanonicalize('email', x)`
 * in `social-link-validate.ts`.
 */

const NAME_MAX = 80;
const MESSAGE_MAX = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactFormInput = {
  name: string;
  email: string;
  message: string;
  honeypot: string;
};

export type ContactFormReason =
  | 'honeypot'
  | 'name-required'
  | 'name-too-long'
  | 'email-invalid'
  | 'message-required'
  | 'message-too-long';

export type ContactFormResult =
  | { ok: true }
  | { ok: false; reason: ContactFormReason };

export function validateContactForm(input: ContactFormInput): ContactFormResult {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { ok: false, reason: 'honeypot' };
  }
  const name = (input.name ?? '').trim();
  if (name.length === 0) return { ok: false, reason: 'name-required' };
  if (name.length > NAME_MAX) return { ok: false, reason: 'name-too-long' };

  const email = (input.email ?? '').trim();
  if (!EMAIL_RE.test(email)) return { ok: false, reason: 'email-invalid' };

  const message = (input.message ?? '').trim();
  if (message.length === 0) return { ok: false, reason: 'message-required' };
  if (message.length > MESSAGE_MAX) {
    return { ok: false, reason: 'message-too-long' };
  }
  return { ok: true };
}
