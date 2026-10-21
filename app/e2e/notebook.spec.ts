import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
}

test('the notebook lists what the level teaches, and a click puts an example in the editor', async ({
  page,
}) => {
  await open(page, '01-the-corridor');
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook).toBeVisible();
  await expect(notebook.locator('h2')).toHaveText("The wizard's notebook");
  await expect(notebook.locator('[data-example="wizard.move_right(3)"]')).toBeVisible();
  await expect(notebook.locator('[data-example="wizard.pick_up()"]')).toHaveCount(0);
  await expect(notebook).toContainText('Walks right, one tile per step.');

  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await notebook.locator('[data-example="wizard.move_right(3)"]').click();
  await expect(page.locator('.cm-content')).toContainText('wizard.move_right(3)');
  await page.locator('#notebook-close').click();
  await expect(notebook).toBeHidden();
});

test('the notebook of the locked door has the door and the key', async ({ page }) => {
  await open(page, '02-the-locked-door');
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook.locator('[data-example="door.open()"]')).toBeVisible();
  await expect(notebook.locator('[data-example="key.position"]')).toBeVisible();
  await expect(notebook.locator('[data-example="wizard.pick_up()"]')).toBeVisible();
});

test('after a name and a dot, the editor offers what the level teaches of it', async ({ page }) => {
  await open(page, '02-the-locked-door');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('door.');
  const offered = page.locator('.cm-tooltip-autocomplete');
  await expect(offered).toBeVisible();
  await expect(offered).toContainText('open');
  await expect(offered).toContainText('locked');
  await expect(offered).not.toContainText('move_right');
  await page.keyboard.type('op');
  await page.keyboard.press('Enter');
  await expect(page.locator('.cm-content')).toHaveText('door.open');
});

test('the notebook in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, '03-past-the-teacher');
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook h2')).toHaveText('El cuaderno del mago');
  await expect(page.locator('#notebook')).toContainText('Se queda quieto mientras el mundo sigue');
  await expect(page.locator('#notebook [data-example="teacher.can_see(wizard)"]')).toBeVisible();
  await context.close();
});

test('a level\'s notebook has what the course has taught so far, for what is in the level (D40)', async ({
  page,
}) => {
  await page.goto('/#level/03-past-the-teacher');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  // Taught before, and the wizard is here: shown, though this level does not need it.
  await expect(notebook.locator('[data-example="wizard.move_right(3)"]')).toHaveCount(1);
  await expect(notebook.locator('[data-example="wizard.pick_up()"]')).toHaveCount(1);
  // Taught here.
  await expect(notebook.locator('[data-example="teacher.facing"]')).toHaveCount(1);
  await expect(notebook.locator('[data-example="wizard.wait(2)"]')).toHaveCount(1);
  // The door of the level before is not in this one.
  await expect(notebook.locator('[data-example="door.open()"]')).toHaveCount(0);
});

test('a level\'s notebook has nothing the course has not taught yet', async ({ page }) => {
  await page.goto('/#level/02-the-locked-door');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook.locator('[data-example="door.open()"]')).toHaveCount(1);
  await expect(notebook.locator('[data-example="wizard.wait(2)"]')).toHaveCount(0);
  await expect(notebook.locator('[data-example="teacher.facing"]')).toHaveCount(0);
});
