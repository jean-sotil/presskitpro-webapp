'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type LightboxItem = {
  id: number;
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

/**
 * Hard Techno Underground gallery lightbox — turns each tile into an
 * accessible button that opens a full-screen photo viewer.
 *
 * UX:
 *   - Tile click, Enter, or Space opens the modal at that index.
 *   - ESC closes; ArrowLeft / ArrowRight cycle through images.
 *   - Backdrop click closes; image area click does not.
 *   - Body scroll is locked while the modal is open.
 *   - Focus moves to the close button on open and is restored to the
 *     originally clicked tile on close (the screen reader doesn't
 *     end up at the top of the document).
 *   - `prefers-reduced-motion` skips the fade/zoom animations.
 *
 * The modal is rendered through a `react-dom` portal so it escapes any
 * `overflow: hidden` parent and stacks above the film-grain overlay.
 */
export function GalleryLightbox({
  items,
  tileClassName,
  gridClassName,
}: {
  items: LightboxItem[];
  tileClassName: (idx: number) => string;
  gridClassName: string;
}) {
  const t = useTranslations('profile.lightbox');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isOpen = activeIdx !== null;

  const close = useCallback(() => {
    setActiveIdx((current) => {
      if (current !== null) tileRefs.current[current]?.focus();
      return null;
    });
  }, []);

  const cycle = useCallback(
    (delta: number) => {
      setActiveIdx((current) => {
        if (current === null) return current;
        const next = (current + delta + items.length) % items.length;
        return next;
      });
    },
    [items.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        cycle(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cycle(-1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close, cycle]);

  return (
    <>
      <ul className={gridClassName}>
        {items.map((item, idx) => (
          <li key={item.id} className={`group relative overflow-hidden ${tileClassName(idx)}`}>
            <button
              ref={(el) => {
                tileRefs.current[idx] = el;
              }}
              type="button"
              onClick={() => setActiveIdx(idx)}
              aria-label={
                item.alt
                  ? t('openPhotoWithAlt', {
                      idx: idx + 1,
                      total: items.length,
                      alt: item.alt,
                    })
                  : t('openPhoto', { idx: idx + 1, total: items.length })
              }
              className="absolute inset-0 h-full w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-[transform,filter] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03] group-hover:[filter:brightness(1.15)_contrast(1.05)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-accent opacity-0 mix-blend-color-dodge transition-opacity duration-300 group-hover:opacity-20"
              />
            </button>
          </li>
        ))}
      </ul>
      {isOpen ? (
        <LightboxModal
          items={items}
          activeIdx={activeIdx}
          onClose={close}
          onCycle={cycle}
          t={t}
        />
      ) : null}
    </>
  );
}

function LightboxModal({
  items,
  activeIdx,
  onClose,
  onCycle,
  t,
}: {
  items: LightboxItem[];
  activeIdx: number;
  onClose: () => void;
  onCycle: (delta: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = items[activeIdx]!;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        item.alt
          ? t('viewerLabelWithAlt', { alt: item.alt })
          : t('viewerLabel')
      }
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 motion-safe:animate-[lightbox-fade-in_200ms_ease-out_both] md:p-12"
    >
      {/* Backdrop dismiss target. Sibling of the figure/buttons so the
          figure's clicks don't bubble here — no stopPropagation needed.
          Tab-order excluded since the close button + ESC already handle
          keyboard dismissal. */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        tabIndex={-1}
        className="absolute inset-0 z-0 cursor-zoom-out"
      />
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center border border-white/40 text-white transition-colors duration-quick hover:border-accent hover:bg-accent hover:text-accent-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:h-14 md:w-14"
      >
        <CloseIcon />
      </button>
      <button
        type="button"
        onClick={() => onCycle(-1)}
        aria-label={t('previous')}
        className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/40 text-white transition-colors duration-quick hover:border-accent hover:bg-accent hover:text-accent-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:flex md:h-14 md:w-14"
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        onClick={() => onCycle(1)}
        aria-label={t('next')}
        className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/40 text-white transition-colors duration-quick hover:border-accent hover:bg-accent hover:text-accent-contrast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:flex md:h-14 md:w-14"
      >
        <ChevronRightIcon />
      </button>
      <figure className="relative z-10 flex max-h-full max-w-full items-center justify-center motion-safe:animate-[lightbox-zoom-in_200ms_ease-out_both]">
        <Image
          key={item.id}
          src={item.src}
          alt={item.alt}
          width={(item.width ?? 1600) || 1600}
          height={(item.height ?? 1200) || 1200}
          sizes="(max-width: 768px) 95vw, 80vw"
          priority
          className="h-auto max-h-[80vh] w-auto max-w-full object-contain md:max-h-[85vh]"
        />
        {item.alt ? (
          <figcaption className="sr-only">{item.alt}</figcaption>
        ) : null}
      </figure>
      <p
        aria-live="polite"
        className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.2em] text-white/80"
      >
        {activeIdx + 1} / {items.length}
      </p>
      {/* Mobile prev/next stack at the bottom — desktop versions sit at
          mid-height. Same handlers, separate visibility so each device
          class gets the ergonomic placement. */}
      <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-3 md:hidden">
        <button
          type="button"
          onClick={() => onCycle(-1)}
          aria-label={t('previous')}
          className="flex h-12 w-12 items-center justify-center border border-white/40 text-white transition-colors duration-quick hover:border-accent hover:bg-accent hover:text-accent-contrast"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => onCycle(1)}
          aria-label={t('next')}
          className="flex h-12 w-12 items-center justify-center border border-white/40 text-white transition-colors duration-quick hover:border-accent hover:bg-accent hover:text-accent-contrast"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>,
    document.body,
  );
}

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function CloseIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
