import { expect, type Page, test } from '@playwright/test';

test.use({ locale: 'en-US' });

/** The level opened, its start card waited for and closed: the card lies over the
 * whole window (D228), the handle between the panes under it. */
async function openTheCorridor(page: Page, address = '/#level/the-long-corridor'): Promise<void> {
  await page.goto(address);
  await page.locator('#start').click();
  await expect(page.locator('.card-overlay')).toHaveCount(0);
  await expect(page.locator('.cm-editor')).toBeVisible();
}

const editorFontSize = (page: Page) =>
  page.locator('.cm-content').evaluate((node) => getComputedStyle(node).fontSize);

/** The editor's letter: its first family, its width and its size (D238). */
const editorLetter = (page: Page) =>
  page.locator('.cm-content').evaluate((node) => {
    const style = getComputedStyle(node);
    const face = (style.fontFamily.split(',')[0] ?? '').replace(/["']/g, '').trim();
    return { face, stretch: style.fontStretch, size: style.fontSize };
  });

/** Whether the page's own face of that name has loaded, the one bundled with the game. */
const loaded = (page: Page, family: string) =>
  page.evaluate(async (name) => {
    await document.fonts.ready;
    return [...document.fonts].some((face) => face.family.replace(/["']/g, '') === name && face.status === 'loaded');
  }, family);

const stageWidth = async (page: Page) => (await page.locator('.stage').boundingBox())?.width ?? 0;

test('the settings open from the start screen, and Back returns to it', async ({ page }) => {
  await page.goto('/#start');
  await page.locator('#settings-link').click();
  await expect(page).toHaveURL(/#settings$/);
  await expect(page.locator('.settings-screen h2')).toHaveText('Settings');
  await page.locator('#settings-back').click();
  await expect(page.locator('#continue')).toBeVisible();
});

test('the text size chosen shows in the editor at once, and after a reload', async ({ page }) => {
  await openTheCorridor(page);
  await expect.poll(() => editorFontSize(page)).toBe('16px');
  await page.locator('#level-settings').click();
  await expect(page).toHaveURL(/#settings$/);
  await page.locator('#settings-font-size').selectOption('24');
  await expect(page.locator('#settings-sample')).toHaveCSS('font-size', '24px');
  await page.locator('#settings-back').click();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
  await expect.poll(() => editorFontSize(page)).toBe('24px');
  await page.reload();
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect.poll(() => editorFontSize(page)).toBe('24px');
});

test('the speed chosen in the settings is the level screen speed', async ({ page }) => {
  await page.goto('/#settings');
  await page.locator('#settings-speed').selectOption('4');
  await openTheCorridor(page);
  await expect(page.locator('#speed')).toHaveValue('4');
});

test('the handle dragged moves the panes, the share stays after a reload, and a double-click restores it', async ({
  page,
}) => {
  await openTheCorridor(page);
  const before = await stageWidth(page);
  const handle = page.locator('#split');
  const box = await handle.boundingBox();
  if (!box) throw new Error('no handle');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x - 150, y, { steps: 5 });
  await page.mouse.up();
  const after = await stageWidth(page);
  expect(after).toBeLessThan(before - 100);

  await page.reload();
  // The level opens on its start card again (D248).
  await page.locator('#start').click();
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect.poll(() => stageWidth(page)).toBeCloseTo(after, -1);

  await page.locator('#split').dblclick();
  await expect.poll(() => stageWidth(page)).toBeCloseTo(before, -1);
});

test('the handle keeps the scene between its least and its most', async ({ page }) => {
  await openTheCorridor(page);
  const handle = page.locator('#split');
  const box = await handle.boundingBox();
  if (!box) throw new Error('no handle');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(0, y, { steps: 5 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '35');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuenow', '40');
});

test('the settings in Spanish, and a language chosen there', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#settings');
  await expect(page.locator('.settings-screen h2')).toHaveText('Ajustes');
  await expect(page.locator('#settings-back')).toHaveText('Volver');
  await page.locator('#settings-language').selectOption('en');
  await expect(page.locator('.settings-screen h2')).toHaveText('Settings');
  await context.close();
});

test("the editor's sizes are 14, 16, 20 and 24, and 16 where nothing is chosen (D223, D238)", async ({ page }) => {
  await page.goto('/#settings');
  const sizes = await page.locator('#settings-font-size option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value),
  );
  expect(sizes).toEqual(['14', '16', '20', '24']);
  await expect(page.locator('#settings-font-size')).toHaveValue('16');
});

test("the code is set in the bundled Inconsolata at 16, no other face is asked for, and no request leaves the page's origin (D238)", async ({
  page,
}) => {
  const asked: string[] = [];
  page.on('request', (request) => asked.push(request.url()));
  await openTheCorridor(page);
  await expect.poll(() => editorLetter(page)).toEqual({ face: 'Inconsolata', stretch: '100%', size: '16px' });
  await expect.poll(() => loaded(page, 'Inconsolata')).toBe(true);
  const origin = new URL(page.url()).origin;
  const elsewhere = asked.filter((url) => /^https?:/.test(url) && new URL(url).origin !== origin);
  expect(elsewhere).toEqual([]);
  expect(asked.filter((url) => /noto/i.test(url))).toEqual([]);
});

test('the settings offer no letter to choose, with ?debug or without (D238)', async ({ page }) => {
  for (const address of ['/#settings', '/?debug#settings']) {
    await page.goto(address);
    await expect(page.locator('#settings-font-size')).toBeVisible();
    await expect(page.locator('#settings-code-font')).toHaveCount(0);
  }
});
