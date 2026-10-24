// The screen's guide (D68): the first level opens it once, after its start card;
// it shows each part of the screen in turn, the notebook's panel and its button
// together with an arrow to each, and the ? card plays it again.

import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

const STEPS = ['scene', 'goals', 'editor', 'run', 'notebook', 'hint', 'about', 'method'];
/** How many parts of the screen each step shows. */
const SHOWN: Record<string, number> = { run: 2, notebook: 2, method: 0 };

test('the first level shows the screen once, step by step; ? shows it again', async ({ page }) => {
  await page.goto('/#level/the-gate');
  await page.locator('#start').click();
  const guide = page.locator('.guide');
  await expect(guide).toBeVisible();
  for (const [index, step] of STEPS.entries()) {
    await expect(guide).toHaveAttribute('data-step', step);
    await expect(page.locator('#guide-count')).toHaveText(`${index + 1} of ${STEPS.length}`);
    await expect(page.locator('#guide-title')).not.toBeEmpty();
    // The notebook is open for its own step, and only then.
    if (step === 'notebook') await expect(page.locator('#notebook')).toBeVisible();
    else await expect(page.locator('#notebook')).toBeHidden();
    // Each part shown is outlined; the card points at the first, an arrow at each other.
    const shown = SHOWN[step] ?? 1;
    await expect(guide).toHaveAttribute('data-shown', String(shown));
    await expect(page.locator('.guide-spot')).toHaveCount(shown);
    await expect(page.locator('.guide-arrow')).toHaveCount(Math.max(0, shown - 1));
    await expect(page.locator('#guide-next')).toHaveText(index === STEPS.length - 1 ? "Let's go!" : 'Next');
    if (step === 'notebook') await page.screenshot({ path: fileURLToPath(new URL('./shots/painted/07-guide-notebook.png', import.meta.url)) });
    await page.locator('#guide-next').click();
  }
  await expect(guide).toHaveCount(0);

  // Once seen, it does not open again by itself.
  await page.reload();
  await expect(page.locator('#run')).toBeVisible();
  await expect(guide).toHaveCount(0);

  // The ? card offers it again; Skip closes it.
  await page.locator('#about').click();
  await page.locator('#show-screen').click();
  await expect(guide).toHaveAttribute('data-step', 'scene');
  await page.locator('#guide-skip').click();
  await expect(guide).toHaveCount(0);
});

test('the guide is in the child\'s language', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#level/the-gate');
  await page.locator('#start').click();
  await expect(page.locator('#guide-title')).toHaveText('La escena del juego');
  // The owner's own words open the step (sprint 13, section 2).
  await expect(page.locator('#guide-text')).toContainText('Aquí ves el juego y los personajes del juego.');
  await expect(page.locator('#guide-next')).toHaveText('Siguiente');
  await expect(page.locator('#guide-skip')).toHaveText('Saltar');
  await context.close();
});
