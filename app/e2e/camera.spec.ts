// The camera on a scene bigger than its window (D69): it follows the wizard, the
// player zooms it with the buttons and the wheel and drags it to look around, and
// a run brings it back to the wizard.

import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('the camera zooms, is dragged, and comes back to the wizard on a run', async ({ page }) => {
  // The long stairs are taller than the camera's window.
  await page.goto('/#level/the-long-stairs');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-zoom', '1');
  await expect(scene).toHaveAttribute('data-following', 'true');

  await page.locator('#zoom-out').click();
  await expect(scene).toHaveAttribute('data-zoom', '0.75');
  await page.locator('#zoom-in').click();
  await page.locator('#zoom-in').click();
  await expect(scene).toHaveAttribute('data-zoom', '1.5');
  await page.locator('#zoom-in').click();
  await expect(scene).toHaveAttribute('data-zoom', '2');
  await expect(page.locator('#zoom-in')).toBeDisabled();

  const box = await scene.locator('canvas').boundingBox();
  if (!box) throw new Error('the scene has no canvas');
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, 200);
  await expect(scene).toHaveAttribute('data-zoom', '1.5');

  // A drag looks around: the camera lets go of the wizard.
  await page.mouse.down();
  await page.mouse.move(x - 120, y - 80, { steps: 6 });
  await page.mouse.up();
  await expect(scene).toHaveAttribute('data-following', 'false');

  // A run brings it back.
  await page.locator('#speed').selectOption('4');
  await page.locator('#run').click();
  await expect(scene).toHaveAttribute('data-following', 'true');
});
