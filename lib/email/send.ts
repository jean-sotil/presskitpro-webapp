/**
 * Transactional email transport (task-30; previously inline in
 * `app/api/profiles/[id]/contact-submit/route.ts`).
 *
 * Reads `RESEND_API_KEY` lazily so dev/CI without the key still gets a
 * usable boolean and a `console.warn` (no message delivered). All
 * call sites pass plain-text bodies; HTML bodies are out of scope until
 * the marketing/onboarding emails ship.
 */

export type SendEmailArgs = {
  to: string;
  from: string;
  subject: string;
  body: string;
};

export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      '[email] RESEND_API_KEY unset — message NOT delivered:',
      args,
    );
    return { ok: true };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: args.from,
        to: args.to,
        subject: args.subject,
        text: args.body,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(
        `[email] Resend rejected (${res.status}):`,
        detail,
        '\n  from:',
        args.from,
        '\n  to:',
        args.to,
      );
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('[email] Resend fetch failed:', err);
    return { ok: false };
  }
}
