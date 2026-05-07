/**
 * Content-Security-Policy header builder.
 *
 * Pure: takes a per-request nonce and returns the assembled directive
 * string. Middleware decides whether to send it as
 * `Content-Security-Policy` (enforce) or
 * `Content-Security-Policy-Report-Only` (the v1 default per task-27 plan).
 *
 * The allowlist mirrors the third parties wired into the public surface:
 *   - Stripe Checkout (`js.stripe.com`, `api.stripe.com`)
 *   - Supabase Storage + REST (`*.supabase.co`)
 *   - Instagram embed (`www.instagram.com`, `*.cdninstagram.com`, `*.fbcdn.net`)
 *   - SoundCloud oEmbed (`w.soundcloud.com`, `i1.sndcdn.com`)
 *   - YouTube thumbnails (`i.ytimg.com`) — used by some IG/SC providers
 */

export type CspOptions = {
  nonce: string;
};

export function buildCspHeader({ nonce }: CspOptions): string {
  const n = `'nonce-${nonce}'`;
  const directives: Array<[string, string[]]> = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      [
        "'self'",
        n,
        // `'strict-dynamic'` would obviate the host allowlist, but
        // Next.js still emits some inline scripts that lack the nonce
        // attribute under certain RSC paths. Stick with the explicit
        // allowlist until task-28 (Sentry) lets us watch violations.
        'js.stripe.com',
      ],
    ],
    ['script-src-elem', ["'self'", n, 'js.stripe.com']],
    ['style-src', ["'self'", n, "'unsafe-inline'"]],
    ['style-src-elem', ["'self'", n, "'unsafe-inline'"]],
    [
      'img-src',
      [
        "'self'",
        'data:',
        'blob:',
        '*.supabase.co',
        '*.cdninstagram.com',
        '*.fbcdn.net',
        'i1.sndcdn.com',
        'i.ytimg.com',
      ],
    ],
    ['font-src', ["'self'", 'data:']],
    ['connect-src', ["'self'", '*.supabase.co', 'api.stripe.com']],
    [
      'frame-src',
      ['www.instagram.com', 'w.soundcloud.com', 'js.stripe.com', 'hooks.stripe.com'],
    ],
    ['media-src', ["'self'", 'blob:', '*.supabase.co']],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
    ['frame-ancestors', ["'none'"]],
  ];

  return directives
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
