import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { skipGuide } from './helpers';

test.use({ locale: 'en-US' });

async function ready(page: Page): Promise<void> {
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
}

async function run(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
}

test('the start card opens a level the first time in a visit, and ? brings it back', async ({
  page,
}) => {
  await page.goto('/#level/the-locked-door');
  const card = page.locator('.start-card');
  await expect(card).toBeVisible();
  await expect(card.locator('h3')).toHaveText('The locked door');
  await expect(card.locator('li')).toHaveCount(4);
  await page.locator('#start').click();
  await expect(card).toBeHidden();

  await page.reload();
  await ready(page);
  await expect(page.locator('.start-card')).toBeHidden();

  await page.locator('#about').click();
  await expect(page.locator('.start-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.start-card')).toBeHidden();
});

test('a won run shows its stars, and Next opens what comes next in the course', async ({ page }) => {
  await page.goto('/#level/the-locked-door');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(
    page,
    'wizard.move_up(2)\nwizard.pick_up()\nwizard.move_up()\nwizard.move_right(3)\ndoor.open()\nwizard.move_right(3)',
  );
  const win = page.locator('.win-card');
  await expect(win).toBeVisible();
  await expect(win.locator('.stars')).toHaveAttribute('data-stars', '3');
  await expect(win.locator('.stars')).toHaveAttribute('aria-label', '3 of 3 stars');
  await page.locator('#next').click();
  await expect(page).toHaveURL(/#level\/the-wrong-order$/);
  await expect(page.locator('.level-title')).toHaveText('The wrong order');
});

test('Play again closes the win card; the chapter\'s last level leads to its closing story', async ({
  page,
}) => {
  await page.goto('/#level/the-night-walk');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-night-walk/solution.py', import.meta.url)), 'utf8'));
  await expect(page.locator('.win-card .stars')).toHaveAttribute('data-stars', '3');
  await page.locator('#again').click();
  await expect(page.locator('.win-card')).toBeHidden();
  await run(page, readFileSync(fileURLToPath(new URL('../../content/levels/the-night-walk/solution.py', import.meta.url)), 'utf8'));
  await page.locator('#next').click();
  await expect(page).toHaveURL(/#story\/caught$/);
});

test('the stars say why: a hint and a bump each cost one (D57)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(page, 'wizard.move_down()');
  await page.locator('#hint').click();
  // Into Nuri, who stands below: a bump; then the long walk, in two lines.
  await run(page, 'wizard.move_down()\nwizard.move_left(6)');
  const win = page.locator('.win-card');
  await expect(win.locator('.stars')).toHaveAttribute('data-stars', '1');
  await expect(win.locator('#star-reasons li')).toHaveText([
    'Solved without a hint',
    'Without bumping into anything',
    'The extra goal met',
  ]);
  await expect(win.locator('#star-reasons li[data-kept="false"]')).toHaveCount(3);
});

test('a level and a lesson say their number in the chapter (D56)', async ({ page }) => {
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-number')).toHaveText('Practice 2');
  await page.locator('#start').click();
  await expect(page.locator('#level-number')).toHaveText('Practice 2');
  await page.goto('/#lesson/how-much');
  await expect(page.locator('#lesson-number')).toHaveText('Lesson 4');
  await page.goto('/#map');
  await expect(page.locator('.stop[data-item="level:the-gate"] .stop-number')).toHaveText('Practice 1');
});

test('before arguments are taught, the notebook shows a move with no number (D60)', async ({ page }) => {
  await page.goto('/#level/the-gate');
  await page.locator('#start').click();
  await skipGuide(page);
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook [data-example="wizard.move_right()"]')).toHaveCount(1);
  await expect(page.locator('#notebook')).toContainText('Walks one step to the right.');
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook [data-example="wizard.move_right(3)"]')).toHaveCount(1);
});

test('? opens the start card over the notebook, and it says Continue', async ({ page }) => {
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#start')).toHaveText('Start');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook')).toBeVisible();
  await page.locator('#about').click();
  const button = page.locator('#start');
  await expect(button).toHaveText('Continue');
  // The card is on top: the point at its button's middle is the button.
  const box = await button.boundingBox();
  if (!box) throw new Error('no button');
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const atPoint = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id ?? '', middle);
  expect(atPoint).toBe('start');
});
