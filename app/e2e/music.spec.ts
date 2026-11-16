// The music (D192): it waits for the first gesture on the page, then plays the
// chapter's theme; a story plays it at its loudness and a lesson lower, with the same
// voices (D210); the slider at none silences it, and the settings keep it; ?debug's
// #music lists every theme with two buttons, as a story and as a level, and the voices
// of the one playing, each to turn off and to set by hand (D203).

import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });
test.beforeEach(({ page }) => seedWizard(page, MARTA));

const root = (page: Page) => page.locator('html');

test('the music starts at the first click on the start screen, with the first chapter\'s theme as a story hears it', async ({ page }) => {
  await page.goto('/#start');
  await expect(page.locator('#continue')).toBeVisible();
  await expect(root(page)).toHaveAttribute('data-music', 'waiting');
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await expect(root(page)).toHaveAttribute('data-music-theme', 'arrival');
  await expect(root(page)).toHaveAttribute('data-music-heard', 'story');
});

test('a lesson plays its chapter\'s theme lower, and a story at its loudness (D210)', async ({ page }) => {
  await page.goto('/#lesson/lists');
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await expect(root(page)).toHaveAttribute('data-music-theme', 'the-broom');
  await expect(root(page)).toHaveAttribute('data-music-heard', 'level');
  await page.goto('/#story/the-flying-lesson');
  await page.locator('h1, header').first().click();
  await expect(root(page)).toHaveAttribute('data-music-heard', 'story', { timeout: ciTimes(10_000) });
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

test('with ?debug, #music lists every theme, two buttons each, and plays the one chosen', async ({ page }) => {
  await page.goto('/?debug#music');
  const buttons = page.locator('.themes-list button');
  // Five chapters' themes, and no candidate beside one (D209).
  await expect(buttons).toHaveCount(10);
  await expect(page.locator('.themes-list button[data-theme="the-broom"]')).toHaveCount(2);
  await page.locator('.themes-list button[data-theme="the-passages"][data-heard="level"]').click();
  await expect(root(page)).toHaveAttribute('data-music-theme', 'the-passages');
  await expect(root(page)).toHaveAttribute('data-music-heard', 'level');
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
});

test('a theme playing on #music shows its voices, each to turn off and to set by hand (D203)', async ({ page }) => {
  await page.goto('/?debug#music');
  await page.locator('.themes-list button[data-theme="the-broom"][data-heard="story"]').click();
  await expect(root(page)).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await expect(page.locator('.themes-mixer li')).toHaveCount(5);
  await expect(page.locator('#themes-mix')).toHaveText('the-broom: every voice as written');
  await page.locator('.themes-mixer input[type="checkbox"][data-voice="strings"]').uncheck();
  await expect(page.locator('#themes-mix')).toHaveText('the-broom: strings off');
  await page.locator('.themes-mixer input[type="range"][data-voice="tune"]').fill('0.5');
  await expect(page.locator('#themes-mix')).toHaveText('the-broom: tune 0.50, strings off');
  await page.locator('#themes-reset').click();
  await expect(page.locator('#themes-mix')).toHaveText('the-broom: every voice as written');
  await expect(page.locator('.themes-mixer input[type="checkbox"][data-voice="strings"]')).toBeChecked();
});

test("with ?debug, #music plays the broom's wind six ways, and its mixer of three voices says each one changed (D243)", async ({
  page,
}) => {
  await page.goto('/?debug#music');
  await expect(page.locator('.themes-wind button[data-wind]')).toHaveCount(6);
  for (const voice of ['air', 'whistle', 'rest']) {
    await expect(page.locator(`.themes-wind input[type="checkbox"][data-wind-voice="${voice}"]`)).toHaveCount(1);
    await expect(page.locator(`.themes-wind input[type="range"][data-wind-voice="${voice}"]`)).toHaveCount(1);
  }
  await expect(page.locator('.themes-wind input[type="checkbox"][data-wind-voice="rest"]')).not.toBeChecked();
  await expect(page.locator('#wind-mix')).toHaveText("The broom's wind: every voice as written");
  await page.locator('.themes-wind button[data-wind="flight"]').click();
  await page.locator('.themes-wind input[type="checkbox"][data-wind-voice="whistle"]').uncheck();
  await expect(page.locator('#wind-mix')).toHaveText("The broom's wind: whistle off");
  await page.locator('.themes-wind input[type="checkbox"][data-wind-voice="rest"]').check();
  await expect(page.locator('#wind-mix')).toHaveText("The broom's wind: whistle off, rest 1.00");
  await page.locator('#wind-reset').click();
  await expect(page.locator('#wind-mix')).toHaveText("The broom's wind: every voice as written");
});
