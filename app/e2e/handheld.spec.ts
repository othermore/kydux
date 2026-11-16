// On a phone or a tablet the page says the game is made for a computer, from the
// first visit, which opens on the story; on a computer it says nothing.

import { expect, test } from '@playwright/test';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

test('on a computer, there is no note about phones', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#story-title')).toBeVisible({ timeout: ciTimes(30_000) });
  await expect(page.locator('#handheld-note')).toHaveCount(0);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 412, height: 839 }, isMobile: true, hasTouch: true });

  test('a first visit says the game is made for a computer, and Got it closes it for the tab', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#story-title')).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(page.locator('#handheld-note')).toContainText('made for a computer');
    await page.locator('#handheld-close').click();
    await expect(page.locator('#handheld-note')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#story-title')).toBeVisible({ timeout: ciTimes(30_000) });
    await expect(page.locator('#handheld-note')).toHaveCount(0);
  });
});
