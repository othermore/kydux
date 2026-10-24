// The game's sounds (plan, phase 4): made as it plays, one for each thing that
// happens; the tests read the last one played from the scene, since they cannot
// hear, and the settings silence them.

import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('a step, a bump and a win each have their sound', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  const scene = page.locator('#scene');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right()');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-sound', 'fail', { timeout: 30_000 });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_left(6)');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-sound', 'win', { timeout: 30_000 });
});

test('the settings turn the sound off, and it stays off', async ({ page }) => {
  await page.goto('/#settings');
  const sound = page.locator('#settings-sound');
  await expect(sound).toHaveValue('on');
  await sound.selectOption('off');
  await page.reload();
  await expect(page.locator('#settings-sound')).toHaveValue('off');
});
