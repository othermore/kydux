// A story told on its scene (D74): the voice under the scene, a figure's words
// in a bubble over it, each step's action played before its words, Back and
// Next, Enter and Space, and Go on to what comes next, the story read.

import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { finishStory, seedWizard, storyNext, storySaid } from './helpers';
import { ciTimes } from './support';

test.beforeEach(async ({ page }) => {
  await seedWizard(page);
});

/** A frame of the scene as a test records it (D319, D322): each figure drawn with its box
 * in cells and its alpha, what the camera shows, and whether it travels. */
interface Frame {
  figures: string;
  world: string;
  travel: boolean;
}

/** Every frame of the scene from now on, and every value data-actors takes. */
async function recordFrames(page: Page): Promise<void> {
  await page.locator('#scene').evaluate((node) => {
    const frames: Frame[] = [];
    const actors: string[] = [node.dataset.actors ?? ''];
    const kept = window as unknown as { kyduxFrames: Frame[]; kyduxActors: string[]; kyduxLook?: number };
    kept.kyduxFrames = frames;
    kept.kyduxActors = actors;
    // Each value it took, the one before each change: changes made in one task are seen
    // together, at its end.
    new MutationObserver((records) => {
      for (const record of records) actors.push(record.oldValue ?? '');
    }).observe(node, { attributes: true, attributeFilter: ['data-actors'], attributeOldValue: true });
    const look = () => {
      kept.kyduxFrames.push({
        figures: node.dataset.figures ?? '',
        world: node.dataset.world ?? '',
        travel: node.dataset.cameraTravel === 'true',
      });
      kept.kyduxLook = requestAnimationFrame(look);
    };
    if (kept.kyduxLook === undefined) look();
  });
}

async function framesRecorded(page: Page): Promise<{ frames: Frame[]; actors: string[] }> {
  return page.evaluate(() => {
    const kept = window as unknown as { kyduxFrames: Frame[]; kyduxActors: string[] };
    return { frames: kept.kyduxFrames, actors: [...kept.kyduxActors, document.getElementById('scene')?.dataset.actors ?? ''] };
  });
}

/** A figure in a frame: its box in cells and its alpha, or null where it is not drawn. */
function figureIn(frame: Frame, id: string): { box: number[]; alpha: number } | null {
  const part = frame.figures.split(';').find((one) => one.startsWith(`${id}:`));
  if (!part) return null;
  const [, box = '', alpha = '0'] = part.split(':');
  return { box: box.split(',').map(Number), alpha: Number(alpha) };
}

/** Whether any of a box lies inside what the camera shows. */
function inView(box: number[], world: string): boolean {
  const [left = 0, top = 0, width = 0, height = 0] = world.split(',').map(Number);
  const [x0 = 0, y0 = 0, x1 = 0, y1 = 0] = box;
  return x1 > left && x0 < left + width && y1 > top && y0 < top + height;
}

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

  // The wizard calls out; the friend comes up the path from below the picture, then walks
  // up to the wizard and speaks.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-speaker', 'wizard');
  await expect(scene).toHaveAttribute('data-bubble', /Is anyone there\?/);
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,22,up');
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

  // Back shows the step before as it was: the friend a cell lower on the path.
  await page.locator('#story-back').click();
  await expect(scene).toHaveAttribute('data-actors', 'friend:8,22,up');
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

test('Rinlo opens the side door and goes down the back stairs and through the arch, walking (D289, D307)', async ({ page }) => {
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
  // The first step frames the whole scene: the room, its side door, the landing, the
  // stairs and the arch.
  await expect(scene).toHaveAttribute('data-camera-fit', '0,0,19,14');
  // The door open, its leaf drawn with its own picture, and Rinlo down the stairs and
  // through the arch, where he waits, walking all the way (D307).
  await expect(scene).toHaveAttribute('data-door-looks', /room_door:art-room_door-open/);
  await expect(scene).toHaveAttribute('data-actors', /(^|;)rinlo:2,12,/);
  const walked = await page.evaluate(() => (window as unknown as { rinlo: string[] }).rinlo);
  for (const cell of ['6,3', '5,3', '2,3', '2,8', '2,10', '2,12']) {
    expect(walked.some((actors) => actors.includes(`rinlo:${cell},`))).toBe(true);
  }
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/rinlo-down-the-back-stairs.png' });
  // The second frames the corridor: from under the arch to the children, who turn to him.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).toHaveAttribute('data-camera-fit', '0,5,19,14');
  await expect(scene).toHaveAttribute('data-actors', /rinlo:5,13,/);
  await expect(scene).toHaveAttribute('data-wizard-facing', 'left');
  await expect(scene).toHaveAttribute('data-actors', /friend:\d+,\d+,left/);
  await expect(scene).toHaveAttribute('data-actors', /mate:\d+,\d+,left/);
});

test("the camera travels between the passage's two halves, and the bubble waits for it to arrive (D321)", async ({ page }) => {
  test.setTimeout(ciTimes(180_000));
  await page.goto('/#story/the-voice-in-the-tunnel');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await expect(scene).toHaveAttribute('data-camera-fit', '0,5,19,14');
  // Each frame, whether the camera travels and whether a bubble shows, from before the press.
  const watch = () =>
    scene.evaluate((node) => {
      const seen: { travel: boolean; bubble: boolean }[] = [];
      (window as unknown as { framesSeen: typeof seen }).framesSeen = seen;
      const look = () => {
        seen.push({ travel: node.dataset.cameraTravel === 'true', bubble: node.dataset.bubble !== undefined });
        requestAnimationFrame(look);
      };
      look();
    });
  const framesSeen = () =>
    page.evaluate(() => (window as unknown as { framesSeen: { travel: boolean; bubble: boolean }[] }).framesSeen);
  await watch();
  // Step 2, the cold voice from the room: the framing is said at once, and the camera goes
  // up to the room's half of the passage before its words come up.
  await page.locator('#story-next').click();
  await expect(scene).toHaveAttribute('data-camera-fit', '0,0,19,9');
  await expect(scene).toHaveAttribute('data-camera-travel', 'true');
  await expect(scene).toHaveAttribute('data-speaker', 'cold_voice', { timeout: ciTimes(15_000) });
  await expect(scene).not.toHaveAttribute('data-camera-travel', /./);
  const travelled = await framesSeen();
  expect(travelled.some((frame) => frame.travel)).toBe(true);
  expect(travelled.some((frame) => frame.travel && frame.bubble)).toBe(false);
  const lastTravel = travelled.map((frame) => frame.travel).lastIndexOf(true);
  expect(travelled.findIndex((frame) => frame.bubble)).toBeGreaterThan(lastTravel);
  // Back to step 1: framed at once, with no travel.
  await watch();
  await page.locator('#story-back').click();
  await expect(scene).toHaveAttribute('data-camera-fit', '0,5,19,14');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await page.waitForTimeout(300);
  expect((await framesSeen()).some((frame) => frame.travel)).toBe(false);
});

test('Orla goes down the stairs and out by the foot of the picture, solid to the last, the camera with her (D319, D321)', async ({
  page,
}) => {
  test.setTimeout(ciTimes(180_000));
  await page.goto('/#story/the-trail');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await storyNext(page, 4);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).toHaveAttribute('data-camera-fit', '4,2,15,11');
  await recordFrames(page);
  // Step 6: the camera goes down to the stairs' foot as she goes.
  await page.locator('#story-next').click();
  await expect(scene).toHaveAttribute('data-camera-fit', '4,4,15,14');
  await page.waitForFunction(
    () => /orla:8,14,/.test(document.getElementById('scene')?.dataset.actors ?? ''),
    null,
    { timeout: ciTimes(30_000), polling: 'raf' },
  );
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-trail-6-stairs.png' });
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  const { frames, actors } = await framesRecorded(page);
  expect(frames.some((frame) => frame.travel)).toBe(true);
  await expect(scene).not.toHaveAttribute('data-camera-travel', /./);
  // Through the door, over the landing and down the painted steps.
  for (const cell of ['9,11', '9,12', '9,13', '8,13', '8,14']) {
    expect(actors.some((all) => all.includes(`orla:${cell},`)), cell).toBe(true);
  }
  // Solid whenever any of her is in sight, never faded (D319); gone at the end.
  for (const frame of frames) {
    const orla = figureIn(frame, 'orla');
    if (orla && inView(orla.box, frame.world)) expect(orla.alpha).toBe(1);
  }
  expect(frames.some((frame) => (figureIn(frame, 'orla')?.box[1] ?? 0) > 14)).toBe(true);
  await expect(scene).not.toHaveAttribute('data-actors', /orla/);
  await expect(scene).not.toHaveAttribute('data-figures', /orla/);
  // The step played again finds her at her place by the circle, in sight.
  await recordFrames(page);
  await page.locator('#story-again').click();
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  expect((await framesRecorded(page)).actors.some((all) => all.includes('orla:11,4,'))).toBe(true);
  // Step 7: the camera comes back up to the hall.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-camera-fit', '4,2,15,11');
});

test('in The tower Zarek goes into the middle archway and out of sight behind the wall, never translucent (D319)', async ({
  page,
}) => {
  test.setTimeout(ciTimes(240_000));
  await page.goto('/#story/the-tower');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await storyNext(page, 6);
  await expect(scene).toHaveAttribute('data-story-part', '1', { timeout: ciTimes(60_000) });
  await storyNext(page, 6);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
  await recordFrames(page);
  await page.locator('#story-next').click();
  await expect(page.locator('#story-step')).toHaveText(/^14 /);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
  const { frames, actors } = await framesRecorded(page);
  for (const cell of ['20,5', '20,4', '20,3']) expect(actors.some((all) => all.includes(`zarek:${cell},`)), cell).toBe(true);
  for (const frame of frames) {
    const zarek = figureIn(frame, 'zarek');
    if (zarek) expect(zarek.alpha).toBe(1);
  }
  await expect(scene).not.toHaveAttribute('data-figures', /zarek/);
});

for (const [name, size] of [
  ['wide', { width: 1600, height: 700 }],
  ['narrow', { width: 700, height: 1000 }],
] as const) {
  test(`in The tower, in a ${name} window, the three are out of what the camera shows once past the edge (D319)`, async ({
    page,
  }) => {
    test.setTimeout(ciTimes(180_000));
    await page.setViewportSize(size);
    await page.goto('/#story/the-tower');
    const scene = page.locator('#scene');
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
    await storyNext(page, 4);
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
    await recordFrames(page);
    await page.locator('#story-next').click();
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
    const { frames } = await framesRecorded(page);
    let past = 0;
    for (const frame of frames) {
      for (const id of ['friend', 'mate', 'wizard']) {
        const figure = figureIn(frame, id);
        if (!figure || (figure.box[2] ?? 0) > 0) continue;
        past += 1;
        expect(inView(figure.box, frame.world), `${id} ${frame.world}`).toBe(false);
      }
      expect(Number(frame.world.split(',')[0])).toBeGreaterThanOrEqual(-0.01);
    }
    expect(past).toBeGreaterThan(0);
    await expect(scene).not.toHaveAttribute('data-figures', /(^|;)(friend|mate|wizard):/);
  });
}

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
  // What the scene frames as it starts to come back out of the dark.
  await frame.evaluate((node) => {
    new MutationObserver(() => {
      if ((node as HTMLElement).dataset.passing !== 'back') return;
      (window as unknown as { framedBack?: string }).framedBack =
        document.getElementById('scene')?.dataset.cameraFit ?? 'none';
    }).observe(node, { attributes: true, attributeFilter: ['data-passing'] });
  });
  // Step 13: the scene goes dark, and Orla's words are said once it is back, at sunset.
  await page.locator('#story-next').click();
  await expect(frame).toHaveAttribute('data-passing', 'dark');
  // Time passes by itself: Next waits, disabled, and its keys do nothing (D317).
  await expect(page.locator('#story-next')).toBeDisabled();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(frame).toHaveAttribute('data-passing', 'dark');
  await expect(page.locator('#story-step')).toHaveText(/13/);
  await expect(scene).not.toHaveAttribute('data-speaker', 'orla');
  await expect(page.locator('#story-speaker')).toHaveCount(0);
  // The words on the dark, in a box with no tail (D309).
  await expect(page.locator('#story-dark-words')).toHaveText('It takes you a good while to tell the whole story.');
  await expect(page.locator('#story-dark-words')).toBeVisible();
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-hall-dark.png' });
  await expect(frame).not.toHaveAttribute('data-passing', /./, { timeout: ciTimes(15_000) });
  // The hall comes out of the dark framed as Orla's step frames it (D318), and Next
  // wakes with the keyboard.
  expect(await page.evaluate(() => (window as unknown as { framedBack?: string }).framedBack)).toBe('4,2,15,11');
  await expect(scene).toHaveAttribute('data-camera-fit', '4,2,15,11');
  await expect(page.locator('#story-next')).toBeEnabled();
  await expect(page.locator('#story-next')).toBeFocused();
  await expect(scene).toHaveAttribute('data-hour', 'sunset');
  await expect(scene).toHaveAttribute('data-speaker', 'orla', { timeout: ciTimes(15_000) });
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-hall-in-the-evening.png' });
  // Back to step 12: the day's hall at once, with no dark.
  await page.locator('#story-back').click();
  await expect(frame).not.toHaveAttribute('data-passing', /./);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await expect(scene).not.toHaveAttribute('data-hour', 'sunset');
});

test("a story draws the game's own familiar, a white crow, and the mate's copy of it (D305)", async ({ page }) => {
  const crow = 'class Crow(Familiar):\n    def __init__(self, name, color):\n        self.name = name\n        self.color = color\n';
  const game = {
    version: 1,
    wizard: { name: 'Marta', gender: 'girl', look: 'teal' },
    familiar: { living: { kind: 'Crow', name: 'Nabi', color: 'white', source: crow } },
  };
  await page.addInitScript((kept) => {
    if (!localStorage.getItem('kydux.games')) localStorage.setItem('kydux.progress', kept);
    localStorage.setItem('kydux.tips-off', '1');
  }, JSON.stringify(game));
  await page.goto('/#story/the-trail');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-creatures', /(^|;)familiar:[^:;]*:Crow:white:/, { timeout: ciTimes(90_000) });
  await expect(scene).not.toHaveAttribute('data-creatures', /(^|;)familiar:[^:;]*:Fox:/);
  // The room-mate's copy is the child's kind in another of its colours (D268).
  await expect(scene).toHaveAttribute('data-creatures', /(^|;)mate_familiar:[^:;]*:Crow:black:/);
});

test("the trail's step 8: the friend's bubble has its tail over her head (D306)", async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#story/the-trail');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await storyNext(page, 7);
  await expect(scene).toHaveAttribute('data-speaker', 'friend', { timeout: ciTimes(30_000) });
  await expect(scene).toHaveAttribute('data-tail', /./);
  const tail = Number(await scene.getAttribute('data-tail'));
  expect(Math.abs(tail)).toBeLessThanOrEqual(0.25);
});

test('the wizard faces Orla from the first frame of the hall parts and of The end of the year (D308)', async ({
  page,
}) => {
  test.setTimeout(ciTimes(240_000));
  await seedWizard(page);
  // Every way the wizard is drawn facing, from the moment it is asked.
  const watch = () =>
    page.locator('#scene').evaluate((node) => {
      const seen: string[] = [];
      (window as unknown as { facings: string[] }).facings = seen;
      new MutationObserver(() => {
        const facing = node.getAttribute('data-wizard-facing');
        if (facing && facing !== seen[seen.length - 1]) seen.push(facing);
      }).observe(node, { attributes: true, attributeFilter: ['data-wizard-facing'] });
    });
  const facings = () => page.evaluate(() => (window as unknown as { facings: string[] }).facings);
  await page.goto('/#story/what-the-familiar-brought');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  // Step 11 opens the hall: the wizard faces up as it is drawn, and turns no more.
  await storyNext(page, 9);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await page.locator('#story-next').click();
  await expect(scene).toHaveAttribute('data-wizard-facing', 'up', { timeout: ciTimes(30_000) });
  await watch();
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  expect(await facings()).not.toContain('down');
  await page.goto('/#story/the-end-of-the-year');
  await expect(scene).toHaveAttribute('data-wizard-facing', 'up', { timeout: ciTimes(90_000) });
  await watch();
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  expect(await facings()).not.toContain('down');
});

test("in The tower the three leave the dormitory by the left, and go into the arch's dark (D310, D311)", async ({
  page,
}) => {
  test.setTimeout(ciTimes(240_000));
  await seedWizard(page);
  await page.goto('/#story/the-tower');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await expect(scene).not.toHaveAttribute('data-actors', /classmate/);
  // Step 6: the three out of the door and gone by the left.
  await storyNext(page, 5);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
  await expect(scene).not.toHaveAttribute('data-actors', /(^|;)(friend|mate):/);
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-tower-6.png' });
  // Step 17: none stays in the arch.
  await storyNext(page, 11);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
  await expect(scene).not.toHaveAttribute('data-actors', /(^|;)(friend|mate):/);
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/the-tower-17.png' });
});


test("in The trail the familiar walks up into the hall's tunnel and comes out of it (D307)", async ({ page }) => {
  test.setTimeout(ciTimes(240_000));
  await seedWizard(page);
  await page.goto('/#story/the-trail');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  // Step 9: up the column to the tunnel's far cell, behind its wall, never faded.
  await storyNext(page, 8);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
  await expect(scene).toHaveAttribute('data-actors', /(^|;)familiar:14,1,up/);
  // Step 10: down out of it and back to the children.
  await storyNext(page);
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(60_000) });
  await expect(scene).toHaveAttribute('data-actors', /(^|;)familiar:11,10,/);
});

test('a story with parts is read to its end with no page error, the zoom box asking no scene gone (2.12)', async ({
  page,
}) => {
  test.setTimeout(ciTimes(300_000));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#story/what-the-familiar-brought');
  await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await finishStory(page);
  // Go on opens the next story, on its own scene.
  await expect(page.locator('#story-title')).toHaveText('The end of the year');
  await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  expect(errors).toEqual([]);
});

test.describe('the ending told to The truth, a movement at each turn of the story (D313, D314, D316)', () => {
  const root = (page: Page) => page.locator('html');

  test("from step 11 of What the familiar brought on into The end of the year with no other theme between, and the familiar's back at its dinner", async ({
    page,
  }) => {
    test.setTimeout(ciTimes(300_000));
    await page.goto('/#story/what-the-familiar-brought');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-familiar');
    // Step 11, the four going up to the tower: The truth; back at 10, the familiar's.
    await storyNext(page, 10);
    await expect(page.locator('#story-step')).toHaveText(/^11 /);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-truth');
    await expect(root(page)).toHaveAttribute('data-music-movement', 'alone');
    await page.locator('#story-back').click();
    await expect(page.locator('#story-step')).toHaveText(/^10 /);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-familiar');
    await expect(root(page)).not.toHaveAttribute('data-music-movement');
    await storyNext(page);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-truth');
    // Every value the theme is given from here to the next story's first step.
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { themesSeen: string[] }).themesSeen = seen;
      const html = document.documentElement;
      new MutationObserver(() => seen.push(html.dataset.musicTheme ?? '')).observe(html, {
        attributes: true,
        attributeFilter: ['data-music-theme'],
      });
    });
    await finishStory(page);
    await expect(page.locator('#story-title')).toHaveText('The end of the year');
    await expect(page.locator('#story-step')).toHaveText(/^1 /);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-truth');
    await expect(root(page)).toHaveAttribute('data-music-movement', 'name');
    const seen = await page.evaluate(() => (window as unknown as { themesSeen: string[] }).themesSeen);
    expect(seen.filter((theme) => theme !== 'the-truth')).toEqual([]);
    await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
    // The theme's movements at the story's turns (D316): the revelation at step 8, the
    // silence at 24, the major statement at 26; a step back, the movement before.
    await storyNext(page, 7);
    await expect(page.locator('#story-step')).toHaveText(/^8 /);
    await expect(root(page)).toHaveAttribute('data-music-movement', 'revelation');
    await storyNext(page, 16);
    await expect(page.locator('#story-step')).toHaveText(/^24 /);
    await expect(root(page)).toHaveAttribute('data-music-movement', 'silence');
    await storyNext(page, 2);
    await expect(page.locator('#story-step')).toHaveText(/^26 /);
    await expect(root(page)).toHaveAttribute('data-music-movement', 'love');
    await page.locator('#story-back').click();
    await expect(page.locator('#story-step')).toHaveText(/^25 /);
    await expect(root(page)).toHaveAttribute('data-music-movement', 'silence');
    // Step 32, the dinner over the castle's painting: the familiar's theme; back, The truth.
    await storyNext(page, 7);
    await expect(page.locator('#story-step')).toHaveText(/^32 /);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-familiar');
    await expect(root(page)).not.toHaveAttribute('data-music-movement');
    await page.locator('#story-back').click();
    await expect(page.locator('#story-step')).toHaveText(/^31 /);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-truth');
    await expect(root(page)).toHaveAttribute('data-music-movement', 'love');
  });

  test("a visit that starts at The end of the year opens to The truth, and the map after it plays the familiar's", async ({
    page,
  }) => {
    test.setTimeout(ciTimes(180_000));
    await page.goto('/#story/the-end-of-the-year');
    await expect(page.locator('#story-step')).toHaveText(/^1 /, { timeout: ciTimes(90_000) });
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-truth');
    await page.locator('#story-skip').click();
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-familiar');
    await page.locator('#story-go-on').click();
    await expect(page).toHaveURL(/#map$/);
    await expect(root(page)).toHaveAttribute('data-music-theme', 'the-familiar');
  });
});
