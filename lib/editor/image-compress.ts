/**
 * Browser-side image compression for hero/gallery uploads.
 *
 * - SVG bypass: rasterizing a vector logo destroys its quality + scaling.
 * - 30MB hard ceiling on the input — Canvas-based resize on iOS Safari
 *   OOMs above ~50MB; we cap conservatively.
 * - Default target: 2400px long edge, JPEG quality 0.82 (per task-10 plan).
 *
 * Pure-ish: I/O is gated through a `CompressDeps` interface so tests can
 * stub `loadImage` + `drawAndExport`. Production wires the live DOM.
 */

const MAX_INPUT_BYTES = 30 * 1024 * 1024;

export type CompressOptions = {
  maxEdge?: number;
  quality?: number;
  /**
   * Skip the canvas roundtrip when the input is already under this size.
   * Default 1.5MB — most modern phone exports already hit the budget.
   */
  skipUnderBytes?: number;
};

export type Dimensions = { width: number; height: number };

export type CompressDeps = {
  loadImage(file: File): Promise<Dimensions>;
  drawAndExport(args: {
    image: Dimensions;
    width: number;
    height: number;
    mimeType: 'image/jpeg';
    quality: number;
  }): Promise<Blob>;
};

export function pickResizeDimensions(
  width: number,
  height: number,
  maxEdge: number,
): Dimensions {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

const SVG_TYPES = new Set(['image/svg+xml', 'image/svg']);

export async function compressImage(
  file: File,
  options: CompressOptions = {},
  deps: CompressDeps = liveDeps,
): Promise<File> {
  if (SVG_TYPES.has(file.type)) return file;
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `compressImage: file too large (${file.size} bytes; max ${MAX_INPUT_BYTES})`,
    );
  }
  const skipUnder = options.skipUnderBytes ?? 1_500_000;
  if (file.size <= skipUnder) return file;

  const maxEdge = options.maxEdge ?? 2400;
  const quality = options.quality ?? 0.82;

  const image = await deps.loadImage(file);
  const { width, height } = pickResizeDimensions(image.width, image.height, maxEdge);
  const blob = await deps.drawAndExport({
    image,
    width,
    height,
    mimeType: 'image/jpeg',
    quality,
  });
  // Defensive: if compression somehow yields a larger blob (degenerate
  // input shapes, browser quirks), keep the original.
  if (blob.size >= file.size) return file;
  return new File([blob], file.name, { type: 'image/jpeg' });
}

// ---------- live DOM wiring ---------------------------------------------

const liveDeps: CompressDeps = {
  async loadImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('image load failed'));
      });
      return { width: image.naturalWidth, height: image.naturalHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  },
  async drawAndExport({ width, height, mimeType, quality }) {
    // The live impl re-loads the image into the canvas via the same File;
    // tests don't hit this path because `drawAndExport` is mocked.
    throw new Error(
      'compressImage.drawAndExport: live implementation must be invoked through the canvas helper from a browser context.',
    );
  },
};

/**
 * Browser-only canvas drawing helper. Kept separate from `liveDeps` so
 * the module can be imported in SSR contexts without DOM references.
 * Call `drawAndExportFromFile(file, dims, quality)` from a client island.
 */
export async function drawAndExportFromFile(
  file: File,
  width: number,
  height: number,
  quality: number,
): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('image load failed'));
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas context unavailable');
    ctx.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const liveCompressDeps: CompressDeps = {
  loadImage: liveDeps.loadImage,
  drawAndExport: async ({ image: _image, width, height, quality }) => {
    // Threading the actual File through here is awkward without leaking
    // it into the dep contract; the wizard / hero editor calls
    // `compressImage` with `drawAndExportFromFile`-bound deps instead.
    throw new Error(
      'use bindCompressDeps(file) to construct deps with the source File closed-over',
    );
  },
};

/**
 * Production callers should use this — closes over the source File so
 * the deps contract stays File-agnostic for testability.
 */
export function bindCompressDeps(file: File): CompressDeps {
  return {
    loadImage: liveDeps.loadImage,
    drawAndExport: async ({ width, height, quality }) =>
      drawAndExportFromFile(file, width, height, quality),
  };
}
