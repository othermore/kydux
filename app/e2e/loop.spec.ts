// The whole loop as a child walks it, in each language (D39): a fresh visit,
// the wizard made, a lesson read, its level failed once, a hint, the level won,
// the next lesson, the map and the settings. Each step is asserted, as in the
// other specs, and photographed into e2e/shots/<lang>/, which git ignores: the
// screenshots are the reviewer's eyes between the owner's own trials.

import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';

const SHOTS = fileURLToPath(new URL('./shots/', import.meta.url));

const WORDS = {
  en: {
    create: 'Make your wizard',
    lesson: 'What a program is',
    greeting: 'Welcome to Arvelia, Ada!',
    gate: 'The gate',
    won: 'You did it, Ada!',
    second: 'Objects and actions',
    hello: 'Hello, Ada',
    settings: 'Settings',
  },
  es: {
    create: 'Crea tu personaje',
    lesson: 'Qué es un programa',
    greeting: '¡Te damos la bienvenida a Arvelia, Ada!',
    gate: 'La puerta',
    won: '¡Lo has conseguido, Ada!',
    second: 'Objetos y acciones',
    hello: 'Hola, Ada',
    settings: 'Ajustes',
  },
} as const;

/** Sets the editor's code, as a child would by typing it. */
async function type(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
}

for (const [lang, words] of Object.entries(WORDS)) {
  test(`the whole loop, in ${lang}`, async ({ browser }) => {
    test.setTimeout(240_000);
    const folder = `${SHOTS}${lang}/`;
    rmSync(folder, { recursive: true, force: true });
    mkdirSync(folder, { recursive: true });
    let step = 0;
    const shoot = async (page: Page, name: string) => {
      step += 1;
      await page.screenshot({ path: `${folder}${String(step).padStart(2, '0')}-${name}.png`, fullPage: true });
    };

    const context = await browser.newContext({
      locale: lang === 'es' ? 'es-ES' : 'en-US',
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // A fresh visit: the start screen asks for a wizard first.
    await page.goto('/');
    await expect(page.locator('#continue')).toHaveText(words.create);
    await shoot(page, 'start');

    // The creator: a name, a girl, a look.
    await page.locator('#continue').click();
    await page.locator('#wizard-name').fill('Ada');
    await page.locator('#wizard-gender [data-value="girl"]').click();
    await page.locator('#wizard-looks .radio').nth(1).click();
    await shoot(page, 'creator');

    // The first lesson, page by page; it greets the wizard by name.
    await page.locator('#wizard-done').click();
    await expect(page.locator('.lesson-page h1')).toHaveText(words.lesson);
    await expect(page.locator('.lesson-page')).toContainText(words.greeting);
    await shoot(page, 'lesson-first-page');
    await page.locator('#lesson-next').click();
    await shoot(page, 'lesson-second-page');
    await page.locator('#lesson-next').click();
    await shoot(page, 'lesson-third-page');
    await page.locator('#lesson-next').click();
    await shoot(page, 'lesson-last-page');

    // Try it: the gate, its start card with the teacher's words, the example in the editor.
    await page.locator('#lesson-try').click();
    await expect(page.locator('.start-card h3')).toHaveText(words.gate);
    await expect(page.locator('#card-intro')).toContainText('Ilda');
    await shoot(page, 'start-card');
    await page.locator('#start').click();
    await expect(page.locator('.cm-content')).toContainText('wizard.move_right()');
    await expect(page.locator('#scene')).toHaveAttribute('data-look', 'teal');
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
    await shoot(page, 'level');

    // A wrong run: the wizard walks into the wall, and the card says why.
    await type(page, 'wizard.move_up()');
    await page.locator('#run').click();
    await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#hint')).toBeEnabled();
    await shoot(page, 'wrong-run');

    // A hint.
    await page.locator('#hint').click();
    await expect(page.locator('.hints .hint')).toHaveCount(1);
    await shoot(page, 'hint');

    // The winning run, and the win card that names the wizard.
    await type(page, 'wizard.move_right()');
    await page.locator('#run').click();
    await expect(page.locator('.win-card h3')).toHaveText(words.won, { timeout: 30_000 });
    await shoot(page, 'win');

    // Next: the second lesson, not a level.
    await page.locator('#next').click();
    await expect(page.locator('.lesson-page h1')).toHaveText(words.second);
    await shoot(page, 'next-lesson');

    // The map: the lesson and the corridor done, the second lesson open.
    await page.locator('#lesson-map').click();
    const stops = page.locator('.stop');
    await expect(stops.nth(0)).toHaveAttribute('data-state', 'done');
    await expect(stops.nth(1)).toHaveAttribute('data-state', 'done');
    await expect(stops.nth(2)).toHaveAttribute('data-state', 'open');
    await expect(stops.nth(3)).toHaveAttribute('data-state', 'locked');
    await shoot(page, 'map');

    // The start screen greets the wizard; the settings.
    await page.locator('#map-back').click();
    await expect(page.locator('.start-screen h2')).toHaveText(words.hello);
    await shoot(page, 'start-again');
    await page.locator('#settings-link').click();
    await expect(page.locator('.settings-screen h2')).toHaveText(words.settings);
    await shoot(page, 'settings');

    await context.close();
  });
}
