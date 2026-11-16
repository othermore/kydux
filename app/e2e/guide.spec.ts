// The screen's guide (D68): the first level opens it once, the first time, over its
// scene drawn and before its start card, which opens after it (D258); it shows each
// part of the screen in turn, the notebook's panel and its button together with an
// arrow to each, and that level's card, once the guide has been seen, plays it again;
// no other level's card does (D248).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';

test.use({ locale: 'en-US' });

const STEPS = ['scene', 'goals', 'editor', 'run', 'notebook', 'hint', 'about', 'method'];
/** How many parts of the screen each step shows. */
const SHOWN: Record<string, number> = { run: 2, notebook: 2, method: 0 };
/** The gate's words: its goal and what the friend says on its card. */
const GATE = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../content/levels/the-gate/text.en.json', import.meta.url)), 'utf8'),
) as { goals: string[]; intro: string };

/** The start card of a first opening: the friend's words, the goal, and Start. */
const expectFirstCard = async (page: Page) => {
  await expect(page.locator('.start-card')).toBeVisible();
  await expect(page.locator('#card-intro')).toContainText(GATE.intro);
  await expect(page.locator('.start-goals')).toContainText(GATE.goals[0] as string);
  await expect(page.locator('#start')).toHaveText('Start');
};

test("a new game at the gate: the guide first, over the scene drawn; the card after it; its card offers it again, and no other level's does (D258, D248)", async ({
  page,
}) => {
  await page.goto('/#level/the-gate');
  // The first time, no card opens with the page: the guide opens by itself once the
  // scene has drawn the level and the goals box is shown.
  const guide = page.locator('.guide');
  await expect(guide).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.start-card')).toHaveCount(0);
  await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
  await expect(page.locator('#scene canvas')).toBeVisible();
  for (const [index, step] of STEPS.entries()) {
    await expect(guide).toHaveAttribute('data-step', step);
    await expect(page.locator('#guide-count')).toHaveText(`${index + 1} of ${STEPS.length}`);
    await expect(page.locator('#guide-title')).not.toBeEmpty();
    // The goals' step outlines the box, shown, with the goal in it.
    if (step === 'goals') {
      await expect(page.locator('.goals')).toBeVisible();
      await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
      await expect(page.locator('.goals')).toContainText(GATE.goals[0] as string);
    }
    // The notebook is open for its own step, and only then.
    if (step === 'notebook') await expect(page.locator('#notebook')).toBeVisible();
    else await expect(page.locator('#notebook')).toBeHidden();
    // Each part shown is outlined; the card points at the first, an arrow at each other.
    const shown = SHOWN[step] ?? 1;
    await expect(guide).toHaveAttribute('data-shown', String(shown));
    await expect(page.locator('.guide-spot')).toHaveCount(shown);
    await expect(page.locator('.guide-arrow')).toHaveCount(Math.max(0, shown - 1));
    await expect(page.locator('#guide-next')).toHaveText(index === STEPS.length - 1 ? "Let's go!" : 'Next');
    if (step === 'notebook') await page.screenshot({ path: fileURLToPath(new URL('./shots/painted/07-guide-notebook.png', import.meta.url)) });
    await page.locator('#guide-next').click();
  }
  await expect(guide).toHaveCount(0);
  // Then the card of a first opening, which has no Show me the screen; Start starts the
  // level, the goals box open.
  await expectFirstCard(page);
  await expect(page.locator('#show-screen')).toHaveCount(0);
  await page.locator('#start').click();
  await expect(page.locator('.start-card')).toBeHidden();
  await expect(page.locator('.goals')).toBeVisible();
  await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
  await expect(page.locator('.goals')).not.toHaveAttribute('data-folded', 'true');

  // Once seen, it does not open again by itself; the card, open at every opening, offers
  // it, and the button opens it, and the card again after it.
  await page.reload();
  await expect(page.locator('.start-card')).toBeVisible();
  await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true', { timeout: 30_000 });
  await expect(guide).toHaveCount(0);
  await page.locator('#show-screen').click();
  await expect(page.locator('.start-card')).toHaveCount(0);
  await expect(guide).toHaveAttribute('data-step', 'scene');
  await page.locator('#guide-skip').click();
  await expect(guide).toHaveCount(0);
  await expect(page.locator('.start-card')).toBeVisible();
  await expect(page.locator('#start')).toHaveText('Continue');
  await page.locator('#start').click();
  await expect(page.locator('.start-card')).toBeHidden();

  // The card opened again with ? offers it too.
  await page.locator('#about').click();
  await expect(page.locator('#show-screen')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.start-card')).toBeHidden();

  // Another level's card has no such button, opened by itself or with ?.
  await page.goto('/#level/the-long-corridor');
  await expect(page.locator('.start-card')).toBeVisible();
  await expect(page.locator('#show-screen')).toHaveCount(0);
  await page.locator('#start').click();
  await expect(guide).toHaveCount(0);
  await page.locator('#about').click();
  await expect(page.locator('.start-card')).toBeVisible();
  await expect(page.locator('#show-screen')).toHaveCount(0);
});

test('the guide skipped at its first step gives way to the card (D258)', async ({ page }) => {
  await page.goto('/#level/the-gate');
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'scene', { timeout: 30_000 });
  await page.locator('#guide-skip').click();
  await expect(page.locator('.guide')).toHaveCount(0);
  await expectFirstCard(page);
  await page.locator('#start').click();
  await expect(page.locator('.start-card')).toBeHidden();
});

test('while the scene is not drawn there is no guide and no card; drawn, the guide opens (D258)', async ({ page }) => {
  // The scene's pictures and the world held back until the test lets them go.
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  for (const pattern of ['**/content/art/**', '**/world.zip*']) {
    await page.route(pattern, async (route) => {
      await held;
      await route.continue();
    });
  }
  await page.goto('/#level/the-gate');
  await expect(page.locator('#scene')).toBeAttached();
  await page.waitForTimeout(2500);
  await expect(page.locator('.guide')).toHaveCount(0);
  await expect(page.locator('.start-card')).toHaveCount(0);
  await expect(page.locator('.goals')).not.toHaveAttribute('data-revealed', 'true');
  release();
  await expect(page.locator('.guide')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
  await expect(page.locator('.start-card')).toHaveCount(0);
});

test("the guide's words not read: no guide, the card opens and the level plays; the guide is still to be seen (D258)", async ({
  page,
}) => {
  await page.route('**/content/guide/**', (route) => route.abort());
  await page.goto('/#level/the-gate');
  await expectFirstCard(page);
  await expect(page.locator('.guide')).toHaveCount(0);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_up(1)\n');
  await page.locator('#run').click();
  await expect(page.locator('#scene')).not.toHaveAttribute('data-tick', '0', { timeout: 30_000 });
  // Its words read at the next opening, the guide comes first.
  await page.unroute('**/content/guide/**');
  await page.reload();
  await expect(page.locator('.guide')).toHaveAttribute('data-step', 'scene', { timeout: 30_000 });
  await expect(page.locator('.start-card')).toHaveCount(0);
});

test('the guide is in the child\'s language', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#level/the-gate');
  await expect(page.locator('#guide-title')).toHaveText('La escena del juego', { timeout: 30_000 });
  // The owner's own words open the step (sprint 13, section 2).
  await expect(page.locator('#guide-text')).toContainText('Aquí ves el juego y los personajes del juego.');
  await expect(page.locator('#guide-next')).toHaveText('Siguiente');
  await expect(page.locator('#guide-skip')).toHaveText('Saltar');
  await context.close();
});
