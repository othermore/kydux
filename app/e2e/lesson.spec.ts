import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('a lesson turns its pages, and Try it opens the level with its example', async ({ page }) => {
  await page.goto('/#lesson/01-first-action');
  await expect(page.locator('.lesson-page h1')).toHaveText('Your first action');
  await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 3');
  await expect(page.locator('#lesson-back')).toBeDisabled();
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-page h2')).toHaveText('Objects and actions');
  await expect(page.locator('.lesson-page pre')).toContainText('wizard.move_right()');
  await page.locator('#lesson-next').click();
  await expect(page.locator('#lesson-page')).toHaveText('Page 3 of 3');
  await expect(page.locator('.lesson-page pre')).not.toContainText('try');

  await page.locator('#lesson-try').click();
  await expect(page).toHaveURL(/#level\/01-the-corridor$/);
  await page.locator('#start').click();
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_right()wizard.move_right()');
});

test('a lesson read shows as done on the map, and opens its level', async ({ page }) => {
  await page.goto('/#lesson/01-first-action');
  await page.locator('#lesson-next').click();
  await page.locator('#lesson-next').click();
  await page.locator('#lesson-map').click();
  const stops = page.locator('.stop');
  await expect(stops).toHaveCount(6);
  await expect(stops.nth(0)).toHaveAttribute('data-state', 'done');
  await expect(stops.nth(1)).toHaveAttribute('data-state', 'open');
  await expect(stops.nth(1)).toContainText('The corridor');
});

test('a lesson in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#lesson/02-steps');
  await expect(page.locator('.lesson-page h1')).toHaveText('Pasos, llaves y puertas');
  await expect(page.locator('#lesson-next')).toHaveText('Página siguiente');
  await context.close();
});
