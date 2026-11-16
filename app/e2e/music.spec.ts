// The music (D192): it waits for the first gesture on the page, then plays the
// chapter's theme; a story plays it whole and a lesson quietly; the slider at none
// silences it, and the settings keep it; ?debug's #music lists every theme.

import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });
test.beforeEach(({ page }) => seedWizard(page, MARTA));

const root = (page: Page) => page.locator('html');

test('the music starts at the first click on the start screen, with the first chapter\'s theme whole', async ({ page }) => {
  await page.goto('/#start');
  await expect(page.locator('#continue')).toBeVisible();
  await expect(root(page)).toHaveAttribute('data-music', 'waiting');
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await expect(root(page)).toHaveAttribute('data-music-theme', 'arrival');
  await expect(root(page)).toHaveAttribute('data-music-arrangement', 'full');
});

test('a lesson plays its chapter\'s theme quietly, and a story whole', async ({ page }) => {
  await page.goto('/#lesson/lists');
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await expect(root(page)).toHaveAttribute('data-music-theme', 'the-broom');
  await expect(root(page)).toHaveAttribute('data-music-arrangement', 'quiet');
  await page.goto('/#story/the-flying-lesson');
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music-arrangement', 'full', { timeout: ciTimes(10_000) });
  await expect(root(page)).toHaveAttribute('data-music-theme', 'the-broom');
});

test('the slider at none silences the music, and the settings keep it', async ({ page }) => {
  await page.goto('/#settings');
  const slider = page.locator('#settings-music');
  await expect(slider).toHaveValue('3');
  await expect(page.locator('#settings-music-said')).toHaveText('3 of 5');
  await slider.fill('0');
  await expect(page.locator('#settings-music-said')).toHaveText('No music');
  await expect(root(page)).toHaveAttribute('data-music', 'off');
  await page.reload();
  await expect(page.locator('#settings-music')).toHaveValue('0');
  await page.locator('#settings-back').click();
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music', 'off');
});

test('with ?debug, #music lists every theme and plays the one chosen', async ({ page }) => {
  await page.goto('/?debug#music');
  const buttons = page.locator('.themes-list button');
  await expect(buttons).toHaveCount(10);
  await page.locator('.themes-list button[data-theme="the-passages"][data-arrangement="quiet"]').click();
  await expect(root(page)).toHaveAttribute('data-music-theme', 'the-passages');
  await expect(root(page)).toHaveAttribute('data-music-arrangement', 'quiet');
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
});
