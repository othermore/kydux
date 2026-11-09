// A scene painted in one picture (D76): chapter 1's field drawn from its art,
// the figures from their sheets, and a run played on it. The screenshots go to
// e2e/shots/painted/, which git ignores, for the owner to look at.

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { actsSeen, seedWizard, storyNext, watchActs } from './helpers';

const SHOTS = fileURLToPath(new URL('./shots/painted/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

test.use({ locale: 'en-US', viewport: { width: 1280, height: 800 } });

test('chapter 1 plays on the painted field', async ({ page }) => {
  await seedWizard(page);
  const art = await page.request.get('/content/art/scenes/the-field/art.json');
  expect(art.ok()).toBe(true);
  await page.goto('/#level/the-password');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('2');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}01-password.png` });
  // Zoomed out, the field's painted margin fills the frame to its edges (D83).
  await page.locator('#zoom-out').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-zoom', '0.75');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${SHOTS}12-zoomed-out.png` });
  await page.locator('#zoom-in').click();
  // Where something painted hides the wizard, its outline shows over it.
  await expect(page.locator('#scene')).toHaveAttribute('data-silhouette', 'true');
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.say("ambrel")\nwizard.move_up(6)');
  await watchActs(page);
  await page.locator('#run').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-doors', 'gate', { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}02-through-the-gate.png` });
  // Won, the wizard celebrates before the win card (14.3).
  await expect.poll(() => actsSeen(page), { intervals: [50], timeout: 30_000 }).toContain('win');
  await page.screenshot({ path: `${SHOTS}14-won-celebrating.png` });
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.win-card .star').nth(2)).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${SHOTS}03-won.png` });
});

test('the castle door opens onto the dark', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-way-in');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('2');
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.move_up(2)\nwizard.cast("zelim")\nwizard.say("ambrel")\nwizard.move_up()');
  await page.locator('#run').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-doors', /castle_door/, { timeout: 30_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}04-castle-door.png` });
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
});

test('the story at the gate is told on the field', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#story/at-the-gate');
  await expect(page.locator('#scene')).toHaveAttribute('data-state', 'done');
  await storyNext(page, 3);
  await expect(page.locator('#scene')).toHaveAttribute('data-actors', 'friend:8,21,up');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}05-at-the-gate.png` });
});

test('the wizard is drawn in the look chosen, and the friend is of the other gender in colours unlike the wizard’s (D77, D90)', async ({ browser }) => {
  for (const [gender, look, friend] of [
    ['girl', 'teal', 'teku-b'],
    ['girl', 'sky', 'teku-a'],
    ['boy', 'amber', 'nuri-a'],
    ['boy', 'moss', 'nuri-b'],
  ] as const) {
    const context = await browser.newContext({ locale: 'en-US' });
    await seedWizard(context, { name: 'Ana', gender, look });
    const page = await context.newPage();
    await page.goto('/#level/the-corridor');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await expect(page.locator('#scene')).toHaveAttribute('data-wizard-figure', `wizard-${look}`);
    await expect(page.locator('#scene')).toHaveAttribute('data-friend-figure', friend);
    await page.screenshot({ path: `${SHOTS}06-${gender}-${look}.png` });
    await context.close();
  }
});

test('a spell is cast with the wand, the seal breaks, a door opens through its half-open state, and a word waits for the seal (13.9)', async ({
  page,
}) => {
  await seedWizard(page);
  await page.goto('/#level/the-sealed-door');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('1');
  const scene = page.locator('#scene');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_left(2)\nwizard.move_up(3)\nwizard.cast("zelim")');
  await page.locator('#run').click();
  // The casting frames play; the seal's glow goes.
  await expect.poll(() => scene.getAttribute('data-casting'), { intervals: [50], timeout: 30_000 }).toBe('true');
  await page.screenshot({ path: `${SHOTS}09-casting.png` });
  await expect(scene).toHaveAttribute('data-glowing', 'castle_door', { timeout: 10_000 });
  await expect(scene).toHaveAttribute('data-doors', 'gate,seal_gate');

  // The gate, opened by its word, is seen half open first.
  await page.goto('/#level/the-password');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('1');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.say("ambrel")');
  await page.locator('#run').click();
  await expect.poll(() => scene.getAttribute('data-opening'), { intervals: [50], timeout: 30_000 }).toBe('gate');
  await page.screenshot({ path: `${SHOTS}10-door-half-open.png` });
  await expect(scene).toHaveAttribute('data-doors', /gate/, { timeout: 10_000 });

  // The castle's door hears no word while its seal holds: said first, it is not
  // heard; the spell, then the word, open it. The mark in its doorway lies on the
  // ground under the shut door, its ring drawn over the door (D160).
  await page.goto('/#level/the-way-in');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await expect(scene).toHaveAttribute('data-marks-covered', '8,6');
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_up(2)\nwizard.say("ambrel")\nwizard.cast("zelim")');
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
  await expect(scene).not.toHaveAttribute('data-doors', /castle_door/);
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_up(2)\nwizard.cast("zelim")\nwizard.say("ambrel")');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-doors', /castle_door/, { timeout: 30_000 });
});

test('with ?debug the scene shows its cells, for a tester to name one', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/?debug#level/the-sealed-door');
  await page.locator('#start').click();
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-debug', 'true', { timeout: 90_000 });
  // The numbers are on at first; the cells' kinds and the masks are turned on by hand.
  await expect(scene).toHaveAttribute('data-debug-layers', 'numbers');
  await page.locator('#debug-cells').click();
  await page.locator('#debug-masks').click();
  await expect(scene).toHaveAttribute('data-debug-layers', 'numbers,cells,masks');
  await expect(page.locator('.debug-legend')).toBeVisible();
  // Each kind is named with its letter in the scene's map.txt (16.6): the field's
  // grass is `g` and its trees `t`.
  await expect(page.locator('.debug-legend')).toContainText(/(^|\s)\S( \S)* · /);
  await page.screenshot({ path: `${SHOTS}11-debug-cells.png` });
  await page.locator('#debug-masks').click();
  await expect(scene).toHaveAttribute('data-debug-layers', 'numbers,cells');
  await page.goto('/#level/the-gate');
  await page.locator('#start').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-state', /./, { timeout: 90_000 });
  await expect(page.locator('#scene')).not.toHaveAttribute('data-debug', /./);
});

test('the outline shows only where more than a quarter of the wizard is hidden', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  const scene = page.locator('#scene');
  // At the start nothing stands in front of the wizard.
  await expect(scene).toHaveAttribute('data-silhouette', 'true');
  await expect(scene).not.toHaveAttribute('data-outlined', /./);
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  // At 9,23 what is painted in front hides the wizard (tools/art/sweep.py).
  await page.keyboard.insertText('wizard.move_down(3)\nwizard.move_right()');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-wizard', '9,23', { timeout: 30_000 });
  await expect(scene).toHaveAttribute('data-outlined', 'true');
  await page.screenshot({ path: `${SHOTS}15-outlined.png` });
});

test('the wizard bends to pick the wand up, and celebrates a win (14.3)', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-wand');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('1');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(3)\nwizard.pick_up()\nwizard.move_left()\nwizard.move_down()');
  await watchActs(page);
  await page.locator('#run').click();
  const scene = page.locator('#scene');
  await expect.poll(() => actsSeen(page), { intervals: [50], timeout: 30_000 }).toContain('pickup');
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${SHOTS}13-pick-up.png` });
  await expect(scene).toHaveAttribute('data-carried', /wand/, { timeout: 10_000 });
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  expect(await actsSeen(page)).toEqual(['pickup', 'win']);
});
