import { expect, type Page, test } from '@playwright/test';

test.use({ locale: 'en-US' });

async function openTheCorridor(page: Page): Promise<void> {
  await page.goto('/#level/the-long-corridor');
  const start = page.locator('#start');
  if (await start.isVisible().catch(() => false)) await start.click();
  await expect(page.locator('.cm-editor')).toBeVisible();
}

const editorFontSize = (page: Page) =>
  page.locator('.cm-content').evaluate((node) => getComputedStyle(node).fontSize);

/** The editor's letter: its first family, its width and its size. */
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

test("the editor's sizes are 14, 16, 20 and 24, and 16 where nothing is chosen (D223)", async ({ page }) => {
  await page.goto('/#settings');
  const sizes = await page.locator('#settings-font-size option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value),
  );
  expect(sizes).toEqual(['14', '16', '20', '24']);
  await expect(page.locator('#settings-font-size')).toHaveValue('16');
});

test("the code is set in the bundled Inconsolata at 16 where nothing is chosen, and no request leaves the page's origin (D223)", async ({
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
  // Without ?debug the letter is not offered.
  await page.goto('/#settings');
  await expect(page.locator('#settings-font-size')).toBeVisible();
  await expect(page.locator('#settings-code-font')).toHaveCount(0);
});

test("under ?debug the settings offer the three letters; each sets the editor's face, width and size at once, and stays after a reload (D223)", async ({
  page,
}) => {
  await page.goto('/?debug#level/the-long-corridor');
  const start = page.locator('#start');
  if (await start.isVisible().catch(() => false)) await start.click();
  await expect(page.locator('.cm-editor')).toBeVisible();
  await page.locator('#level-settings').click();
  await expect(page).toHaveURL(/\?debug#settings$/);
  const choice = page.locator('#settings-code-font');
  const offered = await choice.locator('option').evaluateAll((options) =>
    options.map((option) => [(option as HTMLOptionElement).value, option.textContent]),
  );
  expect(offered).toEqual([
    ['inconsolata-16', 'Inconsolata, 16'],
    ['noto-semi-14', 'Noto Sans Mono semi-condensed, 14'],
    ['noto-condensed-14', 'Noto Sans Mono condensed, 14'],
  ]);
  await expect(choice).toHaveValue('inconsolata-16');

  const sample = page.locator('#settings-sample');
  for (const [name, stretch] of [
    ['noto-semi-14', '87.5%'],
    ['noto-condensed-14', '75%'],
  ] as const) {
    await page.locator('#settings-code-font').selectOption(name);
    // At once, with no reload: the sample, and the size the candidate gives.
    await expect(page.locator('#settings-font-size')).toHaveValue('14');
    await expect(sample).toHaveCSS('font-stretch', stretch);
    await expect(sample).toHaveCSS('font-size', '14px');
  }
  // The size stays the child's to change after.
  await page.locator('#settings-font-size').selectOption('20');
  await page.locator('#settings-back').click();
  await expect(page).toHaveURL(/#level\/the-long-corridor$/);
  await expect.poll(() => editorLetter(page)).toEqual({ face: 'Noto Sans Mono', stretch: '75%', size: '20px' });
  await expect.poll(() => loaded(page, 'Noto Sans Mono')).toBe(true);
  await page.reload();
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect.poll(() => editorLetter(page)).toEqual({ face: 'Noto Sans Mono', stretch: '75%', size: '20px' });

  await page.goto('/?debug#settings');
  await expect(page.locator('#settings-code-font')).toHaveValue('noto-condensed-14');
  await page.locator('#settings-code-font').selectOption('inconsolata-16');
  await expect(page.locator('#settings-font-size')).toHaveValue('16');
  await expect(sample).toHaveCSS('font-stretch', '100%');
});
