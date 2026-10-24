// A story told on its scene (D74): the voice under the scene, a figure's words
// in a bubble over it, each step's action played before its words, Back and
// Next, Enter and Space, and Go on to what comes next, the story read.

import { expect, test } from '@playwright/test';
import { seedWizard, storyNext, storySaid } from './helpers';

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

  // The wizard calls out; Nuri appears at the path's end, then walks up and speaks.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-speaker', 'wizard');
  await expect(scene).toHaveAttribute('data-bubble', /Is anyone there\?/);
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-actors', 'friend:9,28,left');
  await expect(scene).not.toHaveAttribute('data-bubble', /./);
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-actors', 'friend:9,20,up');
  await expect(scene).toHaveAttribute('data-speaker', 'friend');
  await expect(scene).toHaveAttribute('data-bubble', /Hello! I am Teku\./);
  await expect(page.locator('#story-voice')).toHaveText('');
  await expect(storySaid(page)).toContainText('Teku: Hello! I am Teku.');
  // The bubble stays until the next step.
  await page.waitForTimeout(1500);
  await expect(scene).toHaveAttribute('data-speaker', 'friend');

  // Back shows the step before as it was: Nuri back at the path's end.
  await page.locator('#story-back').click();
  await expect(scene).toHaveAttribute('data-actors', 'friend:9,28,left');
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
  await storyNext(page, 4);
  await expect(page.locator('#story-next')).toHaveText('Next');
  await storyNext(page);
  await expect(page.locator('#story-go-on')).toHaveText('Go on');
  await page.locator('#story-go-on').click();
  await expect(page).toHaveURL(/#lesson\/what-a-program-is$/);
  await page.goto('/#map');
  await expect(page.locator('.stop[data-item="story:at-the-gate"]')).toHaveAttribute('data-state', 'done');
});

test('a figure who goes says its words first, and is gone at the next step', async ({ page }) => {
  await page.goto('/#story/in-the-castle');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-actors', /friend:3,13/);
  await storyNext(page, 4);
  await expect(scene).toHaveAttribute('data-speaker', 'friend');
  await expect(scene).toHaveAttribute('data-actors', /friend:3,13/);
  await storyNext(page);
  await expect(scene).not.toHaveAttribute('data-actors', /friend/);
  await expect(scene).toHaveAttribute('data-actors', /wenna:5,12/);
});
