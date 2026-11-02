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
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}asleep-friend.png` });
  });

  test('the mate lies asleep in the morning, and gets up to speak (D91)', async ({ page }) => {
    await seedWizard(page, PABLO);
    await page.goto('/#story/the-morning');
    const scene = page.locator('#scene');
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
  });
});

test.describe('in the library (D85, D86, D51)', () => {
  test.use({ locale: 'en-US' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('the hidden key is out of sight until it is revealed', async ({ page }) => {
    await open(page, 'the-hidden-key');
    await expect(page.locator('#scene')).not.toHaveAttribute('data-revealed', /./);
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('key = wizard.find_nearest("key")\nkey.reveal()\nwizard.wait(4)');
    await page.locator('#run').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-revealed', 'key', { timeout: 30_000 });
    await page.screenshot({ path: `${SHOTS}revealed.png` });
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

  test('Ilda goes dark as she walks into the middle arch', async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto('/#story/the-entrance');
    const scene = page.locator('#scene');
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 90_000 });
    await expect(scene).not.toHaveAttribute('data-shade', /./);
    await storyNext(page, 5);
    await expect(scene).toHaveAttribute('data-state', 'done', { timeout: 30_000 });
    await expect(scene).toHaveAttribute('data-shade', /^ilda:0\.\d\d$/);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}into-the-arch.png` });
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
