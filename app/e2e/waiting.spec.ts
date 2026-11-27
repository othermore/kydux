// While a screen loads there is something to read (D214, D221), and something that moves:
// Loading… large beside the mark, and a bar under them, a band that sweeps while the
// screen loads and a fill over the time a tip holds the ready screen (D249). A child who has begun
// reads a tip with its picture at the visit's first wait and at a scene other than the
// last shown, at once, and the screen opens by itself once the tip has been read; a
// screen of the same scene that loads quickly shows none; a newcomer reads the letter
// over the castle's painting, with the music playing, while the field loads; and a level
// shows while Python is still loading, its card read and its program written. The start
// screen and the welcome page come first (D341): no tip over them, and nothing fetched
// for the screens after them until their own pictures are in.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const ES = JSON.parse(readFileSync(new URL('../../i18n/es.json', import.meta.url), 'utf8'));
const LETTER: string[] = JSON.parse(readFileSync(`${CONTENT}stories/the-letter/text.es.json`, 'utf8')).steps;
const SHOTS = 'e2e/shots/waiting/';
const CHAPTERS = ['01-arrival', '02-the-library'].map(
  (id) => JSON.parse(readFileSync(`${CONTENT}chapters/${id}/chapter.json`, 'utf8')).items as string[],
);

/** A game that has reached the reading room, the first level with the lists (D357): every
 * stop before its lesson done. Its tips are all twelve. */
async function seedReadingRoom(page: Page): Promise<void> {
  const all = CHAPTERS.flat();
  const done = all.slice(0, all.indexOf('level:the-reading-room')).map((item) => item.split(':'));
  const read = (kind: string) => Object.fromEntries(done.filter(([k]) => k === kind).map(([, id]) => [id, { read: true }]));
  const progress = {
    version: 1,
    wizard: MARTA,
    guided: true,
    stories: read('story'),
    lessons: read('lesson'),
    levels: Object.fromEntries(done.filter(([k]) => k === 'level').map(([, id]) => [id, { won: true, stars: 3 }])),
  };
  await page.addInitScript((kept) => {
    if (!localStorage.getItem('kydux.games')) localStorage.setItem('kydux.progress', kept);
    localStorage.removeItem('kydux.tips-off');
  }, JSON.stringify(progress));
}

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

  // The tallest tip of each language, the one with the most words, in a game that has
  // reached the reading room and so is given every tip: the picture as large as the
  // window lets, pinned up, and the view never scrolled either way (D239, D358).
  for (const [lang, locale] of [
    ['es', 'es-ES'],
    ['en', 'en-US'],
  ] as const) {
    const said = JSON.parse(readFileSync(new URL(`../../i18n/${lang}.json`, import.meta.url), 'utf8')).tips as Record<string, string>;
    const keys = Object.keys(said);
    const tallest = keys.reduce((most, key) => ((said[key] ?? '').length > (said[most] ?? '').length ? key : most));
    for (const [width, height, least] of [
      [1280, 800, 600],
      [1024, 700, 430],
      [1366, 650, 340],
      [900, 600, 250],
      [390, 844, 240],
    ] as const) {
      test.describe(`in ${lang} at ${width} by ${height}`, () => {
        test.use({ locale, viewport: { width, height } });

        test('the tallest tip: its picture large, the page not scrolled (D239)', async ({ page }) => {
          await seedReadingRoom(page);
          // The tip before the tallest was the last shown: the tallest comes next.
          await page.addInitScript((last) => localStorage.setItem('kydux.tip', String(last)), keys.indexOf(tallest) - 1);
          // The start screen first, which knows the course: the game's tips are all there.
          await page.goto('/#start');
          await expect(page.locator('#continue')).toBeVisible();
          await page.goto('/#level/the-moving-key');
          await expect(page.locator('#waiting')).toHaveAttribute('data-tip', tallest, { timeout: ciTimes(1_500) });
          const picture = page.locator('.waiting-tip-picture');
          await expect.poll(() => picture.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBe(960);
          // The picture's box as drawn, turned in its frame (D358).
          const drawn = (await picture.boundingBox())?.width ?? 0;
          expect(drawn).toBeGreaterThanOrEqual(least);
          const scrolls = await page.evaluate(() => (document.scrollingElement?.scrollHeight ?? 0) - window.innerHeight);
          expect(scrolls).toBeLessThanOrEqual(0);
          const sideways = await page.evaluate(() => (document.scrollingElement?.scrollWidth ?? 0) - window.innerWidth);
          expect(sideways).toBeLessThanOrEqual(0);
          if (lang === 'es') await page.screenshot({ path: `${SHOTS}tip-${width}x${height}.png` });
          if (lang === 'es') console.log(`tip picture at ${width}x${height}: ${drawn.toFixed(1)} px`);
        });
      });
    }
  }

  test('a tip up and the screen ready: the bar fills over the time the tip has left (D249)', async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#waiting')).toHaveAttribute('data-tip', /./, { timeout: ciTimes(5_000) });
    await expect(page.locator('#waiting')).toHaveAttribute('data-hold', /^\d+$/, { timeout: ciTimes(10_000) });
    const fill = page.locator('.waiting-bar-fill');
    const animation = await fill.evaluate((node) => {
      const style = getComputedStyle(node);
      return { name: style.animationName, seconds: Number.parseFloat(style.animationDuration) };
    });
    expect(animation.name).toBe('waiting-fill');
    expect(animation.seconds).toBeGreaterThan(0);
    expect(animation.seconds).toBeLessThanOrEqual(10);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS}wait-filling.png` });
    await expect(page.locator('#start')).toBeVisible({ timeout: ciTimes(11_000) });
  });

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
    // Neither frame nor pin (D358).
    await expect(page.locator('.tip-photo')).toHaveCount(0);
    await expect(page.locator('.tip-pin')).toHaveCount(0);
  });

  test("a tip's picture is a photograph pinned up, turned one way and the next tip the other (D358)", async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    await page.addInitScript(() => localStorage.setItem('kydux.tip', '2'));
    // The scene's code held back: the first tip stays up, and the next comes after it.
    await delay(page, '**/assets/scene-*.js', ciTimes(14_000));
    await page.goto('/#level/the-moving-key');
    const waiting = page.locator('#waiting');
    await expect(waiting).toHaveAttribute('data-tip', 'dot', { timeout: ciTimes(1_500) });
    const photo = page.locator('.tip-photo');
    await expect(photo).toHaveCount(1);
    await expect(photo.locator('.waiting-tip-picture')).toHaveCount(1);
    await expect(photo.locator('.tip-pin')).toHaveCount(1);
    /** The photograph's turn in degrees, from its computed transform; the words' too. */
    const turn = (selector: string) =>
      page.locator(selector).evaluate((node) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
        return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
      });
    const first = await turn('.tip-photo');
    expect(Math.abs(Math.abs(first) - 2)).toBeLessThan(0.05);
    expect(await turn('#waiting-tip')).toBe(0);
    // The picture takes no click, and shows the plain cursor.
    expect(await photo.evaluate((node) => getComputedStyle(node).pointerEvents)).toBe('none');
    await page.screenshot({ path: `${SHOTS}tip-pinned.png` });
    await expect(waiting).toHaveAttribute('data-tip', 'hint', { timeout: ciTimes(12_000) });
    const second = await turn('.tip-photo');
    expect(Math.sign(second)).toBe(-Math.sign(first));
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

test.describe('Loading… large beside the mark, and a bar that moves (D249)', () => {
  test.beforeEach(async ({ page }) => {
    await seedWizard(page, MARTA);
    // The scene's code held back: the wait stays.
    await delay(page, '**/assets/scene-*.js', ciTimes(6_000));
  });

  /** The fill's animation, by its name, and whether it runs. */
  const fillAnimation = (page: Page) =>
    page.locator('.waiting-bar-fill').evaluate((node) => ({
      name: getComputedStyle(node).animationName,
      running: node.getAnimations().some((one) => one.playState === 'running'),
    }));

  test('Loading… at 28 px beside the mark, and a band that sweeps along the bar', async ({ page }) => {
    await page.goto('/#level/the-moving-key');
    const words = page.locator('#waiting .waiting-loading');
    await expect(words).toHaveText('Cargando…');
    expect(await words.evaluate((node) => getComputedStyle(node).fontSize)).toBe('28px');
    // The mark on the same row, to the left of the words.
    const mark = await page.locator('#waiting .waiting-head svg').boundingBox();
    const said = await words.boundingBox();
    if (!mark || !said) throw new Error('no row');
    expect(mark.x + mark.width).toBeLessThanOrEqual(said.x);
    expect(Math.abs(mark.y + mark.height / 2 - (said.y + said.height / 2))).toBeLessThan(6);
    // The bar under them.
    const bar = await page.locator('#waiting-bar').boundingBox();
    expect(bar?.y ?? 0).toBeGreaterThan(said.y + said.height);
    expect(await fillAnimation(page)).toEqual({ name: 'waiting-sweep', running: true });
    await page.screenshot({ path: `${SHOTS}wait-start.png` });
  });

  test('under reduced motion the band is still and fades', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#waiting .waiting-loading')).toBeVisible();
    expect(await fillAnimation(page)).toEqual({ name: 'waiting-pulse', running: true });
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
  // The scene comes, behind the still: the second step is told over it (D251).
  await expect(page.locator('#scene')).not.toHaveAttribute('data-state', 'loading', { timeout: ciTimes(30_000) });
  await expect(page.locator('#story-still')).toBeVisible();
  // At the third step the scene comes in, and the still leaves.
  await page.locator('#story-next').click();
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

test.describe('the start screen and the welcome page come first (D341)', () => {
  // The tips on, as for a child, where every other spec turns them off.
  test.use({ storageState: { cookies: [], origins: [] } });

  /** What the page fetches for the screens after the one shown: Python and its world,
   * the tips' pictures, and the other screens' code. */
  const BEHIND = /\/pyodide\/|\/world\.zip|\/content\/tips\/|\/assets\/(worker|scene|painted|editor|level|lesson|story|map)-/;

  /** The addresses asked for so far that are fetched behind a screen, each with its
   * moment. */
  function askedBehind(page: Page): { path: string; at: number }[] {
    const asked: { path: string; at: number }[] = [];
    page.on('request', (request) => {
      const path = new URL(request.url()).pathname;
      if (BEHIND.test(path)) asked.push({ path, at: Date.now() });
    });
    return asked;
  }

  /** A picture held back `ms`; the moment it is let go, once it is. */
  async function holdPicture(page: Page, pattern: string, ms: number): Promise<{ at: number | null }> {
    const released: { at: number | null } = { at: null };
    await page.route(pattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      released.at = Date.now();
      await route.continue();
    });
    return released;
  }

  /** Whether a tip has been up at any moment since the page opened. */
  async function watchTips(page: Page): Promise<() => Promise<boolean>> {
    await page.addInitScript(() => {
      const kept = window as unknown as { kyduxTipSeen: boolean };
      kept.kyduxTipSeen = false;
      new MutationObserver(() => {
        if (document.querySelector('#waiting[data-tip], .waiting-tip-box:not([hidden])')) kept.kyduxTipSeen = true;
      }).observe(document, { childList: true, subtree: true, attributes: true });
    });
    return () => page.evaluate(() => (window as unknown as { kyduxTipSeen: boolean }).kyduxTipSeen);
  }

  test('the start screen shows with no tip, however long its one file takes, asked for once', async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    const tipSeen = await watchTips(page);
    // The course file on its way for longer than the grace: a level's wait would tip.
    await delay(page, '**/content/course.json*', 3000);
    let course = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.endsWith('/content/course.json')) course += 1;
    });
    await page.goto('/');
    await expect(page.locator('#waiting .waiting-loading')).toHaveText('Cargando…');
    await expect(page.locator('#continue')).toBeVisible({ timeout: ciTimes(5_000) });
    expect(await tipSeen()).toBe(false);
    expect(course).toBe(1);
    await expect(page.locator('#waiting')).toHaveCount(0);
  });

  test('the start screen comes at once with its file there, where a level reads a tip first', async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    const tipSeen = await watchTips(page);
    await page.goto('/');
    // A tip due at once would hold the screen for its reading time, some seconds.
    await expect(page.locator('#continue')).toBeVisible({ timeout: ciTimes(1_500) });
    expect(await tipSeen()).toBe(false);
    await page.screenshot({ path: `${SHOTS}start-at-once.png` });
    // The level from it is a new scene: its tip, as ever (D221).
    await page.evaluate(() => {
      location.hash = '#level/the-moving-key';
    });
    await expect(page.locator('#waiting')).toHaveAttribute('data-tip', /./, { timeout: ciTimes(5_000) });
  });

  test('the welcome page shows with no waiting view and no tip, for a child who has begun and for a newcomer', async ({
    page,
    browser,
  }) => {
    await seedWizard(page, MARTA, { tips: true });
    const tipSeen = await watchTips(page);
    await page.goto('/#about');
    await expect(page.locator('.about-screen')).toBeVisible({ timeout: ciTimes(1_500) });
    await expect(page.locator('#waiting')).toHaveCount(0);
    expect(await tipSeen()).toBe(false);
    // A first visit, with no address: the welcome page with no start screen before it.
    const context = await browser.newContext({ locale: 'es-ES', storageState: { cookies: [], origins: [] } });
    const first = await context.newPage();
    await first.addInitScript(() => {
      const kept = window as unknown as { kyduxWaited: boolean };
      kept.kyduxWaited = false;
      new MutationObserver((changes) => {
        for (const change of changes)
          for (const node of change.addedNodes)
            if (node instanceof Element && (node.id === 'waiting' || node.querySelector('#waiting'))) kept.kyduxWaited = true;
      }).observe(document, { childList: true, subtree: true });
    });
    await first.goto('/');
    await expect(first.locator('.about-screen')).toBeVisible({ timeout: ciTimes(1_500) });
    await expect(first).toHaveURL(/#about$/);
    expect(await first.evaluate(() => (window as unknown as { kyduxWaited: boolean }).kyduxWaited)).toBe(false);
    await context.close();
  });

  test("Python, the tips' pictures and the other screens' code wait for the start screen's pictures", async ({
    page,
  }) => {
    await seedWizard(page, MARTA, { tips: true });
    const asked = askedBehind(page);
    const painting = await holdPicture(page, '**/decor/backdrop.webp', 2500);
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('#continue')).toBeVisible({ timeout: ciTimes(2_000) });
    // The painting in: all of it on its way, and none of it before.
    const has = (wanted: RegExp) => asked.some((one) => wanted.test(one.path));
    await expect.poll(() => has(/\/pyodide\//), { timeout: ciTimes(8_000) }).toBe(true);
    await expect.poll(() => has(/\/content\/tips\//)).toBe(true);
    await expect.poll(() => has(/\/assets\/(scene|painted)-/), { timeout: ciTimes(5_000) }).toBe(true);
    expect(painting.at).not.toBeNull();
    expect(Math.min(...asked.map((one) => one.at))).toBeGreaterThanOrEqual(painting.at ?? 0);
  });

  test("they wait for the welcome page's pictures too, and no longer once another screen is asked for", async ({
    page,
  }) => {
    const asked = askedBehind(page);
    const castle = await holdPicture(page, '**/about/welcome-castle.webp', ciTimes(4_000));
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('#about-play')).toBeVisible({ timeout: ciTimes(2_000) });
    await page.waitForTimeout(1000);
    expect(asked).toEqual([]);
    // Start playing: the story is asked for, and Python is on its way with it, the
    // castle's painting still to come.
    await page.locator('#about-play').click();
    await expect.poll(() => asked.some((one) => one.path.includes('/pyodide/')), { timeout: ciTimes(2_000) }).toBe(true);
    expect(castle.at).toBeNull();
  });

  test('a level asked for by its address has Python on its way from the first moment', async ({ page }) => {
    await seedWizard(page, MARTA, { tips: true });
    const asked = askedBehind(page);
    // The level's own code held back: Python does not wait for the screen.
    await delay(page, '**/assets/scene-*.js', ciTimes(4_000));
    await page.goto('/#level/the-moving-key', { waitUntil: 'commit' });
    await expect.poll(() => asked.some((one) => one.path.includes('/pyodide/')), { timeout: ciTimes(2_000) }).toBe(true);
    await expect(page.locator('#waiting')).toBeVisible();
  });
});
