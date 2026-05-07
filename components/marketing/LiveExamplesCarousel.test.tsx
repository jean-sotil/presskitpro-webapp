import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ptMessagesRaw from '@/messages/pt.json';

import { LiveExamplesCarousel } from './LiveExamplesCarousel';

// JSON import carries `_meta.draft: boolean` which isn't part of
// next-intl's `AbstractIntlMessages` (string | nested). The cast is
// safe — `collectKeys` and `useTranslations` ignore `_meta`.
const ptMessages = ptMessagesRaw as unknown as AbstractIntlMessages;

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="pt" messages={ptMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const EXAMPLES = [
  { slug: 'dj-1', displayName: 'dj 1', portrait: { bucket: 'avatars', path: 'a/1.jpg' } },
  { slug: 'dj-2', displayName: 'dj 2', portrait: null },
  { slug: 'dj-3', displayName: 'dj 3', portrait: { bucket: 'avatars', path: 'a/3.jpg' } },
];

function stubMatchMedia(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query === '(prefers-reduced-motion: reduce)' ? reduce : !reduce,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('LiveExamplesCarousel', () => {
  it('renders the empty state when no examples are provided', () => {
    stubMatchMedia(false);
    renderWithIntl(<LiveExamplesCarousel examples={[]} />);
    expect(screen.getByText(/nenhum perfil publicado/i)).toBeInTheDocument();
  });

  it('renders one card per example with a link to /<slug>', () => {
    stubMatchMedia(false);
    renderWithIntl(<LiveExamplesCarousel examples={EXAMPLES} />);
    expect(screen.getAllByRole('link')).toHaveLength(EXAMPLES.length);
    expect(screen.getByRole('link', { name: /dj 1/i })).toHaveAttribute(
      'href',
      '/dj-1',
    );
  });

  it('autoplays only when prefers-reduced-motion is no-preference', () => {
    stubMatchMedia(false); // user does not prefer reduced motion → autoplay
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    renderWithIntl(<LiveExamplesCarousel examples={EXAMPLES} />);
    expect(setIntervalSpy).toHaveBeenCalled();
  });

  it('does NOT autoplay when prefers-reduced-motion is reduce', () => {
    stubMatchMedia(true);
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    renderWithIntl(<LiveExamplesCarousel examples={EXAMPLES} />);
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });
});
