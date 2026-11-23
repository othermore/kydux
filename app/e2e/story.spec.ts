// A story told on its scene (D74): the voice under the scene, a figure's words
// in a bubble over it, each step's action played before its words, Back and
// Next, Enter and Space, and Go on to what comes next, the story read.

import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
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
  // The band says no words of the voice: it shows who speaks, Teku's portrait and name (D194),
  // in the navy he wears beside Marta in teal (D283).
  await expect(page.locator('#story-speaker')).toHaveText('Teku');
  await expect(page.locator('#story-speaker img')).toHaveAttribute('data-portrait', 'teku-b');
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

test.describe('the opening told over the painting of the castle (D251)', () => {
  test.use({ locale: 'es-ES' });

  /** The scene's opacity, as drawn now. */
  const opacity = (page: Page) => page.locator('#scene').evaluate((node) => Number(getComputedStyle(node).opacity));

  test('its first two steps over the still, the scene from the third; Back shows the still again; Skip on the scene', async ({
    page,
  }) => {
    await page.goto('/#story/the-letter');
    const frame = page.locator('.story-frame');
    const still = page.locator('#story-still');
    const zoom = page.locator('.story-frame .zoom-box');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
    for (const step of [1, 2]) {
      await expect(frame).toHaveAttribute('data-still', 'on');
      await expect(still).toBeVisible();
      expect(await opacity(page)).toBe(0);
      await expect(zoom).toBeHidden();
      await page.screenshot({ path: `e2e/shots/story/opening-${step}.png` });
      await storyNext(page);
    }
    // The third step: the scene comes in over the still, which then leaves.
    await expect(frame).toHaveAttribute('data-still', 'off');
    await expect.poll(() => opacity(page)).toBe(1);
    await expect(still).toBeHidden();
    await expect(zoom).toBeVisible();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/shots/story/opening-3.png' });
    // Back: the still again, at once.
    await page.locator('#story-back').click();
    await expect(frame).toHaveAttribute('data-still', 'on');
    await expect(still).toBeVisible();
    expect(await opacity(page)).toBe(0);
    // From the first step, Skip: the last step, on the scene.
    await page.locator('#story-back').click();
    await expect(page.locator('#story-back')).toBeDisabled();
    await page.locator('#story-skip').click();
    await expect(page.locator('#story-go-on')).toBeVisible();
    await expect(frame).toHaveAttribute('data-still', 'off');
    await expect.poll(() => opacity(page)).toBe(1);
  });

  test("a chapter's story shows no still once its scene has come", async ({ page }) => {
    await page.goto('/#story/at-the-gate');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
    await expect(page.locator('.story-frame')).toHaveAttribute('data-still', 'off');
    await expect(page.locator('#story-still')).toBeHidden({ timeout: ciTimes(2_000) });
  });
});

test.describe('the letter held before the castle (D257)', () => {
  /** The painted castle in welcome-castle.webp, in fractions of the painting: the
   * outline round it, from the tip of its tallest tower by the left tower's spire and
   * its foot to the right tower's foot and top. A sheet that covers these corners covers
   * the castle whole. */
  const CASTLE: [number, number][] = [
    [0.678, 0.054],
    [0.66, 0.073],
    [0.535, 0.237],
    [0.515, 0.3],
    [0.515, 0.498],
    [0.849, 0.498],
    [0.849, 0.267],
  ];
  /** On the sheet, in fractions of it: where its drawing starts, and its crease and its
   * fold, between which its words are written (welcome-letter.webp). */
  const SHEET = { drawn: 0.05, crease: 0.674, fold: 0.911 };
  const WORDS = (lang: string) => {
    const story = JSON.parse(readFileSync(new URL(`../../i18n/${lang}.json`, import.meta.url), 'utf8')).story;
    return { title: story.letter_title as string, words: story.letter_words as string };
  };

  /** The letter as the frame shows it: whether the sheet, turned, covers the painted
   * castle where the frame shows it; its corners, its drawing's top and its words' box
   * turned onto the frame; its words' box in the sheet's fractions; and how far the
   * last line runs in the column. */
  const letterPlace = (page: Page) =>
    page.locator('.story-frame').evaluate(
      (frame, { castle, drawn }) => {
        const still = frame.querySelector('#story-still') as HTMLImageElement;
        const letter = frame.querySelector('#story-letter') as HTMLElement;
        const words = letter.querySelector('.story-letter-words') as HTMLElement;
        const text = letter.querySelector('.story-letter-text') as HTMLElement;
        const body = letter.querySelector('.story-letter-body') as HTMLElement;
        const end = letter.querySelector('.story-letter-end') as HTMLElement;
        const [fw, fh] = [frame.clientWidth, frame.clientHeight];
        const scale = Math.max(fw / still.naturalWidth, fh / still.naturalHeight);
        const [pw, ph] = [still.naturalWidth * scale, still.naturalHeight * scale];
        const [ox, oy] = [(fw - pw) / 2, (fh - ph) / 2];
        // The castle's outline on the frame, cut to what the frame shows of it.
        let outline = castle.map(([x, y]) => ({ x: ox + x * pw, y: oy + y * ph }));
        const edges: [(p: { x: number; y: number }) => number, 'x' | 'y', number][] = [
          [(p) => p.x, 'x', 0],
          [(p) => fw - p.x, 'x', fw],
          [(p) => p.y, 'y', 0],
          [(p) => fh - p.y, 'y', fh],
        ];
        for (const [inside, axis, at] of edges) {
          const kept: { x: number; y: number }[] = [];
          outline.forEach((point, index) => {
            const next = outline[(index + 1) % outline.length] as { x: number; y: number };
            if (inside(point) >= 0) kept.push(point);
            if (inside(point) >= 0 !== inside(next) >= 0) {
              const share = inside(point) / (inside(point) - inside(next));
              const crossing = { x: point.x + (next.x - point.x) * share, y: point.y + (next.y - point.y) * share };
              crossing[axis] = at;
              kept.push(crossing);
            }
          });
          outline = kept;
        }
        const [w, h] = [letter.offsetWidth, letter.offsetHeight];
        const centre = { x: letter.offsetLeft + w / 2, y: letter.offsetTop + h / 2 };
        const matrix = new DOMMatrix(getComputedStyle(letter).transform);
        const angle = Math.atan2(matrix.b, matrix.a);
        const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
        // A point of the sheet, from its top left corner, onto the frame; and back.
        const onFrame = (x: number, y: number) => ({
          x: centre.x + (x - w / 2) * cos - (y - h / 2) * sin,
          y: centre.y + (x - w / 2) * sin + (y - h / 2) * cos,
        });
        const onSheet = (x: number, y: number) => ({
          x: w / 2 + (x - centre.x) * cos + (y - centre.y) * sin,
          y: h / 2 - (x - centre.x) * sin + (y - centre.y) * cos,
        });
        const covers =
          outline.length > 0 &&
          outline.every(({ x, y }) => {
            const point = onSheet(x, y);
            return point.x >= 0 && point.x <= w && point.y >= 0 && point.y <= h;
          });
        const left = words.offsetLeft + text.offsetLeft;
        const top = words.offsetTop + text.offsetTop;
        const textBox = { left, top, right: left + text.offsetWidth, bottom: top + text.offsetHeight };
        return {
          frame: { width: fw, height: fh },
          covers,
          corners: [onFrame(0, 0), onFrame(w, 0), onFrame(0, h), onFrame(w, h)],
          drawing: [onFrame(0, drawn * h), onFrame(w, drawn * h)],
          words: [
            onFrame(textBox.left, textBox.top),
            onFrame(textBox.right, textBox.top),
            onFrame(textBox.left, textBox.bottom),
            onFrame(textBox.right, textBox.bottom),
          ],
          inSheet: {
            left: textBox.left / w,
            right: textBox.right / w,
            top: textBox.top / h,
            bottom: textBox.bottom / h,
          },
          whole: text.offsetHeight <= words.clientHeight && text.scrollWidth <= text.clientWidth,
          lastLine: end.offsetLeft / body.clientWidth,
          turned: (angle * 180) / Math.PI,
        };
      },
      { castle: CASTLE, drawn: SHEET.drawn },
    );

  /** The letter is there, all of it in its place (D257). */
  const expectHeld = async (page: Page, lang: string) => {
    const frame = page.locator('.story-frame');
    const letter = page.locator('#story-letter');
    await expect(frame).toHaveAttribute('data-letter', 'front');
    await expect(letter).toBeVisible();
    await expect(letter).toHaveAttribute('aria-hidden', 'false');
    const { title, words } = WORDS(lang);
    await expect(letter.locator('.story-letter-title')).toHaveText(title);
    await expect(letter.locator('.story-letter-body')).toHaveText(words);
    await expect(letter.locator('.story-letter-sheet')).toHaveAttribute('alt', /\S/);
    // Placed once the move is done.
    await page.waitForTimeout(700);
    const place = await letterPlace(page);
    expect(place.covers, 'the sheet covers the painted castle').toBe(true);
    expect(Math.abs(place.turned)).toBeGreaterThanOrEqual(3);
    expect(Math.abs(place.turned)).toBeLessThanOrEqual(4);
    // No edge of the sheet passes the frame but its upper margin, over the drawing.
    for (const corner of place.corners) {
      expect(corner.x).toBeGreaterThanOrEqual(0);
      expect(corner.x).toBeLessThanOrEqual(place.frame.width);
    }
    for (const corner of place.corners.slice(2)) expect(corner.y).toBeLessThanOrEqual(place.frame.height);
    for (const point of place.drawing) expect(point.y).toBeGreaterThanOrEqual(-0.5);
    for (const point of place.words) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(place.frame.width);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(place.frame.height);
    }
    // The words between the crease and the fold, clear of the drawing and the seal, cut
    // nowhere, standing on the fold, the last line run to the column's edge.
    expect(place.inSheet.left).toBeGreaterThanOrEqual(0.05);
    expect(place.inSheet.right).toBeLessThanOrEqual(0.95);
    expect(place.inSheet.top).toBeGreaterThanOrEqual(SHEET.crease);
    expect(place.inSheet.bottom).toBeLessThanOrEqual(SHEET.fold);
    expect(place.inSheet.bottom).toBeGreaterThanOrEqual(SHEET.fold - 0.03);
    expect(place.whole, 'the words are cut nowhere').toBe(true);
    expect(place.lastLine).toBeGreaterThanOrEqual(0.98);
  };

  for (const [lang, locale] of [
    ['es', 'es-ES'],
    ['en', 'en-GB'],
  ] as const) {
    for (const [name, size] of [
      ['wide', { width: 1280, height: 800 }],
      ['narrow', { width: 900, height: 700 }],
    ] as const) {
      test.describe(`${lang}, ${name}`, () => {
        test.use({ locale, viewport: size });

        test('before the castle at the first step; lowered at Next; raised at Back; hidden on the scene', async ({
          page,
        }) => {
          await page.goto('/#story/the-letter');
          await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
          const frame = page.locator('.story-frame');
          const letter = page.locator('#story-letter');
          await expectHeld(page, lang);
          await page.screenshot({ path: `e2e/shots/story/letter-${lang}-${name}.png` });
          // Next: lowered out over the frame's lower edge, the painting alone.
          await storyNext(page);
          await expect(frame).toHaveAttribute('data-letter', 'aside');
          await expect(letter).toHaveAttribute('aria-hidden', 'true');
          await expect(letter).toBeHidden({ timeout: ciTimes(2_000) });
          await expect(frame).toHaveAttribute('data-still', 'on');
          await expect(page.locator('#story-still')).toBeVisible();
          // Back: raised again.
          await page.locator('#story-back').click();
          await expectHeld(page, lang);
          // On to the scene: the letter is hidden.
          await storyNext(page, 2);
          await expect(frame).toHaveAttribute('data-still', 'off');
          await expect(frame).toHaveAttribute('data-letter', 'aside');
          await expect(letter).toBeHidden();
        });
      });
    }
  }

  test.describe('in Spanish', () => {
    test.use({ locale: 'es-ES' });

    test('Skip from the first step lowers it under the scene', async ({ page }) => {
      await page.goto('/#story/the-letter');
      await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
      await expect(page.locator('.story-frame')).toHaveAttribute('data-letter', 'front');
      await page.locator('#story-skip').click();
      await expect(page.locator('#story-go-on')).toBeVisible();
      await expect(page.locator('.story-frame')).toHaveAttribute('data-letter', 'aside');
      await expect(page.locator('#story-letter')).toBeHidden({ timeout: ciTimes(2_000) });
    });

    test('with motion reduced it is there or gone at once', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/#story/the-letter');
      await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
      const letter = page.locator('#story-letter');
      await expect(letter).toBeVisible();
      expect(await letter.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
      await storyNext(page);
      expect(await letter.evaluate((node) => (node as HTMLElement).hidden)).toBe(true);
      await page.locator('#story-back').click();
      await expect(page.locator('.story-frame')).toHaveAttribute('data-letter', 'front');
      expect(await letter.evaluate((node) => (node as HTMLElement).hidden)).toBe(false);
      expect(await letter.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s');
    });

    test("a chapter's story has no letter", async ({ page }) => {
      await page.goto('/#story/at-the-gate');
      await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
      await expect(page.locator('#story-letter')).toHaveCount(0);
      await expect(page.locator('.story-frame')).not.toHaveAttribute('data-letter', /.*/);
    });
  });
});

test('Rinlo stands, crosses the room leaving the pieces behind him, and sits again (D279)', async ({ page }) => {
  test.setTimeout(ciTimes(180_000));
  await page.goto('/#story/the-voice-in-the-tunnel');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await expect(scene).toHaveAttribute('data-seated', 'rinlo');
  // At his «No. Vete, vete de aquí.» he stands; no piece is seen yet.
  await storyNext(page, 5);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).not.toHaveAttribute('data-seated', /rinlo/);
  await expect(scene).toHaveAttribute('data-actors', /rinlo:8,3,/);
  await expect(scene).not.toHaveAttribute('data-found', /thread/);
  // At the noises, he crosses to the room's far side and back, the pieces behind him.
  await scene.evaluate((node) => {
    const seen: string[] = [];
    (window as unknown as { rinlo: string[] }).rinlo = seen;
    new MutationObserver(() => seen.push(node.getAttribute('data-actors') ?? '')).observe(node, {
      attributes: true,
      attributeFilter: ['data-actors'],
    });
  });
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  const walked = await page.evaluate(() => (window as unknown as { rinlo: string[] }).rinlo);
  expect(walked.some((actors) => /rinlo:12,3,/.test(actors))).toBe(true);
  await expect(scene).toHaveAttribute('data-actors', /rinlo:8,3,right/);
  await expect(scene).toHaveAttribute('data-seated', 'rinlo');
  await expect(scene).toHaveAttribute('data-found', 'thread_1,thread_2,thread_3');
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/rinlo-and-the-pieces.png' });
  // Back at his words, the pieces are gone again and he stands.
  await page.locator('#story-back').click();
  await expect(scene).not.toHaveAttribute('data-found', /thread/);
});

test('Rinlo opens the side door and goes down the back stairs, then comes out under the arch (D289)', async ({ page }) => {
  test.setTimeout(ciTimes(180_000));
  await page.goto('/#story/what-the-familiar-brought');
  const scene = page.locator('#scene');
  await scene.waitFor({ timeout: ciTimes(90_000) });
  // Every place Rinlo is drawn on while the first step plays.
  await scene.evaluate((node) => {
    const seen: string[] = [];
    (window as unknown as { rinlo: string[] }).rinlo = seen;
    new MutationObserver(() => seen.push(node.getAttribute('data-actors') ?? '')).observe(node, {
      attributes: true,
      attributeFilter: ['data-actors'],
    });
  });
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  // The first step: the door open, its leaf drawn with its own picture, and Rinlo gone
  // down the stairs, after the door and the landing.
  await expect(scene).toHaveAttribute('data-door-looks', /room_door:art-room_door-open/);
  await expect(scene).not.toHaveAttribute('data-actors', /rinlo/);
  const walked = await page.evaluate(() => (window as unknown as { rinlo: string[] }).rinlo);
  for (const cell of ['6,3', '5,3', '2,3', '2,8']) {
    expect(walked.some((actors) => actors.includes(`rinlo:${cell},`))).toBe(true);
  }
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/rinlo-down-the-back-stairs.png' });
  // The second: under the arch, by the children, who turn to him.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).toHaveAttribute('data-actors', /rinlo:5,13,/);
  await expect(scene).toHaveAttribute('data-wizard-facing', 'left');
  await expect(scene).toHaveAttribute('data-actors', /friend:\d+,\d+,left/);
  await expect(scene).toHaveAttribute('data-actors', /mate:\d+,\d+,left/);
});

test("the hall goes dark while the children tell Orla, and comes back in the evening (D280)", async ({ page }) => {
  test.setTimeout(ciTimes(180_000));
  await page.goto('/#story/what-the-familiar-brought');
  const scene = page.locator('#scene');
  const frame = page.locator('.story-frame');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  // Step 12, the friend's «We have something to tell you…», in the hall by day.
  await storyNext(page, 11);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).not.toHaveAttribute('data-hour', 'sunset');
  // Step 13: the scene goes dark, and Orla's words are said once it is back, at sunset.
  await page.locator('#story-next').click();
  await expect(frame).toHaveAttribute('data-passing', 'dark');
  await expect(scene).not.toHaveAttribute('data-speaker', 'orla');
  await expect(page.locator('#story-speaker')).toHaveCount(0);
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-hall-dark.png' });
  await expect(frame).not.toHaveAttribute('data-passing', /./, { timeout: ciTimes(15_000) });
  await expect(scene).toHaveAttribute('data-hour', 'sunset');
  await expect(scene).toHaveAttribute('data-speaker', 'orla', { timeout: ciTimes(15_000) });
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-hall-in-the-evening.png' });
  // Back to step 12: the day's hall at once, with no dark.
  await page.locator('#story-back').click();
  await expect(frame).not.toHaveAttribute('data-passing', /./);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).not.toHaveAttribute('data-hour', 'sunset');
});
