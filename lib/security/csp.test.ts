import { describe, expect, it } from 'vitest';

import { buildCspHeader } from './csp';

const NONCE = 'abc123==';

describe('buildCspHeader', () => {
  it("includes default-src 'self'", () => {
    const csp = buildCspHeader({ nonce: NONCE });
    expect(csp).toContain("default-src 'self'");
  });

  it('includes the per-request nonce on script-src and style-src', () => {
    const csp = buildCspHeader({ nonce: NONCE });
    expect(csp).toContain(`'nonce-${NONCE}'`);
    expect(csp).toMatch(/script-src[^;]*'nonce-abc123=='/);
    expect(csp).toMatch(/style-src[^;]*'nonce-abc123=='/);
  });

  it('allowlists Stripe, Supabase, Instagram, and SoundCloud where each appears', () => {
    const csp = buildCspHeader({ nonce: NONCE });
    expect(csp).toMatch(/script-src[^;]*js\.stripe\.com/);
    expect(csp).toMatch(/connect-src[^;]*\*\.supabase\.co/);
    expect(csp).toMatch(/img-src[^;]*\*\.cdninstagram\.com/);
    expect(csp).toMatch(/img-src[^;]*\*\.fbcdn\.net/);
    expect(csp).toMatch(/img-src[^;]*i1\.sndcdn\.com/);
    expect(csp).toMatch(/frame-src[^;]*www\.instagram\.com/);
    expect(csp).toMatch(/frame-src[^;]*w\.soundcloud\.com/);
    expect(csp).toMatch(/frame-src[^;]*js\.stripe\.com/);
  });

  it("forbids embedding via frame-ancestors 'none'", () => {
    const csp = buildCspHeader({ nonce: NONCE });
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('terminates each directive with a semicolon and trims whitespace', () => {
    const csp = buildCspHeader({ nonce: NONCE });
    // No double semicolons, no leading/trailing whitespace.
    expect(csp).not.toMatch(/;;/);
    expect(csp).not.toMatch(/^\s|\s$/);
  });

  it('emits identical output for the same nonce (deterministic)', () => {
    expect(buildCspHeader({ nonce: NONCE })).toBe(buildCspHeader({ nonce: NONCE }));
  });
});
