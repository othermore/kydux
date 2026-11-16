// A story told on its scene (D74): the voice under the scene, a figure's words
// in a bubble over it, each step's action played before its words, Back and
// Next, Enter and Space, and Go on to what comes next, the story read.

import { expect, test } from '@playwright/test';
import { seedWizard, storyNext, storySaid } from './helpers';
import { ciTimes } from './support';

test.beforeEach(async ({ page }) => {
  await seedWizard(page);
});

test('the voice tells a step under the scene; a figure says its own in a bubble', async ({ page }) => {
  await page.goto('/#story/at-the-gate');
  const scene = page.locator('#scene');
  await expect(page.locator('#story-title')).toHaveText('At the gate');
  await expect(page.locator('#story-voice')).toContainText('You are at the gate');
  await expect(scene).toHaveAttribute('data-state', 'done');
  // The friend, Teku for Marta (D77), is not there yet, and the camera stays on the story's tile.
  await expect(scene).toHaveAttribute('data-actors', '');
  await expect(scene).toHaveAttribute('data-following', 'false');
  await expect(page.locator('#story-back')).toBeDisabled();

  // The wizard calls out; the friend appears at the path's end, then walks up and speaks.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-speaker', 'wizard');
  await expect(scene).toHaveAttribute('data-bubble', /Is anyone there\?/);
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,28,left');
  await expect(scene).not.toHaveAttribute('data-bubble', /./);
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,21,up');
  await expect(scene).toHaveAttribute('data-speaker', 'friend');
  await expect(scene).toHaveAttribute('data-bubble', /Hi there! I am Teku, a first-year pupil/);
  // The band says no words of the voice: it shows who speaks, Teku's portrait and name (D194).
  await expect(page.locator('#story-speaker')).toHaveText('Teku');
  await expect(page.locator('#story-speaker img')).toHaveAttribute('data-portrait', 'teku');
  await expect(storySaid(page)).toContainText('Teku: Hi there! I am Teku, a first-year pupil');
  // The bubble stays until the next step.
  await page.waitForTimeout(ciTimes(1500));
  await expect(scene).toHaveAttribute('data-speaker', 'friend');

  // Back shows the step before as it was: the friend back at the path's end.
  await page.locator('#story-back').click();
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,28,left');
  await expect(page.locator('#story-voice')).toContainText('Someone else is coming up the path');
});

test('Enter and Space go on; Go on ends the story, read, at what comes next', async ({ page }) => {
  await page.goto('/#story/at-the-gate');
  await expect(page.locator('#story-step')).toHaveText(/^1 /);
  await page.locator('#story-title').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#story-step')).toHaveText(/^2 /);
  await page.locator('#story-title').click();
  await page.keyboard.press(' ');
  await expect(page.locator('#story-step')).toHaveText(/^3 /);
  await storyNext(page, 6);
  await expect(page.locator('#story-next')).toHaveText('Next');
  await storyNext(page);
  await expect(page.locator('#story-go-on')).toHaveText('Go on');
  await page.locator('#story-go-on').click();
  await expect(page).toHaveURL(/#lesson\/what-a-program-is$/);
  await page.goto('/#map');
  await expect(page.locator('.stop[data-item="story:at-the-gate"]')).toHaveAttribute('data-state', 'done');
});

test('Ilda goes out by the door and shuts it as the friend goes to the other dormitory (D103)', async ({ page }) => {
  await page.goto('/#story/the-first-night');
  const scene = page.locator('#scene');
  // The three stand before the door; the mate waits in the wizard's dormitory.
  await expect(scene).toHaveAttribute('data-actors', /ilda:12,11/);
  await expect(scene).toHaveAttribute('data-actors', /mate:16,6/);
  await storyNext(page, 3);
  await expect(scene).toHaveAttribute('data-speaker', 'friend');
  await expect(scene).toHaveAttribute('data-actors', /ilda:12,11/);
  await storyNext(page);
  // Ilda's walk is the longest: she is gone once it ends, the door shut behind her.
  await expect(scene).not.toHaveAttribute('data-actors', /ilda/, { timeout: ciTimes(30_000) });
  await expect(scene).toHaveAttribute('data-actors', /friend:8,8/);
  await expect(scene).not.toHaveAttribute('data-doors', /front_door/);
});

test('Again plays a step once more, as R does; Skip goes to the end (14.4)', async ({ page }) => {
  await page.goto('/#story/at-the-gate');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  // The step where the friend walks up the path.
  await storyNext(page, 3);
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,21,up', { timeout: ciTimes(10_000) });
  await expect(page.locator('#story-again')).toBeVisible();
  await page.locator('#story-again').click();
  // The walk again: the friend sets out from the path's end, then comes up.
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,21,up', { timeout: ciTimes(10_000) });
  await page.locator('#story-title').click();
  await page.keyboard.press('r');
  await expect(scene).toHaveAttribute('data-state', 'playing');
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,21,up', { timeout: ciTimes(10_000) });
  // Skip: the last step, read.
  await page.locator('#story-skip').click();
  await expect(page.locator('#story-go-on')).toBeVisible();
  await expect(page.locator('#story-skip')).toBeHidden();
  await expect(page.locator('#story-step')).toHaveText(/^(\d+) of \1$/);
});
