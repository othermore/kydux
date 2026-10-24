import { expect, test, type Page } from '@playwright/test';
import { levelText, shown } from './helpers';

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
}

async function run(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
}

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test('hints are offered after a run that does not win, one at a time', async ({ page }) => {
    await open(page, 'the-locked-door');
    const hint = page.locator('#hint');
    await expect(hint).toHaveText('Hint');
    await expect(hint).toBeDisabled();
    await run(page, 'wizard.move_right(2)');
    await expect(hint).toBeEnabled();
    await hint.click();
    await expect(page.locator('.hint')).toHaveCount(1);
    const hints = levelText('the-locked-door', 'en').hints.map(shown);
    await expect(page.locator('.hint').first()).toHaveText(`Hint 1 of 3 ${hints[0]}`);
    await hint.click();
    await hint.click();
    await expect(page.locator('.hint')).toHaveCount(3);
    await expect(page.locator('.hint').nth(2)).toContainText(hints[2] ?? '');
    await expect(hint).toBeDisabled();
  });

  test('the hints shown stay for the visit', async ({ page }) => {
    await open(page, 'the-long-corridor');
    await run(page, 'wizard.move_right()');
    await page.locator('#hint').click();
    await page.reload();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await expect(page.locator('.hint')).toHaveCount(1);
    await expect(page.locator('#hint')).toBeEnabled();
  });
});

test('hints in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, 'past-the-teacher');
  await run(page, 'wizard.move_up(2)');
  await page.locator('#hint').click();
  await expect(page.locator('#hint')).toHaveText('Pista');
  const first = shown(levelText('past-the-teacher', 'es').hints[0] ?? '');
  await expect(page.locator('.hint').first()).toHaveText(`Pista 1 de 3 ${first}`);
  await context.close();
});
