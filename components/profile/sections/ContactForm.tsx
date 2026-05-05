'use client';

import { useRef, useState } from 'react';

import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget';

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

export interface ContactFormProps {
  profileId: number;
}

/**
 * Public contact form. POSTs to `/api/profiles/[id]/contact-submit`,
 * which layers honeypot → rate-limit → validation → captcha → email
 * delivery. Until `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` are set
 * the captcha is a no-op and the email is logged. See task-14 plan.
 */
export function ContactForm({ profileId }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const turnstileRef = useRef<TurnstileHandle | null>(null);

  const pending = status.kind === 'pending';
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const captchaReady = !captchaRequired || captchaToken.length > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setStatus({ kind: 'pending' });
    try {
      const res = await fetch(`/api/profiles/${profileId}/contact-submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          honeypot,
          captchaToken,
        }),
      });
      if (res.status === 429) {
        const retry = res.headers.get('Retry-After');
        setStatus({
          kind: 'error',
          message: retry
            ? `Muitas tentativas. Tente novamente em ${retry}s.`
            : 'Muitas tentativas. Tente novamente mais tarde.',
        });
        // Cloudflare consumes the token on each verify call — refresh
        // before the user retries.
        turnstileRef.current?.reset();
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          reason?: string;
        };
        setStatus({
          kind: 'error',
          message:
            body.error === 'captcha'
              ? 'Verificação de captcha falhou. Tente novamente.'
              : friendlyError(body.reason),
        });
        turnstileRef.current?.reset();
        return;
      }
      setStatus({ kind: 'ok' });
      setName('');
      setEmail('');
      setMessage('');
      turnstileRef.current?.reset();
    } catch {
      setStatus({
        kind: 'error',
        message: 'Não foi possível enviar a mensagem. Tente novamente.',
      });
    }
  }

  if (status.kind === 'ok') {
    return (
      <p
        role="status"
        aria-live="polite"
        className="border border-border bg-bg p-4 text-sm"
      >
        Mensagem enviada. Você receberá uma resposta no e-mail informado.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          Seu nome
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          Seu e-mail
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          className="h-9 border border-border bg-bg px-3 text-sm outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-text-muted">
          Mensagem
        </span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={5}
          className="resize-y border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </label>
      {/* Honeypot — hidden from real users, irresistible to dumb bots. */}
      <label aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        Não preencha este campo
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </label>
      <TurnstileWidget onToken={setCaptchaToken} handleRef={turnstileRef} />
      {status.kind === 'error' ? (
        <p role="alert" className="text-sm text-text">
          {status.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !captchaReady}
        className="inline-flex h-12 items-center justify-center border border-accent bg-accent px-6 text-sm uppercase tracking-wider text-accent-contrast disabled:opacity-50"
      >
        {pending ? 'Enviando...' : 'Enviar mensagem'}
      </button>
    </form>
  );
}

function friendlyError(reason: string | undefined): string {
  switch (reason) {
    case 'name-required':
      return 'Informe seu nome.';
    case 'name-too-long':
      return 'Nome muito longo.';
    case 'email-invalid':
      return 'E-mail inválido.';
    case 'message-required':
      return 'Escreva uma mensagem.';
    case 'message-too-long':
      return 'Mensagem muito longa.';
    default:
      return 'Não foi possível enviar a mensagem. Tente novamente.';
  }
}
