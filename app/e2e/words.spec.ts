import { type Browser, expect, type Page, test } from '@playwright/test';

/** A page whose progress document already holds a wizard (D36). */
async function withWizard(browser: Browser, locale: string, gender: 'girl' | 'boy'): Promise<Page> {
  const context = await browser.newContext({ locale });
  const document = { version: 1, wizard: { name: 'Marta', gender, look: 'amber' } };
  await context.addInitScript((kept) => {
    if (!localStorage.getItem('kydux.progress')) localStorage.setItem('kydux.progress', kept);
  }, JSON.stringify(document));
  return context.newPage();
}

test('the words speak of a girl as a girl: the starting code and the notebook', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'girl');
  await page.goto('/#level/01-the-corridor');
  await page.locator('#start').click();
  await expect(page.locator('.cm-content')).toContainText('# La maga avanza una casilla por paso.');
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook')).toContainText('El cuaderno de la maga');
  await page.context().close();
});

test('the words speak of a boy as a boy', async ({ browser }) => {
  const page = await withWizard(browser, 'es-ES', 'boy');
  await page.goto('/#level/01-the-corridor');
  await page.locator('#start').click();
  await expect(page.locator('.cm-content')).toContainText('# El mago avanza una casilla por paso.');
  await page.context().close();
});

test('a lesson greets the wizard by name, in both languages', async ({ browser }) => {
  for (const [locale, words] of [
    ['es-ES', '¡Te damos la bienvenida al colegio, Marta!'],
    ['en-US', 'Welcome to the school, Marta!'],
  ] as const) {
    const page = await withWizard(browser, locale, 'girl');
    await page.goto('/#lesson/01-first-action');
    await expect(page.locator('.lesson-page')).toContainText(words);
    if (locale === 'es-ES') await expect(page.locator('.lesson-page')).toContainText('que la maga se mueva');
    await page.context().close();
  }
});

test('with no wizard yet, a lesson says the word for one', async ({ page }) => {
  await page.goto('/#lesson/01-first-action');
  await expect(page.locator('.lesson-page')).toContainText('Welcome to the school, apprentice!');
});
