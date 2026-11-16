// While a screen loads there is something to read (D214, D221): a child who has begun
// reads a tip with its picture at the visit's first wait and at a scene other than the
// last shown, at once, and the screen opens by itself once the tip has been read; a
// screen of the same scene that loads quickly shows none; a newcomer reads the letter
// over the castle's painting, with the music playing, while the field loads; and a level
// shows while Python is still loading, its card read and its program written.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const ES = JSON.parse(readFileSync(new URL('../../i18n/es.json', import.meta.url), 'utf8'));
const LETTER: string[] = JSON.parse(readFileSync(`${CONTENT}stories/the-letter/text.es.json`, 'utf8')).steps;
const SHOTS = 'e2e/shots/waiting/';

test.use({ locale: 'es-ES', viewport: { width: 1280, height: 800 } });

/** Requests matching `pattern` held back `ms` before they go on. */
async function delay(page: Page, pattern: string, ms: number): Promise<void> {
  await page.route(pattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

test.describe('a tip while a screen loads', () => {
  // The tips on, as for a child, where every other spec turns them off.
  test.use({ storageState: { cookies: [], origins: [] } });

  /** The tip up: its words among the page's tips, its picture in the language, loaded. */
  async function tipShown(page: Page): Promise<void> {
    const tip = page.locator('#waiting-tip');
    await expect(tip).toBeVisible({ timeout: ciTimes(1_500) });
    const tips = Object.values(ES.tips as Record<string, string>).map((said) => said.replace(/\*/g, ''));
    expect(tips.map((said) => said.replace(/\{([^|}]*)\|([^}]*)\}/g, '$2'))).toContain(await tip.textContent());
    const picture = page.locator('.waiting-tip-picture');
    await expect(picture).toHaveAttribute('src', /content\/tips\/es\/[a-z]+\.webp\?v=[0-9a-f]{12}$/);
    await expect.poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(640);
    // No button: the screen opens by itself.
    await expect(page.locator('#waiting button')).toHaveCount(0);
  }

  test("the visit's first wait shows a tip with its picture at once, and the level opens by itself (D221)", async ({
    page,
  }) => {
    await seedWizard(page, MARTA, { tips: true });
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#waiting .waiting-loading')).toHaveText('Cargando…');
    await tipShown(page);
    await page.screenshot({ path: `${SHOTS}tip.png` });
    // The level's files come quickly; the tip stays its reading time, then the level.
    await expect(page.locator('#start')).toHaveCount(0);
    await expect(page.locator('#start')).toBeVisible({ timeout: ciTimes(11_000) });
    await expect(page.locator('#waiting')).toHaveCount(0);
  });

  test('a level of the same scene loads with no tip, and one of another scene with a tip first (D221)', async ({
    page,
  }) => {
    await seedWizard(page, MARTA, { tips: true });
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#start')).toBeVisible({ timeout: ciTimes(15_000) });
    // The library again: a quick load, no tip, nothing held.
    await page.evaluate(() => {
      location.hash = '#level/the-hidden-key';
    });
    await expect(page.locator('#start')).toBeVisible({ timeout: ciTimes(10_000) });
    await expect(page.locator('#level-number')).toHaveCount(1);
    expect(await page.locator('#waiting-tip').count()).toBe(0);
    // The two doors: a new scene, a tip at once, then the level by itself.
    await page.evaluate(() => {
      location.hash = '#level/the-wrong-door';
    });
    await tipShown(page);
    await page.screenshot({ path: `${SHOTS}tip-new-scene.png` });
    await expect(page.locator('.level-title')).toHaveText(/./, { timeout: ciTimes(11_000) });
    await expect(page.locator('#waiting')).toHaveCount(0);
  });

  test('a lesson, of no scene, keeps the grace: a quick load shows no tip', async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#start')).toBeVisible({ timeout: ciTimes(15_000) });
    await page.evaluate(() => {
      location.hash = '#lesson/the-distance';
    });
    await expect(page.locator('.lesson-screen, .lesson').first()).toBeVisible({ timeout: ciTimes(10_000) });
    expect(await page.locator('#waiting-tip').count()).toBe(0);
  });
});

test('a newcomer reads the letter over the castle, with the music, while the field loads (D214)', async ({ page }) => {
  // The scene's code held back: the story's words come first.
  await delay(page, '**/assets/scene-*.js', ciTimes(6_000));
  await page.goto('/');
  await page.locator('#about-play').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
  await expect(page.locator('#story-voice')).toHaveText(LETTER[0] as string, { timeout: ciTimes(5_000) });
  await expect(page.locator('#story-still')).toBeVisible();
  await expect(page.locator('#story-still')).toHaveAttribute('src', /welcome-castle\.webp$/);
  await expect(page.locator('#scene')).toHaveAttribute('data-state', 'loading');
  await expect(page.locator('html')).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await expect(page.locator('html')).toHaveAttribute('data-music-theme', 'arrival');
  await page.screenshot({ path: `${SHOTS}letter-over-the-castle.png` });
  // The second step does nothing on the scene: it is read before the scene is there.
  await page.locator('#story-next').click();
  await expect(page.locator('#story-voice')).toHaveText(LETTER[1] as string);
  await expect(page.locator('#story-still')).toBeVisible();
  // The scene comes in, and the still leaves.
  await expect(page.locator('#scene')).not.toHaveAttribute('data-state', 'loading', { timeout: ciTimes(30_000) });
  await expect(page.locator('#story-still')).toBeHidden({ timeout: ciTimes(5_000) });
});

test('a level shows while Python is still loading: its card is read and its program written (D214)', async ({
  page,
}) => {
  await seedWizard(page, MARTA);
  await delay(page, '**/pyodide/**', ciTimes(8_000));
  await page.goto('/#level/the-moving-key');
  await expect(page.locator('#start')).toBeVisible({ timeout: ciTimes(10_000) });
  await page.locator('#start').click();
  await expect(page.locator('#status')).toHaveText('Preparando Python…');
  await expect(page.locator('#status')).toHaveAttribute('data-status', 'loading');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_left(2)');
  await expect(page.locator('.cm-content')).toContainText('wizard.move_left(2)');
  await page.screenshot({ path: `${SHOTS}level-before-python.png` });
  await expect(page.locator('#status')).toHaveAttribute('data-status', 'ready', { timeout: ciTimes(60_000) });
});
