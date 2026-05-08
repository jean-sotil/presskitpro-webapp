import { describe, expect, it, vi } from 'vitest';

import {
  compressImage,
  type CompressDeps,
  pickResizeDimensions,
} from './image-compress';

describe('pickResizeDimensions', () => {
  it('keeps small images at their natural size', () => {
    expect(pickResizeDimensions(800, 600, 2400)).toEqual({ width: 800, height: 600 });
  });

  it('resizes a landscape image so the long edge equals maxEdge', () => {
    expect(pickResizeDimensions(4800, 3600, 2400)).toEqual({ width: 2400, height: 1800 });
  });

  it('resizes a portrait image so the long edge equals maxEdge', () => {
    expect(pickResizeDimensions(3000, 4500, 2400)).toEqual({ width: 1600, height: 2400 });
  });

  it('handles a square image at the boundary', () => {
    expect(pickResizeDimensions(4800, 4800, 2400)).toEqual({ width: 2400, height: 2400 });
  });

  it('rounds to integer pixels (no fractional canvas sizes)', () => {
    const r = pickResizeDimensions(3001, 1999, 2400);
    expect(Number.isInteger(r.width)).toBe(true);
    expect(Number.isInteger(r.height)).toBe(true);
  });
});

describe('compressImage', () => {
  function makeFile(name: string, type: string, sizeBytes = 100) {
    return new File([new Uint8Array(sizeBytes)], name, { type });
  }

  it('returns the original file unchanged for SVGs (rasterizing destroys vector logos)', async () => {
    const svg = makeFile('logo.svg', 'image/svg+xml', 50_000);
    const out = await compressImage(svg);
    expect(out).toBe(svg);
  });

  it('rejects images larger than 30MB before touching the canvas (iOS Safari OOM safety)', async () => {
    const huge = makeFile('big.jpg', 'image/jpeg', 35 * 1024 * 1024);
    await expect(compressImage(huge)).rejects.toThrow(/too large/i);
  });

  it('passes through small images that already meet the budget (skips canvas roundtrip)', async () => {
    const small = makeFile('thumb.jpg', 'image/jpeg', 80_000);
    const deps: CompressDeps = {
      loadImage: vi.fn(),
      drawAndExport: vi.fn(),
    };
    const out = await compressImage(small, { skipUnderBytes: 100_000 }, deps);
    expect(out).toBe(small);
    expect(deps.loadImage).not.toHaveBeenCalled();
  });

  it('attempts AVIF first and returns an AVIF file when supported', async () => {
    const input = makeFile('hero.jpg', 'image/jpeg', 5 * 1024 * 1024);
    const avifBlob = new Blob([new Uint8Array(700 * 1024)], { type: 'image/avif' });
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 4800, height: 3600 }),
      drawAndExport: vi.fn().mockResolvedValue(avifBlob),
    };
    const out = await compressImage(input, { maxEdge: 2400 }, deps);
    expect(out).toBeInstanceOf(File);
    expect(out.type).toBe('image/avif');
    expect(out.name).toBe('hero.avif');
    expect(deps.drawAndExport).toHaveBeenCalledTimes(1);
    expect(deps.drawAndExport).toHaveBeenNthCalledWith(1, expect.objectContaining({ mimeType: 'image/avif' }));
  });

  it('falls back to JPEG when AVIF returns null (older Safari, MIME mismatch)', async () => {
    const input = makeFile('hero.jpg', 'image/jpeg', 5 * 1024 * 1024);
    const jpegBlob = new Blob([new Uint8Array(900 * 1024)], { type: 'image/jpeg' });
    const drawAndExport = vi
      .fn()
      .mockResolvedValueOnce(null) // AVIF unsupported
      .mockResolvedValueOnce(jpegBlob);
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 4800, height: 3600 }),
      drawAndExport,
    };
    const out = await compressImage(input, { maxEdge: 2400 }, deps);
    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('hero.jpg');
    expect(drawAndExport).toHaveBeenCalledTimes(2);
    expect(drawAndExport).toHaveBeenNthCalledWith(2, expect.objectContaining({ mimeType: 'image/jpeg' }));
  });

  it('returns the original file when every format in the ladder yields null', async () => {
    const input = makeFile('hero.jpg', 'image/jpeg', 5 * 1024 * 1024);
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 4800, height: 3600 }),
      drawAndExport: vi.fn().mockResolvedValue(null),
    };
    const out = await compressImage(input, { maxEdge: 2400 }, deps);
    expect(out).toBe(input);
  });

  it('returns the original file when the compressed output is somehow LARGER (defensive)', async () => {
    const input = makeFile('hero.jpg', 'image/jpeg', 100_000);
    const oversized = new Blob([new Uint8Array(200_000)], { type: 'image/avif' });
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
      drawAndExport: vi.fn().mockResolvedValue(oversized),
    };
    const out = await compressImage(input, { skipUnderBytes: 0 }, deps);
    expect(out).toBe(input);
  });

  it('with targetMaxBytes, retries lower quality until the blob fits the byte budget', async () => {
    // Studio JPEG (e.g. 12MB original) where AVIF at default quality still
    // exceeds the 10MB upload ceiling — the compressor must retry at lower
    // qualities before falling through to JPEG or returning the original.
    const input = makeFile('studio.jpg', 'image/jpeg', 12 * 1024 * 1024);
    const huge = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/avif' });
    const ok = new Blob([new Uint8Array(8 * 1024 * 1024)], { type: 'image/avif' });
    const drawAndExport = vi
      .fn()
      .mockResolvedValueOnce(huge) // q=0.7 → 11MB (over budget)
      .mockResolvedValueOnce(ok); // q=0.5 → 8MB (under budget)
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 1926, height: 2568 }),
      drawAndExport,
    };
    const out = await compressImage(
      input,
      { maxEdge: 2400, targetMaxBytes: 10 * 1024 * 1024 },
      deps,
    );
    expect(out.size).toBe(8 * 1024 * 1024);
    expect(out.type).toBe('image/avif');
    expect(drawAndExport).toHaveBeenCalledTimes(2);
    expect(drawAndExport.mock.calls[0]![0]).toMatchObject({ quality: 0.7 });
    expect(drawAndExport.mock.calls[1]![0]!.quality).toBeLessThan(0.7);
  });

  it('with targetMaxBytes, falls through to next format when no quality fits', async () => {
    // AVIF stays over budget even at lowest quality → try JPEG.
    const input = makeFile('studio.jpg', 'image/jpeg', 12 * 1024 * 1024);
    const overBudget = (mime: string) =>
      new Blob([new Uint8Array(11 * 1024 * 1024)], { type: mime });
    const jpegOk = new Blob([new Uint8Array(7 * 1024 * 1024)], { type: 'image/jpeg' });
    const drawAndExport = vi
      .fn()
      // AVIF ladder — all over budget
      .mockResolvedValueOnce(overBudget('image/avif'))
      .mockResolvedValueOnce(overBudget('image/avif'))
      .mockResolvedValueOnce(overBudget('image/avif'))
      // JPEG ladder — first quality already under budget
      .mockResolvedValueOnce(jpegOk);
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 1926, height: 2568 }),
      drawAndExport,
    };
    const out = await compressImage(
      input,
      { targetMaxBytes: 10 * 1024 * 1024 },
      deps,
    );
    expect(out.type).toBe('image/jpeg');
    expect(out.size).toBe(7 * 1024 * 1024);
  });

  it('with targetMaxBytes, returns the original when no format/quality combo fits', async () => {
    const input = makeFile('studio.jpg', 'image/jpeg', 12 * 1024 * 1024);
    const overBudget = new Blob([new Uint8Array(11 * 1024 * 1024)], {
      type: 'image/avif',
    });
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 1926, height: 2568 }),
      drawAndExport: vi.fn().mockResolvedValue(overBudget),
    };
    const out = await compressImage(
      input,
      { targetMaxBytes: 10 * 1024 * 1024 },
      deps,
    );
    // The pre-flight in `uploadMedia` will catch this and surface
    // 'too-large' to the user; here we just guarantee no surprise truncation.
    expect(out).toBe(input);
  });

  it('honors a custom format ladder (e.g. JPEG-only for legacy callers)', async () => {
    const input = makeFile('hero.jpg', 'image/jpeg', 5 * 1024 * 1024);
    const jpegBlob = new Blob([new Uint8Array(800 * 1024)], { type: 'image/jpeg' });
    const drawAndExport = vi.fn().mockResolvedValue(jpegBlob);
    const deps: CompressDeps = {
      loadImage: vi.fn().mockResolvedValue({ width: 4800, height: 3600 }),
      drawAndExport,
    };
    const out = await compressImage(input, { formatLadder: ['image/jpeg'] }, deps);
    expect(out.type).toBe('image/jpeg');
    expect(drawAndExport).toHaveBeenCalledTimes(1);
    expect(drawAndExport).toHaveBeenNthCalledWith(1, expect.objectContaining({ mimeType: 'image/jpeg' }));
  });
});
