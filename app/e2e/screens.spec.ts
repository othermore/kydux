import { expect, type Page, test } from '@playwright/test';
import { seedWizard } from './helpers';

test.use({ locale: 'es-ES' });
test.beforeEach(async ({ page }) => seedWizard(page));

type Box = { x: number; y: number; width: number; height: number };

async function box(page: Page, selector: string): Promise<Box> {
  const found = await page.locator(selector).first().boundingBox();
  if (!found) throw new Error(`${selector} is not shown`);
  return found;
}

function inside(inner: Box, outer: Box): boolean {
  return (
    inner.x >= outer.x - 1 &&
    inner.y >= outer.y - 1 &&
    inner.x + inner.width <= outer.x + outer.width + 1 &&
    inner.y + inner.height <= outer.y + outer.height + 1
  );
}

// The screens the game is made for (D38): a tablet held sideways, a laptop, a
// large monitor. The longest title and the level with most goals are used.
for (const [width, height] of [
  [1024, 700],
  [1280, 720],
  [1920, 1080],
] as const) {
  test(`at ${width}×${height}, the level screen shows all it needs without scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#level/02-the-locked-door');
    const view: Box = { x: 0, y: 0, width, height };
    // The start card fits inside the scene's frame.
    expect(inside(await box(page, '.start-card'), await box(page, '.scene-frame'))).toBe(true);
    await page.locator('#start').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    for (const selector of ['.scene-frame', '.cm-editor', '#run', '.goals', '#speed', '#level-settings']) {
      expect(inside(await box(page, selector), view), `${selector} in view`).toBe(true);
    }
    // At least eight lines of code fit in the editor.
    const lineHeight = await page
      .locator('.cm-line')
      .first()
      .evaluate((line) => parseFloat(getComputedStyle(line).lineHeight));
    expect((await box(page, '.cm-editor')).height / lineHeight).toBeGreaterThanOrEqual(8);
    // The notebook opens over the scene, inside its frame.
    await page.locator('#notebook-open').click();
    expect(inside(await box(page, '#notebook'), await box(page, '.scene-frame'))).toBe(true);
  });
}

test('the heading keeps its parts apart with the longest title, at 1024', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.goto('/#level/03-past-the-teacher');
  await page.locator('#start').click();
  const parts = await Promise.all(['.level-title', '#about', '#level-map', '#level-settings'].map((s) => box(page, s)));
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      const [a, b] = [parts[i] as Box, parts[j] as Box];
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      expect(apart).toBe(true);
    }
  }
});

test('on a phone, the panes stack and nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#level/01-the-corridor');
  await page.locator('#start').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('#split')).toBeHidden();
  const [scene, editor] = [await box(page, '.scene-frame'), await box(page, '.cm-editor')];
  expect(editor.y).toBeGreaterThan(scene.y + scene.height - 1);
});

test('the goals fold away from the scene, and open again', async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await page.locator('#start').click();
  const toggle = page.locator('#goals-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(page.locator('#goals-list')).toBeHidden();
  await toggle.click();
  await expect(page.locator('#goals-list')).toBeVisible();
});

test.describe('the keys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#level/01-the-corridor');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(6)');
  });

  test('Tab moves a line in by four spaces, Shift+Tab out again', async ({ page }) => {
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    await expect(page.locator('.cm-content')).toHaveText('    wizard.move_right(6)');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(6)');
  });

  test('Ctrl+Enter in the editor runs the code', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', /playing|done/, { timeout: 30_000 });
  });

  test('Alt+R runs the code from anywhere on the screen, and types nothing', async ({ page }) => {
    await page.locator('.level-title').click();
    await page.keyboard.press('Alt+KeyR');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', /playing|done/, { timeout: 30_000 });
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(6)');
  });

  test('Alt+N opens and closes the notebook, even from the editor', async ({ page }) => {
    await page.keyboard.press('Alt+KeyN');
    await expect(page.locator('#notebook')).toBeVisible();
    await page.keyboard.press('Alt+KeyN');
    await expect(page.locator('#notebook')).toBeHidden();
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(6)');
  });

  test('the settings list the keys', async ({ page }) => {
    await page.goto('/#settings');
    await expect(page.locator('#settings-keys h3')).toHaveText('Teclas');
    await expect(page.locator('#settings-keys dt')).toHaveCount(6);
    await expect(page.locator('#settings-keys')).toContainText('Ctrl+Intro o Alt+R');
  });
});
