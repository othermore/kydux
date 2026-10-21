import { expect, type Page, test } from '@playwright/test';

test.use({ locale: 'en-US' });

async function openTheCorridor(page: Page): Promise<void> {
  await page.goto('/#level/01-the-corridor');
  const start = page.locator('#start');
  if (await start.isVisible().catch(() => false)) await start.click();
  await expect(page.locator('.cm-editor')).toBeVisible();
}

const editorFontSize = (page: Page) =>
  page.locator('.cm-content').evaluate((node) => getComputedStyle(node).fontSize);

const stageWidth = async (page: Page) => (await page.locator('.stage').boundingBox())?.width ?? 0;

test('the settings open from the start screen, and Back returns to it', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settings-link').click();
  await expect(page).toHaveURL(/#settings$/);
  await expect(page.locator('.settings-screen h2')).toHaveText('Settings');
  await page.locator('#settings-back').click();
  await expect(page.locator('#continue')).toBeVisible();
});

test('the text size chosen shows in the editor at once, and after a reload', async ({ page }) => {
  await openTheCorridor(page);
  await expect.poll(() => editorFontSize(page)).toBe('17px');
  await page.locator('#level-settings').click();
  await expect(page).toHaveURL(/#settings$/);
  await page.locator('#settings-font-size').selectOption('24');
  await expect(page.locator('#settings-sample')).toHaveCSS('font-size', '24px');
  await page.locator('#settings-back').click();
  await expect(page).toHaveURL(/#level\/01-the-corridor$/);
  await expect.poll(() => editorFontSize(page)).toBe('24px');
  await page.reload();
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect.poll(() => editorFontSize(page)).toBe('24px');
});

test('the speed chosen in the settings is the level screen speed', async ({ page }) => {
  await page.goto('/#settings');
  await page.locator('#settings-speed').selectOption('4');
  await openTheCorridor(page);
  await expect(page.locator('#speed')).toHaveValue('4');
});

test('the handle dragged moves the panes, the share stays after a reload, and a double-click restores it', async ({
  page,
}) => {
  await openTheCorridor(page);
  const before = await stageWidth(page);
  const handle = page.locator('#split');
  const box = await handle.boundingBox();
  if (!box) throw new Error('no handle');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x - 150, y, { steps: 5 });
  await page.mouse.up();
  const after = await stageWidth(page);
  expect(after).toBeLessThan(before - 100);

  await page.reload();
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect.poll(() => stageWidth(page)).toBeCloseTo(after, -1);

  await page.locator('#split').dblclick();
  await expect.poll(() => stageWidth(page)).toBeCloseTo(before, -1);
});

test('the handle keeps the scene between its least and its most', async ({ page }) => {
  await openTheCorridor(page);
  const handle = page.locator('#split');
  const box = await handle.boundingBox();
  if (!box) throw new Error('no handle');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(0, y, { steps: 5 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '35');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '40');
});

test('the settings in Spanish, and a language chosen there', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#settings');
  await expect(page.locator('.settings-screen h2')).toHaveText('Ajustes');
  await expect(page.locator('#settings-back')).toHaveText('Volver');
  await page.locator('#settings-language').selectOption('en');
  await expect(page.locator('.settings-screen h2')).toHaveText('Settings');
  await context.close();
});
