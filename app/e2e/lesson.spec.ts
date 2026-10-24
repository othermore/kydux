import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('a lesson turns its pages, theory first, and Try it opens the level, its editor its own', async ({
  page,
}) => {
  await page.goto('/#lesson/what-a-program-is');
  await expect(page.locator('.lesson-page h1')).toHaveText('What a program is');
  await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 3');
  await expect(page.locator('#lesson-back')).toBeDisabled();
  // The idea comes before any code (D41).
  await expect(page.locator('.lesson-page')).toContainText('A list of instructions is a program.');
  await expect(page.locator('.lesson-page code')).toHaveCount(0);
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-page code')).toContainText('wizard.move_right()');
  await page.locator('#lesson-next').click();
  await expect(page.locator('#lesson-page')).toHaveText('Page 3 of 3');
  await expect(page.locator('.lesson-page pre')).toContainText('wizard.move_right()');
  await expect(page.locator('.lesson-page pre')).not.toContainText('try');

  await page.locator('#lesson-try').click();
  await expect(page).toHaveURL(/#level\/the-gate$/);
  await page.locator('#start').click();
  // The gate starts with no program: the example stays in the lesson (D63).
  await expect(page.locator('.cm-content')).toHaveText('');
});

test('a lesson read shows as done on the map, and opens its level', async ({ page }) => {
  await page.goto('/#lesson/what-a-program-is');
  for (let turn = 0; turn < 2; turn += 1) await page.locator('#lesson-next').click();
  await page.locator('#lesson-map').click();
  const stops = page.locator('.stop');
  await expect(stops.nth(2)).toHaveAttribute('data-item', 'lesson:what-a-program-is');
  await expect(stops.nth(2)).toHaveAttribute('data-state', 'done');
  await expect(stops.nth(3)).toHaveAttribute('data-state', 'open');
  await expect(stops.nth(3)).toContainText('The gate');
});

test('a lesson in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#lesson/words');
  await expect(page.locator('.lesson-page h1')).toHaveText('Palabras');
  await expect(page.locator('#lesson-next')).toHaveText('Página siguiente');
  await context.close();
});

test('a lesson shows who teaches it; a story is told on its scene instead (D67, D74)', async ({ page }) => {
  await page.goto('/#lesson/what-a-program-is');
  await expect(page.locator('.lesson-screen')).toHaveClass(/taught/);
  await expect(page.locator('#lesson-teacher figcaption')).toHaveText('Nuri');
  await expect(page.locator('#lesson-teacher canvas')).toBeVisible();
  await page.goto('/#lesson/a-name-for-a-value');
  await expect(page.locator('#lesson-teacher figcaption')).toHaveText('Wenna');
  await page.goto('/#story/at-the-gate');
  await expect(page.locator('.story-screen #scene canvas')).toBeVisible();
  await expect(page.locator('.lesson-screen')).toHaveCount(0);
  await expect(page.locator('#lesson-teacher')).toHaveCount(0);
});
