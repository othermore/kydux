// Chapter 2 as the child plays it (sprint 15): every level won by its solution, in
// Spanish for a girl and in English for a boy; the dormitory's arch that refuses
// the wizard, and sleep; the hidden key revealed; the moving key in its three
// ways; each story told to its end; the map in the chapter's order. Screenshots of
// every stop go to e2e/shots/chapter-2/, which git ignores, for the owner.

import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, type SeededWizard, seedWizard, storyNext } from './helpers';

const SHOTS = fileURLToPath(new URL('./shots/chapter-2/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const PABLO: SeededWizard = { name: 'Pablo', gender: 'boy', look: 'amber' };

const ITEMS: string[] = JSON.parse(readFileSync(`${CONTENT}chapters/02-the-library/chapter.json`, 'utf8')).items;
const LEVELS = ITEMS.filter((item) => item.startsWith('level:')).map((item) => item.slice('level:'.length));
const STORIES = ITEMS.filter((item) => item.startsWith('story:')).map((item) => item.slice('story:'.length));
const solution = (id: string) => readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8');

test.use({ viewport: { width: 1280, height: 800 } });

/** A level opened and ready to run, at speed 4. */
async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
}

/** The child's code typed into the editor and run; the card's words once it ends. */
async function run(page: Page, code: string): Promise<string> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 60_000 });
  return page.locator('.outcome-text').innerText();
}

for (const [wizard, locale, won] of [
  [MARTA, 'es-ES', /^¡Lo has conseguido/],
  [PABLO, 'en-US', /^You did it/],
] as const) {
  test.describe(`chapter 2 for ${wizard.name}`, () => {
    test.use({ locale });
    test.beforeEach(({ page }) => seedWizard(page, wizard));

    for (const id of LEVELS) {
      test(`${id} is won by its solution`, async ({ page }) => {
        await open(page, id);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-start.png` });
        expect(await run(page, solution(id))).toMatch(won);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-won.png` });
      });
    }
  });
}

/** From the wizard's dormitory, round the common room's table, into the other's doorway. */
const OTHER_DORMITORY = [
  'wizard.move_down(2)',
  'wizard.move_left(2)',
  'wizard.move_down()',
  'wizard.move_left(4)',
  'wizard.move_up()',
  'wizard.move_left()',
].join('\n');

test.describe('in the dormitory (D84)', () => {
  test.use({ locale: 'en-US' });

  test("the other dormitory's arch refuses the wizard, with the wizard's own words", async ({ page }) => {
    await seedWizard(page, PABLO);
    await open(page, 'your-bed');
    await run(page, OTHER_DORMITORY);
    await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '10,9');
    await expect(page.locator('.outcome-text')).toContainText("girls' dormitory");
  });

  test('a girl wizard is refused the boys’ dormitory', async ({ page }) => {
    await seedWizard(page, MARTA);
    await open(page, 'your-bed');
    await run(page, OTHER_DORMITORY);
    await expect(page.locator('.outcome-text')).toContainText("boys' dormitory");
  });

  test('sleep beside the free bed ends the level; elsewhere it is refused', async ({ page }) => {
    await seedWizard(page, MARTA);
    await open(page, 'your-bed');
    // The mate lies asleep from the start, under the sheet, and no one else (D96, D97).
    await expect(page.locator('#scene')).toHaveAttribute('data-asleep', 'mate:bed_1:lying');
    expect(await run(page, 'wizard.sleep()')).toContain('There is no bed right beside me.');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(solution('your-bed'));
    await page.locator('#run').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-sleeping', 'bed_2', { timeout: 60_000 });
    await expect(page.locator('#scene')).toHaveAttribute('data-asleep', /wizard:bed_2:lying/);
    // Asleep under the quilt, the wizard is not outlined as hidden.
    await expect(page.locator('#scene')).not.toHaveAttribute('data-outlined', 'true');
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}asleep.png` });
    await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  });

  test('the cell to sleep from is marked, and the wizard walks to the pillow and lies down, a tick each (D130)', async ({
    page,
  }) => {
    await seedWizard(page, MARTA);
    await open(page, 'your-bed');
    const scene = page.locator('#scene');
    // The cell before the free bed's trunk, ringed with a sign of sleep.
    await expect(scene).toHaveAttribute('data-marks', '16,8');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s26-sleep-mark.png` });
    await page.locator('#speed').selectOption('1');
    // When the wizard is taken to be asleep in the bed, and when lying in it.
    await scene.evaluate((node) => {
      const seen: [string, number][] = [];
      (window as unknown as { kyduxAsleep: [string, number][] }).kyduxAsleep = seen;
      new MutationObserver(() => {
        const asleep = (node.getAttribute('data-asleep') ?? '').split(',').find((s) => s.startsWith('wizard'));
        if (asleep && seen.at(-1)?.[0] !== asleep) seen.push([asleep, performance.now()]);
      }).observe(node, { attributes: true, attributeFilter: ['data-asleep'] });
    });
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(solution('your-bed'));
    await page.locator('#run').click();
    await expect(scene).toHaveAttribute('data-asleep', /wizard:bed_2(,|$)/, { timeout: 60_000 });
    // A tick apart at speed 1: walking along the bed, lying down, lying.
    for (const shot of [1, 2, 3]) {
      await page.waitForTimeout(shot === 1 ? 200 : 400);
      await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s26-sleep-${shot}.png` });
    }
    await expect(scene).toHaveAttribute('data-asleep', /wizard:bed_2:lying/, { timeout: 15_000 });
    const seen = await page.evaluate(() => (window as unknown as { kyduxAsleep: [string, number][] }).kyduxAsleep);
    const [begun, lying] = [seen.find(([s]) => s === 'wizard:bed_2'), seen.find(([s]) => s === 'wizard:bed_2:lying')];
    expect(begun && lying, JSON.stringify(seen)).toBeTruthy();
    // Lying only after the walk's tick and most of the next: 1.7 ticks of 400 ms.
    expect(lying![1] - begun![1]).toBeGreaterThan(400 * 1.6);
  });

  test('going to sleep, the night falls and the morning comes before the card (D124)', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await seedWizard(page, MARTA);
    await open(page, 'your-bed');
    const scene = page.locator('#scene');
    await expect(scene).toHaveAttribute('data-light', 'none');
    // The night painting, its picture by morning unseen until the dawn (D126).
    await expect(scene).toHaveAttribute('data-ground', 'painting');
    // Every light the scene goes through, as it goes (data-light).
    await scene.evaluate((node) => {
      const seen: string[] = [];
      (window as unknown as { kyduxLights: string[] }).kyduxLights = seen;
      new MutationObserver(() => {
        const light = node.getAttribute('data-light');
        if (light && seen.at(-1) !== light) seen.push(light);
      }).observe(node, { attributes: true, attributeFilter: ['data-light'] });
    });
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(solution('your-bed'));
    await page.locator('#run').click();
    await expect(scene).toHaveAttribute('data-light', 'night', { timeout: 60_000 });
    // The sleeper is seen asleep in the night, with no card over it.
    await expect(page.locator('.win-card')).toHaveCount(0);
    await expect(scene).toHaveAttribute('data-thought', 'z z z');
    await expect(scene).toHaveAttribute('data-ground', 'painting');
    await page.screenshot({ path: `${SHOTS}night.png` });
    // At the dawn the whole scene turns to day as the night lifts, its torches,
    // candles and fire out, and no light is laid over the morning (D126).
    await expect(scene).toHaveAttribute('data-ground', 'morning', { timeout: 15_000 });
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s26-morning-after-dawn.png` });
    await expect(scene).toHaveAttribute('data-light', 'morning', { timeout: 15_000 });
    await expect(page.locator('.win-card')).toBeVisible({ timeout: 15_000 });
    await expect(scene).not.toHaveAttribute('data-thought', 'z z z');
    await page.screenshot({ path: `${SHOTS}morning-light.png` });
    expect(await page.evaluate(() => (window as unknown as { kyduxLights: string[] }).kyduxLights)).toEqual([
      'falling',
      'night',
      'dawning',
      'morning',
    ]);
    // Played again, the level starts again (D75) under the painting's own light.
    await page.locator('#again').click();
    await page.locator('#run').click();
    await expect(scene).toHaveAttribute('data-restarting', 'true');
    await expect(scene).toHaveAttribute('data-light', 'none');
    await expect(scene).not.toHaveAttribute('data-restarting', 'true');
    await expect(scene).toHaveAttribute('data-light', 'none');
    await expect(scene).toHaveAttribute('data-ground', 'painting');
    await context.close();
  });

  test('at the first night, the friend and the mate go to bed, each in their dormitory (D96)', async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto('/#story/the-first-night');
    const scene = page.locator('#scene');
    for (let step = 1; step < 9; step += 1) {
      await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
      await storyNext(page);
    }
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
    await expect(scene).toHaveAttribute('data-asleep', 'friend:bed_6:lying,mate:bed_1:lying');
    // The first night is told on the night painting as it is (D124).
    await expect(scene).toHaveAttribute('data-light', 'none');
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}asleep-friend.png` });
  });

  test("at the first night, Ilda opens the door with no one behind its leaf, whose cells ?debug shows (D125)", async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto('/?debug#story/the-first-night');
    const scene = page.locator('#scene');
    await expect(scene).toHaveAttribute('data-debug', 'true', { timeout: 90_000 });
    if ((await scene.getAttribute('data-debug-layers'))?.includes('cells') !== true) await page.locator('#debug-cells').click();
    for (let step = 1; step < 5; step += 1) {
      await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
      await storyNext(page);
    }
    // Step 5: Ilda opens the door, steps out and shuts it; while it is open, the
    // cells its leaf lies on are not walked.
    await expect(scene).toHaveAttribute('data-debug-leaves', '9,15;10,15', { timeout: 30_000 });
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}door-leaf-debug.png` });
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
    await expect(scene).not.toHaveAttribute('data-debug-leaves', /./);
    await expect(scene).not.toHaveAttribute('data-shoved', /./);
  });

  test('the mate lies asleep in the morning, and gets up to speak (D91)', async ({ page }) => {
    await seedWizard(page, PABLO);
    await page.goto('/#story/the-morning');
    const scene = page.locator('#scene');
    // Told in the morning (D124) on the scene's picture by morning, whole, from the
    // first step (D126).
    await expect(scene).toHaveAttribute('data-light', 'morning');
    await expect(scene).toHaveAttribute('data-ground', 'morning');
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
    await expect(scene).toHaveAttribute('data-asleep', 'mate:bed_1:lying');
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}asleep-mate.png` });
    await storyNext(page);
    await expect(scene).not.toHaveAttribute('data-asleep', /mate/);
    await expect(scene).toHaveAttribute('data-actors', /mate:16,5/);
    // The two leave together (D103): the wizard opens the door, both go out, the
    // mate shuts it behind them.
    await storyNext(page, 3);
    await expect(scene).toHaveAttribute('data-actors', /mate:13,12/, { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-wizard', '12,12');
    await storyNext(page);
    await expect(scene).toHaveAttribute('data-wizard', '11,15', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-actors', /mate:12,15/, { timeout: 30_000 });
    await expect(scene).not.toHaveAttribute('data-doors', /front_door/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}morning-out.png` });
    // Back and Again keep the morning's light.
    await page.locator('#story-back').click();
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-light', 'morning');
    await page.locator('#story-again').click();
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-light', 'morning');
    await expect(scene).toHaveAttribute('data-ground', 'morning');
    // Zoomed out, the windows with the morning sky in them, the fire and the
    // candles out (D126).
    while ((await page.locator('#zoom-out').count()) > 0 && (await page.locator('#zoom-out').isEnabled())) {
      await page.locator('#zoom-out').click();
    }
    await page.waitForTimeout(600);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s26-morning-story.png` });
  });
});

test.describe('in the library (D85, D86, D51)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('the hidden key is out of sight under the bookcase until it is revealed', async ({ page }) => {
    await open(page, 'the-hidden-key');
    await expect(page.locator('#scene')).not.toHaveAttribute('data-revealed', /./);
    // Laid under the front bookcase, in its cell's middle, drawn under the shelves (D109).
    await expect(page.locator('#scene')).toHaveAttribute('data-drawn', /key:3\.50,14\.50/);
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('key = wizard.find_nearest("key")\nkey.reveal()\nwizard.wait(4)');
    await page.locator('#run').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-revealed', 'key', { timeout: 30_000 });
    await page.screenshot({ path: `${SHOTS}revealed.png` });
    // The glow is the key's own shape, traced on its outline, with no line of the floor.
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s26-key-glow.png` });
  });

  test('the old book by the pile glows in its own shape, nothing of the pile with it', async ({ page }) => {
    await open(page, 'the-lost-book');
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('book = wizard.find_nearest("book")\nbook.reveal()\nwizard.move_up(2)\nwizard.move_right(4)\nwizard.move_up(4)\nwizard.move_left(6)');
    await page.locator('#run').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-revealed', 'old_book', { timeout: 30_000 });
    await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: 60_000 });
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s26-book-glow.png` });
  });

  test('the moving key: the given program fails a way, distance_to wins all three', async ({ page }) => {
    await page.goto('/#level/the-moving-key');
    await expect(page.locator('#card-ways li')).toHaveCount(3);
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
    const given = JSON.parse(readFileSync(`${CONTENT}levels/the-moving-key/text.en.json`, 'utf8')).starting_code;
    expect(await run(page, given)).toContain('In the way “The key is near”');
    expect(await run(page, solution('the-moving-key'))).toContain('In every way!');
  });
});

test.describe('in the entrance (D100)', () => {
  test.use({ locale: 'es-ES' });

  test('Ilda goes dark as she walks into the middle arch, and the two follow her side by side', async ({
    page,
  }) => {
    await seedWizard(page, MARTA);
    await page.goto('/#story/the-entrance');
    const scene = page.locator('#scene');
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
    await expect(scene).not.toHaveAttribute('data-shade', /./);
    await storyNext(page, 5);
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-shade', /^ilda:0\.\d\d$/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}into-the-arch.png` });
    // The two children follow her side by side, at once (D103), under the
    // chandelier, which hangs over every head (D95).
    await storyNext(page);
    await expect(scene).toHaveAttribute('data-wizard', '20,13', { timeout: 30_000 });
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s25-lamp.png` });
    await expect(scene).toHaveAttribute('data-wizard', '20,8', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-actors', /friend:19,8/);
  });
});

test.describe('at the wand bank (D128)', () => {
  test.use({ locale: 'es-ES' });

  test('the friend walks out from behind the high shelf into the gap before the counter', async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto('/#story/the-wand-bank');
    const scene = page.locator('#scene');
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
    await expect(scene).not.toHaveAttribute('data-actors', /friend:/);
    await storyNext(page, 4);
    // Step 5: in sight from the step's start, on 10,5, drawn stepping out from 9,5.
    await page.waitForFunction(() => /friend:10,5/.test(document.querySelector('#scene')?.getAttribute('data-actors') ?? ''), null, {
      polling: 'raf',
      timeout: 30_000,
    });
    await page.waitForTimeout(60);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s25-friend-steps-out.png` });
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-actors', /friend:10,5,down/);
  });
});

test.describe('the stories', () => {
  test.use({ locale: 'es-ES' });

  for (const id of STORIES) {
    test(`${id} is told to its end`, async ({ page }) => {
      await seedWizard(page, MARTA);
      await page.goto(`/#story/${id}`);
      await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
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

test('the map shows chapter 2 in its order', async ({ page }) => {
  await seedWizard(page, MARTA);
  await page.goto('/?debug#map');
  const stops = page.locator('.map-chapter').nth(1).locator('.stop');
  await expect(stops).toHaveCount(ITEMS.length);
  for (const [index, item] of ITEMS.entries()) {
    await expect(stops.nth(index)).toHaveAttribute('data-item', item);
  }
  await page.locator('.map-chapter').nth(1).screenshot({ path: `${SHOTS}map.png` });
});

for (const scene of ['the-entrance', 'the-dormitory', 'the-library']) {
  test(`${scene} zoomed out`, async ({ page }) => {
    await seedWizard(page, MARTA);
    const id = scene === 'the-entrance' ? 'story/the-entrance' : scene === 'the-dormitory' ? 'level/your-bed' : 'level/the-lost-book';
    await page.goto(`/#${id}`);
    if (id.startsWith('level')) await page.locator('#start').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-state', /./, { timeout: 90_000 });
    // A story's camera is the story's; a level's zooms out as far as it goes.
    while ((await page.locator('#zoom-out').count()) > 0 && (await page.locator('#zoom-out').isEnabled())) {
      await page.locator('#zoom-out').click();
    }
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}${scene}-zoomed-out.png` });
  });
}
