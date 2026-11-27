// The two lists over the editor (D346): Tienes, what the program has, and Por encontrar,
// what is to find, read from the code half a second after the last key; none in chapter
// 1 nor in a lesson's code box. A chip opens the notebook.

import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

const SHOTS = fileURLToPath(new URL('./shots/lists/', import.meta.url));

test.use({ locale: 'es-ES', viewport: { width: 1280, height: 800 } });
test.beforeEach(({ page }) => seedWizard(page, MARTA));

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
}

const have = (page: Page) => page.locator('#have-chips .chip');
const toFind = (page: Page) => page.locator('#find-chips .chip');

test('the fallen book: wizard given, tesoro kept from the given line, nothing left to find', async ({ page }) => {
  await open(page, 'the-fallen-book');
  await expect(page.locator('#have .program-list-title')).toHaveText('Tienes');
  await expect(have(page)).toHaveCount(2);
  await expect(have(page).nth(0)).toHaveAttribute('data-name', 'wizard');
  await expect(have(page).nth(0)).toHaveClass(/given/);
  await expect(have(page).nth(1)).toHaveAttribute('data-name', 'tesoro');
  await expect(have(page).nth(1)).toHaveClass(/own/);
  await expect(have(page).nth(1)).toHaveAttribute('data-thing', 'book');
  // Por encontrar is empty, and gone with its title: Tienes takes the whole width.
  await expect(page.locator('#to-find')).toBeHidden();
  await page.locator('.workbench').screenshot({ path: `${SHOTS}the-fallen-book.png` });
});

test('the lost book: "book" to find until a line keeps it, a chip added half a second after its line', async ({
  page,
}) => {
  await open(page, 'the-lost-book');
  await expect(page.locator('#to-find .program-list-title')).toHaveText('Por encontrar');
  await expect(toFind(page)).toHaveCount(1);
  await expect(toFind(page).first()).toContainText('"book"');
  await expect(have(page)).toHaveCount(1);
  await page.locator('.workbench').screenshot({ path: `${SHOTS}the-lost-book.png` });
  // A line typed: its chip comes half a second after the last key, not before.
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('mi_libro = wizard.find_nearest("book")');
  const typedAt = Date.now();
  await expect(page.locator('#have-chips [data-name="mi_libro"]')).toBeVisible();
  expect(Date.now() - typedAt).toBeGreaterThanOrEqual(400);
  await expect(page.locator('#have-chips [data-name="mi_libro"]')).toHaveAttribute('data-thing', 'book');
  await expect(page.locator('#to-find')).toBeHidden();
  // The line deleted: the chip goes, and "book" is to find again.
  await page.keyboard.press('Shift+Home');
  await page.keyboard.press('Delete');
  await expect(page.locator('#have-chips [data-name="mi_libro"]')).toHaveCount(0);
  await expect(toFind(page)).toHaveCount(1);
});

test('a number written by hand shows its value; a row with more chips than fit scrolls to the one added', async ({
  page,
}) => {
  await open(page, 'the-reading-room');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  const names = Array.from({ length: 14 }, (_, index) => `numero_${index} = ${index}`);
  await page.keyboard.insertText(names.join('\n'));
  await expect(page.locator('#have-chips [data-name="numero_13"]')).toHaveAttribute('data-value', '13');
  const strip = page.locator('#have .chips-strip');
  await expect(strip).toHaveAttribute('data-scrolls', 'true');
  await expect(page.locator('#have .chips-scroll.before')).toHaveAttribute('aria-label', 'Ver las anteriores');
  await expect(page.locator('#have .chips-scroll.after')).toHaveAttribute('aria-label', 'Ver las siguientes');
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('ultimo = 99');
  const added = page.locator('#have-chips [data-name="ultimo"]');
  await expect(added).toBeInViewport();
  const inStrip = await added.evaluate((chip) => {
    const list = chip.closest('.chips') as HTMLElement;
    const a = chip.getBoundingClientRect();
    const b = list.getBoundingClientRect();
    return a.left >= b.left - 1 && a.right <= b.right + 1;
  });
  expect(inStrip).toBe(true);
  await page.locator('.workbench').screenshot({ path: `${SHOTS}scrolled.png` });
});

test('a chip opens the notebook', async ({ page }) => {
  await open(page, 'the-fallen-book');
  await expect(page.locator('#notebook')).toBeHidden();
  await have(page).nth(1).click();
  await expect(page.locator('#notebook')).toBeVisible();
});

test('no lists in chapter 1, nor in a lesson code box', async ({ page }) => {
  await open(page, 'the-corridor');
  await expect(page.locator('#program-lists')).toHaveCount(0);
  await page.goto('/#lesson/a-name-for-a-value');
  await expect(page.locator('.lesson-run')).toHaveCount(1);
  await expect(page.locator('#program-lists')).toHaveCount(0);
});

test('the lists at 900 by 600, in one row each', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await open(page, 'the-check');
  await expect(have(page).first()).toBeVisible();
  const rows = await page.locator('#program-lists').evaluate((lists) => lists.getBoundingClientRect().height);
  expect(rows).toBeLessThan(60);
  await page.locator('.workbench').screenshot({ path: `${SHOTS}the-check-900x600.png` });
});
