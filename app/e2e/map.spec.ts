import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('the map shows the course in order: the first stop open, the rest locked', async ({ page }) => {
  await page.goto('/#map');
  const stops = page.locator('.stop');
  await expect(stops).toHaveCount(6);
  await expect(page.locator('.map-chapter h2')).toHaveText('Arrival');
  await expect(stops.nth(0)).toHaveAttribute('data-state', 'open');
  await expect(stops.nth(0)).toContainText('Your first action');
  await expect(stops.nth(0).locator('.stop-icon.lesson')).toHaveCount(1);
  await expect(stops.nth(1)).toHaveAttribute('data-state', 'locked');
  await expect(stops.nth(1)).toContainText('The corridor');
  await expect(stops.nth(1).locator('a')).toHaveCount(0);
});

test('a won level is done with its stars, and opens the next stop', async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(6)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  await page.locator('#level-map').click();
  const stops = page.locator('.stop');
  await expect(stops.nth(1)).toHaveAttribute('data-state', 'done');
  await expect(stops.nth(1).locator('.stop-stars')).toHaveText('★☆☆');
  await expect(stops.nth(2)).toHaveAttribute('data-state', 'open');
  await expect(stops.nth(3)).toHaveAttribute('data-state', 'locked');
});

test('the map in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#map');
  await expect(page.locator('.map-chapter h2')).toHaveText('La llegada');
  await expect(page.locator('.stop').nth(3)).toContainText('La puerta cerrada');
  await context.close();
});
