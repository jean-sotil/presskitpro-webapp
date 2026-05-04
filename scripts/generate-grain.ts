/**
 * One-shot generator for `public/grain.png` — the noise tile consumed by
 * <Grain />. Re-run this only if you want to refresh the noise pattern.
 *
 *   bun run scripts/generate-grain.ts
 *
 * Output: 200×200 grayscale PNG, ~10–15 KB. Tiles seamlessly because we
 * don't blur or smooth — every pixel is independent.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const SIZE = 200;
const OUTPUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'grain.png',
);

async function main() {
  // Single-channel grayscale buffer — 4× smaller than RGBA and PNG indexes it.
  const pixels = Buffer.alloc(SIZE * SIZE);
  for (let i = 0; i < pixels.length; i++) {
    // Random luminance in the mid range — extremes (pure black/white) read
    // as banding rather than noise when blended.
    pixels[i] = Math.floor(80 + Math.random() * 96);
  }

  const png = await sharp(pixels, {
    raw: { width: SIZE, height: SIZE, channels: 1 },
  })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, png);
  console.log(`wrote ${OUTPUT} (${png.byteLength} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
