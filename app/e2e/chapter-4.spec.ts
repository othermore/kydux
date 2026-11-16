// Chapter 4 as the child plays it: every level won by its solution, in Spanish for a
// girl and in English for a boy, in every way; the broom at the wizard's feet and the
// brooms hung on their pegs (D195, D197); the brooms counted from the straw and from the
// wall, the straw's unseen until found (D184, D196); a loop needed where the ways differ
// (D51); the shed framed whole as the story walks in, the finish told wide (D199);
// Python's own words in the notebook as the lessons teach them (D60); the knot's error
// and its fix (D183); water refused to a walk and crossed by a flight three times as
// fast, with the wind's sound (D185, D186); the loop round the rings flown into the
// trees and the function that wins (D190); drevo cast in the air lands, or is refused
// over the water, the wizard left flying (D215); the race by Ilda's count, her band at
// the scene's foot while she reads and when she judges, and its card (D189, D234); each story told to its end, the first on two scenes; the map's stops in
// order; the shed's levels framed whole, their pegs clear of the page's panels (D201);
// the shed's lying brooms in sight on the boards and hidden under the straw (D202); the
// wall walked by the distance from the row's end (D206); the straw's negative move
// refused (D212).
// Screenshots of every stop go to e2e/shots/chapter-4/, which git ignores, for the owner.

import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { gotoTesting, MARTA, type SeededWizard, seedWizard, storyNext } from './helpers';
import { ciTimes } from './support';

const SHOTS = fileURLToPath(new URL('./shots/chapter-4/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const PABLO: SeededWizard = { name: 'Pablo', gender: 'boy', look: 'amber' };

const ITEMS: string[] = JSON.parse(readFileSync(`${CONTENT}chapters/04-the-broom/chapter.json`, 'utf8')).items;
const LEVELS = ITEMS.filter((item) => item.startsWith('level:')).map((item) => item.slice('level:'.length));
const STORIES = ITEMS.filter((item) => item.startsWith('story:')).map((item) => item.slice('story:'.length));
const solution = (id: string) => readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8');
const wrong = (id: string, name: string) => readFileSync(`${CONTENT}levels/${id}/wrong/${name}.py`, 'utf8');
type Thing = { id: string; kind?: string; hung?: boolean; hidden?: boolean; gone?: boolean };

/** A level's things in a way, from its level.json. */
function thingsOf(id: string, way: string): Thing[] {
  const spec = JSON.parse(readFileSync(`${CONTENT}levels/${id}/level.json`, 'utf8'));
  const things = new Map<string, Thing>((spec.things as Thing[]).map((thing) => [thing.id, { ...thing }]));
  const changes: Thing[] = (spec.ways ?? []).find((one: { id: string }) => one.id === way)?.things ?? [];
  for (const change of changes) {
    if (change.gone) things.delete(change.id);
    else things.set(change.id, { ...things.get(change.id), ...change } as Thing);
  }
  return [...things.values()];
}

/** A level's hung brooms in a way, by id. */
const hungOf = (id: string, way: string): string[] =>
  thingsOf(id, way)
    .filter((thing) => thing.kind === 'broom' && thing.hung)
    .map((thing) => thing.id);

/** A level's lying brooms in a way, from its level.json: those in sight and those hidden
 * until a program finds them (D184, D202). */
function lyingOf(id: string, way: string): { seen: string[]; hidden: string[] } {
  const lying = thingsOf(id, way).filter((thing) => thing.kind === 'broom' && !thing.hung);
  return {
    seen: lying.filter((thing) => !thing.hidden).map((thing) => thing.id),
    hidden: lying.filter((thing) => thing.hidden).map((thing) => thing.id),
  };
}

/** The lying brooms the scene draws now. */
async function lyingDrawn(page: Page): Promise<string[]> {
  const drawn = (await scene(page).getAttribute('data-sprite-things')) ?? '';
  return drawn
    .split(';')
    .filter((entry) => entry.includes(':broom:'))
    .map((entry) => entry.split(':')[0] as string);
}

const waysOf = (id: string): string[] =>
  (JSON.parse(readFileSync(`${CONTENT}levels/${id}/level.json`, 'utf8')).ways ?? []).map((way: { id: string }) => way.id);

test.use({ viewport: { width: 1280, height: 800 } });

const scene = (page: Page) => page.locator('#scene');

/** A level opened and ready to run, at a speed. */
async function open(page: Page, id: string, speed = '4'): Promise<void> {
  // A level with ways is opened under ?debug, whose select alone shows them (D204).
  if (waysOf(id).length > 0) await gotoTesting(page, `#level/${id}`);
  else await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption(speed);
}

/** The child's code typed and run. */
async function start(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
}

/** The child's code typed and run; the card's words once it ends. */
async function run(page: Page, code: string): Promise<string> {
  await start(page, code);
  await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
  return page.locator('.outcome-text').innerText();
}

for (const [wizard, locale, won] of [
  [MARTA, 'es-ES', /^¡Lo has conseguido/],
  [PABLO, 'en-US', /^You did it/],
] as const) {
  test.describe(`chapter 4 for ${wizard.name}`, () => {
    test.use({ locale });
    test.beforeEach(({ page }) => seedWizard(page, wizard));

    for (const id of LEVELS) {
      test(`${id} is won by its solution, in every way`, async ({ page }) => {
        await open(page, id);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-start.png` });
        expect(await run(page, solution(id))).toMatch(won);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-won.png` });
        for (const way of waysOf(id)) {
          await page.locator('#way').selectOption(way, { force: true });
          await expect(page.locator('.outcome-text')).toHaveText(won, { timeout: ciTimes(30_000) });
        }
      });
    }
  });
}

/** A cell's box on the page, from what the camera shows (data-world) and the canvas. */
async function cellOnPage(page: Page, [x, y]: [number, number]): Promise<{ x: number; y: number; width: number; height: number }> {
  const canvas = await page.locator('#scene canvas').boundingBox();
  const world = (await scene(page).getAttribute('data-world'))?.split(',').map(Number) ?? [];
  const [left = 0, top = 0, wide = 1, high = 1] = world;
  if (!canvas) throw new Error('no canvas');
  const across = canvas.width / wide;
  const down = canvas.height / high;
  return { x: canvas.x + (x - left) * across, y: canvas.y + (y - top) * down, width: across, height: down };
}

type PageBox = { x: number; y: number; width: number; height: number };
const meets = (one: PageBox, other: PageBox) =>
  one.x < other.x + other.width && other.x < one.x + one.width && one.y < other.y + other.height && other.y < one.y + one.height;
const within = (one: PageBox, other: PageBox) =>
  one.x >= other.x - 0.5 && one.y >= other.y - 0.5 && one.x + one.width <= other.x + other.width + 0.5 && one.y + one.height <= other.y + other.height + 0.5;

test.describe('the shed', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  for (const id of ['the-broom-at-your-feet', 'the-shed', 'the-brooms-on-the-wall', 'the-check', 'the-nearest-broom', 'the-brooms-in-the-straw']) {
    test(`${id} opens on the shed whole, its pegs clear of the goals and the buttons (D201)`, async ({ page }) => {
      await open(page, id);
      await expect(scene(page)).toHaveAttribute('data-camera-fit', '3,0,16,10');
      await expect(scene(page)).not.toHaveAttribute('data-restarting', /./);
      // The goals box in the shape it takes once the start is drawn (D227).
      await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
      const panel = await page.locator('.goals').boundingBox();
      const buttons = await page.locator('.zoom-box').boundingBox();
      const canvas = await page.locator('#scene canvas').boundingBox();
      if (!panel || !buttons || !canvas) throw new Error('no panel, buttons or canvas');
      for (let x = 6; x <= 13; x += 1) {
        for (const y of [4, 5]) {
          const cell = await cellOnPage(page, [x, y]);
          expect(meets(cell, panel), `cell ${x},${y} under the goals`).toBe(false);
          expect(meets(cell, buttons), `cell ${x},${y} under the buttons`).toBe(false);
        }
      }
      // The roof's row and the door's threshold inside the canvas.
      for (const cell of [[4, 3], [15, 3], [9, 10], [10, 10]] as [number, number][]) {
        expect(within(await cellOnPage(page, cell), canvas), `cell ${cell} in view`).toBe(true);
      }
      await page.screenshot({ path: `${SHOTS}framed-${id}.png` });
    });
  }

  test('a run keeps the shed framed while the wizard is in it; a drag lets it go, and the next start frames it again (D201)', async ({ page }) => {
    await open(page, 'the-brooms-on-the-wall');
    expect(await run(page, solution('the-brooms-on-the-wall'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-camera-fit', '3,0,16,10');
    await expect(scene(page)).toHaveAttribute('data-following', 'false');
    await page.locator('#again').click();
    const canvas = await page.locator('#scene canvas').boundingBox();
    if (!canvas) throw new Error('no canvas');
    const [x, y] = [canvas.x + canvas.width / 2, canvas.y + canvas.height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 120, y - 80, { steps: 6 });
    await page.mouse.up();
    await expect(scene(page)).not.toHaveAttribute('data-camera-fit', /./);
    await page.locator('#restart').click();
    await expect(scene(page)).toHaveAttribute('data-camera-fit', '3,0,16,10');
  });

  test('the broom at your feet is found and untied in two lines, the hung ones drawn on their pegs (D195, D197)', async ({ page }) => {
    await open(page, 'the-broom-at-your-feet');
    // The four hung brooms on the pegs of columns 6 to 9, the one at the feet and two more
    // lying on the boards, in sight (D202).
    await expect(scene(page)).toHaveAttribute(
      'data-sprite-things',
      'broom_0:broom:9,8;broom_1:broom:7,7;broom_2:broom:11,7;' +
        'broom_6:broom-hung:6,4;broom_7:broom-hung:7,4;broom_8:broom-hung:8,4;broom_9:broom-hung:9,4',
    );
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}shed-pegs.png` });
    expect(await run(page, solution('the-broom-at-your-feet'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-untied', 'broom_0');
  });

  test('the brooms on the floor are counted, and a walk to the wall is stopped with the owner\'s words (D202, D205)', async ({ page }) => {
    await open(page, 'the-shed');
    // The brooms lying on the boards are seen; those under the straw only once a program
    // looks there.
    const first = lyingOf('the-shed', waysOf('the-shed')[0] as string);
    await expect.poll(() => lyingDrawn(page)).toEqual(first.seen.sort());
    // The walk up is stopped before the row under the pegs, and the wizard thinks why.
    await start(page, 'wizard.move_up(3)');
    await expect(scene(page)).toHaveAttribute(
      'data-thought',
      'Para contar las escobas en el suelo, mejor me quedo cerca de donde están tiradas.',
      { timeout: ciTimes(60_000) },
    );
    await expect(scene(page)).toHaveAttribute('data-wizard', '9,6');
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(page.locator('.outcome')).not.toHaveAttribute('data-kind', 'won');
    expect(await run(page, solution('the-shed'))).toMatch(/^¡Lo has conseguido/);
    // Each way played back to its end, its won card closed to see the scene.
    for (const way of waysOf('the-shed')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('#way')).toHaveValue(way);
      await expect(page.locator('#again')).toBeHidden();
      await expect(page.locator('#again')).toBeVisible({ timeout: ciTimes(60_000) });
      await expect(page.locator('.outcome-text')).toContainText('Lo has conseguido');
      await page.locator('#again').click();
      const { seen, hidden } = lyingOf('the-shed', way);
      await expect.poll(() => lyingDrawn(page)).toEqual([...seen, ...hidden].sort());
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}shed-found-${way}.png` });
    }
  });

  test('in the straw the brooms on the boards lie in sight at the start, and find_all uncovers the others (D202)', async ({ page }) => {
    await open(page, 'the-brooms-in-the-straw');
    const first = lyingOf('the-brooms-in-the-straw', waysOf('the-brooms-in-the-straw')[0] as string);
    expect(first.hidden.length).toBeGreaterThan(0);
    await expect.poll(() => lyingDrawn(page)).toEqual(first.seen.sort());
    expect(await run(page, solution('the-brooms-in-the-straw'))).toMatch(/^¡Lo has conseguido/);
    // Each way played back to its end, its won card closed to see the scene.
    for (const way of waysOf('the-brooms-in-the-straw')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('#way')).toHaveValue(way);
      await expect(page.locator('#again')).toBeHidden();
      await expect(page.locator('#again')).toBeVisible({ timeout: ciTimes(60_000) });
      await expect(page.locator('.outcome-text')).toContainText('Lo has conseguido');
      await page.locator('#again').click();
      const { seen, hidden } = lyingOf('the-brooms-in-the-straw', way);
      await expect.poll(() => lyingDrawn(page)).toEqual([...seen, ...hidden].sort());
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}straw-found-${way}.png` });
    }
  });

  test("on the wall the program walks from the row's end to each broom by its distance and unties it, each time (D206)", async ({
    page,
  }) => {
    await open(page, 'the-brooms-on-the-wall');
    expect(await run(page, solution('the-brooms-on-the-wall'))).toMatch(/^¡Lo has conseguido/);
    // Each way played back to its end: its hung brooms untied, the two on the boards left.
    for (const way of waysOf('the-brooms-on-the-wall')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('#way')).toHaveValue(way);
      await expect(page.locator('#again')).toBeHidden();
      await expect(page.locator('#again')).toBeVisible({ timeout: ciTimes(60_000) });
      await expect(page.locator('.outcome-text')).toContainText('Lo has conseguido');
      await expect(scene(page)).toHaveAttribute('data-untied', hungOf('the-brooms-on-the-wall', way).sort().join(','));
      await page.locator('#again').click();
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}wall-untied-${way}.png` });
    }
  });

  test('the steps written out win one arrangement and lose the others, which the card says changed (D51, D204)', async ({
    page,
  }) => {
    await open(page, 'the-brooms-on-the-wall');
    await run(page, wrong('the-brooms-on-the-wall', 'the_steps_written_out'));
    await expect(page.locator('.outcome')).not.toHaveAttribute('data-kind', 'won');
    await expect(page.locator('#way')).toHaveValue('b');
    await expect(page.locator('.outcome-text')).toHaveText(/^Esta vez, hay otras escobas colgadas\.\n/);
  });

  test('in the straw a walk only left and down is refused at the first broom to the right, in the game\'s words (D212)', async ({
    page,
  }) => {
    await open(page, 'the-brooms-in-the-straw');
    expect(await run(page, wrong('the-brooms-in-the-straw', 'left_and_down_only'))).toMatch(/move_left no se usa así/);
    await expect(scene(page)).toHaveAttribute('data-wizard', '10,6');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}straw-refused.png` });
  });

  for (const [id, deepest] of [
    ['the-nearest-broom', '    '],
    ['the-brooms-in-the-straw', '        '],
  ] as const) {
    test(`${id} starts from the owner's comments, the line under each with the spaces of the line to write (D218)`, async ({
      page,
    }) => {
      await open(page, id);
      const lines = await page.locator('.cm-content .cm-line').allTextContents();
      // The owner's words, one line a sentence (D223).
      expect(lines[0]).toBe(
        '# Para que sea un poco más fácil, he escrito comentarios y te he dejado huecos para que, debajo de cada comentario, escribas el código que hace lo que dice el comentario.',
      );
      expect(lines[1]).toMatch(/^# ¡Incluso te he dejado los espacios para que sepas lo que va dentro de los (for y los )?if!$/);
      const left = lines.findIndex((line) => line.trim() === '# Deberás usar move_left');
      expect(left).toBeGreaterThan(0);
      expect(lines[left + 1]).toBe(deepest);
      expect(lines.filter((line) => line.trim() !== '' && !line.trim().startsWith('#'))).toEqual([]);
      await page.screenshot({ path: `${SHOTS}${id}-comments.png` });
    });
  }

  test("a comment of the loop's body that wraps goes on under its #, not at the editor's edge (D223)", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await open(page, 'the-brooms-in-the-straw');
    const comment = page
      .locator('.cm-content .cm-line')
      .filter({ hasText: '# Si la x de la escoba es menor que la tuya, está a tu izquierda:' });
    const lefts = await comment.evaluate((line) => {
      const range = document.createRange();
      range.selectNodeContents(line);
      const boxes = [...range.getClientRects()].filter((box) => box.width > 0);
      // Where the # stands: the first box after the line's leading spaces.
      const hash = document.createRange();
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const at = node.textContent?.indexOf('#') ?? -1;
        if (at < 0) continue;
        hash.setStart(node, at);
        hash.setEnd(node, at + 1);
        break;
      }
      const rows = [...new Set(boxes.map((box) => Math.round(box.top)))].sort((a, b) => a - b);
      const lastRow = boxes.filter((box) => Math.round(box.top) === rows[rows.length - 1]);
      return {
        rows: rows.length,
        hash: hash.getBoundingClientRect().left,
        wrapped: Math.min(...lastRow.map((box) => box.left)),
        edge: line.getBoundingClientRect().left,
      };
    });
    expect(lefts.rows).toBeGreaterThan(1);
    expect(Math.abs(lefts.wrapped - lefts.hash)).toBeLessThan(1.5);
    expect(lefts.wrapped - lefts.edge).toBeGreaterThan(20);
    await page.locator('.cm-editor').screenshot({ path: `${SHOTS}straw-comment-wrapped.png` });
  });

  test("the wall's program stops at the first broom, which has no knot, and the if mends it (D183)", async ({ page }) => {
    await open(page, 'the-check');
    expect(await run(page, wrong('the-check', 'the_given_program'))).toMatch(/no tiene nudo/);
    await page.screenshot({ path: `${SHOTS}check-no-knot.png` });
    expect(await run(page, solution('the-check'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-untied', /broom_/);
  });
});

test.describe('the first flight', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('a walk into the water is refused with what it is (D186)', async ({ page }) => {
    await open(page, 'the-first-flight');
    await start(page, wrong('the-first-flight', 'walked_into_the_water'));
    await expect(scene(page)).toHaveAttribute('data-thought', /El agua no se pisa/, { timeout: ciTimes(60_000) });
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}water-refused.png` });
  });

  test('the word lifts the broom with the wind, and a flown step takes a third of a walked one (D185, D225)', async ({ page }) => {
    await open(page, 'the-first-flight', '1');
    // When each tick is shown, on the page's own clock.
    await page.evaluate(() => {
      const node = document.querySelector('#scene') as HTMLElement;
      const times: [string, number][] = [];
      (window as unknown as { tickTimes: [string, number][] }).tickTimes = times;
      new MutationObserver(() => times.push([node.dataset.tick ?? '', performance.now()])).observe(node, {
        attributes: true,
        attributeFilter: ['data-tick'],
      });
    });
    await start(page, solution('the-first-flight'));
    await expect(scene(page)).toHaveAttribute('data-wind', 'on', { timeout: ciTimes(60_000) });
    await expect(scene(page)).toHaveAttribute('data-sounds', /wind/);
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}flight.png` });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(scene(page)).toHaveAttribute('data-flying', '');
    const times = await page.evaluate(() => (window as unknown as { tickTimes: [string, number][] }).tickTimes);
    const at = (tick: number) => times.find(([shown]) => shown === String(tick))?.[1] ?? Number.NaN;
    // A walked step takes three ticks where the wizard can fly (D225): the steps at ticks
    // 1, 4 … 22; the cast at 25; the flown steps at 26 to 30, a tick each.
    const walked = (at(22) - at(4)) / 6;
    const flown = (at(30) - at(26)) / 4;
    expect(flown).toBeLessThan(walked / 2.5);
    expect(flown).toBeGreaterThan(walked / 3.5);
  });
});

/** The frame the wizard is drawn in, read on thirty frames of the screen in a row. */
async function framesInARow(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve) => {
        const node = document.querySelector('#scene') as HTMLElement;
        const seen: string[] = [];
        const look = () => {
          seen.push(node.dataset.wizardFrame ?? '');
          if (seen.length < 30) requestAnimationFrame(look);
          else resolve(seen);
        };
        requestAnimationFrame(look);
      }),
  );
}

/** A program run until the wizard is in the air facing `way`, its frame then read. */
async function hoveringFrames(page: Page, code: string, way: string): Promise<string[]> {
  await start(page, code);
  await page.waitForFunction(
    (facing) => {
      const node = document.querySelector<HTMLElement>('#scene')?.dataset;
      return node?.flying === 'wizard' && node.wizardFacing === facing && node.state === 'playing';
    },
    way,
    { timeout: ciTimes(60_000) },
  );
  return framesInARow(page);
}

for (const wizard of [PABLO, MARTA]) {
  test.describe(`the way ${wizard.name} faces in the air (D241)`, () => {
    test.use({ locale: 'es-ES' });
    test.beforeEach(({ page }) => seedWizard(page, wizard));

    test('one frame, facing right, while it hovers: never turned by the frame it is drawn in', async ({ page }) => {
      await open(page, 'the-first-flight', '1');
      const frames = await hoveringFrames(page, 'wizard.move_right(8)\nwizard.cast("drevo")\nwizard.move_right(2)\nwizard.wait(60)\n', 'right');
      expect(new Set(frames)).toEqual(new Set(['48']));
      await expect(scene(page)).toHaveAttribute('data-wizard-facing', 'right');
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}${wizard.name}-air-right.png` });
    });

    for (const [code, way, frame] of [
      ['wizard.cast("drevo")\nwizard.move_right(1)\nwizard.move_up(1)\nwizard.wait(60)\n', 'up', '51'],
      ['wizard.cast("drevo")\nwizard.move_right(1)\nwizard.move_up(2)\nwizard.move_right(2)\nwizard.move_down(1)\nwizard.wait(60)\n', 'down', '42'],
      ['wizard.cast("drevo")\nwizard.move_right(1)\nwizard.move_up(2)\nwizard.move_left(1)\nwizard.wait(60)\n', 'left', '45'],
    ] as const) {
      test(`one frame, facing ${way}, in Los aros`, async ({ page }) => {
        await open(page, 'the-rings', '1');
        expect(new Set(await hoveringFrames(page, code, way))).toEqual(new Set([frame]));
        await page.locator('.scene-frame').screenshot({ path: `${SHOTS}${wizard.name}-air-${way}.png` });
      });
    }
  });
}

test.describe('the way a landing leaves the wizard facing (D241)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("El primer vuelo's own program: landed facing right, in its standing frame", async ({ page }) => {
    await open(page, 'the-first-flight');
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-flying', '');
    await expect(scene(page)).toHaveAttribute('data-wizard-facing', 'right');
    // Facing right, the standing frame of its row: 2 * 3 + 1.
    await expect(scene(page)).toHaveAttribute('data-wizard-frame', '7');
  });
});

/** Every sound named (data-sound, set at each sound), when the playback ends and when a
 * card first shows, on the page's clock (D247). */
async function watchEnd(page: Page): Promise<void> {
  await page.evaluate(() => {
    const node = document.querySelector('#scene') as HTMLElement;
    const seen = { sounds: [] as { sound: string; at: number }[], done: 0, card: 0, verdict: false };
    (window as unknown as { ending: typeof seen }).ending = seen;
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === 'data-sound') seen.sounds.push({ sound: node.dataset.sound ?? '', at: performance.now() });
        if (record.attributeName === 'data-state' && node.dataset.state === 'done' && !seen.done) seen.done = performance.now();
      }
    }).observe(node, { attributes: true, attributeFilter: ['data-sound', 'data-state'] });
    new MutationObserver(() => {
      const card = document.querySelector<HTMLElement>('.outcome');
      if (!seen.card && card && !card.hidden && card.getClientRects().length > 0) seen.card = performance.now();
    }).observe(document.body, { attributes: true, childList: true, subtree: true });
  });
}

type Ending = { sounds: { sound: string; at: number }[]; done: number; card: number };
const ending = (page: Page) => page.evaluate(() => (window as unknown as { ending: Ending }).ending);

test.describe("the sound of a run's end (D247)", () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("Los aros, the rim: fail as the playback ends, before the card, and once", async ({ page }) => {
    await open(page, 'the-rings', '1');
    await watchEnd(page);
    await start(page, wrong('the-rings', 'turned_inside_the_ring'));
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(60_000) });
    await page.waitForTimeout(500);
    const { sounds, done, card } = await ending(page);
    const fails = sounds.filter(({ sound }) => sound === 'fail');
    expect(fails).toHaveLength(1);
    const fail = fails[0]?.at ?? 0;
    expect(fail - done).toBeLessThan(500);
    expect(fail).toBeLessThan(card);
  });

  test('La carrera, eighteen lines: fail while Ilda says her verdict, with no card yet', async ({ page }) => {
    await open(page, 'the-race', '4');
    await watchEnd(page);
    await start(page, wrong('the-race', 'eighteen_lines'));
    await expect(scene(page)).toHaveAttribute('data-race-verdict', /./, { timeout: ciTimes(120_000) });
    await expect(scene(page)).toHaveAttribute('data-sound', 'fail', { timeout: ciTimes(2_000) });
    const { card } = await ending(page);
    expect(card).toBe(0);
  });

  test("El primer vuelo's own program: win before the card", async ({ page }) => {
    await open(page, 'the-first-flight');
    await watchEnd(page);
    await start(page, solution('the-first-flight'));
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(60_000) });
    const { sounds, card } = await ending(page);
    const wins = sounds.filter(({ sound }) => sound === 'win');
    expect(wins).toHaveLength(1);
    expect(wins[0]?.at ?? 0).toBeLessThan(card);
  });

  test('a program with an error in its first line sounds fail with its card, and Stop sounds nothing', async ({ page }) => {
    await open(page, 'the-first-flight');
    await watchEnd(page);
    await start(page, 'wizard.move_right(\n');
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(60_000) });
    await expect(scene(page)).toHaveAttribute('data-sound', 'fail');
    const before = (await ending(page)).sounds.length;
    await start(page, 'wizard.move_right(8)\nwizard.cast("drevo")\nwizard.wait(60)\n');
    await expect(scene(page)).toHaveAttribute('data-state', 'playing', { timeout: ciTimes(60_000) });
    await page.locator('#stop').click();
    await page.waitForTimeout(800);
    const after = (await ending(page)).sounds.slice(before).map(({ sound }) => sound);
    expect(after.filter((sound) => sound === 'win' || sound === 'fail')).toEqual([]);
  });
});

/** Every value the wizard's rise takes, in order, the attribute gone written as ''; and
 * the sounds named, as they stand at the end (D244). */
async function watchRise(page: Page): Promise<void> {
  await page.evaluate(() => {
    const node = document.querySelector('#scene') as HTMLElement;
    const seen: string[] = [];
    (window as unknown as { rises: string[] }).rises = seen;
    new MutationObserver((records) => {
      for (const record of records) seen.push(record.oldValue ?? '');
    }).observe(node, { attributes: true, attributeFilter: ['data-rise'], attributeOldValue: true });
  });
}

/** The rise's values seen, the one now last; consecutive repeats once. */
async function risesSeen(page: Page): Promise<string[]> {
  const seen = await page.evaluate(() => [
    ...(window as unknown as { rises: string[] }).rises,
    (document.querySelector('#scene') as HTMLElement).dataset.rise ?? '',
  ]);
  return seen.filter((value, index) => index === 0 || value !== seen[index - 1]);
}

const below1 = (value: string) => value !== '' && Number(value) < 1;

test.describe('the lift and the landing (D244)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("El primer vuelo: the lift rises with air that rises, and the landing cast sets down with its own sound", async ({
    page,
  }) => {
    await open(page, 'the-first-flight', '1');
    await watchRise(page);
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    const rises = await risesSeen(page);
    // From the ground ('') up through less than 1 to 1, and down through less than 1 to ''.
    const top = rises.indexOf('1.00');
    expect(top).toBeGreaterThan(0);
    expect(rises.slice(0, top).some(below1)).toBe(true);
    expect(rises.slice(top).some(below1)).toBe(true);
    expect(rises[rises.length - 1]).toBe('');
    await expect(scene(page)).toHaveAttribute('data-sounds', /lift/);
    await expect(scene(page)).toHaveAttribute('data-sounds', /set_down/);
  });

  test('El primer vuelo: set down by its cast, the wizard stands from its flying frame, with no frame of the cast', async ({
    page,
  }) => {
    await open(page, 'the-first-flight', '1');
    await page.evaluate(() => {
      const node = document.querySelector('#scene') as HTMLElement;
      const seen: string[] = [];
      (window as unknown as { frames: string[] }).frames = seen;
      new MutationObserver(() => seen.push(node.dataset.wizardFrame ?? '')).observe(node, {
        attributes: true,
        attributeFilter: ['data-wizard-frame'],
      });
    });
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    const frames = await page.evaluate(() => (window as unknown as { frames: string[] }).frames);
    // After the flying frame, 48: standing facing right, 7, and the celebration's row,
    // 36 to 38; never the cast's row facing right, 18 to 20.
    const landed = frames.slice(frames.lastIndexOf('48') + 1);
    expect(landed[0]).toBe('7');
    expect(landed.filter((frame) => !['7', '36', '37', '38'].includes(frame))).toEqual([]);
  });

  test("La carrera: the landing the world makes at the program's end sets down and sounds, and Zarek's does not", async ({
    page,
  }) => {
    await open(page, 'the-race', '4');
    await watchRise(page);
    await start(page, solution('the-race'));
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(120_000) });
    const rises = await risesSeen(page);
    const top = rises.lastIndexOf('1.00');
    expect(rises.slice(top).some(below1)).toBe(true);
    expect(rises[rises.length - 1]).toBe('');
    const sounds = ((await scene(page).getAttribute('data-sounds')) ?? '').split(',');
    expect(sounds.filter((sound) => sound === 'set_down')).toHaveLength(1);
  });

  test('the slider on a tick of a flight puts the wizard at its height at once, with no sound', async ({ page }) => {
    await open(page, 'the-first-flight');
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    const lifts = ((await scene(page).getAttribute('data-sounds')) ?? '').split(',').filter((s) => s === 'lift').length;
    // The lift is tick 25; the flown cells follow.
    await page.locator('#timeline').fill('27');
    await expect(scene(page)).toHaveAttribute('data-rise', '1.00', { timeout: 1000 });
    const after = ((await scene(page).getAttribute('data-sounds')) ?? '').split(',').filter((s) => s === 'lift').length;
    expect(after).toBe(lifts);
  });

  test('under reduced motion the wizard is up or down at once, never between', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'the-first-flight', '1');
    await watchRise(page);
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    expect((await risesSeen(page)).filter(below1)).toEqual([]);
  });
});

/** Every moment data-landing, the state, data-flying or the gusts change, with the tick
 * then (D255). */
async function watchLanding(page: Page): Promise<void> {
  await page.evaluate(() => {
    const node = document.querySelector('#scene') as HTMLElement;
    const seen: string[] = [];
    (window as unknown as { landings: string[] }).landings = seen;
    const note = () => {
      const set = node.dataset;
      seen.push([set.tick ?? '', set.landing ?? '', set.state ?? '', set.flying ?? '', set.windGusts ?? '0'].join('|'));
    };
    new MutationObserver(note).observe(node, {
      attributes: true,
      attributeFilter: ['data-landing', 'data-state', 'data-flying', 'data-wind-gusts'],
    });
  });
}

type Landing = { tick: number; landing: string; state: string; flying: string; gusts: number };
async function landingsSeen(page: Page): Promise<Landing[]> {
  const seen = await page.evaluate(() => (window as unknown as { landings: string[] }).landings);
  return seen.map((line) => {
    const [tick, landing, state, flying, gusts] = line.split('|');
    return { tick: Number(tick), landing: landing ?? '', state: state ?? '', flying: flying ?? '', gusts: Number(gusts) };
  });
}

/** El primer vuelo's own program: the approach from the lift's tick, the wind switched off
 * at the landing, and nothing after it; set_down said once (D255). */
async function landsAsTheWindSwitchedOff(page: Page): Promise<void> {
  await watchLanding(page);
  expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
  await expect(scene(page)).not.toHaveAttribute('data-landing', /./, { timeout: ciTimes(5_000) });
  const seen = await landingsSeen(page);
  const lift = seen.find((one) => one.flying.includes('wizard'));
  const near = seen.find((one) => one.landing === 'near');
  expect(near?.tick).toBe(lift?.tick);
  const down = seen.findIndex((one) => one.landing === 'down');
  expect(down).toBeGreaterThan(seen.indexOf(near as Landing));
  expect(seen.slice(down).some((one) => one.landing === '')).toBe(true);
  const sounds = ((await scene(page).getAttribute('data-sounds')) ?? '').split(',');
  expect(sounds.filter((sound) => sound === 'set_down')).toHaveLength(1);
}

test.describe('the landing as the wind switched off (D255)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("El primer vuelo: near from the lift's tick, down at the landing, none after it", async ({ page }) => {
    await open(page, 'the-first-flight', '1');
    await landsAsTheWindSwitchedOff(page);
  });

  test("Los aros' own program: no approach at its first gusts, and the landing falls with the run done", async ({
    page,
  }) => {
    await open(page, 'the-rings', '4');
    await watchLanding(page);
    await start(page, wrong('the-rings', 'the_given_program'));
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    const seen = await landingsSeen(page);
    const first = seen.find((one) => one.gusts >= 1);
    expect(first?.landing).toBe('');
    expect(seen.some((one) => one.state === 'done' && one.landing === 'down')).toBe(true);
  });

  test('Stop in an approach takes it away at once, the wizard still in the air', async ({ page }) => {
    await open(page, 'the-first-flight', '1');
    await start(page, solution('the-first-flight'));
    await expect(scene(page)).toHaveAttribute('data-landing', 'near', { timeout: ciTimes(60_000) });
    await page.locator('#stop').click();
    await expect(scene(page)).not.toHaveAttribute('data-landing', /./, { timeout: 500 });
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
  });

  test('the slider on a tick of a flight plans no landing', async ({ page }) => {
    await open(page, 'the-first-flight');
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).not.toHaveAttribute('data-landing', /./, { timeout: ciTimes(5_000) });
    await page.locator('#timeline').fill('27');
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await page.waitForTimeout(500);
    await expect(scene(page)).not.toHaveAttribute('data-landing', /./);
  });

  test('with the sound off in the settings, the same', async ({ page }) => {
    await page.goto('/#settings');
    await page.locator('#settings-sound').selectOption('off');
    await open(page, 'the-first-flight', '1');
    await landsAsTheWindSwitchedOff(page);
  });
});

/** A flight that hovers: the wizard walks to the broom, lifts, flies two cells and waits
 * in the air for sixty ticks, eight seconds at speed 1 (D235, D236, D242). */
const HOVERING = 'wizard.move_right(8)\nwizard.cast("drevo")\nwizard.move_right(2)\nwizard.wait(60)\n';

/** The hover's clock, as the scene says it (D235). */
const hoverOf = async (page: Page) => Number(await scene(page).getAttribute('data-hover'));

test.describe('the hover (D235, D242)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  /** The hover's clock read twice, 400 ms apart: it grows. */
  const grows = async (page: Page) => {
    const before = await hoverOf(page);
    await page.waitForTimeout(400);
    expect(await hoverOf(page)).toBeGreaterThan(before);
  };

  test('a flight hovers while the program plays, after Stop, and paused under the slider (D242)', async ({ page }) => {
    await open(page, 'the-first-flight', '1');
    await start(page, HOVERING);
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard', { timeout: ciTimes(60_000) });
    await grows(page);

    await page.locator('#stop').click();
    await expect(scene(page)).toHaveAttribute('data-state', 'done');
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await grows(page);

    // A stopped run is over and its slider is off: the run again, and while it plays in
    // the air, the slider back to a tick of the flight.
    await page.locator('#run').click();
    // In the air again: the walk is 24 ticks and the lift the 25th.
    await page.waitForFunction(
      () => {
        const node = document.querySelector<HTMLElement>('#scene')?.dataset;
        return node?.state === 'playing' && Number(node.tick) >= 30 && node.flying === 'wizard';
      },
      undefined,
      { timeout: ciTimes(60_000) },
    );
    const timeline = page.locator('#timeline');
    await expect(timeline).toBeEnabled();
    await timeline.fill(String(Number(await scene(page).getAttribute('data-tick')) - 2));
    await expect(scene(page)).toHaveAttribute('data-state', 'paused');
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await grows(page);
  });

  test("a run that ends in the air hovers after its end (D242)", async ({ page }) => {
    await open(page, 'the-rings', '1');
    await start(page, wrong('the-rings', 'turned_inside_the_ring'));
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(60_000) });
    await expect(scene(page)).toHaveAttribute('data-state', 'done');
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await grows(page);
  });

  test('Stop in the middle of a long flown move silences the wind at once (D242)', async ({ page }) => {
    await open(page, 'the-first-flight', '1');
    await start(page, 'wizard.move_right(8)\nwizard.cast("drevo")\nwizard.move_right(5)\nwizard.wait(30)\n');
    await page.waitForFunction(
      () => {
        const node = document.querySelector<HTMLElement>('#scene')?.dataset;
        return node?.flying === 'wizard' && node.wind === 'on' && Number(node.wizard?.split(',')[0]) >= 10;
      },
      undefined,
      { timeout: ciTimes(60_000) },
    );
    await page.locator('#stop').click();
    await expect(scene(page)).toHaveAttribute('data-wind', 'off', { timeout: 300 });
  });

  test('in a story the hover runs while the words are read', async ({ page }) => {
    await page.goto('/#story/the-flying-lesson');
    await expect(scene(page)).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
    // The fourth step: Zarek comes flying over the lake.
    await storyNext(page, 3);
    await expect(scene(page)).toHaveAttribute('data-flying', 'zarek', { timeout: ciTimes(30_000) });
    const reading = await hoverOf(page);
    await page.waitForTimeout(400);
    expect(await hoverOf(page)).toBeGreaterThan(reading);
  });

  test('under reduced motion a flight does not hover', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'the-first-flight');
    await start(page, HOVERING);
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard', { timeout: ciTimes(60_000) });
    await page.waitForTimeout(400);
    expect(await hoverOf(page)).toBe(0);
  });
});

/** Every value data-wind takes, in order, from now (D243). */
async function watchWind(page: Page): Promise<void> {
  await page.evaluate(() => {
    const node = document.querySelector('#scene') as HTMLElement;
    const seen: string[] = [];
    (window as unknown as { winds: string[] }).winds = seen;
    new MutationObserver((records) => {
      for (const record of records) seen.push(record.oldValue ?? '');
    }).observe(node, { attributes: true, attributeFilter: ['data-wind'], attributeOldValue: true });
  });
}

const windsSeen = async (page: Page) => {
  const seen = await page.evaluate(() => [
    ...(window as unknown as { winds: string[] }).winds,
    (document.querySelector('#scene') as HTMLElement).dataset.wind ?? '',
  ]);
  return seen.filter((value, index) => index === 0 || value !== seen[index - 1]);
};

/** Up one cell and down one, six times, in the air: twelve one-cell commands. */
const ZIGZAG = 'wizard.cast("drevo")\nfor i in range(6):\n    wizard.move_up(1)\n    wizard.move_down(1)\n';

test.describe('the wind, a gust for each flown command (D243)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("Los aros' own program: a gust for each of its eighteen flown commands, heard", async ({ page }) => {
    await open(page, 'the-rings');
    expect(await run(page, solution('the-rings'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-wind-gusts', '18');
    await expect(scene(page)).toHaveAttribute('data-sounds', /wind/);
  });

  test('a flown move is a gust, and a wait in the air is silent', async ({ page }) => {
    await open(page, 'the-first-flight', '1');
    await watchWind(page);
    await start(page, HOVERING);
    // The lift is tick 25, the two flown cells 26 and 27; the wait from 28.
    await page.waitForFunction(() => Number(document.querySelector<HTMLElement>('#scene')?.dataset.tick) >= 28, undefined, {
      timeout: ciTimes(60_000),
    });
    expect(await windsSeen(page)).toContain('on');
    await page.waitForTimeout(2000);
    await expect(scene(page)).toHaveAttribute('data-wind', 'off');
    await expect(scene(page)).toHaveAttribute('data-state', 'playing');
    await expect(scene(page)).toHaveAttribute('data-wind-gusts', '1');
  });

  test('a zigzag of twelve one-cell moves is twelve gusts heard as one wind that changes', async ({ page }) => {
    await open(page, 'the-rings', '1');
    await watchWind(page);
    await start(page, ZIGZAG);
    await expect(scene(page)).toHaveAttribute('data-wind-gusts', '12', { timeout: ciTimes(60_000) });
    await expect(scene(page)).toHaveAttribute('data-wind', 'off', { timeout: ciTimes(10_000) });
    // From off, on once, and off once at the end: never off between the first and the last.
    expect((await windsSeen(page)).filter((value) => value !== '')).toEqual(['off', 'on', 'off']);
  });

  test('with the sound off in the settings the gusts are counted the same', async ({ page }) => {
    await page.goto('/#settings');
    await page.locator('#settings-sound').selectOption('off');
    await open(page, 'the-rings', '1');
    await start(page, ZIGZAG);
    await expect(scene(page)).toHaveAttribute('data-wind-gusts', '12', { timeout: ciTimes(60_000) });
  });
});

test.describe('drevo lands (D215)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('the stone reached wins; the extra is to land on it with drevo before the program ends', async ({ page }) => {
    await open(page, 'the-first-flight');
    const extra = page.locator('.win-card #star-reasons li', { hasText: 'El objetivo extra cumplido' });
    expect(await run(page, 'wizard.move_right(8)\nwizard.cast("drevo")\nwizard.move_right(5)')).toMatch(
      /^¡Lo has conseguido/,
    );
    await expect(extra).toHaveAttribute('data-kept', 'false');
    await page.locator('#again').click();
    expect(await run(page, solution('the-first-flight'))).toMatch(/^¡Lo has conseguido/);
    await expect(extra).toHaveAttribute('data-kept', 'true');
    await expect(scene(page)).toHaveAttribute('data-flying', '');
    await page.locator('#again').click();
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}landed-on-the-stone.png` });
  });

  test('cast over the water, it is refused with the bump, the program stops, and the wizard stays in the air', async ({
    page,
  }) => {
    await open(page, 'the-first-flight');
    await start(page, wrong('the-first-flight', 'landed_on_the_water'));
    await expect(scene(page)).toHaveAttribute('data-thought', 'No hay dónde posar la escoba.', {
      timeout: ciTimes(60_000),
    });
    await expect(scene(page)).toHaveAttribute('data-sounds', /bump/);
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(page.locator('.outcome-text')).toContainText('Aquí no hay dónde posar la escoba');
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await expect(scene(page)).toHaveAttribute('data-wizard', '11,7');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}no-landing-over-the-water.png` });
  });
});

test.describe('the notebook of chapter 4', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("Python's own words come as the lessons teach them: len, then def and its arguments (D60)", async ({ page }) => {
    for (const [id, shown] of [
      ['the-broom-at-your-feet', []],
      ['the-shed', ['len(brooms)']],
      ['the-rings', ['len(brooms)', 'def quick_fly():']],
      ['the-race', ['len(brooms)', 'def quick_fly():', 'def two_rings(to_second, to_next):']],
    ] as const) {
      await open(page, id);
      await page.locator('#notebook-open').click();
      const python = page.locator('#notebook .notebook-python [data-example]');
      if (shown.length === 0) await expect(python).toHaveCount(0);
      else await expect(python).toHaveText([...shown]);
    }
    await expect(page.locator('#notebook .notebook-python')).toContainText('son los argumentos de la función');
    await page.locator('#notebook').screenshot({ path: `${SHOTS}notebook-python.png` });
    await page.locator('#notebook [data-example="def two_rings(to_second, to_next):"]').click();
    await expect(page.locator('.cm-content')).toContainText('def two_rings(to_second, to_next):');
  });
});

test.describe('the rings and the race', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('a loop round the pair flies into the trees, and the function wins in fewer lines (D190)', async ({ page }) => {
    await open(page, 'the-rings');
    await start(page, wrong('the-rings', 'a_loop_round_the_pair'));
    await expect(scene(page)).toHaveAttribute('data-thought', /copas/, { timeout: ciTimes(90_000) });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    expect(await run(page, solution('the-rings'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-through', 'ring_1,ring_2,ring_3,ring_4,ring_5,ring_6');
  });

  test('a turn inside a ring rubs its rim: the bump, the thought, the program stopped in the air (D226)', async ({ page }) => {
    await open(page, 'the-rings', '1');
    await start(page, wrong('the-rings', 'turned_inside_the_ring'));
    await expect(scene(page)).toHaveAttribute('data-thought', 'Oh, giré demasiado pronto y rocé el aro.', {
      timeout: ciTimes(60_000),
    });
    await expect(scene(page)).toHaveAttribute('data-sounds', /bump/);
    // Flown up into the ring, the wizard is past its plane, behind it, in its hole (D232).
    await expect(scene(page)).toHaveAttribute('data-ring-sides', 'wizard:behind');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}ring-rim.png` });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(page.locator('.outcome-text')).toContainText('rozó el borde');
    await expect(page.locator('.win-card')).toHaveCount(0);
    await expect(scene(page)).toHaveAttribute('data-flying', 'wizard');
    await expect(scene(page)).toHaveAttribute('data-wizard', '5,8');
    await page.screenshot({ path: `${SHOTS}ring-rim-card.png` });
  });

  test("the rim's thought comes half a second after the bump, beside the head clear of the goals box, and the card once it is read (D237, D240, D245)", async ({
    page,
  }) => {
    await open(page, 'the-rings', '1');
    await page.evaluate(() => {
      const node = document.querySelector('#scene') as HTMLElement;
      const seen: Record<string, number> = {};
      (window as unknown as { bumpSeen: Record<string, number> }).bumpSeen = seen;
      new MutationObserver(() => {
        if (seen.bump === undefined && /bump/.test(node.dataset.sounds ?? '')) seen.bump = performance.now();
        if (seen.thought === undefined && node.dataset.thought) seen.thought = performance.now();
        const card = document.querySelector<HTMLElement>('.outcome');
        if (seen.card === undefined && card && !card.hidden && card.getClientRects().length > 0) seen.card = performance.now();
      }).observe(document.body, { attributes: true, childList: true, subtree: true });
    });
    await start(page, wrong('the-rings', 'turned_inside_the_ring'));
    await expect(scene(page)).toHaveAttribute('data-sounds', /bump/, { timeout: ciTimes(60_000) });
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}ring-rim-bump.png` });
    await expect(scene(page)).toHaveAttribute('data-thought', 'Oh, giré demasiado pronto y rocé el aro.', {
      timeout: ciTimes(10_000),
    });
    // Beside the head: over the hat the goals box, open along the top, would cover it
    // (D240, D245).
    await expect(page.locator('.goals')).toHaveAttribute('data-shape', 'strip');
    await expect(page.locator('.goals')).toHaveAttribute('data-folded', 'false');
    await expect(scene(page)).toHaveAttribute('data-words-place', /^(left|right)$/);
    await expect(scene(page)).toHaveAttribute('data-words-over', /^-?\d+\.\d\d$/);
    const [left, top, right, bottom] = ((await scene(page).getAttribute('data-thought-box')) ?? '').split(',').map(Number);
    const goals = await page.locator('.goals').boundingBox();
    const clear =
      !goals || (right as number) <= goals.x || (left as number) >= goals.x + goals.width || (bottom as number) <= goals.y || (top as number) >= goals.y + goals.height;
    expect(clear).toBe(true);
    await page.waitForTimeout(500);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}ring-rim-thought.png` });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(30_000) });
    const seen = await page.evaluate(() => (window as unknown as { bumpSeen: Record<string, number> }).bumpSeen);
    const [bump, thought, card] = [seen.bump as number, seen.thought as number, seen.card as number];
    expect(thought - bump).toBeGreaterThan(350);
    expect(thought - bump).toBeLessThan(1500);
    expect(card).toBeGreaterThan(thought);
  });

  test("with the goals box folded, the rim's thought is over the hat (D237, D240)", async ({ page }) => {
    await open(page, 'the-rings');
    await page.locator('#goals-toggle').click();
    await expect(page.locator('.goals')).toHaveAttribute('data-folded', 'true');
    await start(page, wrong('the-rings', 'turned_inside_the_ring'));
    await expect(scene(page)).toHaveAttribute('data-thought', 'Oh, giré demasiado pronto y rocé el aro.', {
      timeout: ciTimes(60_000),
    });
    await expect(scene(page)).toHaveAttribute('data-words-place', 'above');
    await expect(scene(page)).toHaveAttribute('data-words-over', '1.95');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}ring-rim-thought-folded.png` });
  });

  test("flown down into a ring, the wizard rubs its rim in front of it, in its hole (D226, D232)", async ({ page }) => {
    await open(page, 'the-rings', '1');
    await start(
      page,
      'wizard.cast("drevo")\nwizard.move_right(1)\nwizard.move_up(2)\nwizard.move_right(2)\nwizard.move_down(1)\nwizard.move_right(1)\n',
    );
    await expect(scene(page)).toHaveAttribute('data-thought', 'Oh, giré demasiado pronto y rocé el aro.', {
      timeout: ciTimes(60_000),
    });
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,8');
    await expect(scene(page)).toHaveAttribute('data-ring-sides', 'wizard:front');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}ring-rim-front.png` });
  });

  test('a pair flown down and then up is seen and said: each ring shakes, the wizard thinks its way (D219)', async ({ page }) => {
    await open(page, 'the-rings', '1');
    await start(page, wrong('the-rings', 'the_pair_upside_down'));
    await expect(scene(page)).toHaveAttribute('data-thought', 'Este aro se cruza hacia arriba, desde abajo. ¡Así no cuenta!', {
      timeout: ciTimes(90_000),
    });
    await expect(scene(page)).toHaveAttribute('data-sounds', /bump/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}rings-wrong-way.png` });
    const second = 'Este aro se cruza hacia abajo, desde arriba. ¡Así no cuenta!';
    await expect(scene(page)).toHaveAttribute('data-thought', second, { timeout: ciTimes(30_000) });
    // The thought stays its reading time in this level's ticks, a third as long as
    // elsewhere (D175, D225): twelve ticks on it is still there, the flight going on.
    const seen = Number(await scene(page).getAttribute('data-tick'));
    await page.waitForFunction((tick) => Number(document.querySelector<HTMLElement>('#scene')?.dataset.tick) >= tick, seen + 12);
    expect(await scene(page).getAttribute('data-thought')).toBe(second);
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(120_000) });
    await expect(page.locator('.win-card')).toHaveCount(0);
    await expect(scene(page)).not.toHaveAttribute('data-through', /ring/);
  });

  test('Ilda reads the programs on her band and judges the race at its end; the function counts 54, the same flight in 18 lines ties at 61 (D189, D220, D229, D234)', async ({ page }) => {
    await open(page, 'the-race', '2');
    await start(page, solution('the-race'));
    await expect(scene(page)).toHaveAttribute('data-race-band', /11 líneas; Zarek, 18/, { timeout: ciTimes(60_000) });
    // The band is seen: Ilda's portrait and her words, at the scene's foot and inside it.
    const band = page.locator('.race-band');
    await expect(band).toBeVisible();
    await expect(band.locator('img[data-portrait="ilda"]')).toBeVisible();
    const [frame, box] = [await page.locator('.scene-frame').boundingBox(), await band.boundingBox()];
    if (!frame || !box) throw new Error('the band or the scene has no box');
    expect(box.x).toBeGreaterThanOrEqual(frame.x);
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width);
    expect(box.y).toBeGreaterThan(frame.y + frame.height / 2);
    expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}race-band.png` });
    // The race flown out, Ilda says her verdict on the band, and the card waits for it
    // to be read (D234, D175).
    await expect(scene(page)).toHaveAttribute(
      'data-race-verdict',
      'Marta ha tardado 54 ticks y Zarek ha tardado 61, y por tanto ha ganado Marta.',
      { timeout: ciTimes(120_000) },
    );
    await expect(band.locator('p')).toHaveText('Marta ha tardado 54 ticks y Zarek ha tardado 61, y por tanto ha ganado Marta.');
    await expect(page.locator('.win-card')).toHaveCount(0);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}race-verdict.png` });
    // The card that follows says the numbers no more: they are Ilda's to say.
    await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(120_000) });
    await expect(page.locator('.win-card')).not.toContainText('61');
    // Both land past the painted line, Zarek clear of the pole (D229).
    await expect(scene(page)).toHaveAttribute('data-wizard', '32,8');
    await expect(scene(page)).toHaveAttribute('data-actors', /zarek:32,12/);
    // Only the wizard's rings are counted; Zarek's light as he passes, his own.
    await expect(scene(page)).toHaveAttribute('data-through', 'ring_1,ring_2,ring_3,ring_4,ring_5,ring_6,ring_7,ring_8');
    // The card with the stars, the words and what was learned is seen whole, unscrolled.
    const card = page.locator('.win-card');
    expect(await card.evaluate((node) => node.scrollHeight - node.clientHeight)).toBe(0);
    // The stars are drawn in one after another: the picture waits for the last.
    await page.waitForTimeout(ciTimes(1500));
    await page.screenshot({ path: `${SHOTS}race-won-card.png` });
    await page.locator('#again').click();
    await page.locator('#speed').selectOption('4');
    await run(page, wrong('the-race', 'eighteen_lines'));
    await expect(scene(page)).toHaveAttribute(
      'data-race-verdict',
      'Marta ha tardado 61 ticks y Zarek ha tardado 61. ¡Es un empate! La carrera se repite.',
    );
    await expect(page.locator('.outcome')).not.toContainText('61');
    await expect(page.locator('.win-card')).toHaveCount(0);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}race-tie.png` });
  });

  test('a ring missed stops nobody before the finish: Ilda adds its penalty at the end and names the winner (D234)', async ({ page }) => {
    await open(page, 'the-race', '2');
    // Two pairs skipped: the wizard crosses the finish well before Zarek, in the air
    // all the way, and loses by Ilda's count.
    await start(page, wrong('the-race', 'two_pairs_skipped'));
    const missed =
      'Marta ha tardado 45 ticks y Zarek ha tardado 61. Pero Marta ha tenido una penalización de 20 ticks, y por tanto ha ganado Zarek.';
    await expect(scene(page)).toHaveAttribute('data-race-verdict', missed, { timeout: ciTimes(120_000) });
    await expect(scene(page)).toHaveAttribute('data-wizard', '32,8');
    await expect(page.locator('.outcome')).toBeHidden();
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}race-verdict-missed.png` });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(page.locator('.win-card')).toHaveCount(0);
    await expect(page.locator('.outcome')).not.toContainText('61');
    // The verdict stays on the band until the run starts again.
    await expect(scene(page)).toHaveAttribute('data-race-verdict', missed);
    await page.screenshot({ path: `${SHOTS}race-missed-card.png` });
  });

  test("one pair skipped still wins by Ilda's count, and the extra goals' star is lost (D233, D234)", async ({ page }) => {
    await open(page, 'the-race');
    // The third pair flown past: 11 lines and 39 cells are 50 ticks, and with 10 of
    // penalty 60, under Zarek's 61.
    const code = solution('the-race').replace('two_rings(2, 4)\ntwo_rings(3, 2)', 'wizard.move_right(6)\ntwo_rings(3, 2)');
    expect(code).toContain('wizard.move_right(6)');
    expect(await run(page, code)).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute(
      'data-race-verdict',
      'Marta ha tardado 50 ticks y Zarek ha tardado 61. Marta ha tenido una penalización de 10 ticks, pero aun así ha ganado.',
    );
    // The rings are an extra goal: missed, they cost the third star and its reason says so.
    const reason = page.locator('#star-reasons li', { hasText: 'Los objetivos extra cumplidos' });
    await expect(reason).toHaveAttribute('data-kept', 'false');
    await expect(page.locator('.win-card .star.earned')).toHaveCount(2);
    // The stars are drawn in one after another: the picture waits for the last.
    await page.waitForTimeout(ciTimes(1500));
    await page.screenshot({ path: `${SHOTS}race-pair-skipped-card.png` });
  });

  test("in the rematch the race's program misses seven rings, and the numbers mended win at 54", async ({ page }) => {
    await open(page, 'the-rematch');
    expect(await run(page, wrong('the-rematch', 'the_race_s_program'))).not.toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute(
      'data-race-verdict',
      /^Marta ha tardado 54 ticks y Zarek ha tardado \d+\. Pero Marta ha tenido una penalización de 35 ticks, y por tanto ha ganado Zarek\.$/,
    );
    expect(await run(page, solution('the-rematch'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-race-verdict', /^Marta ha tardado 54 ticks .* y por tanto ha ganado Marta\.$/);
  });
});

test.describe('the stories', () => {
  test.use({ locale: 'es-ES' });

  for (const id of STORIES) {
    test(`${id} is told to its end`, async ({ page }) => {
      await seedWizard(page, MARTA);
      await page.goto(`/#story/${id}`);
      await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
      await page.screenshot({ path: `${SHOTS}story-${id}-1.png` });
      // The flying lesson opens in the shed, every peg with its broom, the floor and the
      // path to the door framed (sprint 43, 2.7).
      if (id === 'the-flying-lesson') {
        await expect(page.locator('#scene')).toHaveAttribute('data-story-part', '0');
        await expect(page.locator('#scene')).toHaveAttribute('data-camera-fit', '3,3,16,14');
        await expect(page.locator('#scene')).toHaveAttribute('data-sprite-things', /broom_13:broom-hung:13,4/);
      }
      // The finish is told on the whole width of the race course (D199).
      if (id === 'the-finish') await expect(page.locator('#scene')).toHaveAttribute('data-camera-fit', 'wide');
      let step = 1;
      while ((await page.locator('#story-next').count()) > 0) {
        await storyNext(page);
        step += 1;
        await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
        await page.screenshot({ path: `${SHOTS}story-${id}-${step}.png` });
        // The morning after goes on in the shed from its fourth step, the shed framed
        // whole (D199), four brooms on the pegs and four on the floor (D195).
        if (id === 'the-morning-after' && step >= 4) {
          await expect(page.locator('#scene')).toHaveAttribute('data-story-part', '1');
          await expect(page.locator('#scene')).toHaveAttribute('data-camera-fit', '3,3,16,10');
          await expect(page.locator('#scene')).toHaveAttribute('data-sprite-things', /broom_6:broom-hung:6,4/);
          await expect(page.locator('#scene')).toHaveAttribute('data-sprite-things', /broom_0:broom:9,8/);
          // The three have walked in by the step's end: the scene's own playback is done.
          await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '9,8');
        }
        // Ilda comes into the shed, the class outside on the path; then the lake.
        if (id === 'the-flying-lesson' && step === 2) {
          await expect(page.locator('#scene')).toHaveAttribute('data-story-part', '0');
        }
        if (id === 'the-flying-lesson' && step >= 3) {
          await expect(page.locator('#scene')).toHaveAttribute('data-story-part', '1');
        }
        // From the step that names Rinlo by the gate, the far end is framed nearer: the
        // class beyond the finish and the gate with Rinlo beside it.
        if (id === 'the-finish') {
          await expect(page.locator('#scene')).toHaveAttribute('data-camera-fit', step >= 5 ? '30,5,40,12' : 'wide');
        }
      }
      await expect(page.locator('#story-go-on')).toBeVisible();
    });
  }
});

test.describe('the debug view of chapter 4', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("with ?debug, the shed's zones are framed and named (D196)", async ({ page }) => {
    await page.goto('/?debug#level/the-brooms-on-the-wall');
    await page.locator('#start').click();
    await expect(scene(page)).toHaveAttribute('data-debug', 'true', { timeout: ciTimes(90_000) });
    await page.locator('#debug-cells').click();
    await expect(page.locator('.debug-legend')).toContainText('Zona: junto a la pared');
    await expect(page.locator('.debug-legend')).toContainText('Zona: en la paja');
    await page.screenshot({ path: `${SHOTS}debug-the-shed.png` });
  });

  for (const id of ['the-first-flight', 'the-rings']) {
    test(`with ?debug, ${id}'s low cells are named and its rings numbered`, async ({ page }) => {
      await page.goto(`/?debug#level/${id}`);
      await page.locator('#start').click();
      await expect(scene(page)).toHaveAttribute('data-debug', 'true', { timeout: ciTimes(90_000) });
      await page.locator('#debug-cells').click();
      await expect(scene(page)).toHaveAttribute('data-debug-layers', /cells/);
      await expect(page.locator('.debug-legend')).toContainText('Bajo: se cruza volando');
      await page.screenshot({ path: `${SHOTS}debug-${id}.png` });
    });
  }
});

for (const [scenery, level] of [
  ['the-broom-shed', 'the-shed'],
  ['the-lake-edge', 'the-first-flight'],
  ['the-ring-field', 'the-rings'],
  ['the-race-course', 'the-race'],
] as const) {
  test(`${scenery} zoomed out`, async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto(`/#level/${level}`);
    await page.locator('#start').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-state', /./, { timeout: ciTimes(90_000) });
    while ((await page.locator('#zoom-out').count()) > 0 && (await page.locator('#zoom-out').isEnabled())) {
      await page.locator('#zoom-out').click();
    }
    await page.waitForTimeout(ciTimes(400));
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}${scenery}-zoomed-out.png` });
  });
}

test('the map shows chapter 4 in its order', async ({ page }) => {
  await seedWizard(page, MARTA);
  await page.goto('/?debug#map');
  const stops = page.locator('.map-chapter').nth(3).locator('.stop');
  await expect(stops).toHaveCount(ITEMS.length);
  for (const [index, item] of ITEMS.entries()) {
    await expect(stops.nth(index)).toHaveAttribute('data-item', item);
  }
  await page.locator('.map-chapter').nth(3).screenshot({ path: `${SHOTS}map.png` });
});
