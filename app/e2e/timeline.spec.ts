import { expect, test } from '@playwright/test';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

test('the timeline goes back to any tick of a run, and Play goes on from there', async ({
  page,
}) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  const timeline = page.locator('#timeline');
  await expect(timeline).toBeDisabled();

  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
  await expect(timeline).toHaveAttribute('max', '8');
  await expect(timeline).toHaveValue('8');

  await timeline.fill('3');
  await expect(page.locator('.win-card')).toBeHidden();
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '7,25');
  await expect(page.locator('#scene')).toHaveAttribute('data-tick', '3');
  await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'open');
  await expect(page.locator('#stop')).toHaveText('Play');

  await timeline.fill('8');
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '12,25');
  await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'met');

  await timeline.fill('1');
  await page.locator('#stop').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '12,25', { timeout: ciTimes(10_000) });
  await expect(page.locator('#stop')).toHaveText('Stop');
});
