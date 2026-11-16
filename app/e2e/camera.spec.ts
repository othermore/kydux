// The camera on a scene bigger than its window (D69): it follows the wizard, the
// player zooms it with the buttons a step at a time and with the wheel a little at
// a time (D106), on a level's scene and a story's, and drags it to look around, and
// a run brings it back to the wizard. The canvas takes the frame's shape, so how
// far it zooms out is the scene's size and its painted margin's (D83) against the
// frame: the field, painted with a margin, is zoomed on.

import { expect, test } from '@playwright/test';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

test('the camera zooms, is dragged, and comes back to the wizard on a run', async ({ page }) => {
  // The field and its margin are larger than the camera's window, zoomed out too.
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
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
  // The wheel turns the zoom a little at a time (D106): two notches out from 2.
  await page.mouse.wheel(0, 200);
  await expect(scene).toHaveAttribute('data-zoom', '1.65');
  await expect(page.locator('#zoom-in')).toBeEnabled();
  // The buttons step on from there to the next of their zooms.
  await page.locator('#zoom-out').click();
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

test('the camera never zooms out past a scene that does not fill the frame', async ({ page }) => {
  // The three doors are fifteen rows high: in a tall frame, zoomed out a step, the
  // window would be taller than they are, and the step is refused.
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.goto('/#level/the-three-doors');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await expect(page.locator('#scene')).toHaveAttribute('data-zoom', '1');
  await expect(page.locator('#zoom-out')).toBeDisabled();
});

test('on a window wider than a painted scene, the camera zooms in until the painting fills it (D92)', async ({
  page,
}) => {
  // The library is fifteen cells wide and three more on each side; a window this
  // wide shows more than twenty-one across at the zoom of fifteen by nine.
  await page.setViewportSize({ width: 1900, height: 650 });
  await page.goto('/#story/at-the-library');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await expect(scene).toHaveAttribute('data-bounds', '21.00×24.00');
  const [width, height] = ((await scene.getAttribute('data-view')) ?? '').split('×').map(Number);
  expect(width).toBeLessThanOrEqual(21.01);
  expect(height).toBeLessThanOrEqual(24.01);
  expect(width).toBeGreaterThan(20.9);
  await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/library-wide.png' });
});

test('a shaky press does not let go of the wizard; Find my wizard brings the camera back (12.6)', async ({
  page,
}) => {
  await page.goto('/#level/the-three-doors');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  const scene = page.locator('#scene');
  const box = await scene.locator('canvas').boundingBox();
  if (!box) throw new Error('the scene has no canvas');
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await expect(page.locator('#find-wizard')).toBeHidden();

  // A press that moves a pixel or two is not a drag.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 2, y + 1, { steps: 2 });
  await page.mouse.up();
  await expect(scene).toHaveAttribute('data-following', 'true');

  // The wheel over the scene zooms it, and the page does not scroll.
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 300);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);

  // A real drag lets go, and Find my wizard brings the camera back.
  await page.mouse.down();
  await page.mouse.move(x - 120, y - 80, { steps: 6 });
  await page.mouse.up();
  await expect(scene).toHaveAttribute('data-following', 'false');
  await expect(page.locator('#find-wizard')).toBeVisible();
  await expect(page.locator('#find-wizard')).toHaveText('Find my wizard');
  await page.locator('#find-wizard').click();
  await expect(scene).toHaveAttribute('data-following', 'true');
  await expect(page.locator('#find-wizard')).toBeHidden();
});

test('a story has the zoom box, opens at zoom 1, and its words keep their size zoomed out (D106)', async ({
  page,
}) => {
  await page.goto('/#story/the-first-night');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await expect(page.locator('#zoom-in')).toBeVisible();
  await expect(scene).toHaveAttribute('data-zoom', '1');
  await page.locator('#zoom-in').click();
  await expect(scene).toHaveAttribute('data-zoom', '1.5');
  const box = await scene.locator('canvas').boundingBox();
  if (!box) throw new Error('the scene has no canvas');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -100);
  await expect(scene).toHaveAttribute('data-zoom', '1.65');
  // Find my wizard waits for a drag in a story too.
  await expect(page.locator('#find-wizard')).toBeHidden();
  // The words are drawn at the scene's size zoomed in, larger zoomed out.
  const scale = Number(await scene.getAttribute('data-words-scale'));
  expect(scale).toBeGreaterThanOrEqual(1);
});

test('in a story, the camera stays where it is dragged until the next step (D106)', async ({ page }) => {
  await page.goto('/#story/the-first-night');
  const scene = page.locator('#scene');
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  await page.locator('#story-title').click();
  // Ilda's long walk out by the door, as the camera stays with the wizard.
  for (let step = 0; step < 4; step += 1) await page.locator('#story-next').click();
  await expect(scene).toHaveAttribute('data-state', 'playing');
  const box = await scene.locator('canvas').boundingBox();
  if (!box) throw new Error('the scene has no canvas');
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 40, y - 160, { steps: 6 });
  await page.mouse.up();
  await expect(scene).toHaveAttribute('data-dragged', 'true');
  // Ticks go on, and the camera stays dragged.
  await page.waitForTimeout(ciTimes(2000));
  await expect(scene).toHaveAttribute('data-dragged', 'true');
  await expect(page.locator('#find-wizard')).toBeVisible();
  // The next step brings it back.
  await expect(scene).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
  await page.locator('#story-next').click();
  await expect(scene).not.toHaveAttribute('data-dragged', /./);
});

