import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

async function setCode(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
}

test('a level that does not exist says so, and leads to the start', async ({ page }) => {
  await page.goto('/#level/no-such-level');
  await expect(page.locator('.not-found')).toContainText('There is no level called “no-such-level”.');
  await page.locator('#first-level').click();
  await expect(page.locator('#continue')).toBeVisible();
});

test('Python that cannot start says so, with a way to reload', async ({ page }) => {
  // A wasm that fails to arrive makes Pyodide wait forever, which the runtime's
  // load timeout catches (a Vitest); a loader that fails to arrive fails at once.
  await page.route('**/pyodide/pyodide.mjs', (route) => route.abort());
  await page.goto('/#level/01-the-corridor');
  await expect(page.locator('.outcome-text')).toHaveText(
    'Python could not start. Reload the page to try again.',
    { timeout: 60_000 },
  );
  await expect(page.locator('#reload')).toBeVisible();
  await expect(page.locator('#run')).toBeDisabled();
});

test('a Run during the playback starts the new run from the start', async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await setCode(page, 'wizard.move_right(6)');
  await page.locator('#run').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-tick', '2', { timeout: 10_000 });
  await setCode(page, 'wizard.move_right(2)');
  await page.locator('#run').click();
  await expect(page.locator('.outcome-text')).toHaveText('Not yet: 0 of 1 goals met. Try again.', {
    timeout: 30_000,
  });
  await expect(page.locator('#scene')).toHaveAttribute('data-wizard', '3,1');
});

test('without isolation, a loop that never ends is stopped by starting Python again', async ({
  page,
}) => {
  // As on a page served over plain HTTP from another computer.
  await page.addInitScript(() =>
    Object.defineProperty(globalThis, 'crossOriginIsolated', { value: false }),
  );
  await page.goto('/#level/01-the-corridor');
  await expect(page.locator('html')).toHaveAttribute('data-isolated', 'false');
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await setCode(page, 'while True:\n    pass');
  await page.locator('#run').click();
  await expect(page.locator('.outcome-text')).toHaveText(
    'Your program was stopped: it ran for more than 5 seconds without doing anything.',
    { timeout: 15_000 },
  );
  await expect(page.locator('#status')).toHaveText('Starting Python again…');
  await expect(page.locator('#run')).toBeDisabled();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 60_000 });
  await setCode(page, 'wizard.move_right(6)');
  await page.locator('#run').click();
  await expect(page.locator('.outcome-text')).toHaveText('You did it!', { timeout: 30_000 });
});

test('the scene follows the size of the window', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#level/01-the-corridor');
  const canvas = page.locator('#scene canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const wide = (await canvas.boundingBox())?.width ?? 0;
  await page.setViewportSize({ width: 900, height: 700 });
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeLessThan(wide);
});

test('the page may reach no other server, and the game still runs', async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  const blocked = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        document.addEventListener('securitypolicyviolation', (e) => resolve(e.effectiveDirective), {
          once: true,
        });
        fetch('https://example.com/').catch(() => {});
      }),
  );
  expect(blocked).toBe('connect-src');
  await setCode(page, 'wizard.move_right(6)');
  await page.locator('#run').click();
  await expect(page.locator('.outcome-text')).toHaveText('You did it!', { timeout: 30_000 });
});

test("the child's code cannot reach JavaScript", async ({ page }) => {
  await page.goto('/#level/01-the-corridor');
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  for (const code of ['import js', 'from pyodide.ffi import to_js', 'import sys\nprint(sys.modules["js"])']) {
    await setCode(page, code);
    await page.locator('#run').click();
    await expect(page.locator('.outcome-text')).toHaveText(
      /^(There is no book called (js|pyodide\.ffi) in the school's library|Python says: KeyError)/,
      { timeout: 30_000 },
    );
  }
});
