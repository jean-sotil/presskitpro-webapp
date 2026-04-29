# Task 14 — Editor Section: Contact

## Summary
Configure how visitors reach the artist: WhatsApp number, email address, optional contact form.

## PRD references
- §6.3 (Contact), §4 visitor story ("Contato para shows").

## Dependencies
- task-09, task-08.

## Scope (in)
- WhatsApp number field with E.164 validation + country selector default to Brazil (BR).
- Email field with RFC validation.
- Toggle to enable/disable the contact form on the public page; when enabled, defines a destination email.
- Spam protection on the public form: honeypot + Cloudflare Turnstile (or hCaptcha).
- Rate limit: max 5 submissions per IP per hour (per §14).

## Scope (out)
- Booking inquiry inbox in dashboard (v2 — task-34).

## Acceptance criteria
- [ ] Submissions delivered to the configured email within 60s.
- [ ] Honeypot field, when filled, silently drops the submission with a 200 (anti-bot).
- [ ] Form is keyboard-accessible and announces validation errors via `aria-invalid` + `role="alert"`.
- [ ] Rate-limit returns 429 with a clear retry-after.

## Implementation notes
- Use a transactional email provider (Resend or Postmark) — never SMTP from the app server.
- Don't store submissions in DB unless the v2 inbox is built; just relay.

## Definition of Done
Per Appendix C.
