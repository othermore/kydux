// Chapter 4 as the child plays it (sprint 39): every level won by its solution, in
// Spanish for a girl and in English for a boy, in every way; the brooms in the straw
// unseen until found (D184); a loop needed where the ways differ (D51); the knot's error
// and its fix (D183); water refused to a walk and crossed by a flight three times as
// fast, with the wind's sound (D185, D186); the loop round the rings flown into the
// trees and the function that wins (D190); the race by Ilda's count, its band and its
// card (D189); each story told to its end, the first on two scenes; the map's stops in
// order. Screenshots of every stop go to e2e/shots/chapter-4/, which git ignores, for
// the owner.

import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, type SeededWizard, seedWizard, storyNext } from './helpers';
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
  await page.goto(`/#level/${id}`);
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

test.describe('the shed', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('the brooms in the straw are not seen until find_all finds them (D184)', async ({ page }) => {
    await open(page, 'the-shed');
    await expect(scene(page)).toHaveAttribute('data-sprite-things', '');
    await run(page, solution('the-shed'));
    await expect(scene(page)).toHaveAttribute('data-found', /broom_1/);
    await expect(scene(page)).toHaveAttribute('data-sprite-things', /broom_1:broom:7,8/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}shed-found.png` });
  });

  test('three brooms untied by hand win the way of three and lose the longer ones (D51)', async ({ page }) => {
    await open(page, 'the-brooms-in-a-row');
    await run(page, wrong('the-brooms-in-a-row', 'three_written_out'));
    await expect(page.locator('.outcome')).not.toHaveAttribute('data-kind', 'won');
    await expect(page.locator('#way')).toHaveValue('four');
  });

  test('the friend\'s program stops at a broom with no knot, and the if mends it (D183)', async ({ page }) => {
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
      let step = 1;
      while ((await page.locator('#story-next').count()) > 0) {
        await storyNext(page);
        step += 1;
        await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
        await page.screenshot({ path: `${SHOTS}story-${id}-${step}.png` });
        // The morning after goes on in the shed from its fourth step.
        if (id === 'the-morning-after' && step === 4) {
          await expect(page.locator('#scene')).toHaveAttribute('data-story-part', '1');
          await expect(page.locator('#scene')).toHaveAttribute('data-sprite-things', /broom_1:broom/);
        }
      }
      await expect(page.locator('#story-go-on')).toBeVisible();
    });
  }
});

test.describe('the debug view of chapter 4', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

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
