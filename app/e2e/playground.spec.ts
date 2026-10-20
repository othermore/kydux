import { expect, test, type Page } from '@playwright/test';

async function setCode(page: Page, code: string): Promise<void> {
  await page.locator('#code').fill(code);
}

async function waitReady(page: Page, timeout = 90_000): Promise<void> {
  await expect(page.locator('#run')).toBeEnabled({ timeout });
}

test.use({ locale: 'en-US' });

test('Python runs in the browser, and a forever loop is stopped', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(true);
  await waitReady(page);
  await expect(page.locator('#status')).toHaveText(/^Python 3\.14\.\d+ ready$/);

  await page.locator('#run').click();
  await expect(page.locator('#output')).toHaveText('Hello, Kydux!');

  await setCode(page, 'print(1 + 1)');
  await page.locator('#run').click();
  await expect(page.locator('#output')).toHaveText('2');

  await setCode(page, 'import kydux_world\nprint(kydux_world.__version__)');
  await page.locator('#run').click();
  await expect(page.locator('#output')).toHaveText(/^\d+\.\d+\.\d+\s*$/);

  await setCode(page, 'x = 1\nprint(y)');
  await page.locator('#run').click();
  await expect(page.locator('#output')).toHaveText("NameError: name 'y' is not defined (line 2)");

  await setCode(page, 'while True:\n    pass');
  const started = Date.now();
  await page.locator('#run').click();
  await expect(page.locator('#status')).toHaveText(
    'Stopped: the code ran for more than 5 seconds.',
    { timeout: 10_000 },
  );
  expect(Date.now() - started).toBeLessThan(10_000);

  await setCode(page, 'print("again")');
  await waitReady(page, 30_000);
  await page.locator('#run').click();
  await expect(page.locator('#output')).toHaveText('again');
});

test('the page speaks Spanish, and switches language without a reload', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.tagline')).toHaveText('Un juego para aprender Python');
  await waitReady(page);
  await expect(page.locator('#status')).toHaveText(/^Python 3\.14\.\d+ listo$/);
  await page.locator('#run').click();
  await expect(page.locator('#output')).toHaveText('¡Hola, Kydux!');

  await page.locator('#language').selectOption('en');
  await expect(page.locator('.tagline')).toHaveText('A game for learning Python');
  await expect(page.locator('#status')).toHaveText(/^Python 3\.14\.\d+ ready$/);
  await expect(page.locator('#output')).toHaveText('¡Hola, Kydux!');
  await context.close();
});
