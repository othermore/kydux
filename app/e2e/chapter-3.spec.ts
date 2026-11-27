// Chapter 3 as the child plays it (sprint 30): every level won by its solution, in
// Spanish for a girl and in English for a boy, in every way; the map's plan opened
// by orvim and the run paused until it is closed (D134); the enchanted tunnel, where
// no one is seen (D135); a teacher's phases (D137); the dark room over a painting
// (D52); the hole that opens in the floor (D167); the goal's mark under an arch and under
// the wizard (D160, D168); the dark room's key on the plan (D169); each story told to its
// end; the map's stops in order. Screenshots of every stop go to e2e/shots/chapter-3/, which git ignores, for
// the owner.

import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { gotoTesting, MARTA, nextLessonPage, type SeededWizard, seedWizard, storyNext } from './helpers';
import { ciTimes } from './support';

const SHOTS = fileURLToPath(new URL('./shots/chapter-3/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const PABLO: SeededWizard = { name: 'Pablo', gender: 'boy', look: 'amber' };

const ITEMS: string[] = JSON.parse(readFileSync(`${CONTENT}chapters/03-passages/chapter.json`, 'utf8')).items;
const LEVELS = ITEMS.filter((item) => item.startsWith('level:')).map((item) => item.slice('level:'.length));
const STORIES = ITEMS.filter((item) => item.startsWith('story:')).map((item) => item.slice('story:'.length));
const solution = (id: string) => readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8');
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
  await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(60_000) });
  return page.locator('.outcome-text').innerText();
}

for (const [wizard, locale, won] of [
  [MARTA, 'es-ES', /^¡Lo has conseguido/],
  [PABLO, 'en-US', /^You did it/],
] as const) {
  test.describe(`chapter 3 for ${wizard.name}`, () => {
    test.use({ locale });
    test.beforeEach(({ page }) => seedWizard(page, wizard));

    for (const id of LEVELS) {
      test(`${id} is won by its solution, in every way`, async ({ page }) => {
        await open(page, id);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-start.png` });
        // The map's level: the plan opens only when a program casts it.
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

test.describe('a stop is not an outcome (D177)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  test('a playback stopped halfway shows no card and no star, and the level is still to do', async ({ page }) => {
    await open(page, 'the-doors-corridor', '1');
    await start(page, solution('the-doors-corridor'));
    await expect
      .poll(async () => Number(await scene(page).getAttribute('data-tick')), { timeout: ciTimes(60_000) })
      .toBeGreaterThanOrEqual(5);
    await page.locator('#stop').click();
    const stoppedAt = await scene(page).getAttribute('data-wizard');
    await page.waitForTimeout(ciTimes(2_000));
    await expect(page.locator('.outcome')).toBeHidden();
    await expect(page.locator('.win-card')).toHaveCount(0);
    await expect(page.locator('#run')).toBeEnabled();
    // The wizard stays where the playback was stopped.
    await expect(scene(page)).toHaveAttribute('data-wizard', stoppedAt ?? '');
    await page.screenshot({ path: `${SHOTS}stopped-playback.png` });
    await page.goto('/#map');
    await expect(page.locator('.stop[data-item="level:the-doors-corridor"]')).not.toHaveAttribute(
      'data-state',
      'done',
    );
    // Back to the level, run again whole: the card says it is won. The level's start
    // card was seen already in this visit, and is not shown again.
    await page.goto('/#level/the-doors-corridor');
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#speed').selectOption('4');
    expect(await run(page, solution('the-doors-corridor'))).toMatch(/^You did it/);
    await expect(page.locator('.win-card')).toBeVisible();
  });
});

test.describe('the map, opened by its spell (D134)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  test('orvim opens the plan and pauses the run; closing it plays on', async ({ page }) => {
    await open(page, 'the-doors-corridor', '1');
    await start(page, 'wizard.cast("orvim")\nwizard.move_right()');
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(scene(page)).toHaveAttribute('data-plan-open', 'true');
    await expect(scene(page)).toHaveAttribute('data-state', 'paused');
    await expect(scene(page)).toHaveAttribute('data-tick', '1');
    await expect(plan).toHaveAttribute('data-figures', /wizard:1,12/);
    await expect(plan).toHaveAttribute('data-figures', /friend:0,12/);
    await expect(plan).toHaveAttribute('data-figures', /mate:0,11/);
    await expect(plan).toHaveAttribute('data-doors', 'door_a:shut;door_b:shut');
    await expect(plan).toHaveAttribute('data-marks', '15,3');
    await expect(plan).toHaveAttribute('data-drawn', 'true', { timeout: ciTimes(30_000) });
    // A cell's own numbers come under the pointer (D143).
    await page.locator('#plan-canvas').hover({ position: { x: 28 + 1.5 * 40, y: 28 + 12.5 * 40 } });
    await expect(plan).toHaveAttribute('data-cell', /^\d+,\d+$/);
    await expect(page.locator('#plan-cell')).toBeVisible();
    await expect(page.locator('#plan-legend')).toContainText('x counts from the left');
    await page.screenshot({ path: `${SHOTS}plan-window.png` });
    await page.locator('#plan-close').click();
    await expect(plan).toHaveCount(0);
    await expect(scene(page)).not.toHaveAttribute('data-plan-open');
    await expect(scene(page)).toHaveAttribute('data-wizard', '2,12', { timeout: ciTimes(30_000) });
  });

  test('it opens in a level that does not need it, wherever the map is carried', async ({ page }) => {
    await open(page, 'the-tunnel-exit');
    await start(page, 'wizard.cast("orvim")');
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(plan).toHaveAttribute('data-figures', /dask:9,11/);
    await expect(plan).toHaveAttribute('data-marks', '11,6');
    await expect(plan).toHaveAttribute('data-drawn', 'true', { timeout: ciTimes(30_000) });
    await page.keyboard.press('Escape');
    await expect(plan).toHaveCount(0);
  });

  test('in the dark tunnel, the exit is found on the plan and the cell printed (D152)', async ({ page }) => {
    await open(page, 'the-dark-tunnel');
    await start(page, 'wizard.cast("orvim")\nprint(wizard.position)');
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(plan).toHaveAttribute('data-marks', '19,1');
    await expect(plan).toHaveAttribute('data-mark-labels', '(19, 1)');
    await page.keyboard.press('Escape');
    await expect(page.locator('.printed')).toHaveText('(14, 2)', { timeout: ciTimes(30_000) });
  });

  test("P8's plan shows the key lying in the dark storeroom (D169)", async ({ page }) => {
    await open(page, 'the-dark-room');
    await expect(scene(page)).toHaveAttribute('data-dark', 'true');
    await start(page, 'wizard.cast("orvim")');
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(plan).toHaveAttribute('data-things', /key:9,7/);
    await expect(plan).toHaveAttribute('data-drawn', 'true', { timeout: ciTimes(30_000) });
    await page.screenshot({ path: `${SHOTS}plan-dark-room-key.png` });
    await page.keyboard.press('Escape');
  });

  test('the plan writes a mark\'s cell and rules the floor cells (D151)', async ({ page }) => {
    await open(page, 'the-doors-corridor');
    await start(page, 'wizard.cast("orvim")');
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(plan).toHaveAttribute('data-mark-labels', '(15, 3)');
    await expect(plan).toHaveAttribute('data-floor-edges', /^\d{2,}$/);
    await expect(plan).toHaveAttribute('data-drawn', 'true', { timeout: ciTimes(30_000) });
    await page.screenshot({ path: `${SHOTS}plan-grid.png` });
    await page.keyboard.press('Escape');
  });

  test('Escape closes it too, and a run started again closes it', async ({ page }) => {
    await open(page, 'the-doors-corridor');
    await start(page, 'wizard.cast("orvim")');
    await expect(page.locator('#plan')).toBeVisible({ timeout: ciTimes(30_000) });
    await page.keyboard.press('Escape');
    await expect(page.locator('#plan')).toHaveCount(0);
    await expect(scene(page)).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
    await start(page, 'wizard.cast("orvim")');
    await expect(page.locator('#plan')).toBeVisible({ timeout: ciTimes(30_000) });
    await page.keyboard.press('Alt+KeyR');
    await expect(scene(page)).toHaveAttribute('data-state', 'paused', { timeout: ciTimes(30_000) });
  });

  test("the first lesson's last button leads to the level, where the map's word opens the plan", async ({ page }) => {
    await page.goto('/#lesson/the-cells');
    // The lesson drawn before its pages are counted: a slow load is not its last page.
    await expect(page.locator('.lesson-page')).toBeVisible();
    while ((await page.locator('#lesson-next').count()) > 0) await nextLessonPage(page);
    // Its third page, the map's word, holds no block (D174), and goes on to the level.
    await expect(page.locator('.lesson-run')).toHaveCount(0);
    await expect(page.locator('#lesson-try')).toHaveText('Go on');
    await page.screenshot({ path: `${SHOTS}lesson-the-cells.png` });
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(/#level\/the-doors-corridor$/);
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await start(page, 'wizard.cast("orvim")');
    await expect(page.locator('#plan')).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(scene(page)).toHaveAttribute('data-plan-open', 'true');
  });
});

test.describe('the enchanted tunnel (D135)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  test('the wizard fades on entering the mouth, and the mark is not shown', async ({ page }) => {
    await open(page, 'the-doors-corridor');
    await expect(scene(page)).toHaveAttribute('data-marks', '');
    await expect(scene(page)).not.toHaveAttribute('data-enchanted');
    await run(page, solution('the-doors-corridor'));
    await expect(scene(page)).toHaveAttribute('data-enchanted', /wizard/);
  });

  test('inside, no one is seen, position tells where, and the plan draws no figure', async ({ page }) => {
    await open(page, 'the-dark-tunnel');
    await expect(scene(page)).toHaveAttribute('data-enchanted', 'wizard,friend,mate');
    await start(page, 'print(wizard.position)\nwizard.cast("orvim")');
    await expect(page.locator('#plan')).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(page.locator('#plan')).toHaveAttribute('data-figures', '');
    await expect(page.locator('#plan')).toHaveAttribute('data-tunnel', '10');
    await expect(page.locator('#plan')).toHaveAttribute('data-marks', '19,1');
    await page.screenshot({ path: `${SHOTS}plan-tunnel.png` });
    await page.keyboard.press('Escape');
    await expect(page.locator('.printed')).toHaveText('(14, 2)', { timeout: ciTimes(30_000) });
  });
});

test.describe('Dask, in every way (D51, D137)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  test('at the crossing, Dask comes up from below, and the walk alone is caught (D146)', async ({ page }) => {
    await open(page, 'the-tunnel-exit');
    await expect(scene(page)).toHaveAttribute('data-actors', /dask:9,12,up/);
    await expect(page.locator('#way')).toBeHidden();
    await run(page, 'wizard.move_right(7)');
    await expect(page.locator('.outcome-text')).toContainText('The teacher saw you');
    await expect(scene(page)).toHaveAttribute('data-actors', /dask:9,7,up/);
  });

  test('two ticks of waiting let him go by (D146)', async ({ page }) => {
    await open(page, 'the-tunnel-exit');
    expect(await run(page, 'wizard.wait(2)\nwizard.move_right(7)')).toMatch(/^You did it/);
    await expect(scene(page)).toHaveAttribute('data-wizard', '11,6');
  });

  test('a way turns him as well as moves him (D51, D146)', async ({ page }) => {
    await open(page, 'by-the-statues');
    await expect(scene(page)).toHaveAttribute('data-actors', /dask:13,7,up/);
    await run(page, 'wizard.move_right(4)\nwizard.move_down(2)');
    await expect(page.locator('#way')).toHaveValue('looking_up');
    await expect(page.locator('.outcome-text')).toContainText('The teacher saw you');
    await page.locator('#way').selectOption('looking_down', { force: true });
    await expect(scene(page)).toHaveAttribute('data-actors', /dask:13,7,down/);
  });

  for (const id of ['past-the-teacher', 'the-night-walk']) {
    test(`${id}: one wait written in the code is caught in a way, and the while wins all three`, async ({ page }) => {
      await open(page, id);
      const code = solution(id).replace(/while dask\.facing == "right":\n {4}wizard\.wait\(\)/, 'wizard.wait()');
      expect(code).not.toEqual(solution(id));
      await run(page, code);
      await expect(page.locator('.outcome-text')).toContainText('The teacher saw you');
      await expect(page.locator('#way')).toBeVisible();
      expect(await run(page, solution(id))).toMatch(/^You did it/);
      for (const way of waysOf(id)) {
        await page.locator('#way').selectOption(way, { force: true });
        await expect(page.locator('.outcome-text')).toHaveText(/^You did it/, { timeout: ciTimes(30_000) });
      }
    });
  }
});

test.describe('the storeroom', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  test('the hole shows while it is open, the storeroom dark (D162), and osto is no spell there yet (D178)', async ({
    page,
  }) => {
    await open(page, 'the-opening-hole', '1');
    await expect(scene(page)).toHaveAttribute('data-dark', 'true');
    await expect(scene(page)).toHaveAttribute('data-holes', 'hole:closed');
    await expect(scene(page)).not.toHaveAttribute('data-drawn', /hole:/);
    await start(page, 'wizard.move_right(2)\nwizard.wait(4)');
    await expect(scene(page)).toHaveAttribute('data-holes', 'hole:open', { timeout: ciTimes(30_000) });
    await expect(scene(page)).toHaveAttribute('data-drawn', /hole:3\.\d+,7\.\d+/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}hole-open.png` });
    await page.locator('#speed').selectOption('4');
    await start(page, 'wizard.move_right(2)\nwizard.cast("osto")');
    await expect(scene(page)).toHaveAttribute('data-thought', 'I do not know a spell called “osto”.', {
      timeout: ciTimes(30_000),
    });
    await expect(scene(page)).not.toHaveAttribute('data-held', /hole/);
  });

  test("the way home's hole is open from the start, and osto holds it closed with its crack of light (D167, D178)", async ({
    page,
  }) => {
    await open(page, 'the-night-walk');
    await expect(scene(page)).toHaveAttribute('data-holes', 'hole:open');
    const toTheEdge = 'wizard.move_down()\nwizard.pick_up()\nwizard.move_down()\ndoor.open()\nwizard.move_down(2)\n';
    await start(page, `${toTheEdge}wizard.cast("osto")\nprint(hole.closed)`);
    await expect(scene(page)).toHaveAttribute('data-held', 'hole', { timeout: ciTimes(30_000) });
    await expect(page.locator('.printed')).toHaveText('True', { timeout: ciTimes(30_000) });
    // Held, its floor is whole, with a crack of light round it (D167).
    await expect(scene(page)).not.toHaveAttribute('data-drawn', /hole:/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}hole-held.png` });
  });

  test('the room is dark until kirra, and the key is not seen (D52)', async ({ page }) => {
    await open(page, 'the-dark-room');
    await expect(scene(page)).toHaveAttribute('data-dark', 'true');
    await expect(scene(page)).not.toHaveAttribute('data-drawn', /key:/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}dark-room-dark.png` });
    await run(page, 'wizard.cast("kirra")');
    await expect(scene(page)).toHaveAttribute('data-dark', 'false');
    await expect(scene(page)).toHaveAttribute('data-drawn', /key:9\.\d+,7\.\d+/);
    await page.waitForTimeout(ciTimes(500));
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}dark-room-lit.png` });
  });

  test('the dark room is won in its three ways by the two numbers (D153)', async ({ page }) => {
    await open(page, 'the-dark-room');
    expect(await run(page, solution('the-dark-room'))).toMatch(/^You did it/);
    for (const way of waysOf('the-dark-room')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('.outcome-text')).toHaveText(/^You did it/, { timeout: ciTimes(30_000) });
    }
  });

  test('the door refuses with no key, and from afar', async ({ page }) => {
    await open(page, 'the-dark-room');
    await run(page, 'wizard.cast("kirra")\nwizard.move_right(5)\nwizard.move_down(2)\nstore_door.open()');
    await expect(scene(page)).toHaveAttribute('data-doors', '');
    await expect(page.locator('.outcome-text')).toContainText('locked');
  });
});

test.describe('what the page draws of the chapter', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  test("a level's start shows Dask, and a run takes the camera back to the wizard", async ({ page }) => {
    await open(page, 'past-the-teacher');
    await expect(scene(page)).toHaveAttribute('data-framed', 'true');
    await expect(scene(page)).toHaveAttribute('data-following', 'false');
    await expect(scene(page)).toHaveAttribute('data-zoom', '1');
    await start(page, 'wizard.move_down()');
    await expect(scene(page)).toHaveAttribute('data-following', 'true', { timeout: ciTimes(30_000) });
    await expect(scene(page)).not.toHaveAttribute('data-framed');
  });

  test('a door of two cells opens from either, and frees them both (D150)', async ({ page }) => {
    await open(page, 'the-three-doors');
    // The doors are to find (D344): the nearest, the first door, kept and opened.
    const find = 'next_door = wizard.find_nearest("door")\n';
    await run(page, `${find}wizard.move_left()\nnext_door.open()\nwizard.move_up(2)`);
    await expect(scene(page)).toHaveAttribute('data-doors', 'door_1');
    await expect(scene(page)).toHaveAttribute('data-wizard', '9,10');
    await run(page, `${find}next_door.open()\nwizard.move_up(2)`);
    await expect(scene(page)).toHaveAttribute('data-wizard', '10,10');
  });

  test('the goals box takes the strip where the list would cover the wizard, and stays open (D227)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await open(page, 'the-tunnel-exit');
    const goals = page.locator('.goals');
    await expect(goals).toHaveAttribute('data-revealed', 'true', { timeout: ciTimes(10_000) });
    await expect(goals).toHaveAttribute('data-shape', 'strip');
    await expect(goals).toHaveAttribute('data-strip-covers', '0');
    await page.waitForTimeout(3500);
    await expect(goals).toHaveAttribute('data-folded', 'false');
    await open(page, 'past-the-teacher');
    await expect(page.locator('.goals')).toHaveAttribute('data-shape', 'list');
    await expect(page.locator('.goals')).toHaveAttribute('data-folded', 'false');
  });

  test("the goal's mark lies on the floor, its thin ring seen where an arch covers it, never over the wizard (D160, D168)", async ({ page }) => {
    // In the top arch's opening, behind its stones: its silhouette shows over the stones,
    // the arch's cut-out being its stones and not the opening's dark (D181), from the
    // start to the end of the solution, the wizard standing on it.
    await open(page, 'the-three-doors');
    await expect(scene(page)).toHaveAttribute('data-marks-covered', '10,0', { timeout: ciTimes(10_000) });
    await page.screenshot({ path: `${SHOTS}mark-under-the-arch.png` });
    await run(page, solution('the-three-doors'));
    await expect(scene(page)).toHaveAttribute('data-wizard', '10,0');
    await expect(scene(page)).toHaveAttribute('data-marks-covered', '10,0');
    // The win card's words show their code as code, no backquote left (D140).
    const learned = page.locator('#card-learned');
    await expect(learned.locator('code')).toHaveText('next_door');
    await expect(learned).not.toContainText('`');
    await expect(page.locator('#card-outro')).not.toContainText('`');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}mark-under-the-arch-won.png` });
    // Free at the start, and under the wizard who stands on it at the end: the wizard
    // covers it, and no ring is drawn over the figure.
    await open(page, 'the-tunnel-exit');
    await expect(scene(page)).toHaveAttribute('data-marks-covered', '', { timeout: ciTimes(10_000) });
    await run(page, solution('the-tunnel-exit'));
    await expect(scene(page)).toHaveAttribute('data-wizard', '11,6');
    await page.waitForTimeout(ciTimes(500));
    await expect(scene(page)).toHaveAttribute('data-marks-covered', '');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}mark-under-the-wizard.png` });
  });

  test('the key lies small on the middle of its cell, beside the torch (D109, D164)', async ({ page }) => {
    await open(page, 'the-night-walk');
    await expect(scene(page)).toHaveAttribute('data-drawn', /key:10\.50,3\.50/);
    await page.screenshot({ path: `${SHOTS}key-small.png` });
  });

  test("the way down's hole takes (9, 7) as well as (10, 7): closed under the wizard on it, open once off it, a bump while open (D167)", async ({ page }) => {
    // The friends stand on (9, 2) and (9, 3): the wizard steps into column 9 at the door,
    // to (9, 6), the cell above the hole's second cell. The hole never closes on its own
    // (D178): osto holds it while the wizard steps on, and the hold ends there.
    const toTheEdge =
      'wizard.move_down()\nwizard.pick_up()\nwizard.move_down()\ndoor.open()\nwizard.move_left()\nwizard.move_down(2)\n';
    const onIt = `${toTheEdge}wizard.cast("osto")\nwizard.move_down()\nwizard.wait(6)\n`;
    await open(page, 'the-night-walk');
    // On (9, 7) once the hold is over, the hole open: it stays closed under the wizard, as
    // it does on its one cell (D53).
    await run(page, onIt);
    await expect(scene(page)).toHaveAttribute('data-wizard', '9,7');
    await expect(scene(page)).toHaveAttribute('data-holes', 'hole:closed');
    await page.keyboard.press('Escape');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}hole-under-the-wizard.png` });
    // A step off it, to (9, 8), and it is open behind the wizard.
    await run(page, `${onIt}wizard.move_down()\n`);
    await expect(scene(page)).toHaveAttribute('data-wizard', '9,8');
    await expect(scene(page)).toHaveAttribute('data-holes', 'hole:open');
    await page.keyboard.press('Escape');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}hole-open-behind-the-wizard.png` });
    // A step onto (9, 7) while it is open bumps, and the wizard stays on (9, 6).
    await run(page, `${toTheEdge}while hole.closed:\n    wizard.wait()\nwizard.move_down()\n`);
    await expect(scene(page)).toHaveAttribute('data-wizard', '9,6');
    await expect(scene(page)).toHaveAttribute('data-holes', 'hole:open');
  });

  test("a spell's word shows in italics, with no asterisk (D140)", async ({ page }) => {
    await page.goto('/#level/the-dark-room');
    await expect(page.locator('#card-intro em')).toHaveText('kirra');
    await expect(page.locator('#card-intro')).not.toContainText('*');
  });

  test('with ?debug the enchanted cells are named in the legend (D135)', async ({ page }) => {
    await page.goto('/?debug#level/the-dark-tunnel');
    await page.locator('#start').click();
    await expect(page.locator('.debug-legend')).toContainText('Dark tunnel', { timeout: ciTimes(90_000) });
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
        await page.screenshot({ path: `${SHOTS}story-${id}-${step}.png` });
      }
      await expect(page.locator('#story-go-on')).toBeVisible();
    });
  }
});

test('the map shows chapter 3 in its order', async ({ page }) => {
  await seedWizard(page, MARTA);
  await page.goto('/?debug#map');
  const stops = page.locator('.map-chapter').nth(2).locator('.stop');
  await expect(stops).toHaveCount(ITEMS.length);
  for (const [index, item] of ITEMS.entries()) {
    await expect(stops.nth(index)).toHaveAttribute('data-item', item);
  }
  await page.locator('.map-chapter').nth(2).screenshot({ path: `${SHOTS}map.png` });
});

test.describe('a painted door, at every tick (D156)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, PABLO));

  /** Every tick of the run shown, each door drawn with its painted state as it is then:
   * at the tick it opens, at the run's end, and when the timeline goes back. */
  async function everyTick(page: Page, doors: string[]): Promise<void> {
    const timeline = page.locator('#timeline');
    const last = Number(await timeline.getAttribute('max'));
    for (const tick of [...Array.from({ length: last + 1 }, (_, t) => t), 0, last]) {
      await timeline.fill(String(tick));
      await expect(scene(page)).toHaveAttribute('data-tick', String(tick));
      await expect
        .poll(async () => {
          const open = ((await scene(page).getAttribute('data-doors')) ?? '').split(',');
          const shown = doors.map((door) => `${door}:art-${door}-${open.includes(door) ? 'open' : 'closed'}`);
          return (await scene(page).getAttribute('data-door-looks')) === shown.join(';');
        })
        .toBe(true);
    }
  }

  test('left or right, in both ways, and the three doors', async ({ page }) => {
    await open(page, 'left-or-right');
    expect(await run(page, solution('left-or-right'))).toMatch(/^You did it/);
    for (const way of waysOf('left-or-right')) {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('.outcome-text')).toHaveText(/^You did it/, { timeout: ciTimes(30_000) });
      await everyTick(page, ['left_door', 'right_door']);
    }
    await open(page, 'the-three-doors');
    expect(await run(page, solution('the-three-doors'))).toMatch(/^You did it/);
    await everyTick(page, ['door_1', 'door_2', 'door_3']);
  });
});

for (const [scenery, level] of [
  ['the-tunnel', 'the-doors-corridor'],
  ['the-crossing', 'the-tunnel-exit'],
  ['the-two-doors', 'left-or-right'],
  ['the-three-doors', 'the-three-doors'],
  ['the-long-round', 'past-the-teacher'],
  ['the-storeroom', 'the-opening-hole'],
  ['the-way-down', 'the-night-walk'],
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
