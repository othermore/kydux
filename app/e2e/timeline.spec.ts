import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('the timeline goes back to any tick of a run, and Play goes on from there', async ({
  page,
}) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  const timeline = page.locator('#timeline');
  await expect(timeline).toBeDisabled();

  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_left(6)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
  await expect(timeline).toHaveAttribute('max', '6');
  await expect(timeline).toHaveValue('6');

  await timeline.fill('3');
  await expect(page.locator('.win-card')).toBeHidden();
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '5,10');
  await expect(page.locator('#scene')).toHaveAttribute('data-tick', '3');
  await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'open');
  await expect(page.locator('#stop')).toHaveText('Play');

  await timeline.fill('6');
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '2,10');
  await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'met');

  await timeline.fill('1');
  await page.locator('#stop').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '2,10', { timeout: 10_000 });
  await expect(page.locator('#stop')).toHaveText('Stop');
});
