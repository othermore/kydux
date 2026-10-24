import { expect, type Page, test } from '@playwright/test';

test.use({ locale: 'en-US' });

const stop = (page: Page, item: string) => page.locator(`.stop[data-item="${item}"]`);

test('the map shows the course in order: the first stop open, the rest locked', async ({ page }) => {
  await page.goto('/#map');
  await expect(page.locator('.map-chapter h2')).toHaveText(['Arrival', 'The library', 'The passages']);
  const first = page.locator('.stop').first();
  await expect(first).toHaveAttribute('data-item', 'story:at-the-gate');
  await expect(first).toHaveAttribute('data-state', 'open');
  await expect(first).toContainText('At the gate');
  await expect(first.locator('.stop-icon.story')).toHaveCount(1);
  const gate = stop(page, 'level:the-gate');
  await expect(gate).toHaveAttribute('data-state', 'locked');
  await expect(gate).toContainText('The gate');
  await expect(gate.locator('a')).toHaveCount(0);
});

test('a won level is done with its stars, and opens the next stop', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(6)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  await page.locator('#level-map').click();
  const won = stop(page, 'level:the-long-corridor');
  await expect(won).toHaveAttribute('data-state', 'done');
  // One line, no hint, no bump: every star (D57).
  await expect(won.locator('.stop-stars')).toHaveText('★★★');
  await expect(stop(page, 'level:the-stairs')).toHaveAttribute('data-state', 'open');
  await expect(stop(page, 'lesson:words')).toHaveAttribute('data-state', 'locked');
});

test('the map in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#map');
  await expect(page.locator('.map-chapter h2').first()).toHaveText('La llegada');
  await expect(stop(page, 'level:the-locked-door')).toContainText('La puerta cerrada');
  await context.close();
});
