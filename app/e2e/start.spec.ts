import { expect, test, type Page } from '@playwright/test';
import { levelText, seedWizard } from './helpers';

const STAIRS = levelText('the-stairs', 'en').title;

test.use({ locale: 'en-US' });

// Continue goes on in the course once there is a wizard; before, it makes one
// (wizard.spec.ts).
test.beforeEach(async ({ page }) => seedWizard(page));

async function winTheCorridor(page: Page): Promise<void> {
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: 30_000 });
}

test('the start screen opens the game, and Continue opens the first lesson', async ({
  page,
}) => {
  await page.goto('/');
  const go = page.locator('#continue');
  await expect(go).toHaveText('Continue: At the gate');
  await go.click();
  await expect(page.locator('#story-title')).toHaveText('At the gate');
});

test('after a win, Continue names what comes next, and the title leads home', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();
  await expect(page.locator('#continue')).toHaveText(`Continue: ${STAIRS}`);
});

test('a game exported comes back, imported as one more game', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();
  await expect(page.locator('#saved-note')).toHaveText('Your game is saved as you play.');

  const downloading = page.waitForEvent('download');
  await page.locator('#export').click();
  const file = await (await downloading).path();
  expect(file).toBeTruthy();

  await page.locator('#import-file').setInputFiles(file as string);
  await expect(page.locator('#continue')).toHaveText(`Continue: ${STAIRS}`);
  await page.locator('#load-game').click();
  await expect(page.locator('#games .game')).toHaveCount(2);
});

test('a new game begins the story for a new wizard; the games are loaded by name (D70)', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();

  // New game: the letter, the creator, a second wizard; the first game stays.
  await page.locator('#new').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
  await page.goto('/#wizard');
  await page.locator('#wizard-name').fill('Leo');
  await page.locator('#wizard-gender [data-value="boy"]').click();
  await page.locator('#wizard-done').click();
  await page.locator('#home').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Leo');

  // The list: each wizard, where the game is, and Play.
  await page.locator('#load-game').click();
  const games = page.locator('#games .game');
  await expect(games).toHaveCount(2);
  await expect(games.nth(0)).toContainText('Leo');
  await expect(games.nth(1)).toContainText('Marta');
  await expect(games.nth(1)).toContainText(`Improve 1: ${STAIRS}`);
  await games.nth(1).locator('.play').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await expect(page.locator('#continue')).toHaveText(`Continue: ${STAIRS}`);

  // Delete asks first.
  await page.locator('#load-game').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#games .game', { hasText: 'Leo' }).locator('.delete').click();
  await expect(page.locator('#games .game')).toHaveCount(1);
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
});

test('with saved games and no game being played, the start screen offers them', async ({ page }) => {
  await page.goto('/');
  await page.locator('#new').click();
  await page.goto('/');
  await expect(page).not.toHaveURL(/#story/);
  await expect(page.locator('#continue')).toHaveText('Begin the story');
  await page.locator('#load-game').click();
  await expect(page.locator('#games .game')).toHaveCount(1);
});

test('a file that is not progress is refused, and nothing changes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#import-file').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": "world"}'),
  });
  await expect(page.locator('#start-message')).toHaveText(
    'That file is not a Kydux progress file. Nothing has changed.',
  );
  await expect(page.locator('#continue')).toHaveText('Continue: At the gate');
});

test('the start screen in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  await seedWizard(context);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#continue')).toHaveText('Continuar: Ante la puerta');
  await expect(page.locator('#new')).toHaveText('Partida nueva');
  await expect(page.locator('#load-game')).toHaveText('Cargar una partida');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#continue')).toHaveText('Continue: At the gate');
  await context.close();
});
