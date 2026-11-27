// The kept program and the buttons (D351): a saved game keeps the program being written,
// one, which its level opens with by every way into it; Original code asks in the game's
// own dialog before it erases; the buttons stand in two rows, each with its picture.

import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { levelText, seedWizard } from './helpers';
import { ciTimes } from './support';

const SHOTS = fileURLToPath(new URL('./shots/program/', import.meta.url));
const TYPED = 'wizard.move_right(3)';

test.use({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
test.beforeEach(({ page }) => seedWizard(page));

async function open(page: Page, id: string): Promise<void> {
  // Through the start screen, so that a level opened again is opened anew.
  await page.goto('/#start');
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
}

/** A line typed at the program's end, and the second it takes to be kept. */
async function typeLine(page: Page, line: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.type(line);
  await page.waitForTimeout(1200);
}

const code = (page: Page) => page.locator('.cm-content');

test('the program typed is there again after the map, a reload, and back and forward', async ({ page }) => {
  await open(page, 'the-long-corridor');
  await typeLine(page, TYPED);
  // The map over the level, closed: the program as it was.
  await page.locator('#level-map').click();
  await page.locator('#map-close').click();
  await expect(code(page)).toContainText(TYPED);
  // The page loaded again.
  await page.reload();
  await page.locator('#start').click();
  await expect(code(page)).toContainText(TYPED);
  // Left by a link, then back and forward in the browser's history.
  await page.goto('/#map');
  await expect(page.locator('.map-screen')).toBeVisible();
  await page.goBack();
  await page.locator('#start').click();
  await expect(code(page)).toContainText(TYPED);
  await page.goForward();
  await expect(page.locator('.map-screen')).toBeVisible();
  await page.goBack();
  await page.locator('#start').click();
  await expect(code(page)).toContainText(TYPED);
});

test("another level's code changed takes the program's place; a level won opens on the program that won", async ({
  page,
}) => {
  await open(page, 'the-long-corridor');
  await typeLine(page, TYPED);
  await open(page, 'the-stairs');
  await typeLine(page, 'wizard.move_up()');
  await open(page, 'the-long-corridor');
  await expect(code(page)).toHaveText(levelText('the-long-corridor', 'en').starting_code.trim().replace(/\n/g, ''));
  // Won and opened again: the program that won.
  await code(page).click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#speed').selectOption('4');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  await open(page, 'the-long-corridor');
  await expect(code(page)).toHaveText('wizard.move_right(8)');
});

test('a saved game exported and imported carries its program', async ({ page }) => {
  await open(page, 'the-long-corridor');
  await typeLine(page, TYPED);
  await page.goto('/');
  const downloading = page.waitForEvent('download');
  await page.locator('#games .game .export').click();
  const file = (await (await downloading).path()) as string;
  const { readFileSync } = await import('node:fs');
  const kept = JSON.parse(readFileSync(file, 'utf8')) as { program?: { level: string; code: string } };
  expect(kept.program?.level).toBe('the-long-corridor');
  expect(kept.program?.code).toContain(TYPED);
  await page.locator('#import-file').setInputFiles(file);
  await page.locator('#import-name').fill('The copy');
  await page.locator('#import-name').press('Enter');
  await expect(page.locator('#current-game')).toHaveText('You are in the game “The copy”.');
  await open(page, 'the-long-corridor');
  await expect(code(page)).toContainText(TYPED);
});

for (const [width, height] of [
  [1280, 800],
  [900, 600],
] as const) {
  test(`the buttons in two rows, each with its picture, at ${width} by ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, 'the-long-corridor');
    const first = page.locator('#program-buttons > button');
    await expect(first).toHaveCount(4);
    expect(await first.evaluateAll((buttons) => buttons.map((b) => b.id))).toEqual(['run', 'restart', 'stop', 'original']);
    const second = page.locator('#help-buttons > button');
    expect(await second.evaluateAll((buttons) => buttons.map((b) => b.id))).toEqual(['notebook-open', 'hint']);
    await expect(page.locator('#help-buttons > .speed')).toBeVisible();
    for (const id of ['run', 'restart', 'stop', 'original', 'notebook-open', 'hint']) {
      await expect(page.locator(`#${id} svg.icon`)).toHaveCount(1);
      await expect(page.locator(`#${id} .button-word`)).toHaveCSS('font-size', '15px');
    }
    await expect(page.locator('#original')).toHaveText('Original code');
    // The second row stands under the first.
    const top = async (selector: string) => (await page.locator(selector).boundingBox())?.y ?? 0;
    expect(await top('#notebook-open')).toBeGreaterThan(await top('#run'));
    await page.locator('.workbench').screenshot({ path: `${SHOTS}buttons-${width}x${height}.png` });
  });
}

test('Original code asks first, in the game own dialog: No keeps the code, Escape is No, Yes puts the starting code', async ({
  page,
}) => {
  await open(page, 'the-long-corridor');
  const original = page.locator('#original');
  await expect(original).toBeDisabled();
  await typeLine(page, TYPED);
  await expect(original).toBeEnabled();
  page.on('dialog', () => {
    throw new Error('no browser dialog');
  });
  await original.click();
  await expect(page.locator('#ask-question')).toHaveText('Delete what you have written and go back to the original code?');
  await expect(page.locator('#ask-no')).toBeFocused();
  await page.screenshot({ path: `${SHOTS}original-asks.png` });
  await page.locator('#ask-no').click();
  await expect(page.locator('#ask')).toHaveCount(0);
  await expect(code(page)).toContainText(TYPED);
  await original.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ask')).toHaveCount(0);
  await expect(code(page)).toContainText(TYPED);
  await original.click();
  await page.locator('#ask-yes').click();
  await expect(code(page)).not.toContainText(TYPED);
  await expect(original).toBeDisabled();
  // Dropped: opened again, the level shows its starting code.
  await page.reload();
  await page.locator('#start').click();
  await expect(code(page)).not.toContainText(TYPED);
});

test('in Spanish, the question and its two answers', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await seedWizard(page);
  await open(page, 'the-long-corridor');
  await typeLine(page, TYPED);
  await page.locator('#original').click();
  await expect(page.locator('#ask-question')).toHaveText('¿Borrar lo que has escrito y volver al código original?');
  await expect(page.locator('#ask-yes')).toHaveText('Sí, borrar');
  await expect(page.locator('#ask-no')).toHaveText('No, seguir');
  await expect(page.locator('#original')).toHaveText('Código original');
  await context.close();
});
