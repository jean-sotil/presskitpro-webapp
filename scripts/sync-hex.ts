/**
 * One-shot dev helper: prints the OKLCH → sRGB hex conversions for every
 * preset in lib/design/tokens.ts. Run after editing the OKLCH table to
 * regenerate the hex column manually.
 *
 *   bun run scripts/sync-hex.ts
 */
import { formatHex, oklch, parse } from 'culori';
import { accentPresets, bgPresets, autoText } from '../lib/design/tokens';

function toHex(oklchStr: string): string {
  const c = parse(`oklch(${oklchStr})`);
  if (!c) throw new Error(`Cannot parse: ${oklchStr}`);
  const hex = formatHex(c);
  return hex ?? '#000000';
}

console.log('--- bgPresets ---');
for (const bg of bgPresets) {
  console.log(`  ${bg.id.padEnd(20)} oklch=${bg.oklch.padEnd(22)} hex=${toHex(bg.oklch)}`);
}

console.log('--- accentPresets ---');
for (const a of accentPresets) {
  console.log(`  ${a.id.padEnd(20)} oklch=${a.oklch.padEnd(22)} hex=${toHex(a.oklch)}`);
}

console.log('--- autoText ---');
for (const [mode, t] of Object.entries(autoText)) {
  console.log(`  ${mode.padEnd(20)} oklch=${t.oklch.padEnd(22)} hex=${toHex(t.oklch)}`);
}

// Quietly silence unused import warning in some configs
void oklch;
