'use client';

import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * Minimal Cloudflare Turnstile widget. Loads the script on first mount
 * and renders the challenge into a div ref. No npm dependency — the
 * `window.turnstile` API is small enough to wrap directly.
 *
 * When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset the component renders
 * nothing; ContactForm bypasses the captcha gate in that mode.
 */

declare global {
  interface Window {
    turnstile?: {
      render(
        container: string | HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
        },
      ): string;
      reset(widgetId?: string): void;
      remove(widgetId: string): void;
    };
  }
}

const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener('load', () => resolve());
    s.addEventListener('error', () => {
      scriptPromise = null;
      reject(new Error('failed to load turnstile script'));
    });
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export type TurnstileHandle = {
  reset(): void;
};

export interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  /** Imperative handle so parent forms can `reset()` after a successful POST. */
  handleRef?: React.RefObject<TurnstileHandle | null>;
}

export function TurnstileWidget({ onToken, handleRef }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    onToken('');
    if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Widget already torn down — nothing to do.
      }
    }
  }, [onToken]);

  useImperativeHandle(handleRef, () => ({ reset }), [reset]);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          'error-callback': () => onToken(''),
          'expired-callback': () => onToken(''),
        });
      })
      .catch(() => {
        // Network blocked / extension / offline — leave the form
        // submittable; the server-side siteverify will still gate it
        // (route returns 400, form shows a friendly retry).
        if (!cancelled) onToken('');
      });
    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // Already gone.
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;
  return <div ref={containerRef} data-testid="turnstile-widget" />;
}
