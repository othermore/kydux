import { expect, type Page, test } from '@playwright/test';

test.use({ locale: 'en-US' });

const stop = (page: Page, item: string) => page.locator(`.stop[data-item="${item}"]`);

test('the map shows the course in order: the first stop open, the rest locked', async ({ page }) => {
  await page.goto('/#map');
  await expect(page.locator('.map-chapter h2')).toHaveText(['Arrival', 'The library', 'The passages']);
  const first = page.locator('.stop').first();
  // The opening is chapter 1's first story, numbered like the rest (D78).
  await expect(first).toHaveAttribute('data-item', 'story:the-letter');
  await expect(first).toHaveAttribute('data-state', 'open');
  await expect(first).toContainText('Story 1');
  await expect(first).toContainText('The letter');
  await expect(first.locator('.stop-icon.story')).toHaveCount(1);
  // The first locked stop is named; the ones after it show only their kind (D71).
  const gateStory = stop(page, 'story:at-the-gate');
  await expect(gateStory).toHaveAttribute('data-state', 'locked');
  await expect(gateStory).toContainText('At the gate');
  const lesson = stop(page, 'lesson:what-a-program-is');
  await expect(lesson).toHaveAttribute('data-state', 'locked');
  await expect(lesson).toHaveAttribute('data-unnamed', 'true');
  const gate = stop(page, 'level:the-gate');
  await expect(gate).toHaveAttribute('data-state', 'locked');
  await expect(gate).toHaveAttribute('data-unnamed', 'true');
  await expect(gate.locator('.stop-title')).toHaveText('Practice 1 ?');
  await expect(gate.locator('a')).toHaveCount(0);
});

test('a won level is done with its stars, and opens the next stop', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
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
  await expect(stop(page, 'level:the-hidden-key').locator('.stop-number')).toHaveText('Práctica 3');
  await context.close();
});

test('from a level, the map opens over it, says where you are, and closes back to it (D71)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(2)');

  await page.locator('#level-map').click();
  const overlay = page.locator('#map-overlay');
  await expect(overlay).toBeVisible();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
  const here = overlay.locator('.stop[data-here="true"]');
  await expect(here).toHaveAttribute('data-item', 'level:the-long-corridor');
  await expect(here).toContainText('You are here');
  await page.locator('#map-close').click();
  await expect(overlay).toHaveCount(0);
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(2)');

  // A stop chosen on the map is gone to.
  await page.locator('#level-map').click();
  // With no wizard yet, the open story is the letter, chapter 1's first (D78).
  await overlay.locator('.stop[data-item="story:the-letter"] a').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
});

test('a level offers its lesson again, which goes back to the level (D71)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await page.locator('#level-lesson').click();
  await expect(page).toHaveURL(/#lesson\/how-much\/from\/the-long-corridor$/);
  await expect(page.locator('.lesson-page h1')).toHaveText('How far we move');
  await page.locator('#lesson-to-level').click();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
});

test('with ?debug every stop opens and is named, for a tester to go straight to it', async ({ page }) => {
  await page.goto('/?debug#map');
  const last = stop(page, 'level:the-watchtower');
  await expect(last).toHaveAttribute('data-state', 'locked');
  await expect(last).not.toHaveAttribute('data-unnamed', /./);
  await expect(page.locator('.stop:not(:has(a))')).toHaveCount(0);
  await last.locator('a').click();
  await expect(page).toHaveURL(/#level\/the-watchtower$/);
  // The button that writes the solution is the development server's alone:
  // the solutions never ship.
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('#debug-solution')).toHaveCount(0);
});
