import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { levelText, seedWizard, shown, skipGuide } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

async function ready(page: Page): Promise<void> {
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
}

async function run(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(30_000) });
}

test('the start card opens a level every time it opens, and ? brings it back (D248)', async ({ page }) => {
  await page.goto('/#level/the-hidden-key');
  const card = page.locator('.start-card');
  await expect(card).toBeVisible();
  await expect(card.locator('h3')).toHaveText(levelText('the-hidden-key', 'en').title);
  await expect(card.locator('li')).toHaveCount(4);
  await page.locator('#start').click();
  await expect(card).toBeHidden();

  await page.reload();
  await expect(card).toBeVisible();
  await expect(card.locator('h3')).toHaveText(levelText('the-hidden-key', 'en').title);
  await page.locator('#start').click();
  await expect(card).toBeHidden();
  await ready(page);

  await page.locator('#about').click();
  await expect(page.locator('.start-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.start-card')).toBeHidden();
});

test.describe('the start card at every opening (D248)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page));

  test("La revisión opened again from the map opens on its card, with its intro's words", async ({ page }) => {
    // A sentence of the intro with no friend's name in it.
    const words = shown(levelText('the-check', 'es').intro ?? '').split('. ')[1] as string;
    await page.goto('/#level/the-check');
    const card = page.locator('.start-card');
    await expect(card).toContainText(words);
    await page.locator('#start').click();
    await expect(card).toBeHidden();
    await page.goto('/?debug#map');
    await page.locator('.stop[data-item="level:the-check"] a').click();
    await expect(page).toHaveURL(/#level\/the-check$/);
    await expect(card).toBeVisible();
    await expect(card).toContainText(words);
    await expect(card.locator('#show-screen')).toHaveCount(0);
  });

  test('a level won and opened again opens on its card', async ({ page }) => {
    await page.goto('/#level/the-hidden-key');
    await page.locator('#start').click();
    await ready(page);
    await page.locator('#speed').selectOption('4');
    await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-hidden-key/solution.py', import.meta.url)), 'utf8'));
    await expect(page.locator('.win-card')).toBeVisible();
    await page.reload();
    await expect(page.locator('.start-card')).toBeVisible();
    await expect(page.locator('.start-card h3')).toHaveText(levelText('the-hidden-key', 'es').title);
  });
});

test('a won run shows its stars, and Next opens what comes next in the course', async ({ page }) => {
  await page.goto('/#level/the-hidden-key');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-hidden-key/solution.py', import.meta.url)), 'utf8'));
  const win = page.locator('.win-card');
  await expect(win).toBeVisible();
  await expect(win.locator('.stars')).toHaveAttribute('data-stars', '3');
  await expect(win.locator('.stars')).toHaveAttribute('aria-label', '3 of 3 stars');
  await page.locator('#next').click();
  await expect(page).toHaveURL(/#lesson\/the-distance$/);
});

test('Play again closes the win card; the chapter\'s last level leads to its closing story', async ({
  page,
}) => {
  await page.goto('/#level/the-night-walk');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-night-walk/solution.py', import.meta.url)), 'utf8'));
  await expect(page.locator('.win-card .stars')).toHaveAttribute('data-stars', '3');
  await page.locator('#again').click();
  await expect(page.locator('.win-card')).toBeHidden();
  await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-night-walk/solution.py', import.meta.url)), 'utf8'));
  await page.locator('#next').click();
  await expect(page).toHaveURL(/#story\/caught$/);
});

test('the stars say why: a hint and a bump each cost one (D57)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(page, 'wizard.move_up()');
  await page.locator('#hint').click();
  // Into the friend, who stands above: a bump; then the long walk, in two lines.
  await run(page, 'wizard.move_up()\nwizard.move_right(8)');
  const win = page.locator('.win-card');
  await expect(win.locator('.stars')).toHaveAttribute('data-stars', '1');
  await expect(win.locator('#star-reasons li')).toHaveText([
    'Solved without a hint',
    'Without bumping into anything',
    'The extra goal met',
  ]);
  await expect(win.locator('#star-reasons li[data-kept="false"]')).toHaveCount(3);
});

test('a level and a lesson say their number in the chapter (D56)', async ({ page }) => {
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-number')).toHaveText('Chapter 1 · Practice 2');
  await page.locator('#start').click();
  await expect(page.locator('#level-number')).toHaveText('Chapter 1 · Practice 2');
  await page.goto('/#lesson/how-much');
  await expect(page.locator('#lesson-number')).toHaveText('Chapter 1 · Lesson 4');
  await page.goto('/#map');
  await expect(page.locator('.stop[data-item="level:the-gate"] .stop-number')).toHaveText('Practice 1');
});

test('a level and a lesson say their number again in the language chosen', async ({ page }) => {
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-number')).toHaveText('Chapter 1 · Practice 2');
  await page.locator('#language').selectOption('es');
  await expect(page.locator('#card-number')).toHaveText('Capítulo 1 · Práctica 2');
  await expect(page.locator('#level-number')).toHaveText('Capítulo 1 · Práctica 2');
  await page.goto('/#lesson/how-much');
  await expect(page.locator('#lesson-number')).toHaveText('Capítulo 1 · Lección 4');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#lesson-number')).toHaveText('Chapter 1 · Lesson 4');
});

test('before arguments are taught, the notebook shows a move with no number (D60)', async ({ page }) => {
  await page.goto('/#level/the-gate');
  await skipGuide(page);
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook [data-example="wizard.move_right()"]')).toHaveCount(1);
  await expect(page.locator('#notebook')).toContainText('Walks one step to the right.');
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook [data-example="wizard.move_right(3)"]')).toHaveCount(1);
});

test('? opens the start card over the notebook, and it says Continue', async ({ page }) => {
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#start')).toHaveText('Start');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook')).toBeVisible();
  await page.locator('#about').click();
  const button = page.locator('#start');
  await expect(button).toHaveText('Continue');
  // The card is on top: the point at its button's middle is the button.
  const box = await button.boundingBox();
  if (!box) throw new Error('no button');
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const atPoint = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id ?? '', middle);
  expect(atPoint).toBe('start');
});

/** A point of `inner` that `over` does not cover, or its middle. */
async function beside(page: Page, inner: string, over: string): Promise<{ x: number; y: number }> {
  const a = await page.locator(inner).first().boundingBox();
  const b = await page.locator(over).first().boundingBox();
  if (!a) throw new Error(`${inner} is not shown`);
  for (const [fx, fy] of [[0.97, 0.97], [0.97, 0.03], [0.03, 0.97], [0.03, 0.03], [0.5, 0.97], [0.97, 0.5]]) {
    const x = a.x + a.width * (fx ?? 0.5);
    const y = a.y + a.height * (fy ?? 0.5);
    if (!b || x < b.x || x > b.x + b.width || y < b.y || y > b.y + b.height) return { x, y };
  }
  return { x: a.x + a.width / 2, y: a.y + a.height / 2 };
}

test.describe('a card in a window 600 px high (D222)', () => {
  test.use({ viewport: { width: 1280, height: 600 } });

  /** Whether a card shows its first line: its scroll at the top, its title inside it. */
  const top = (page: Page, selector: string) =>
    page.locator(selector).evaluate((card) => {
      const title = card.querySelector('h3')?.getBoundingClientRect();
      const box = card.getBoundingClientRect();
      return {
        scroll: card.scrollTop,
        titleShown: Boolean(title && title.top >= box.top - 1 && title.bottom <= box.bottom + 1),
        taller: card.scrollHeight > card.clientHeight,
      };
    });

  test('the start card and the win card show their title when they open, however tall', async ({ page }) => {
    // A window short enough for the start card, over the whole window (D228), to scroll.
    await page.setViewportSize({ width: 1280, height: 380 });
    await page.goto('/#level/the-brooms-in-the-straw');
    await expect(page.locator('.start-card')).toBeVisible();
    await expect.poll(() => top(page, '.start-card')).toEqual({ scroll: 0, titleShown: true, taller: true });
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.locator('#start').click();
    await ready(page);
    await page.locator('#speed').selectOption('4');
    await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-brooms-in-the-straw/solution.py', import.meta.url)), 'utf8'));
    await expect(page.locator('.win-card')).toBeVisible();
    await expect.poll(() => top(page, '.win-card')).toEqual({ scroll: 0, titleShown: true, taller: true });
  });

  test('with the start card open, a button of the page closes it and does what it does; ? opens and closes it', async ({
    page,
  }) => {
    await page.goto('/#level/the-long-corridor');
    const card = page.locator('.start-card');
    await expect(card).toBeVisible();
    await ready(page);
    // Run runs.
    await page.locator('#run').click();
    await expect(card).toBeHidden();
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(30_000) });
    // Hint gives its hint.
    await page.locator('#about').click();
    await expect(card).toBeVisible();
    await page.locator('#hint').click();
    await expect(card).toBeHidden();
    await expect(page.locator('.hints .hint')).toHaveCount(1);
    // The notebook opens. Its button, on the second row (D351), lies under the card in a
    // window this low: its click, which a child gives by Alt+N, still closes the card.
    await page.locator('#about').click();
    await expect(card).toBeVisible();
    await page.locator('#notebook-open').dispatchEvent('click');
    await expect(card).toBeHidden();
    await expect(page.locator('#notebook')).toBeVisible();
    await page.locator('#notebook-open').click();
    // The speed changes.
    await page.locator('#about').click();
    await expect(card).toBeVisible();
    await page.locator('#speed').selectOption('2');
    await expect(card).toBeHidden();
    await expect(page.locator('#speed')).toHaveValue('2');
    // The editor beside the card, under its dim, and the card itself close nothing; ?
    // closes the card it opened.
    await page.locator('#about').click();
    await expect(card).toBeVisible();
    const point = await beside(page, '.cm-content', '.start-card');
    await page.mouse.click(point.x, point.y);
    await card.locator('h3').click();
    await expect(card).toBeVisible();
    await page.locator('#about').click();
    await expect(card).toBeHidden();
  });
});

/** The levels of the course, in its order. */
function courseLevels(): string[] {
  const chapters = fileURLToPath(new URL('../../content/chapters/', import.meta.url));
  return readdirSync(chapters)
    .sort()
    .flatMap((folder) => JSON.parse(readFileSync(`${chapters}${folder}/chapter.json`, 'utf8')).items as string[])
    .filter((item) => item.startsWith('level:'))
    .map((item) => item.slice('level:'.length));
}

test.describe('the start card over the whole window (D228)', () => {
  test.use({ viewport: { width: 1024, height: 700 } });

  for (const locale of ['es-ES', 'en-US']) {
    test(`at 1024 by 700, no start card of the game scrolls, and each lies inside the window (${locale})`, async ({
      browser,
    }) => {
      test.setTimeout(ciTimes(600_000));
      const context = await browser.newContext({ locale, viewport: { width: 1024, height: 700 } });
      const page = await context.newPage();
      await seedWizard(page);
      await page.goto('/#start');
      const levels = courseLevels();
      expect(levels.length).toBeGreaterThan(30);
      const scrolled: string[] = [];
      for (const id of levels) {
        await page.evaluate((hash) => {
          location.hash = hash;
        }, `#level/${id}`);
        const card = page.locator('.start-card');
        // The first level opens the screen's guide before its card (D258).
        await page.locator('#guide-skip, .start-card').first().waitFor({ state: 'visible', timeout: ciTimes(30_000) });
        if (await page.locator('#guide-skip').isVisible()) await skipGuide(page);
        await expect(card).toBeVisible({ timeout: ciTimes(30_000) });
        const measured = await card.evaluate((node) => {
          const box = node.getBoundingClientRect();
          return {
            over: node.scrollHeight - node.clientHeight,
            inside: box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth,
          };
        });
        if (measured.over > 0 || !measured.inside) scrolled.push(`${id}: ${JSON.stringify(measured)}`);
      }
      expect(scrolled).toEqual([]);
      await context.close();
    });
  }

  test('the start card is 760 px wide at most, its text 17 px, over a dim that takes no click', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/#level/the-rings');
    const card = page.locator('.start-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('width', '760px');
    await expect(card).toHaveCSS('font-size', '17px');
    await expect(card.locator('h3')).toHaveCSS('font-size', '21px');
    await expect(page.locator('.card-overlay.over-window')).toHaveCSS('pointer-events', 'none');
    await expect(page.locator('.card-overlay.over-window')).toHaveCSS('position', 'fixed');
    await page.screenshot({ path: 'e2e/shots/cards/start-card-the-rings.png' });
  });

  test("the win cards of the check and of the race do not scroll at 1280 by 800", async ({ page }) => {
    test.setTimeout(ciTimes(300_000));
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const id of ['the-check', 'the-race']) {
      await page.goto(`/?debug#level/${id}`);
      await page.locator('#start').click();
      await ready(page);
      await page.locator('#speed').selectOption('4');
      await run(page, readFileSync(fileURLToPath(new URL(`../../content/levels/${id}/solution.py`, import.meta.url)), 'utf8'));
      const win = page.locator('.win-card');
      await expect(win).toBeVisible({ timeout: ciTimes(120_000) });
      expect(await win.evaluate((node) => node.scrollHeight - node.clientHeight), id).toBeLessThanOrEqual(0);
    }
  });
});
