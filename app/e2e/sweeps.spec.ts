// Sweeps of every level, on demand, for the designer and the owner to read: the start
// card's height and what it scrolls by (D228), in each language, at the screens it is
// measured on; and the goals box's shape, whether it folds, and what each shape covers
// (D227). Each writes a table into e2e/shots/sweeps/. Run from app/:
//
//   KYDUX_SWEEPS=1 npx playwright test e2e/sweeps.spec.ts
//
// (docs/dev/dev-environment.md, section 6).

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { seedWizard, skipGuide } from './helpers';

const OUT = fileURLToPath(new URL('./shots/sweeps/', import.meta.url));
const CHAPTERS = fileURLToPath(new URL('../../content/chapters/', import.meta.url));

test.skip(!process.env.KYDUX_SWEEPS, 'run on demand: KYDUX_SWEEPS=1');

/** The levels of the course, in its order. */
function courseLevels(): string[] {
  return readdirSync(CHAPTERS)
    .sort()
    .flatMap((folder) => JSON.parse(readFileSync(`${CHAPTERS}${folder}/chapter.json`, 'utf8')).items as string[])
    .filter((item) => item.startsWith('level:'))
    .map((item) => item.slice('level:'.length));
}

const SIZES = [
  [1024, 700],
  [1280, 800],
  [1366, 650],
] as const;

test("every start card's height and its scroll, in each language, at three screens (D228)", async ({ browser }) => {
  test.setTimeout(1_800_000);
  const rows: string[] = [];
  for (const locale of ['es-ES', 'en-US']) {
    const heights = new Map<string, string[]>();
    for (const [width, height] of SIZES) {
      const context = await browser.newContext({ locale, viewport: { width, height } });
      const page = await context.newPage();
      await seedWizard(page);
      await page.goto('/#start');
      for (const id of courseLevels()) {
        await page.evaluate((hash) => {
          location.hash = hash;
        }, `#level/${id}`);
        const card = page.locator('.start-card');
        // The first level opens the screen's guide before its card (D258).
        await page.locator('#guide-skip, .start-card').first().waitFor({ state: 'visible', timeout: 30_000 });
        if (await page.locator('#guide-skip').isVisible()) await skipGuide(page);
        await expect(card).toBeVisible({ timeout: 30_000 });
        const { tall, over } = await card.evaluate((node) => ({
          tall: Math.round(node.getBoundingClientRect().height),
          over: Math.max(0, node.scrollHeight - node.clientHeight),
        }));
        const title = (await card.locator('h3').textContent()) ?? id;
        const cells = heights.get(id) ?? [title];
        cells.push(over > 0 ? `${tall} (scrolls ${over})` : String(tall));
        heights.set(id, cells);
      }
      await context.close();
    }
    rows.push(`\n## ${locale}\n`, `| level | ${SIZES.map(([w, h]) => `${w}×${h}`).join(' | ')} |`, `|---|${SIZES.map(() => '---').join('|')}|`);
    for (const cells of heights.values()) rows.push(`| ${cells.join(' | ')} |`);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}start-cards.md`,
    `# The start cards: height in px, and what each scrolls by (D228)\n${rows.join('\n')}\n`,
  );
});

test("every level's goals box: the shape taken, folded or not, and what each shape covers (D227)", async ({ browser }) => {
  test.setTimeout(1_800_000);
  const rows: string[] = [];
  const found = new Map<string, string[]>();
  for (const [width, height] of [
    [1024, 700],
    [1280, 800],
  ] as const) {
    const context = await browser.newContext({ locale: 'es-ES', viewport: { width, height } });
    const page = await context.newPage();
    await seedWizard(page);
    await page.goto('/#start');
    for (const id of courseLevels()) {
      await page.evaluate((hash) => {
        location.hash = hash;
      }, `#level/${id}`);
      // The first level of the course opens the screen's guide before its card (D258).
      await page.locator('#guide-skip, #start').first().waitFor({ state: 'visible', timeout: 30_000 });
      if (await page.locator('#guide-skip').isVisible()) await skipGuide(page);
      await page.locator('#start').click({ timeout: 30_000 });
      const goals = page.locator('.goals');
      await expect(goals).toHaveAttribute('data-revealed', 'true', { timeout: 30_000 });
      await page.waitForTimeout(3600);
      const seen = await goals.evaluate((node) => ({
        shape: node.dataset.shape,
        folded: node.dataset.folded,
        list: node.dataset.listCovers,
        strip: node.dataset.stripCovers,
      }));
      const title = (await page.locator('.level-title').textContent()) ?? id;
      const cells = found.get(id) ?? [title];
      cells.push(`${seen.shape}${seen.folded === 'true' ? ', folded' : ''} (list ${seen.list}, strip ${seen.strip})`);
      found.set(id, cells);
    }
    await context.close();
  }
  rows.push('| level | 1024×700 | 1280×800 |', '|---|---|---|');
  for (const cells of found.values()) rows.push(`| ${cells.join(' | ')} |`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}goals-box.md`,
    `# The goals box: the shape taken, folded after three seconds or not, and how many things of the level each shape covers (D227), in Spanish\n\n${rows.join('\n')}\n`,
  );
});
