// Chapter 4 as the child plays it: every level won by its solution, in Spanish for a
// girl and in English for a boy, in every way; the broom at the wizard's feet and the
// brooms hung on their pegs (D195, D197); the brooms counted from the straw and from the
// wall, the straw's unseen until found (D184, D196); a loop needed where the ways differ
// (D51); the shed framed whole as the story walks in, the finish told wide (D199);
// Python's own words in the notebook as the lessons teach them (D60); the knot's error
// and its fix (D183); water refused to a walk and crossed by a flight three times as
// fast, with the wind's sound (D185, D186); the loop round the rings flown into the
// trees and the function that wins (D190); the race by Ilda's count, its band and its
// card (D189); each story told to its end, the first on two scenes; the map's stops in
// order; the shed's levels framed whole, their pegs clear of the page's panels (D201);
// the shed's lying brooms in sight on the boards and hidden under the straw (D202).
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

  for (const id of ['the-broom-at-your-feet', 'the-shed', 'the-brooms-on-the-wall', 'the-brooms-in-the-straw', 'the-check']) {
    test(`${id} opens on the shed whole, its pegs clear of the goals and the buttons (D201)`, async ({ page }) => {
      await open(page, id);
      await expect(scene(page)).toHaveAttribute('data-camera-fit', '3,0,16,10');
      await expect(scene(page)).not.toHaveAttribute('data-restarting', /./);
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
        'broom_6:broom-hung:6,5;broom_7:broom-hung:7,5;broom_8:broom-hung:8,5;broom_9:broom-hung:9,5',
    );
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}shed-pegs.png` });
    expect(await run(page, solution('the-broom-at-your-feet'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-untied', 'broom_0');
  });

  test('the brooms are counted from the straw and from the wall; one find_all loses (D196, D202)', async ({ page }) => {
    await open(page, 'the-shed');
    // The hung one and the three lying on the boards are seen; the two under the straw
    // only once a program looks there.
    await expect(scene(page)).toHaveAttribute(
      'data-sprite-things',
      'broom_0:broom:9,8;broom_1:broom:7,7;broom_2:broom:11,7;broom_6:broom-hung:6,5',
    );
    expect(await run(page, wrong('the-shed', 'one_find_all_from_the_door'))).not.toMatch(/^¡Lo has conseguido/);
    expect(await run(page, solution('the-shed'))).toMatch(/^¡Lo has conseguido/);
    // Each way played back to its end, its won card closed to see the scene.
    for (const way of waysOf('the-shed')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('#way')).toHaveValue(way);
      await expect(page.locator('#again')).toBeHidden();
      await expect(page.locator('#again')).toBeVisible({ timeout: ciTimes(60_000) });
      await expect(page.locator('.outcome-text')).toContainText('Lo has conseguido');
      await page.locator('#again').click();
      await expect(scene(page)).toHaveAttribute('data-found', /broom_3.*broom_4|broom_4.*broom_3/);
      await expect(scene(page)).toHaveAttribute('data-sprite-things', /broom_3:broom:.*broom_4:broom:/);
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}shed-found-${way}.png` });
    }
  });

  test('in the straw two brooms lie in sight at the start, and find_all uncovers the other two (D202)', async ({ page }) => {
    await open(page, 'the-brooms-in-the-straw');
    const lying = async () =>
      ((await scene(page).getAttribute('data-sprite-things')) ?? '').split(';').filter((entry) => entry.includes(':broom:')).length;
    await expect.poll(lying).toBe(2);
    await expect(scene(page)).toHaveAttribute('data-sprite-things', /^broom_1:broom:11,7;broom_2:broom:8,7;broom_6:/);
    expect(await run(page, solution('the-brooms-in-the-straw'))).toMatch(/^¡Lo has conseguido/);
    // Each way played back to its end, its won card closed to see the scene.
    for (const way of waysOf('the-brooms-in-the-straw')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('#way')).toHaveValue(way);
      await expect(page.locator('#again')).toBeHidden();
      await expect(page.locator('#again')).toBeVisible({ timeout: ciTimes(60_000) });
      await expect(page.locator('.outcome-text')).toContainText('Lo has conseguido');
      await page.locator('#again').click();
      await expect.poll(lying).toBe(4);
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}straw-found-${way}.png` });
    }
  });

  test('two brooms untied by hand win the way of two and lose the longer ones, which the card says changed (D51, D204)', async ({ page }) => {
    await open(page, 'the-brooms-on-the-wall');
    await run(page, wrong('the-brooms-on-the-wall', 'two_written_out'));
    await expect(page.locator('.outcome')).not.toHaveAttribute('data-kind', 'won');
    await expect(page.locator('#way')).toHaveValue('three');
    await expect(page.locator('.outcome-text')).toContainText(/^Esta vez era distinto\. /);
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

  test('the word lifts the broom with the wind, and a flown step takes a third of a walked one (D185)', async ({ page }) => {
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
    // Ticks 2 to 7 are walked; 10 to 14, after the cast at 9, flown.
    const walked = (at(7) - at(2)) / 5;
    const flown = (at(14) - at(10)) / 4;
    expect(flown).toBeLessThan(walked / 2.5);
  });
});

test.describe('the notebook of chapter 4', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("Python's own words come as the lessons teach them: len, then def and its arguments (D60)", async ({ page }) => {
    for (const [id, shown] of [
      ['the-broom-at-your-feet', []],
      ['the-shed', ['len(brooms)']],
      ['the-rings', ['len(brooms)', 'def two_rings():']],
      ['the-race', ['len(brooms)', 'def two_rings():', 'def rings(times):']],
    ] as const) {
      await open(page, id);
      await page.locator('#notebook-open').click();
      const python = page.locator('#notebook .notebook-python [data-example]');
      if (shown.length === 0) await expect(python).toHaveCount(0);
      else await expect(python).toHaveText([...shown]);
    }
    await expect(page.locator('#notebook .notebook-python')).toContainText('son los argumentos de la función');
    await page.locator('#notebook').screenshot({ path: `${SHOTS}notebook-python.png` });
    await page.locator('#notebook [data-example="def rings(times):"]').click();
    await expect(page.locator('.cm-content')).toContainText('def rings(times):');
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
    await expect(scene(page)).toHaveAttribute('data-through', 'ring_1,ring_2,ring_3,ring_3,ring_4,ring_5,ring_6');
  });

  test('Ilda reads the programs on the band; eighteen lines cross after Zarek, the function before him (D189)', async ({ page }) => {
    await open(page, 'the-race', '2');
    await start(page, solution('the-race'));
    await expect(scene(page)).toHaveAttribute('data-race-band', /11 líneas; Zarek, 14/, { timeout: ciTimes(60_000) });
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}race-band.png` });
    await expect(page.locator('#card-race')).toContainText('tick 49', { timeout: ciTimes(120_000) });
    // The card with the count, the words and what was learned is seen whole, unscrolled.
    const card = page.locator('.win-card');
    expect(await card.evaluate((node) => node.scrollHeight - node.clientHeight)).toBe(0);
    await page.screenshot({ path: `${SHOTS}race-count-card.png` });
    await page.locator('#again').click();
    await page.locator('#speed').selectOption('4');
    await run(page, wrong('the-race', 'eighteen_lines'));
    await expect(page.locator('#outcome-race')).toContainText('tick 56');
    await expect(page.locator('#outcome-race')).toContainText('tick 55');
  });

  test('in the rematch the race\'s program loses, and the arguments changed win by a tick', async ({ page }) => {
    await open(page, 'the-rematch');
    expect(await run(page, wrong('the-rematch', 'the_race_s_program'))).not.toMatch(/^¡Lo has conseguido/);
    expect(await run(page, solution('the-rematch'))).toMatch(/^¡Lo has conseguido/);
    await expect(page.locator('#card-race')).toContainText('tick 49');
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
          await expect(page.locator('#scene')).toHaveAttribute('data-sprite-things', /broom_6:broom-hung:6,5/);
          await expect(page.locator('#scene')).toHaveAttribute('data-sprite-things', /broom_0:broom:9,8/);
          // The three have walked in by the step's end: the scene's own playback is done.
          await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '9,8');
        }
        if (id === 'the-finish') await expect(page.locator('#scene')).toHaveAttribute('data-camera-fit', 'wide');
      }
      await expect(page.locator('#story-go-on')).toBeVisible();
    });
  }
});

test.describe('the debug view of chapter 4', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("with ?debug, the shed's zones are framed and named (D196)", async ({ page }) => {
    await page.goto('/?debug#level/the-shed');
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
