// A scene painted in one picture (D76): chapter 1's field drawn from its art,
// the figures from their sheets, and a run played on it. The screenshots go to
// e2e/shots/painted/, which git ignores, for the owner to look at.

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { seedWizard, storyNext } from './helpers';

const SHOTS = fileURLToPath(new URL('./shots/painted/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

test.use({ locale: 'en-US', viewport: { width: 1280, height: 800 } });

test('chapter 1 plays on the painted field', async ({ page }) => {
  await seedWizard(page);
  const art = await page.request.get('/content/art/scenes/the-field/art.json');
  expect(art.ok()).toBe(true);
  await page.goto('/#level/the-password');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('2');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}01-password.png` });
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.say("ambrel")\nwizard.move_up(6)');
  await page.locator('#run').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-doors', 'gate', { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}02-through-the-gate.png` });
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.win-card .star').nth(2)).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${SHOTS}03-won.png` });
});

test('a figure behind a tree is hidden by it; the castle door opens onto the dark', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-way-in');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('2');
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.move_up(3)\nwizard.say("ambrel")\nwizard.cast("zelim")\nwizard.move_up()');
  await page.locator('#run').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-doors', /castle_door/, { timeout: 30_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}04-castle-door.png` });
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
});

test('the story at the gate is told on the field', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#story/at-the-gate');
  await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done');
  await storyNext(page, 3);
  await expect(page.locator('#scene')).toHaveAttribute('data-actors', 'friend:9,20,up');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}05-at-the-gate.png` });
});
