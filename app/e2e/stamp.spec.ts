import { expect, test } from '@playwright/test';
import { seedWizard, skipGuide } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

test('the page says its build, and runs the world it was built with (the stamp in ?debug)', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/?debug#level/the-gate');
  await skipGuide(page);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  // The footer: the version, and beside it the build, its short hash and its day.
  await expect(page.locator('footer #build')).toHaveText(/^([0-9a-f]{7,} \d{4}-\d{2}-\d{2}|local)$/);
  // The debug corner: the page's world and the world running, the same stamp.
  const pageWorld = await page.locator('#debug-page-world').getAttribute('data-stamp');
  expect(pageWorld).toMatch(/^[0-9a-f]{12}$/);
  await expect(page.locator('#debug-world')).toHaveAttribute('data-stamp', pageWorld ?? '', { timeout: ciTimes(30_000) });
  await expect(page.locator('#debug-build')).toHaveAttribute('data-stamp', (await page.locator('footer #build').innerText()).trim());
  await expect(page.locator('#stale-world')).toHaveCount(0);
});
