// A scene painted in one picture (D76): chapter 1's field drawn from its art,
// the figures from their sheets, and a run played on it. The screenshots go to
// e2e/shots/painted/, which git ignores, for the owner to look at.

import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { seedWizard, storyNext } from './helpers';

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
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.say("ambrel")\nwizard.move_up(6)');
  await page.locator('#run').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-doors', 'gate', { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${SHOTS}02-through-the-gate.png` });
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
  await page.keyboard.insertText('wizard.move_up(2)\nwizard.say("ambrel")\nwizard.cast("zelim")\nwizard.move_up()');
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

test('the wizard is drawn in the look chosen, and the friend is of the other gender (D77)', async ({ browser }) => {
  for (const [gender, look, friend] of [
    ['girl', 'teal', 'teku'],
    ['boy', 'amber', 'nuri'],
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

test('a spell is cast with the wand, the seal breaks, and a door opens through its half-open state (13.9)', async ({
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

  // The castle's door, opened by the word and the spell, is seen half open first.
  await page.goto('/#level/the-way-in');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('1');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_up(2)\nwizard.say("ambrel")\nwizard.cast("zelim")');
  await page.locator('#run').click();
  await expect.poll(() => scene.getAttribute('data-opening'), { intervals: [50], timeout: 30_000 }).toBe('castle_door');
  await page.screenshot({ path: `${SHOTS}10-door-half-open.png` });
  await expect(scene).toHaveAttribute('data-doors', /castle_door/, { timeout: 10_000 });
});
