import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LazyEmbed } from './LazyEmbed';

const BLOCKQUOTE_HTML =
  '<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/abc/"></blockquote>';

afterEach(() => {
  vi.unstubAllGlobals();
  // Clean up any test-leaked window.instgrm.
  delete (window as { instgrm?: unknown }).instgrm;
});

describe('LazyEmbed', () => {
  it('renders only the placeholder before intersection', () => {
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
      },
    );
    render(<LazyEmbed html={BLOCKQUOTE_HTML} />);
    expect(screen.getByTestId('lazy-embed-mount')).toBeInTheDocument();
    expect(document.querySelector('blockquote')).toBeNull();
  });

  it('mounts the html once the observer fires', () => {
    let cb: ((e: { isIntersecting: boolean }[]) => void) | undefined;
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
        constructor(c: (e: { isIntersecting: boolean }[]) => void) {
          cb = c;
        }
      },
    );
    render(<LazyEmbed html={BLOCKQUOTE_HTML} />);
    expect(document.querySelector('blockquote')).toBeNull();
    act(() => {
      cb!([{ isIntersecting: true }]);
    });
    expect(document.querySelector('blockquote')).toBeInTheDocument();
  });

  it('falls back to immediate mount when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<LazyEmbed html={BLOCKQUOTE_HTML} />);
    expect(document.querySelector('blockquote')).toBeInTheDocument();
  });

  it('calls window.instgrm.Embeds.process() after mounting a blockquote', () => {
    const processSpy = vi.fn();
    (window as unknown as { instgrm: unknown }).instgrm = {
      Embeds: { process: processSpy },
    };
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<LazyEmbed html={BLOCKQUOTE_HTML} />);
    return new Promise<void>((resolve) => {
      // The hydration is awaited inside an effect; flush microtasks.
      setTimeout(() => {
        expect(processSpy).toHaveBeenCalled();
        resolve();
      }, 0);
    });
  });

  it('does not load embed.js for an iframe-only payload', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<LazyEmbed html='<iframe src="https://www.instagram.com/p/abc/embed/"></iframe>' />);
    expect(document.querySelector('iframe')).toBeInTheDocument();
    // No instgrm needed for the iframe path.
    expect((window as { instgrm?: unknown }).instgrm).toBeUndefined();
  });
});
