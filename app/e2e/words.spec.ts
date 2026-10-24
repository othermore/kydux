import { type Browser, expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';

/** A page whose progress document already holds a wizard (D36). */
async function withWizard(browser: Browser, locale: string, gender: 'girl' | 'boy'): Promise<Page> {
  const context = await browser.newContext({ locale });
  await seedWizard(context, { ...MARTA, gender });
  return context.newPage();
}

test('the words speak of a girl as a girl: a level\'s intro and the notebook', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'girl');
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-intro')).toContainText('Dale a tu maga una acción para cada paso.');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook')).toContainText('El cuaderno de la maga');
  await page.context().close();
});

test('the words speak of a boy as a boy', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'boy');
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-intro')).toContainText('Dale a tu mago una acción para cada paso.');
  await page.context().close();
});

test('a story page greets the wizard by name, and Nuri is of the wizard\'s gender', async ({ browser }) => {
  for (const [locale, gender, words] of [
    ['es-ES', 'girl', 'No te preocupes, Marta.'],
    ['es-ES', 'girl', 'Soy una alumna de primer año'],
    ['es-ES', 'boy', 'Soy un alumno de primer año'],
    ['en-US', 'girl', 'Do not worry, Marta.'],
  ] as const) {
    const page = await withWizard(browser, locale, gender);
    await page.goto('/#story/at-the-gate');
    await page.locator('#lesson-next').click();
    await page.locator('#lesson-next').click();
    await page.locator('#lesson-back').click();
    await expect(page.locator('.lesson-page')).toContainText(words.startsWith('Soy') ? words : 'Nuri');
    await page.locator('#lesson-next').click();
    if (!words.startsWith('Soy')) await expect(page.locator('.lesson-page')).toContainText(words);
    await page.context().close();
  }
});

test('with no wizard yet, a story page says the word for one', async ({ page }) => {
  await page.goto('/#story/at-the-gate');
  await page.locator('#lesson-next').click();
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-page')).toContainText('Do not worry, apprentice.');
});
