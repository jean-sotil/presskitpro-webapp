/**
 * Browser-side image compression for hero/gallery uploads.
 *
 * - SVG bypass: rasterizing a vector logo destroys its quality + scaling.
 * - 30MB hard ceiling on the input — Canvas-based resize on iOS Safari
 *   OOMs above ~50MB; we cap conservatively.
 * - Default target: 2400px long edge.
 * - Format: AVIF preferred (lighter, ~30% smaller for same perceived
 *   quality), JPEG fallback when AVIF encoder is unavailable (older
 *   Safari, some Firefox builds).
 *
 * Pure-ish: I/O is gated through a `CompressDeps` interface so tests can
 * stub `loadImage` + `drawAndExport`. Production wires the live DOM.
 */

const MAX_INPUT_BYTES = 30 * 1024 * 1024;

export type CompressMimeType = 'image/avif' | 'image/jpeg';

export type CompressOptions = {
  maxEdge?: number;
  /** Quality for the chosen format (0..1). AVIF default 0.7, JPEG 0.82. */
  quality?: number;
  /**
   * Skip the canvas roundtrip when the input is already under this size.
   * Default 1.5MB — most modern phone exports already hit the budget.
   */
  skipUnderBytes?: number;
  /**
   * Override the format ladder. Defaults to `['image/avif', 'image/jpeg']`
   * (try AVIF first, fall back to JPEG).
   */
  formatLadder?: CompressMimeType[];
  /**
   * If set, the compressor retries each format at progressively lower
   * qualities (default → 0.5 → 0.35) until the encoded blob fits this
   * byte budget, then falls through to the next format. Use this to
   * keep uploads under the server's MAX_UPLOAD_BYTES ceiling instead of
   * relying on a single fixed quality.
   */
  targetMaxBytes?: number;
};

const ADAPTIVE_FALLBACK_QUALITIES = [0.5, 0.35] as const;

export type Dimensions = { width: number; height: number };

export type CompressDeps = {
  loadImage(file: File): Promise<Dimensions>;
  /**
   * Draw the resized image and export to the requested MIME type.
   * Returns `null` when the format isn't supported (e.g. AVIF on Safari 15);
   * the caller falls back to the next entry in the format ladder.
   */
  drawAndExport(args: {
    image: Dimensions;
    width: number;
    height: number;
    mimeType: CompressMimeType;
    quality: number;
  }): Promise<Blob | null>;
};

const DEFAULT_FORMAT_LADDER: CompressMimeType[] = ['image/avif', 'image/jpeg'];
const DEFAULT_QUALITY: Record<CompressMimeType, number> = {
  'image/avif': 0.7,
  'image/jpeg': 0.82,
};

const SVG_TYPES = new Set(['image/svg+xml', 'image/svg']);

const FILE_EXT: Record<CompressMimeType, string> = {
  'image/avif': 'avif',
  'image/jpeg': 'jpg',
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
  const ladder = options.formatLadder ?? DEFAULT_FORMAT_LADDER;
  const overrideQuality = options.quality;

  const image = await deps.loadImage(file);
  const { width, height } = pickResizeDimensions(image.width, image.height, maxEdge);

  for (const mimeType of ladder) {
    const baseQuality = overrideQuality ?? DEFAULT_QUALITY[mimeType];
    const qualities =
      options.targetMaxBytes !== undefined
        ? [baseQuality, ...ADAPTIVE_FALLBACK_QUALITIES]
        : [baseQuality];

    let smallest: Blob | null = null;
    let formatUnavailable = false;
    for (const quality of qualities) {
      const blob = await deps.drawAndExport({
        image,
        width,
        height,
        mimeType,
        quality,
      });
      if (!blob) {
        // format unavailable (e.g. AVIF on Safari 15); skip remaining qualities
        formatUnavailable = true;
        break;
      }
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (
        options.targetMaxBytes === undefined ||
        blob.size <= options.targetMaxBytes
      ) {
        break;
      }
    }
    if (formatUnavailable) continue;
    if (!smallest) continue;
    if (smallest.size >= file.size) continue; // compression made it worse
    if (
      options.targetMaxBytes !== undefined &&
      smallest.size > options.targetMaxBytes
    ) {
      continue; // doesn't fit budget; try next format
    }
    const newName = swapExtension(file.name, FILE_EXT[mimeType]);
    return new File([smallest], newName, { type: mimeType });
  }

  // Every format in the ladder failed — keep the original. Caller's
  // pre-flight (uploadMedia) catches oversize files before signing.
  return file;
}

function swapExtension(name: string, newExt: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return `${name}.${newExt}`;
  return `${name.slice(0, dot)}.${newExt}`;
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
  async drawAndExport(_args) {
    throw new Error(
      'compressImage.drawAndExport: use bindCompressDeps(file) for live wiring.',
    );
  },
};

/**
 * Browser-only canvas helper that closes over the source File. Returns
 * `null` when `canvas.toBlob` doesn't support the MIME type — the caller
 * falls back to the next format in the ladder.
 */
export async function drawAndExportFromFile(
  file: File,
  width: number,
  height: number,
  mimeType: CompressMimeType,
  quality: number,
): Promise<Blob | null> {
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
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          // Browsers that don't support the requested MIME type return
          // `null` (or a PNG blob with the wrong type — we accept either
          // signal to fall back).
          if (!blob) return resolve(null);
          if (blob.type !== mimeType) return resolve(null);
          resolve(blob);
        },
        mimeType,
        quality,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Production callers should use this — closes over the source File so
 * the deps contract stays File-agnostic for testability.
 */
export function bindCompressDeps(file: File): CompressDeps {
  return {
    loadImage: liveDeps.loadImage,
    drawAndExport: async ({ width, height, mimeType, quality }) =>
      drawAndExportFromFile(file, width, height, mimeType, quality),
  };
}
