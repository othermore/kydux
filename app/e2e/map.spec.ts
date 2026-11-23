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

test('a level won and opened again from the map starts from its starting code (D131)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  const starting = await page.locator('.cm-content').innerText();
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
  await expect(page.locator('.cm-content')).toHaveText(starting);
  expect(starting).not.toContain('move_right(8)');
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
  await expect(stop(page, 'level:the-hidden-key').locator('.stop-number')).toHaveText('Práctica 4');
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
