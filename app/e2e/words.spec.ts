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
  await expect(page.locator('#card-intro')).toContainText('Cada línea mueve a la maga una casilla.');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook')).toContainText('El cuaderno de la maga');
  await page.context().close();
});

test('the words speak of a boy as a boy', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'boy');
  await page.goto('/#level/the-corridor');
  await expect(page.locator('#card-intro')).toContainText('Cada línea mueve al mago una casilla.');
  await page.context().close();
});

test('a lesson greets the wizard by name, in both languages', async ({ browser }) => {
  for (const [locale, words] of [
    ['es-ES', '¡Te damos la bienvenida a Arvelia, Marta!'],
    ['en-US', 'Welcome to Arvelia, Marta!'],
  ] as const) {
    const page = await withWizard(browser, locale, 'girl');
    await page.goto('/#lesson/what-a-program-is');
    await expect(page.locator('.lesson-page')).toContainText(words);
    await page.context().close();
  }
});

test('with no wizard yet, a lesson says the word for one', async ({ page }) => {
  await page.goto('/#lesson/what-a-program-is');
  await expect(page.locator('.lesson-page')).toContainText('Welcome to Arvelia, apprentice!');
});
