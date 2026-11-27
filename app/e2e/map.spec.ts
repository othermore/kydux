import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

const stop = (page: Page, item: string) => page.locator(`.stop[data-item="${item}"]`);
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));

test('the map shows the course in order: the first stop open, the rest locked', async ({ page }) => {
  await page.goto('/#map');
  await expect(page.locator('.map-chapter h2')).toHaveText(['Arrival', 'The library', 'The passages', 'The broom', 'The familiar']);
  const first = page.locator('.stop').first();
  // The opening is chapter 1's first story, numbered like the rest (D78).
  await expect(first).toHaveAttribute('data-item', 'story:the-letter');
  await expect(first).toHaveAttribute('data-state', 'open');
  await expect(first).toContainText('Story 1');
  await expect(first).toContainText('The letter');
  await expect(first.locator('.stop-icon.story')).toHaveCount(1);
  // The first locked stop is named; the ones after it show only their kind (D71).
  const gateStory = stop(page, 'story:at-the-gate');
  await expect(gateStory).toHaveAttribute('data-state', 'locked');
  await expect(gateStory).toContainText('At the gate');
  const lesson = stop(page, 'lesson:what-a-program-is');
  await expect(lesson).toHaveAttribute('data-state', 'locked');
  await expect(lesson).toHaveAttribute('data-unnamed', 'true');
  const gate = stop(page, 'level:the-gate');
  await expect(gate).toHaveAttribute('data-state', 'locked');
  await expect(gate).toHaveAttribute('data-unnamed', 'true');
  await expect(gate.locator('.stop-title')).toHaveText('Practice 1 ?');
  await expect(gate.locator('a')).toHaveCount(0);
});

test('a level won and opened again from the map opens on the program that won (D351)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  // Play again keeps the program the child typed, while the screen is open.
  await page.locator('#again').click();
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(8)');
  await page.locator('#level-map').click();
  await stop(page, 'level:the-long-corridor').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(8)');
});

test('a won level is done with its stars, and opens the next stop', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  await page.locator('#level-map').click();
  const won = stop(page, 'level:the-long-corridor');
  await expect(won).toHaveAttribute('data-state', 'done');
  // One line, no hint, no bump: every star (D57).
  await expect(won.locator('.stop-stars')).toHaveText('★★★');
  await expect(stop(page, 'level:the-stairs')).toHaveAttribute('data-state', 'open');
  await expect(stop(page, 'lesson:words')).toHaveAttribute('data-state', 'locked');
});

test('the map in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#map');
  await expect(page.locator('.map-chapter h2').first()).toHaveText('La llegada');
  await expect(stop(page, 'level:the-hidden-key').locator('.stop-number')).toHaveText('Práctica 7');
  await context.close();
});

test('from a level, the map opens over it, says where you are, and closes back to it (D71)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(2)');

  await page.locator('#level-map').click();
  const overlay = page.locator('#map-overlay');
  await expect(overlay).toBeVisible();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
  const here = overlay.locator('.stop[data-here="true"]');
  await expect(here).toHaveAttribute('data-item', 'level:the-long-corridor');
  await expect(here).toContainText('You are here');
  await page.locator('#map-close').click();
  await expect(overlay).toHaveCount(0);
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(2)');

  // A stop chosen on the map is gone to.
  await page.locator('#level-map').click();
  // With no wizard yet, the open story is the letter, chapter 1's first (D78).
  await overlay.locator('.stop[data-item="story:the-letter"] a').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
});

for (const [width, height] of [
  [1280, 800],
  [900, 600],
] as const) {
  test(`from a level, the map is a window over it, the level seen all round it, at ${width} by ${height} (D352)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#level/the-long-corridor');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(8)');
    await page.locator('#level-map').click();
    const frame = page.locator('#map-window');
    await expect(frame).toBeVisible();
    await expect(frame.locator('#map-window-title')).toHaveText('Map');
    await expect(page.locator('#map-close')).toHaveText('✕ Back to the level');
    const box = (await frame.boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    expect(box.width).toBeLessThanOrEqual(1100);
    expect(box.height).toBeLessThanOrEqual(height * 0.9 + 1);
    // A margin of the level all round it.
    expect(box.x).toBeGreaterThan(20);
    expect(box.y).toBeGreaterThan(10);
    expect(width - box.x - box.width).toBeGreaterThan(20);
    expect(height - box.y - box.height).toBeGreaterThan(10);
    // The close button at the top right.
    const close = (await page.locator('#map-close').boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
    expect(close.x + close.width).toBeGreaterThan(box.x + box.width - 40);
    expect(close.y).toBeLessThan(box.y + 50);
    await page.screenshot({ path: `${SHOTS}map-window-${width}x${height}.png` });
    // Closed by a click outside it, by Escape and by its button, onto the level as it was.
    await page.mouse.click(Math.max(4, box.x / 2), height / 2);
    await expect(page.locator('#map-overlay')).toHaveCount(0);
    await page.locator('#level-map').click();
    await page.keyboard.press('Escape');
    await expect(page.locator('#map-overlay')).toHaveCount(0);
    // A run going on stays going on under the window.
    await page.locator('#speed').selectOption('1');
    await page.locator('#run').click();
    await expect(page.locator('#stop')).toBeEnabled({ timeout: ciTimes(30_000) });
    await page.locator('#level-map').click();
    await expect(frame).toBeVisible();
    await page.locator('#map-close').click();
    await expect(page.locator('#map-overlay')).toHaveCount(0);
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(8)');
    await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  });
}

test('leaving by the map while a program runs asks in the game\'s own dialog (D364)', async ({ page }) => {
  await seedWizard(page);
  page.on('dialog', () => {
    throw new Error('no browser dialog');
  });
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('1');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('#stop')).toBeEnabled({ timeout: ciTimes(30_000) });
  await page.locator('#level-map').click();
  const letter = page.locator('#map-overlay .stop[data-item="story:the-letter"] a');
  await letter.click();
  await expect(page.locator('#ask-question')).toHaveText('Your program is still running. Leave the level?');
  await expect(page.locator('#ask-yes')).toHaveText('Yes, leave');
  await expect(page.locator('#ask-no')).toHaveText('No, stay');
  // Escape is No: the question goes, the map's window stays, the level is not left.
  await page.keyboard.press('Escape');
  await expect(page.locator('#ask')).toHaveCount(0);
  await expect(page.locator('#map-window')).toBeVisible();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
  await letter.click();
  await page.locator('#ask-no').click();
  await expect(page.locator('#ask')).toHaveCount(0);
  await expect(page.locator('#map-window')).toBeVisible();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
  // The program ran on all the while, to its win.
  await page.locator('#map-close').click();
  await expect(page.locator('#map-overlay')).toHaveCount(0);
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  // A second run, and Yes: the stop is gone to.
  await page.locator('#run').click();
  await expect(page.locator('#stop')).toBeEnabled({ timeout: ciTimes(30_000) });
  await page.locator('#level-map').click();
  await letter.click();
  await page.locator('#ask-yes').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
  await expect(page.locator('#map-overlay')).toHaveCount(0);
});

test('in Spanish, the question about leaving and its two answers (D364)', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await seedWizard(page);
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('1');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('#stop')).toBeEnabled({ timeout: ciTimes(30_000) });
  await page.locator('#level-map').click();
  await page.locator('#map-overlay .stop[data-item="story:the-letter"] a').click();
  await expect(page.locator('#ask-question')).toHaveText('Tu programa todavía se está ejecutando. ¿Salir del nivel?');
  await expect(page.locator('#ask-yes')).toHaveText('Sí, salir');
  await expect(page.locator('#ask-no')).toHaveText('No, quedarme');
  await page.screenshot({ path: `${SHOTS}leave-asks.png` });
  await context.close();
});

test('from the start screen, the map is a whole screen that leads back home (D352)', async ({ page }) => {
  await seedWizard(page, MARTA);
  await page.goto('/#start');
  await page.locator('#map-link').click();
  await expect(page.locator('.map-screen')).toBeVisible();
  await expect(page.locator('#map-window')).toHaveCount(0);
  await expect(page.locator('#map-back')).toBeVisible();
});

test('a level offers its lesson again, which goes back to the level (D71)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await page.locator('#level-lesson').click();
  await expect(page).toHaveURL(/#lesson\/how-much\/from\/the-long-corridor$/);
  await expect(page.locator('.lesson-page h1')).toHaveText('How far we move');
  await page.locator('#lesson-to-level').click();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
});

test('with ?debug every stop opens and is named, for a tester to go straight to it', async ({ page }) => {
  await page.goto('/?debug#map');
  const last = stop(page, 'level:the-tunnel-exit');
  await expect(last).toHaveAttribute('data-state', 'locked');
  await expect(last).not.toHaveAttribute('data-unnamed', /./);
  await expect(page.locator('.stop:not(:has(a))')).toHaveCount(0);
  await last.locator('a').click();
  await expect(page).toHaveURL(/#level\/the-tunnel-exit$/);
  // The button that writes the solution is there in the build too, under ?debug,
  // and writes the level's solution into the editor.
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeVisible({ timeout: ciTimes(90_000) });
  await page.locator('#debug-solution').click();
  await expect(page.locator('.cm-content')).toContainText('wizard.wait(2)');
});

test('without ?debug no level has the button that writes the solution', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/#level/the-tunnel-exit');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeVisible({ timeout: ciTimes(90_000) });
  await expect(page.locator('#debug-solution')).toHaveCount(0);
});

test('opened by itself, the map opens at the item last opened, marked (D122)', async ({ page }) => {
  await seedWizard(page);
  // A story opened is the item last opened, as a lesson and a level are.
  await page.goto('/#story/the-morning');
  await expect(page.locator('#scene')).toBeVisible();
  await page.goto('/#map');
  const here = page.locator('.stop[data-here="true"]');
  await expect(here).toHaveAttribute('data-item', 'story:the-morning');
  await expect(here).toBeInViewport();
  await page.goto('/#lesson/the-distance');
  await expect(page.locator('.lesson-page h1')).toBeVisible();
  await page.goto('/#map');
  await expect(here).toHaveAttribute('data-item', 'lesson:the-distance');
  await expect(here).toBeInViewport();
  // From the start screen too.
  await page.goto('/#');
  await page.locator('#map-link').click();
  await expect(here).toHaveAttribute('data-item', 'lesson:the-distance');
  await expect(here).toBeInViewport();
});

test("a finished chapter folds under its card with its stars; Unfold opens it, a locked one shows how it begins (D200)", async ({
  page,
}) => {
  // A saved game with every stop of chapter 1 done, each level won with two stars.
  const items: string[] = JSON.parse(readFileSync(`${CONTENT}chapters/01-arrival/chapter.json`, 'utf8')).items;
  const done: Record<string, Record<string, object>> = { story: {}, lesson: {}, level: {} };
  for (const item of items) {
    const [kind, id] = item.split(':') as [string, string];
    done[kind]![id] = kind === 'level' ? { won: true, stars: 2 } : { read: true };
  }
  const levels = items.filter((item) => item.startsWith('level:')).length;
  await page.addInitScript(
    (kept) => localStorage.setItem('kydux.progress', kept),
    JSON.stringify({ version: 1, wizard: MARTA, stories: done.story, lessons: done.lesson, levels: done.level }),
  );
  await page.goto('/#map');
  const chapter = (n: number) => page.locator('.map-chapter').nth(n);
  await expect(chapter(0)).toHaveAttribute('data-finished', 'true');
  await expect(chapter(0)).toHaveAttribute('data-folded', 'true');
  await expect(chapter(0).locator('.stops')).toBeHidden();
  await expect(chapter(0).locator('.chapter-stars')).toHaveText(`${2 * levels} of ${3 * levels} stars`);
  await expect(chapter(0).locator('.chapter-fold')).toHaveText('Unfold');
  await expect(chapter(1)).toHaveAttribute('data-current', 'true');
  await expect(chapter(1)).not.toHaveAttribute('data-folded', /./);
  await expect(chapter(1).locator('.stop').first()).toBeVisible();
  // A locked chapter: greyed, its first stop named and shown, the rest hidden.
  await expect(chapter(2)).toHaveAttribute('data-locked', 'true');
  await expect(chapter(2)).toHaveAttribute('data-folded', 'true');
  await expect(chapter(2).locator('.stop').first()).toBeVisible();
  await expect(chapter(2).locator('.stop').first()).not.toHaveAttribute('data-unnamed', /./);
  await expect(chapter(2).locator('.stop').nth(1)).toBeHidden();
  await expect(chapter(2).locator('.chapter-fold')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}map-folded.png`, fullPage: true });
  await chapter(0).locator('.chapter-fold').click();
  await expect(chapter(0)).not.toHaveAttribute('data-folded', /./);
  await expect(chapter(0).locator('.stop').first()).toBeVisible();
  await expect(chapter(0).locator('.chapter-fold')).toHaveText('Fold');
  await page.screenshot({ path: `${SHOTS}map-unfolded.png`, fullPage: true });
  // Unfolded it stays while the page lives: back to the start and to the map again.
  await page.locator('#map-back').click();
  await page.locator('#map-link').click();
  await expect(chapter(0)).not.toHaveAttribute('data-folded', /./);
});
