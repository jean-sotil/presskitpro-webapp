'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import {
  LOCALE_COOKIE_NAME,
  isSupportedLocale,
  type SupportedLocale,
} from './locale';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Server action that persists the locale toggle (task-29 PR-A).
 *
 * Writes the `NEXT_LOCALE` cookie and revalidates the calling path so
 * the UI re-renders with the new catalog. The action ignores any
 * unsupported locale value — defense against a malicious form post.
 */
export async function setLocaleAction(locale: SupportedLocale): Promise<void> {
  if (!isSupportedLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE_NAME, locale, {
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
  });
  // Re-render the layout (and every nested RSC) so the new catalog
  // takes effect. The locale toggle button calls `router.refresh()`
  // after this resolves to repaint the client tree as well.
  revalidatePath('/', 'layout');
}
