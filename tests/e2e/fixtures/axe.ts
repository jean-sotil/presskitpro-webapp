import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Run axe against the current page and assert zero `critical` or `serious`
 * violations. `moderate` and `minor` are noisy enough that we surface them
 * but don't fail the build (they get logged for engineer review).
 *
 * Wraps `@axe-core/playwright` so the project has one place to tweak the
 * rule set or report format.
 */
export async function expectAxeClean(
  page: Page,
  label = page.url(),
  { disableRules = [] as string[] } = {},
) {
  const builder = new AxeBuilder({ page });
  if (disableRules.length > 0) builder.disableRules(disableRules);
  const results = await builder.analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  if (blocking.length > 0) {
    const summary = blocking
      .map(
        (v) =>
          `  [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
      )
      .join('\n');
    console.error(`Axe violations on ${label}:\n${summary}`);
  }

  expect(blocking, `Critical/serious axe violations on ${label}`).toEqual([]);
}
