/**
 * `pnpm contrast:check` — runs the curated bg × accent preset matrix through
 * WCAG AA and exits non-zero on any failure.
 *
 * Per PRD §12.3:
 *   - text vs bg ≥ 4.5:1
 *   - accent vs bg ≥ 3:1 (large-text / non-text UI threshold)
 *
 * Per task-03 AC: "verifies every preset combination passes WCAG AA."
 */
import { accentPresets, autoText, bgPresets, defaultTokens } from '../lib/design/tokens';
import { contrastRatio, passesAA } from '../lib/design/contrast';

type Failure = {
  bg: string;
  pair: string;
  required: number;
  actual: number;
};

function check(): Failure[] {
  const failures: Failure[] = [];

  for (const bg of bgPresets) {
    const text = autoText[bg.mode];

    if (!passesAA(bg.hex, text.hex, 4.5)) {
      failures.push({
        bg: bg.id,
        pair: `text (${text.hex})`,
        required: 4.5,
        actual: contrastRatio(bg.hex, text.hex),
      });
    }

    // text-muted only needs to be verified against the default-theme bg
    // (each bg preset auto-derives its own muted via task-18; for now we
    // gate the default-theme dark stack so axe never fires on dashboard copy).
    if (bg.id === 'editorial-night' && !passesAA(bg.hex, defaultTokens.textMuted.hex, 4.5)) {
      failures.push({
        bg: bg.id,
        pair: `text-muted (${defaultTokens.textMuted.hex})`,
        required: 4.5,
        actual: contrastRatio(bg.hex, defaultTokens.textMuted.hex),
      });
    }

    for (const accent of accentPresets) {
      if (!passesAA(bg.hex, accent.hex, 3)) {
        failures.push({
          bg: bg.id,
          pair: `accent ${accent.id} (${accent.hex})`,
          required: 3,
          actual: contrastRatio(bg.hex, accent.hex),
        });
      }
    }
  }

  return failures;
}

function main() {
  const totalCombos = bgPresets.length * (accentPresets.length + 1);
  const failures = check();

  if (failures.length === 0) {
    console.log(`✓ ${totalCombos}/${totalCombos} preset combos pass WCAG AA`);
    process.exit(0);
  }

  console.error(
    `✗ ${failures.length} of ${totalCombos} preset combos fail WCAG AA:\n`,
  );
  for (const f of failures) {
    console.error(
      `  bg=${f.bg.padEnd(18)} ${f.pair.padEnd(40)} ratio=${f.actual.toFixed(2)} (need ≥ ${f.required})`,
    );
  }
  process.exit(1);
}

main();
