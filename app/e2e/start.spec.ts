import { expect, test, type Page } from '@playwright/test';
import { levelText, seedWizard } from './helpers';
import { ciTimes } from './support';

const STAIRS = levelText('the-stairs', 'en').title;

test.use({ locale: 'en-US' });

// Continue goes on in the course once there is a wizard; before, it makes one
// (wizard.spec.ts).
test.beforeEach(async ({ page }) => seedWizard(page));

async function winTheCorridor(page: Page): Promise<void> {
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('4');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('wizard.move_right(8)');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
}

test('the start screen opens the game, and Continue opens the first lesson', async ({
  page,
}) => {
  await page.goto('/');
  const go = page.locator('#continue');
  await expect(go).toHaveText('Continue game');
  await expect(go).toHaveAttribute('href', '#story/at-the-gate');
  // One screen with or without a wizard: no words above the buttons (D293).
  await expect(page.locator('.start-screen > p')).toHaveCount(0);
  await go.click();
  await expect(page.locator('#story-title')).toHaveText('At the gate');
});

test('after a win, Continue goes to what comes next, and the title leads home', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();
  await expect(page.locator('#continue')).toHaveAttribute('href', '#level/the-stairs');
});

test('a game exported comes back, imported as one more game', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await winTheCorridor(page);
  await page.locator('#home').click();
  // The box of the saved games is there as soon as there is one, and says how they are kept (D293).
  await expect(page.locator('#games #saved-note')).toHaveText(
    'Your game is saved as you play, in this browser. To take it to another browser or another computer, ' +
      'or to keep a copy, export it to a file and import it there.',
  );

  // Each game has its Export, and the file takes the game's name.
  const downloading = page.waitForEvent('download');
  await page.locator('#games .game .export').click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('kydux-Marta.json');
  const file = await download.path();
  expect(file).toBeTruthy();

  // The name is asked first: the wizard's, with a number, since a game of the list has it.
  await page.locator('#import-file').setInputFiles(file as string);
  const name = page.locator('#import-name');
  await expect(name).toHaveValue('Marta 2');
  await expect(name).toBeFocused();
  await expect(page.locator('#import-done')).toBeEnabled();
  await name.fill('marta');
  await expect(page.locator('#import-name-taken')).toBeVisible();
  await expect(page.locator('#import-done')).toBeDisabled();
  await name.fill('The copy');
  await expect(page.locator('#import-name-taken')).toBeHidden();
  await name.press('Enter');
  await expect(page.locator('#import-form')).toHaveCount(0);
  await expect(page.locator('#continue')).toHaveAttribute('href', '#level/the-stairs');
  await expect(page.locator('#current-game')).toHaveText('You are in the game “The copy”.');
  await expect(page.locator('#games .game')).toHaveCount(2);
  await expect(page.locator('#games .game-name')).toHaveText(['The copy', 'Marta']);
  await expect(page.locator('#games .game').nth(0).locator('.game-wizard')).toHaveText('Marta');
});

test('Cancel and Escape on the name of a game brought bring nothing (D291)', async ({ page }) => {
  await page.goto('/');
  const downloading = page.waitForEvent('download');
  await page.locator('#games .game .export').click();
  const file = (await (await downloading).path()) as string;
  await page.locator('#import-file').setInputFiles(file);
  await expect(page.locator('#import-form')).toBeVisible();
  await page.locator('#import-cancel').click();
  await expect(page.locator('#import-form')).toHaveCount(0);
  await page.locator('#import-file').setInputFiles(file);
  await expect(page.locator('#import-name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#import-form')).toHaveCount(0);
  await expect(page.locator('#games .game-name')).toHaveText(['Marta']);
  await expect(page.locator('#current-game')).toHaveText('You are in the game “Marta”.');
});

test('a new game begins the story for a new wizard; the games are played by name (D70, D293)', async ({ page }) => {
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

  // The game being played, by its name (D290).
  await expect(page.locator('#current-game')).toHaveText('You are in the game “Leo”.');

  // The list: each game by its name and where it is. The one being played is the open
  // one, with a word in Play's place; the other has Play.
  const games = page.locator('#games .game');
  await expect(games).toHaveCount(2);
  await expect(page.locator('#games .game-name')).toHaveText(['Leo', 'Marta']);
  await expect(games.nth(0)).toHaveAttribute('data-current', 'true');
  await expect(games.nth(0).locator('.game-open')).toHaveText('Open now');
  await expect(games.nth(0).locator('.play')).toHaveCount(0);
  await expect(games.nth(1)).not.toHaveAttribute('data-current', 'true');
  await expect(games.nth(1).locator('.game-open')).toHaveCount(0);
  await expect(games.nth(1)).toContainText(`Improve 1: ${STAIRS}`);
  await games.nth(1).locator('.play').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await expect(page.locator('#current-game')).toHaveText('You are in the game “Marta”.');
  await expect(page.locator('#continue')).toHaveAttribute('href', '#level/the-stairs');
  await expect(page.locator(`#games .game[data-current="true"] .game-name`)).toHaveText('Marta');
  // A game that is not the open one is kept as a file too.
  const downloading = page.waitForEvent('download');
  await page.locator('#games .game', { hasText: 'Leo' }).locator('.export').click();
  expect((await downloading).suggestedFilename()).toBe('kydux-Leo.json');

  // Delete asks first, with the game's name.
  let asked = '';
  page.once('dialog', (dialog) => {
    asked = dialog.message();
    void dialog.accept();
  });
  await page.locator('#games .game', { hasText: 'Leo' }).locator('.delete').click();
  await expect(page.locator('#games .game')).toHaveCount(1);
  expect(asked).toBe('Delete the game “Leo”? It cannot be brought back.');
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
});

test('with saved games and no game being played, the start screen offers them', async ({ page }) => {
  await page.goto('/');
  await page.locator('#new').click();
  await page.goto('/');
  await expect(page).not.toHaveURL(/#story/);
  await expect(page.locator('#continue')).toHaveText('Start game');
  await expect(page.locator('#games .game')).toHaveCount(1);
  // No game is the open one: the saved one has Play.
  await expect(page.locator('#games .game[data-current]')).toHaveCount(0);
  await expect(page.locator('#games .game .play')).toBeVisible();
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
  await expect(page.locator('#continue')).toHaveText('Continue game');
});

test('a painting lies behind the start screen, with the school\'s people at its sides in a wide window (D294)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 700 });
  await page.goto('/');
  const backdrop = page.locator('.start-screen .backdrop');
  await expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  for (const picture of await backdrop.locator('img').all()) {
    await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  // The two groups stand clear of the page, one at each side.
  await expect(backdrop.locator('.backdrop-left .figure')).toHaveCount(6);
  await expect(backdrop.locator('.backdrop-right .figure')).toHaveCount(5);
  const sheet = (await page.locator('.start-screen').boundingBox())!;
  const left = (await backdrop.locator('.backdrop-left').boundingBox())!;
  const right = (await backdrop.locator('.backdrop-right').boundingBox())!;
  expect(left.x + left.width).toBeLessThanOrEqual(sheet.x);
  expect(right.x).toBeGreaterThanOrEqual(sheet.x + sheet.width);
  // The pencil is beside the wizard's name.
  await expect(page.locator('.start-name #change-wizard')).toBeVisible();
  // A narrow window keeps the painting and leaves the people out.
  await page.setViewportSize({ width: 1000, height: 700 });
  await expect(backdrop.locator('.backdrop-left')).toBeHidden();
  await expect(backdrop.locator('.backdrop-right')).toBeHidden();
  await expect(backdrop.locator('.backdrop-painting')).toBeVisible();
});

test('the start screen in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  await seedWizard(context);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#continue')).toHaveText('Continuar partida');
  await expect(page.locator('#new')).toHaveText('Partida nueva');
  await expect(page.locator('#import')).toHaveText('Importar una partida');
  await expect(page.locator('#games .game-open')).toHaveText('Abierta ahora');
  await expect(page.locator('#change-wizard')).toHaveAttribute('aria-label', 'Cambiar los nombres');
  await expect(page.locator('#settings-link')).toHaveAttribute('aria-label', 'Ajustes');
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#continue')).toHaveText('Continue game');
  await context.close();
});
