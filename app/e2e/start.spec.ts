import { expect, test, type Page } from '@playwright/test';
import { seedWizard } from './helpers';

test.use({ locale: 'en-US' });

// Continue goes on in the course once there is a wizard; before, it makes one
// (wizard.spec.ts).
test.beforeEach(async ({ page }) => seedWizard(page));

async function winTheCorridor(page: Page): Promise<void> {
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(6)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
}

test('the start screen opens the game, and Continue opens the first lesson', async ({
  page,
}) => {
  await page.goto('/');
  const go = page.locator('#continue');
  await expect(go).toHaveText('Continue: Your first action');
  await go.click();
  await expect(page.locator('.lesson-page h1')).toHaveText('Your first action');
});

test('after a win, Continue names what comes next, and the title leads home', async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();
  await expect(page.locator('#continue')).toHaveText('Continue: Steps, keys and doors');
});

test('progress exported, cleared and imported comes back', async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();

  const downloading = page.waitForEvent('download');
  await page.locator('#export').click();
  const file = await (await downloading).path();
  expect(file).toBeTruthy();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#new').click();
  await expect(page.locator('#continue')).toHaveText('Continue: Your first action');

  await page.locator('#import-file').setInputFiles(file as string);
  await expect(page.locator('#continue')).toHaveText('Continue: Steps, keys and doors');
});

test('a file that is not progress is refused, and nothing changes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#import-file').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": "world"}'),
  });
  await expect(page.locator('#start-message')).toHaveText(
    'That file is not a Kydux progress file. Nothing has changed.',
  );
  await expect(page.locator('#continue')).toHaveText('Continue: Your first action');
});

test('the start screen in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  await seedWizard(context);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#continue')).toHaveText('Continuar: Tu primera acción');
  await expect(page.locator('#new')).toHaveText('Empezar desde el principio');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#continue')).toHaveText('Continue: Your first action');
  await context.close();
});
