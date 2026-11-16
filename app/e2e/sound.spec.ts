// The game's sounds (plan, phase 4): made as it plays, one for each thing that
// happens; the tests read the last one played from the scene, since they cannot
// hear, and the settings silence them.

import { expect, test } from '@playwright/test';
import { seedWizard, storyNext } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

test('a step, a bump and a win each have their sound', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('4');
  const scene = page.locator('#scene');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_up()');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-sound', 'fail', { timeout: ciTimes(30_000) });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-sound', 'win', { timeout: ciTimes(30_000) });
});

test('the settings turn the sound off, and it stays off', async ({ page }) => {
  await page.goto('/#settings');
  const sound = page.locator('#settings-sound');
  await expect(sound).toHaveValue('on');
  await sound.selectOption('off');
  await page.reload();
  await expect(page.locator('#settings-sound')).toHaveValue('off');
});

test("every figure's steps are heard: the wizard's own, a child's, a grown-up's (D132)", async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#story/the-morning');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  // Step 5: the wizard and the mate walk to the door side by side.
  await storyNext(page, 4);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  let sounds = ((await scene.getAttribute('data-sounds')) ?? '').split(',');
  expect(sounds, sounds.join(' ')).toContain('step');
  expect(sounds, sounds.join(' ')).toContain('step_child');
  // The first night's step 5: Ilda, a grown-up, walks out as the friend goes.
  await page.goto('/#story/the-first-night');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await storyNext(page, 4);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  sounds = ((await scene.getAttribute('data-sounds')) ?? '').split(',');
  expect(sounds, sounds.join(' ')).toContain('step_adult');
  expect(sounds, sounds.join(' ')).toContain('step_child');
});

test('with ?debug, a row of buttons plays each step for the owner to tune by ear (D132)', async ({ page }) => {
  await seedWizard(page);
  // Not the course's first level, whose guide opens over the scene.
  await page.goto('/?debug#level/the-sealed-door');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-debug', 'true', { timeout: ciTimes(90_000) });
  for (const [button, name] of [
    ['#debug-step', 'step'],
    ['#debug-step-child', 'step_child'],
    ['#debug-step-adult', 'step_adult'],
  ] as const) {
    await page.locator(button).click();
    await expect(scene).toHaveAttribute('data-sound', name);
  }
  await expect(page.locator('#debug-step-adult')).toHaveAttribute('title', /s, \d+\u2192\d+ Hz, 0\.\d+/);
});
