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
    await expect.poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(960);
    // No button: the screen opens by itself.
    await expect(page.locator('#waiting button')).toHaveCount(0);
  }

  // The tallest tip of each language, the zoom's, three lines of words: the picture as
  // large as the window lets, and the view never scrolled (D239).
  for (const [lang, locale] of [
    ['es', 'es-ES'],
    ['en', 'en-US'],
  ] as const) {
    for (const [width, height, least] of [
      [1280, 800, 720],
      [1024, 700, 480],
      [390, 844, 0],
    ] as const) {
      test.describe(`in ${lang} at ${width} by ${height}`, () => {
        test.use({ locale, viewport: { width, height } });

        test('the tallest tip: its picture large, the page not scrolled (D239)', async ({ page }) => {
          await seedWizard(page, MARTA, { tips: true });
          // The tip before the zoom's was the last shown: the zoom's comes next.
          await page.addInitScript(() => localStorage.setItem('kydux.tip', '6'));
          await page.goto('/#level/the-moving-key');
          await expect(page.locator('#waiting')).toHaveAttribute('data-tip', 'zoom', { timeout: ciTimes(1_500) });
          const picture = page.locator('.waiting-tip-picture');
          await expect.poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(960);
          const drawn = (await picture.boundingBox())?.width ?? 0;
          if (least > 0) expect(drawn).toBeGreaterThanOrEqual(least);
          else {
            const room = await page
              .locator('.waiting-tip-box')
              .evaluate((box) => box.clientWidth - Number.parseFloat(getComputedStyle(box).paddingLeft) * 2);
            expect(Math.abs(drawn - room)).toBeLessThan(2);
          }
          const scrolls = await page.evaluate(() => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight);
          expect(scrolls).toBeLessThanOrEqual(0);
          if (lang === 'es' && least > 0) await page.screenshot({ path: `${SHOTS}tip-${width}x${height}.png` });
        });
      });
    }
  }

  test('a tip comes up only with its picture loaded, asked for once (D246)', async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    // The pictures on their way for 3 s, and the scene's code for longer.
    await delay(page, '**/content/tips/**', 3000);
    await delay(page, '**/assets/scene-*.js', ciTimes(10_000));
    const asked: string[] = [];
    page.on('request', (request) => {
      if (/\/content\/tips\//.test(request.url())) asked.push(new URL(request.url()).pathname);
    });
    // Not waiting for the page's load, which a picture asked for holds back.
    await page.goto('/#level/the-moving-key', { waitUntil: 'commit' });
    const box = page.locator('.waiting-tip-box');
    await expect(page.locator('#waiting .waiting-loading')).toBeVisible();
    await expect(page.locator('#waiting')).not.toHaveAttribute('data-tip', /./);
    await expect(box).toBeHidden();
    await expect(page.locator('#waiting')).toHaveAttribute('data-tip', /./, { timeout: ciTimes(8_000) });
    const key = await page.locator('#waiting').getAttribute('data-tip');
    const picture = box.locator('img.waiting-tip-picture');
    expect(await picture.evaluate((image) => (image as HTMLImageElement).complete)).toBe(true);
    expect(await picture.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(960);
    expect(asked.filter((path) => path.endsWith(`/${key}.webp`))).toHaveLength(1);
    await page.screenshot({ path: `${SHOTS}tip-with-its-picture.png` });
  });

  test("a tip whose picture is refused comes up with its words alone, and no picture's room (D246)", async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    await page.route('**/content/tips/**', (route) => route.abort());
    await delay(page, '**/assets/scene-*.js', ciTimes(6_000));
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#waiting')).toHaveAttribute('data-tip', /./, { timeout: ciTimes(5_000) });
    await expect(page.locator('#waiting-tip')).toBeVisible();
    await expect(page.locator('.waiting-tip-box img')).toHaveCount(0);
  });

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
