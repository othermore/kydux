import { type Browser, expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard, skipGuide, storyNext, storySaid } from './helpers';

/** A page whose progress document already holds a wizard (D36). */
async function withWizard(browser: Browser, locale: string, gender: 'girl' | 'boy'): Promise<Page> {
  const context = await browser.newContext({ locale });
  await seedWizard(context, { ...MARTA, gender });
  return context.newPage();
}

/** The gate won, its win card open with Nuri's words. */
async function winTheGate(page: Page): Promise<void> {
  await page.locator('#start').click();
  await skipGuide(page);
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.move_right()');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
}

test('the words speak of a girl as a girl: the notebook and a level\'s outro', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'girl');
  await page.goto('/#level/the-gate');
  await winTheGate(page);
  await expect(page.locator('#card-outro')).toContainText('Has aprendido a mover a tu maga');
  await page.locator('#again').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook')).toContainText('El cuaderno de la maga');
  await page.context().close();
});

test('the words speak of a boy as a boy', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'boy');
  await page.goto('/#level/the-gate');
  await winTheGate(page);
  await expect(page.locator('#card-outro')).toContainText('Has aprendido a mover a tu mago');
  await page.context().close();
});

test('a story greets the wizard by name, and Nuri is of the wizard\'s gender', async ({ browser }) => {
  for (const [locale, gender, words] of [
    ['es-ES', 'girl', 'Encantada de conocerte, Nuri. Yo soy Marta.'],
    ['es-ES', 'girl', 'Soy una alumna de primer año'],
    ['es-ES', 'boy', 'Soy un alumno de primer año'],
    ['en-US', 'girl', 'I am Marta.'],
  ] as const) {
    const page = await withWizard(browser, locale, gender);
    await page.goto('/#story/at-the-gate');
    // Nuri's greeting, reached again with Back; then the wizard's answer, by name.
    await storyNext(page, 4);
    await page.locator('#story-back').click();
    await expect(page.locator('#story-step')).toHaveText(/^4 /);
    if (words.startsWith('Soy')) await expect(storySaid(page)).toContainText(words);
    await storyNext(page);
    if (!words.startsWith('Soy')) await expect(storySaid(page)).toContainText(words);
    await page.context().close();
  }
});

test('with no wizard yet, a story says the word for one', async ({ page }) => {
  await page.goto('/#story/at-the-gate');
  await storyNext(page, 4);
  await expect(storySaid(page)).toContainText('I am apprentice.');
});
