// The screen's guide (D68): the first level opens it once, after its start card;
// it shows each part of the screen in turn, opens the notebook for its step, and
// the ? card plays it again.

import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

const STEPS = ['scene', 'goals', 'editor', 'run', 'notebook', 'hint', 'method'];

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
    await expect(page.locator('#guide-next')).toHaveText(index === STEPS.length - 1 ? "Let's go!" : 'Next');
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
  await expect(page.locator('#guide-title')).toHaveText('La escena');
  await expect(page.locator('#guide-next')).toHaveText('Siguiente');
  await expect(page.locator('#guide-skip')).toHaveText('Saltar');
  await context.close();
});
