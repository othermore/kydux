import { expect, type Page, test } from '@playwright/test';
import { seedWizard } from './helpers';

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

test('a first visit makes the wizard first, and Done opens the first lesson by name', async ({ page }) => {
  await page.goto('/');
  const go = page.locator('#continue');
  await expect(go).toHaveText('Make your wizard');
  await go.click();
  await expect(page).toHaveURL(/#wizard$/);
  await expect(page.locator('.wizard-screen h2')).toHaveText('Your wizard');
  await expect(page.locator('#wizard-looks .radio')).toHaveCount(8);
  await expect(page.locator('#wizard-done')).toBeDisabled();
  await expect(page.locator('#wizard-back')).toHaveCount(0);

  await page.locator('#wizard-name').fill('Ana');
  // A name alone is not enough: the wizard's gender is the child's to choose.
  await expect(page.locator('#wizard-done')).toBeDisabled();
  await page.locator('#wizard-gender [data-value="girl"]').click();
  await expect(page.locator('#wizard-done')).toBeEnabled();
  await page.locator('#wizard-looks .radio').nth(2).click();
  await expect(page.locator('#wizard-looks .radio').nth(2)).toHaveAttribute('aria-checked', 'true');
  expect(await robeColour(page, '#wizard-preview')).toBe('#8e4bb5');
  await expect(page.locator('#wizard-preview-name')).toHaveText('Ana');

  await page.locator('#wizard-done').click();
  await expect(page).toHaveURL(/#lesson\/what-a-program-is$/);
  await expect(page.locator('.lesson-page')).toContainText('Welcome to Arvelia, Ana!');

  await page.locator('#home').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Ana');
  await expect(page.locator('#continue')).toHaveText('Continue: What a program is');
  await expect(page.locator('#change-wizard')).toBeVisible();
  expect(await robeColour(page, '#start-figure')).toBe('#8e4bb5');
});

test('a name keeps only the characters a name may have, and says so', async ({ page }) => {
  await page.goto('/#wizard');
  await expect(page.locator('#wizard-name-rule')).toBeHidden();
  await page.locator('#wizard-name').pressSequentially('Jo<sé>');
  await expect(page.locator('#wizard-name')).toHaveValue('José');
  await expect(page.locator('#wizard-name-rule')).toBeVisible();
  await page.locator('#wizard-name').fill('   ');
  await page.locator('#wizard-gender [data-value="boy"]').click();
  await expect(page.locator('#wizard-done')).toBeDisabled();
});

test('the arrow keys move through the looks', async ({ page }) => {
  await page.goto('/#wizard');
  const looks = page.locator('#wizard-looks .radio');
  await looks.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(looks.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(looks.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(looks.nth(7)).toHaveAttribute('aria-checked', 'true');
});

test('the scene draws the look chosen, and the words follow a girl in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#wizard');
  await makeWizard(page, 'Lucía', 'girl', 5);
  await page.locator('#wizard-done').click();
  await expect(page).toHaveURL(/#lesson\/what-a-program-is$/);
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-intro')).toContainText('mueve a la maga');
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
  await elsewhere.goto('/');
  await expect(elsewhere.locator('#continue')).toHaveText('Make your wizard');
  await elsewhere.locator('#import-file').setInputFiles(file as string);
  await expect(elsewhere.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await other.close();
});
