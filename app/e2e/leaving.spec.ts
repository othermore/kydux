// No screen of the game is left by mistake (D353): the browser's own menu opens only in
// the editor, a lesson's code box and a text field, and a sideways swipe does not go back
// in the browser's history.

import { expect, type Page, test } from '@playwright/test';
import { seedWizard } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
test.beforeEach(({ page }) => seedWizard(page));

/** Whether a right click on `selector` lets the browser's menu open: the page's handler
 * did not take it away. */
function menuOpens(page: Page, selector: string): Promise<boolean> {
  return page.locator(selector).first().evaluate((node) => {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
    return node.dispatchEvent(event);
  });
}

test("no browser menu on the scene, the buttons and a lesson's words; one in the editor and a text field", async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  expect(await menuOpens(page, '#scene')).toBe(false);
  expect(await menuOpens(page, '#run')).toBe(false);
  expect(await menuOpens(page, '.cm-content')).toBe(true);
  await page.goto('/#lesson/how-much');
  await expect(page.locator('.lesson-page')).toBeVisible();
  expect(await menuOpens(page, '.lesson-page p')).toBe(false);
  // The creator's field for the wizard's name.
  await page.goto('/#wizard');
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  expect(await menuOpens(page, 'input[type="text"]')).toBe(true);
});

test('a lesson code box has the browser menu', async ({ page }) => {
  await page.goto('/#lesson/a-name-for-a-value');
  await expect(page.locator('.lesson-run')).toBeVisible();
  expect(await menuOpens(page, '.lesson-run .cm-content')).toBe(true);
});

test('a sideways swipe does not go back: the page holds its overscroll sideways', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  for (const node of ['html', 'body']) {
    expect(await page.locator(node).evaluate((one) => getComputedStyle(one).overscrollBehaviorX)).toBe('none');
  }
  // Nothing of a level scrolls the page sideways.
  const sideways = await page.evaluate(() => (document.scrollingElement?.scrollWidth ?? 0) - window.innerWidth);
  expect(sideways).toBeLessThanOrEqual(0);
});
