import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContactForm } from './ContactForm';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockReset();
  // Default: captcha disabled (no NEXT_PUBLIC_TURNSTILE_SITE_KEY).
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function fillForm() {
  fireEvent.change(screen.getByLabelText(/seu nome/i), {
    target: { value: 'Fan' },
  });
  fireEvent.change(screen.getByLabelText(/seu e-mail/i), {
    target: { value: 'fan@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/mensagem/i), {
    target: { value: 'Olá, posso reservar?' },
  });
}

describe('ContactForm', () => {
  it('posts to the contact-submit endpoint and shows the success state', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    render(<ContactForm profileId={42} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/mensagem enviada/i),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/profiles/42/contact-submit');
    const sentBody = JSON.parse((init as RequestInit).body as string);
    expect(sentBody).toMatchObject({
      name: 'Fan',
      email: 'fan@example.com',
      message: 'Olá, posso reservar?',
      honeypot: '',
    });
  });

  it('renders a friendly error from the server reason', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: 'validation', reason: 'email-invalid' }),
        { status: 400 },
      ),
    );
    render(<ContactForm profileId={1} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/e-mail inválido/i),
    );
  });

  it('disables submit until a Turnstile token arrives when the site key is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
    render(<ContactForm profileId={1} />);
    fillForm();
    const submit = screen.getByRole('button', { name: /enviar mensagem/i });
    expect(submit).toBeDisabled();
  });

  it('surfaces a captcha-failed error from the server', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'captcha' }), { status: 400 }),
    );
    render(<ContactForm profileId={1} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/captcha/i),
    );
  });

  it('surfaces the rate-limit retry-after header', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'rate-limited' }), {
        status: 429,
        headers: { 'Retry-After': '120' },
      }),
    );
    render(<ContactForm profileId={1} />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/120s/),
    );
  });
});
