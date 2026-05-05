'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { supabaseBrowser } from '@/lib/supabase/browser';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export interface LoginFormProps {
  next: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;

    setStatus('sending');
    setErrorMessage(null);

    const supabase = supabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <div className="mt-8 border border-border bg-surface px-4 py-6 text-sm">
        <p className="font-display text-lg uppercase tracking-wider">Confira seu e-mail</p>
        <p className="mt-2 text-text-muted">
          Enviamos um link para <strong className="text-text">{email}</strong>. Clique nele para
          entrar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-xs uppercase tracking-wider text-text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full border border-border bg-bg px-3 py-2 text-text outline-none focus:border-accent"
          aria-invalid={status === 'error' || undefined}
          aria-describedby={errorMessage ? 'login-error' : undefined}
        />
      </div>

      {errorMessage ? (
        <p id="login-error" role="alert" className="text-sm text-text">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={status === 'sending' || !email} className="w-full">
        {status === 'sending' ? 'Enviando…' : 'Enviar link mágico'}
      </Button>
    </form>
  );
}
