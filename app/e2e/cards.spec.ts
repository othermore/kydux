import { expect, test, type Page } from '@playwright/test';

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
  await page.goto('/#level/02-the-locked-door');
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

test('a won run shows its stars, and Next opens the next level', async ({ page }) => {
  await page.goto('/#level/02-the-locked-door');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(
    page,
    'wizard.move_right(4)\nwizard.pick_up()\nwizard.move_right(2)\ndoor.open()\nwizard.move_down(2)',
  );
  const win = page.locator('.win-card');
  await expect(win).toBeVisible();
  await expect(win.locator('.stars')).toHaveAttribute('data-stars', '2');
  await expect(win.locator('.stars')).toHaveAttribute('aria-label', '2 of 3 stars');
  await page.locator('#next').click();
  await expect(page).toHaveURL(/#level\/03-past-the-teacher$/);
  await expect(page.locator('.level-title')).toHaveText('Past the teacher');
});

test('Play again closes the win card; the last level says there is no next yet', async ({
  page,
}) => {
  await page.goto('/#level/03-past-the-teacher');
  await page.locator('#start').click();
  await ready(page);
  await page.locator('#speed').selectOption('4');
  await run(page, 'while teacher.facing == "left":\n    wizard.wait()\nwizard.move_up(2)');
  await expect(page.locator('.win-card .stars')).toHaveAttribute('data-stars', '1');
  await expect(page.locator('#last')).toHaveText('That is all for now. More levels are coming.');
  await page.locator('#again').click();
  await expect(page.locator('.win-card')).toBeHidden();
});
