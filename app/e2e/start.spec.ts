import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

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

test('a first visit lands on the start screen, and Continue opens the first level', async ({
  page,
}) => {
  await page.goto('/');
  const go = page.locator('#continue');
  await expect(go).toHaveText('Continue: The corridor');
  await go.click();
  await expect(page.locator('.level-title')).toHaveText('The corridor');
});

test('after a win, Continue names what comes next, and the title leads home', async ({ page }) => {
  await page.goto('/');
  await page.locator('#continue').click();
  await winTheCorridor(page);
  await page.locator('#home').click();
  await expect(page.locator('#continue')).toHaveText('Continue: The locked door');
});

test('progress exported, cleared and imported comes back', async ({ page }) => {
  await page.goto('/');
  await page.locator('#continue').click();
  await winTheCorridor(page);
  await page.locator('#home').click();

  const downloading = page.waitForEvent('download');
  await page.locator('#export').click();
  const file = await (await downloading).path();
  expect(file).toBeTruthy();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#new').click();
  await expect(page.locator('#continue')).toHaveText('Continue: The corridor');

  await page.locator('#import-file').setInputFiles(file as string);
  await expect(page.locator('#continue')).toHaveText('Continue: The locked door');
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
  await expect(page.locator('#continue')).toHaveText('Continue: The corridor');
});

test('the start screen in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#continue')).toHaveText('Continuar: El pasillo');
  await expect(page.locator('#new')).toHaveText('Empezar desde el principio');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#continue')).toHaveText('Continue: The corridor');
  await context.close();
});
