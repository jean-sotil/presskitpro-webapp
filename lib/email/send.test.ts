import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmail } from './send';

describe('sendEmail', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    warn.mockClear();
    error.mockClear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('logs and returns ok when RESEND_API_KEY is unset (dev/CI fallback)', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const fakeFetch = vi.fn();
    vi.stubGlobal('fetch', fakeFetch);
    const r = await sendEmail({
      to: 'a@b.com',
      from: 'noreply@x.com',
      subject: 's',
      body: 'b',
    });
    expect(r.ok).toBe(true);
    expect(warn).toHaveBeenCalled();
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it('POSTs to Resend with the correct envelope when configured', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    const fakeFetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fakeFetch);
    const r = await sendEmail({
      to: 'a@b.com',
      from: 'noreply@x.com',
      subject: 's',
      body: 'b',
    });
    expect(r.ok).toBe(true);
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const call = fakeFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toBe('https://api.resend.com/emails');
    expect(call[1].method).toBe('POST');
    const headers = call[1].headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer re_test_123');
    expect(JSON.parse(call[1].body as string)).toEqual({
      from: 'noreply@x.com',
      to: 'a@b.com',
      subject: 's',
      text: 'b',
    });
  });

  it('returns { ok: false } and logs when Resend responds non-2xx', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('upstream failure', { status: 422 })),
    );
    const r = await sendEmail({
      to: 'a@b.com',
      from: 'noreply@x.com',
      subject: 's',
      body: 'b',
    });
    expect(r.ok).toBe(false);
    expect(error).toHaveBeenCalled();
  });

  it('returns { ok: false } when fetch throws', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_123');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const r = await sendEmail({
      to: 'a@b.com',
      from: 'noreply@x.com',
      subject: 's',
      body: 'b',
    });
    expect(r.ok).toBe(false);
  });
});
