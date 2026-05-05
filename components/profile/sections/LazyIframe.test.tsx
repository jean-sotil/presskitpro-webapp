import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LazyIframe } from './LazyIframe';

const SAFE_HTML = '<iframe src="https://w.soundcloud.com/player/?url=foo"></iframe>';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LazyIframe', () => {
  it('renders only the placeholder before intersection', () => {
    // Stub IntersectionObserver so the callback never fires.
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
        takeRecords = () => [];
        root = null;
        rootMargin = '';
        thresholds = [];
      },
    );
    render(<LazyIframe html={SAFE_HTML} />);
    expect(screen.getByTestId('lazy-iframe-mount')).toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(observe).toHaveBeenCalled();
  });

  it('mounts the iframe once the observer fires', () => {
    let cb: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        unobserve = vi.fn();
        takeRecords = () => [];
        root = null;
        rootMargin = '';
        thresholds = [];
        constructor(c: (entries: { isIntersecting: boolean }[]) => void) {
          cb = c;
        }
      },
    );
    render(<LazyIframe html={SAFE_HTML} />);
    expect(document.querySelector('iframe')).toBeNull();
    act(() => {
      cb!([{ isIntersecting: true }]);
    });
    expect(document.querySelector('iframe')).toBeInTheDocument();
  });

  it('falls back to immediate mount when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<LazyIframe html={SAFE_HTML} />);
    expect(document.querySelector('iframe')).toBeInTheDocument();
  });
});
