// The tips' pictures (D221, D239): each tip's thing in the game's own page, in each
// language, cut to 16:9 round what it tells, taken at twice the page's pixels, made 960
// by 540 and written as a webp of less than 90 KB into content/tips/<lang>/<key>.webp. Each is taken where a child of chapter 1,
// who waits for the first scenes, has been: the notebook, its spells and a click in
// the-sealed-door, the level after the first spell's lesson; the lesson in how-much.
// Run on demand, when the page changes:
//
//   KYDUX_TIP_PICTURES=1 npx playwright test e2e/tips-pictures.spec.ts
//
// (docs/dev/dev-environment.md says how).

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { MARTA, type SeededWizard, seedWizard } from './helpers';

const CONTENT = fileURLToPath(new URL('../../content/tips/', import.meta.url));
const PABLO: SeededWizard = { name: 'Pablo', gender: 'boy', look: 'amber' };
/** The picture's size, and the most it may weigh (D239). */
const WIDTH = 960;
const HEIGHT = 540;
const MOST_BYTES = 90_000;

test.skip(!process.env.KYDUX_TIP_PICTURES, 'run on demand, to make the tips’ pictures');
// The page at 1280 by 800, taken at twice its pixels: a crop in the page's pixels has
// twice as many in its picture.
test.use({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });

/** The smallest box of 16:9 round `boxes`, with a margin, kept inside the window. */
function framed(boxes: { x: number; y: number; width: number; height: number }[], margin = 24) {
  const x0 = Math.min(...boxes.map((b) => b.x)) - margin;
  const y0 = Math.min(...boxes.map((b) => b.y)) - margin;
  const x1 = Math.max(...boxes.map((b) => b.x + b.width)) + margin;
  const y1 = Math.max(...boxes.map((b) => b.y + b.height)) + margin;
  let width = x1 - x0;
  let height = y1 - y0;
  if (width / height > WIDTH / HEIGHT) height = (width * HEIGHT) / WIDTH;
  else width = (height * WIDTH) / HEIGHT;
  width = Math.min(width, 1280);
  height = Math.min(height, 800);
  const x = Math.max(0, Math.min(1280 - width, (x0 + x1) / 2 - width / 2));
  const y = Math.max(0, Math.min(800 - height, (y0 + y1) / 2 - height / 2));
  return { x, y, width, height };
}

/** Writes the page round `around` as the tip's picture in `lang`. */
async function picture(page: Page, lang: string, key: string, around: Locator[]): Promise<void> {
  const boxes = [];
  for (const locator of around) {
    const box = await locator.boundingBox();
    if (box) boxes.push(box);
  }
  expect(boxes.length).toBeGreaterThan(0);
  const shot = await page.screenshot({ clip: framed(boxes) });
  // Made small and written as a webp by the page's own canvas, at the best quality
  // that weighs less than MOST_BYTES.
  const webp = await page.evaluate(
    async ({ png, width, height, most }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return '';
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);
      for (let quality = 0.9; quality > 0.3; quality -= 0.05) {
        const url = canvas.toDataURL('image/webp', quality);
        const data = url.slice(url.indexOf(',') + 1);
        if ((data.length * 3) / 4 < most) return data;
      }
      return '';
    },
    { png: shot.toString('base64'), width: WIDTH, height: HEIGHT, most: MOST_BYTES },
  );
  expect(webp, `${lang}/${key} fits ${MOST_BYTES} bytes`).not.toBe('');
  mkdirSync(`${CONTENT}${lang}`, { recursive: true });
  writeFileSync(`${CONTENT}${lang}/${key}.webp`, Buffer.from(webp, 'base64'));
}

async function openLevel(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
}

for (const [lang, locale, wizard] of [
  ['es', 'es-ES', MARTA],
  ['en', 'en-US', PABLO],
] as const) {
  test.describe(`the tips' pictures in ${lang}`, () => {
    test.use({ locale });
    test.beforeEach(({ page }) => seedWizard(page, wizard));

    test('the notebook: its actions, its spells, an action clicked into the program', async ({ page }) => {
      await openLevel(page, 'the-sealed-door');
      await page.locator('#notebook-open').click();
      const notebook = page.locator('#notebook');
      await expect(notebook).toBeVisible();
      await picture(page, lang, 'notebook', [notebook]);
      await page.locator('#notebook-tab-spells').click();
      await expect(notebook).toHaveAttribute('data-tab', 'spells');
      await picture(page, lang, 'spells', [notebook]);
      await page.locator('#notebook-tab-actions').click();
      await page.locator('.cm-content').click();
      await page.keyboard.press('ControlOrMeta+End');
      await notebook.locator('[data-example^="wizard.move_up"]').first().click();
      await picture(page, lang, 'click', [notebook, page.locator('.cm-editor')]);
    });

    test('a name and a dot: what the object has, offered', async ({ page }) => {
      await openLevel(page, 'the-long-corridor');
      await page.locator('.cm-content').click();
      await page.keyboard.press('ControlOrMeta+End');
      await page.keyboard.press('Enter');
      await page.keyboard.type('wizard.');
      const offered = page.locator('.cm-tooltip-autocomplete');
      await expect(offered).toBeVisible();
      await picture(page, lang, 'dot', [page.locator('.cm-editor'), offered]);
    });

    test('a hint, the keys, the timeline and the zoom', async ({ page }) => {
      await openLevel(page, 'the-long-corridor');
      await page.locator('#run').click();
      await expect(page.locator('.outcome')).toBeVisible({ timeout: 60_000 });
      await page.locator('#hint').click();
      await expect(page.locator('.hints .hint')).toHaveCount(1);
      await picture(page, lang, 'hint', [page.locator('#hint'), page.locator('.hints')]);
      // A run with moves, its timeline taken back two ticks.
      await page.locator('.cm-content').click();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.insertText('wizard.move_right(3)\nwizard.move_down(1)\nwizard.move_right(2)\n');
      await page.locator('#run').click();
      const timeline = page.locator('#timeline');
      await expect(timeline).toBeEnabled({ timeout: 60_000 });
      await timeline.evaluate((input) => {
        const range = input as HTMLInputElement;
        range.value = String(Math.max(0, Number(range.max) - 2));
        range.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await picture(page, lang, 'timeline', [timeline, page.locator('.scene-frame')]);
      await page.locator('#zoom-in').click();
      await page.locator('#zoom-in').click();
      const frame = page.locator('.scene-frame');
      const box = await frame.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 260, box.y + box.height / 2 - 120, { steps: 8 });
        await page.mouse.up();
      }
      await expect(page.locator('#find-wizard')).toBeVisible();
      await picture(page, lang, 'zoom', [frame]);
      await page.goto('/#settings');
      await picture(page, lang, 'keys', [page.locator('#settings-keys')]);
    });

    test('a lesson whose example is run on its page, and the map', async ({ page }) => {
      // how-much's third page holds its block, a walk that prints nothing: the page
      // says what the walk did.
      await page.goto('/#lesson/how-much');
      await page.locator('#lesson-next').click();
      await page.locator('#lesson-next').click();
      const run = page.locator('.lesson-run-button').first();
      await run.click();
      const block = page.locator('.lesson-run').first();
      await expect(block.locator('.lesson-said')).toBeVisible({ timeout: 90_000 });
      await picture(page, lang, 'lesson', [block]);
      await page.goto('/#map');
      await expect(page.locator('.map-screen')).toBeVisible();
      // The first chapter's heading and its first stops, large enough to read.
      const chapter = page.locator('.map-chapter').first();
      const stops = chapter.locator('.stop');
      await picture(page, lang, 'map', [chapter.locator('h3, h2').first(), ...[0, 1, 2, 3, 4, 5].map((n) => stops.nth(n))]);
    });
  });
}
