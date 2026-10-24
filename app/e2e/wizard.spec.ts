import { expect, type Page, test } from '@playwright/test';
import { seedWizard, storyNext, storySaid } from './helpers';

test.use({ locale: 'en-US' });

/** The colour of a pixel of the robe in a figure's canvas, as #rrggbb. */
const robeColour = (page: Page, selector: string) =>
  page.locator(selector).evaluate((canvas: HTMLCanvasElement) => {
    const [r, g, b] = canvas.getContext('2d')?.getImageData(18, 36, 1, 1).data ?? [];
    return `#${[r, g, b].map((c) => (c ?? 0).toString(16).padStart(2, '0')).join('')}`;
  });

async function makeWizard(page: Page, name: string, gender: 'girl' | 'boy', look: number): Promise<void> {
  await page.locator('#wizard-name').fill(name);
  await page.locator(`#wizard-gender [data-value="${gender}"]`).click();
  await page.locator('#wizard-looks .radio').nth(look).click();
}

test('a first visit opens on the story, which leads to the creator (D61)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/#story\/the-letter$/);
  await expect(page.locator('#story-title')).toHaveText('The letter');
  // No code in the opening: the story comes first, told on the scene (D74).
  await expect(page.locator('.cm-content')).toHaveCount(0);
  await expect(page.locator('#scene canvas')).toBeVisible();
  await storyNext(page, 3);
  await expect(page.locator('#story-go-on')).toHaveText('Go on');
  await page.locator('#story-go-on').click();
  await expect(page).toHaveURL(/#wizard$/);
  // The start screen, reached on purpose, begins the story too.
  await page.goto('/#start');
  await expect(page.locator('#continue')).toHaveText('Begin the story');
  await expect(page.locator('#continue')).toHaveAttribute('href', '#story/the-letter');
});

test('the creator, and Done opens the first lesson by name', async ({ page }) => {
  await page.goto('/#wizard');
  await expect(page.locator('.wizard-screen h2')).toHaveText('Your wizard');
  // A name to start from (D61); the looks wait for the gender.
  await expect(page.locator('#wizard-name')).toHaveValue('Kydux');
  await expect(page.locator('#wizard-looks .radio')).toHaveCount(0);
  await expect(page.locator('#wizard-looks-first')).toBeVisible();
  await expect(page.locator('#wizard-done')).toBeDisabled();
  await expect(page.locator('#wizard-back')).toHaveCount(0);

  await page.locator('#wizard-name').fill('Ana');
  // A name alone is not enough: the wizard's gender is the child's to choose.
  await expect(page.locator('#wizard-done')).toBeDisabled();
  await page.locator('#wizard-gender [data-value="girl"]').click();
  await expect(page.locator('#wizard-looks .radio')).toHaveCount(4);
  await expect(page.locator('#wizard-done')).toBeEnabled();
  await page.locator('#wizard-looks .radio').nth(2).click();
  await expect(page.locator('#wizard-looks .radio').nth(2)).toHaveAttribute('aria-checked', 'true');
  expect(await robeColour(page, '#wizard-preview')).toBe('#3b8fd6');
  await expect(page.locator('#wizard-preview-name')).toHaveText('Ana');

  await page.locator('#wizard-done').click();
  // Chapter 1 opens at the gate, where Nuri greets the wizard by name.
  await expect(page).toHaveURL(/#story\/at-the-gate$/);
  await storyNext(page, 4);
  await expect(storySaid(page)).toContainText('Ana');

  await page.locator('#home').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Ana');
  await expect(page.locator('#continue')).toHaveText('Continue: At the gate');
  await expect(page.locator('#change-wizard')).toBeVisible();
  expect(await robeColour(page, '#start-figure')).toBe('#3b8fd6');
});

test('a name of the game\'s own is refused, and a boy\'s looks are a boy\'s', async ({ page }) => {
  await page.goto('/#wizard');
  await page.locator('#wizard-gender [data-value="boy"]').click();
  await expect(page.locator('#wizard-looks .radio')).toHaveCount(4);
  expect(await robeColour(page, '#wizard-preview')).toBe('#d9822b');
  for (const name of ['Dask', 'zelim', 'Wizard']) {
    await page.locator('#wizard-name').fill(name);
    await expect(page.locator('#wizard-name-taken')).toBeVisible();
    await expect(page.locator('#wizard-done')).toBeDisabled();
  }
  await page.locator('#wizard-name').fill('Leo');
  await expect(page.locator('#wizard-name-taken')).toBeHidden();
  await expect(page.locator('#wizard-done')).toBeEnabled();
});

test('a name keeps only the characters a name may have, and says so', async ({ page }) => {
  await page.goto('/#wizard');
  await expect(page.locator('#wizard-name-rule')).toBeHidden();
  // Typing in the field replaces the name it starts with.
  await page.locator('#wizard-name').click();
  await page.locator('#wizard-name').pressSequentially('Jo<sé>');
  await expect(page.locator('#wizard-name')).toHaveValue('José');
  await expect(page.locator('#wizard-name-rule')).toBeVisible();
  await page.locator('#wizard-name').fill('   ');
  await page.locator('#wizard-gender [data-value="boy"]').click();
  await expect(page.locator('#wizard-done')).toBeDisabled();
});

test('the arrow keys move through the looks', async ({ page }) => {
  await page.goto('/#wizard');
  await page.locator('#wizard-gender [data-value="girl"]').click();
  const looks = page.locator('#wizard-looks .radio');
  await looks.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(looks.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(looks.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(looks.nth(3)).toHaveAttribute('aria-checked', 'true');
});

test('the scene draws the look chosen, and the words follow a girl in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#wizard');
  await makeWizard(page, 'Lucía', 'girl', 2);
  await page.locator('#wizard-done').click();
  await expect(page).toHaveURL(/#story\/at-the-gate$/);
  await page.goto('/#lesson/what-a-program-is');
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-page')).toContainText('Tu maga, que eres tú');
  await page.goto('/#level/the-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-look', 'sky');
  await context.close();
});

test('Change my wizard opens it as it is; Back and Escape leave it so', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/');
  await page.locator('#change-wizard').click();
  await expect(page.locator('#wizard-name')).toHaveValue('Marta');
  await expect(page.locator('#wizard-gender [data-value="girl"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#wizard-looks .radio').nth(0)).toHaveAttribute('aria-checked', 'true');
  await page.locator('#wizard-name').fill('Mar');
  await page.locator('#wizard-back').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await page.locator('#change-wizard').click();
  await page.locator('#wizard-name').fill('Mar');
  await page.keyboard.press('Escape');
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await page.locator('#change-wizard').click();
  await page.locator('#wizard-name').fill('Mar');
  await page.locator('#wizard-done').click();
  await page.locator('#home').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Mar');
});

test('the wizard goes with exported progress to another browser', async ({ page, browser }) => {
  await seedWizard(page);
  await page.goto('/');
  const downloading = page.waitForEvent('download');
  await page.locator('#export').click();
  const file = await (await downloading).path();

  const other = await browser.newContext({ locale: 'en-US' });
  const elsewhere = await other.newPage();
  await elsewhere.goto('/#start');
  await expect(elsewhere.locator('#continue')).toHaveText('Begin the story');
  await elsewhere.locator('#import-file').setInputFiles(file as string);
  await expect(elsewhere.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await other.close();
});
