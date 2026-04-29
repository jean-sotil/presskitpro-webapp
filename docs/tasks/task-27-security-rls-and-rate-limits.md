# Task 27 — Security: RLS, Encryption, Rate Limits, Cookie Consent

## Summary
Lock down the data plane and the public surface area per §14.

## PRD references
- §14 (Security & privacy), §18 risk #10 (link rot mitigation), §6.5 validation.

## Dependencies
- task-08 (collections exist), task-23 (Stripe webhook).

## Scope (in)
- RLS on every Supabase table; `auth.uid() = user_id` policy on profile-scoped rows.
- Payload access control mirrors the same ownership rules.
- Encryption at rest for `InstagramConnections.accessToken` (Supabase pgcrypto + secret in env).
- Rate limits: auth endpoints (5/min/IP), slug-availability (30/min/IP), contact form (5/hour/IP).
- Cookie consent banner — minimal: locale cookie + auth cookie only; banner explains both.
- Privacy policy + Terms pages (drafted by legal — engineering wires the routes).
- Server-side HEAD validation for press kit URLs (already in task-15) reaffirmed; daily check in task-30.
- CSP header: `default-src 'self'`, with explicit allowlist for IG/SoundCloud iframe sources, Supabase, Stripe.

## Scope (out)
- 2FA for users (admin-only mention).
- Bug bounty program.

## Acceptance criteria
- [ ] An anon user querying another's profile rows via Supabase JS gets 0 results.
- [ ] CSP report-only deployment shows zero unexpected violations on staging for 7 days before flipping to enforcing.
- [ ] Rate-limit returns 429 with `Retry-After` header.
- [ ] DB dump shows IG tokens as ciphertext.

## Implementation notes
- Use Upstash Redis (or Vercel KV) for rate limit counters — Postgres-based counters add latency to auth path.
- CSP nonces for any inline `<style>` (theme injection on public profile uses nonce per request).

## Definition of Done
Per Appendix C.
