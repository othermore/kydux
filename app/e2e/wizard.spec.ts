import { expect, type Page, test } from '@playwright/test';
import { finishStory, nextLessonPage, seedWizard, storyNext, storySaid } from './helpers';

test.use({ locale: 'en-US' });

/** The colour of a pixel of the robe in a figure's canvas, as #rrggbb. */
/** The look a portrait shows (D194), by its file: the look's own. */
const portraitShown = (page: Page, selector: string) => page.locator(selector).getAttribute('data-portrait');

async function makeWizard(page: Page, name: string, gender: 'girl' | 'boy', look: number): Promise<void> {
  await page.locator('#wizard-name').fill(name);
  await page.locator(`#wizard-gender [data-value="${gender}"]`).click();
  await page.locator('#wizard-looks .radio').nth(look).click();
}

test('a first visit opens on the welcome page, whose Start playing begins the story, which leads to the creator (D61, D193)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator('#about-play')).toHaveText('Start playing');
  await page.locator('#about-play').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
  await expect(page.locator('#story-title')).toHaveText('The letter');
  // No code in the opening: the story comes first, told on the scene (D74).
  await expect(page.locator('.cm-content')).toHaveCount(0);
  await expect(page.locator('#scene canvas')).toBeVisible();
  await finishStory(page);
  await expect(page).toHaveURL(/#wizard$/);
  // The start screen, reached on purpose, begins the story too.
  await page.goto('/#start');
  await expect(page.locator('#continue')).toHaveText('Start game');
  await expect(page.locator('#continue')).toHaveAttribute('href', '#story/the-letter');
  // The same screen as with a wizard, with no map yet and no game to play (D293).
  await expect(page.locator('.start-screen h2')).toHaveText('Welcome to the school of magic');
  await expect(page.locator('#map-link')).toHaveCount(0);
  await expect(page.locator('#start-welcome')).toHaveCount(0);
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
  // The gender and the look are for the whole game (D292).
  await expect(page.locator('#wizard-once')).toHaveText(
    'Choose calmly: later you can change the names, but not who your wizard is or their look.',
  );
  await expect(page.locator('#wizard-fixed')).toHaveCount(0);

  await page.locator('#wizard-name').fill('Ana');
  // A name alone is not enough: the wizard's gender is the child's to choose.
  await expect(page.locator('#wizard-done')).toBeDisabled();
  await page.locator('#wizard-gender [data-value="girl"]').click();
  await expect(page.locator('#wizard-looks .radio')).toHaveCount(4);
  await expect(page.locator('#wizard-done')).toBeEnabled();
  await page.locator('#wizard-looks .radio').nth(2).click();
  await expect(page.locator('#wizard-looks .radio').nth(2)).toHaveAttribute('aria-checked', 'true');
  expect(await portraitShown(page, '#wizard-preview')).toBe('wizard-sky');
  await expect(page.locator('#wizard-preview')).toBeVisible();
  await expect(page.locator('#wizard-preview-name')).toHaveText('Ana');

  await page.locator('#wizard-done').click();
  // Chapter 1 opens at the gate, where the wizard meets the friend and says their name.
  await expect(page).toHaveURL(/#story\/at-the-gate$/);
  await storyNext(page, 4);
  await expect(storySaid(page)).toContainText('Ana');

  await page.locator('#home').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Ana');
  await expect(page.locator('#continue')).toHaveText('Continue game');
  await expect(page.locator('#continue')).toHaveAttribute('href', '#story/at-the-gate');
  await expect(page.locator('#change-wizard')).toBeVisible();
  expect(await portraitShown(page, '#start-figure')).toBe('wizard-sky');
});

test('a name of the game\'s own is refused, and a boy\'s looks are a boy\'s', async ({ page }) => {
  await page.goto('/#wizard');
  await page.locator('#wizard-gender [data-value="boy"]').click();
  await expect(page.locator('#wizard-looks .radio')).toHaveCount(4);
  expect(await portraitShown(page, '#wizard-preview')).toBe('wizard-moss');
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
  await nextLessonPage(page);
  await expect(page.locator('.lesson-page')).toContainText('a tu maga');
  await page.goto('/#level/the-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#scene')).toHaveAttribute('data-look', 'sky');
  await context.close();
});

test('the pencil opens the wizard with both names; Back and Escape leave both so (D290)', async ({ page }) => {
  await seedWizard(page);
  await page.goto('/');
  // The pencil beside the two names (D293).
  await expect(page.locator('#change-wizard')).toHaveAttribute('aria-label', 'Change the names');
  await page.locator('#change-wizard').click();
  await expect(page.locator('#wizard-name')).toHaveValue('Marta');
  // The game of before is named by its wizard (D291).
  await expect(page.locator('#game-name')).toHaveValue('Marta');
  // The gender and the look are chosen once (D292): shown, not offered.
  await expect(page.locator('#wizard-gender')).toHaveCount(0);
  await expect(page.locator('#wizard-looks')).toHaveCount(0);
  await expect(page.locator('#wizard-once')).toHaveCount(0);
  await expect(page.locator('#wizard-fixed')).toHaveText(
    'Who your wizard is and their look are chosen once, when the game begins.',
  );
  expect(await portraitShown(page, '#wizard-preview')).toBe('wizard-teal');
  await expect(page.locator('.wizard-screen .radio')).toHaveCount(0);
  // A wizard made: the game's name changes only by the child's hand.
  await page.locator('#wizard-name').fill('Mar');
  await expect(page.locator('#game-name')).toHaveValue('Marta');
  await page.locator('#game-name').fill('My game');
  await page.locator('#wizard-back').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await expect(page.locator('#current-game')).toHaveText('You are in the game “Marta”.');
  await page.locator('#change-wizard').click();
  await page.locator('#wizard-name').fill('Mar');
  await page.locator('#game-name').fill('My game');
  await page.keyboard.press('Escape');
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await expect(page.locator('#current-game')).toHaveText('You are in the game “Marta”.');
  await page.locator('#change-wizard').click();
  await expect(page.locator('#game-name')).toHaveValue('Marta');
  await page.locator('#wizard-name').fill('Mar');
  await page.locator('#game-name').fill('My game');
  await page.locator('#wizard-done').click();
  await page.locator('#home').click();
  await expect(page.locator('.start-screen h2')).toHaveText('Hello, Mar');
  expect(await portraitShown(page, '#start-figure')).toBe('wizard-teal');
  await expect(page.locator('#current-game')).toHaveText('You are in the game “My game”.');
  await expect(page.locator('#games .game-name')).toHaveText(['My game']);
  await expect(page.locator('#games .game-wizard')).toHaveText(['Mar']);
});

test("a new game's name follows its wizard's until it is written, with a number when it is taken (D290, D291)", async ({
  page,
}) => {
  await seedWizard(page);
  await page.goto('/');
  await page.locator('#new').click();
  await expect(page).toHaveURL(/#story\/the-letter$/);
  await page.goto('/#wizard');
  const game = page.locator('#game-name');
  await expect(game).toHaveValue('Kydux');
  await page.locator('#wizard-name').fill('Mar');
  await expect(game).toHaveValue('Mar');
  // A second game for a wizard called like the first is offered a number.
  await page.locator('#wizard-name').fill('marta');
  await expect(game).toHaveValue('marta 2');
  await page.locator('#wizard-name').fill('');
  await expect(game).toHaveValue('');
  await page.locator('#wizard-name').fill('Lea');
  await expect(game).toHaveValue('Lea');
  await page.locator('#wizard-gender [data-value="girl"]').click();
  await expect(page.locator('#wizard-done')).toBeEnabled();
  // Another game's name, in any case of letters: Done waits, and the message says why.
  await game.fill('MARTA');
  await expect(page.locator('#game-name-taken')).toBeVisible();
  await expect(page.locator('#wizard-done')).toBeDisabled();
  // Written by hand, the name stays the child's.
  await game.fill('Second year');
  await expect(page.locator('#game-name-taken')).toBeHidden();
  await page.locator('#wizard-name').fill('Leo');
  await expect(game).toHaveValue('Second year');
  await page.locator('#game-name').pressSequentially('!');
  await expect(page.locator('#game-name-rule')).toBeVisible();
  await expect(game).toHaveValue('Second year');
  await page.locator('#wizard-done').click();
  await expect(page).toHaveURL(/#story\/at-the-gate$/);
  await page.locator('#home').click();
  await expect(page.locator('#current-game')).toHaveText('You are in the game “Second year”.');
  await expect(page.locator('#games .game-name')).toHaveText(['Second year', 'Marta']);
  await expect(page.locator('#games .game').nth(0).locator('.game-wizard')).toHaveText('Leo');
  await expect(page.locator('#games .game').nth(1).locator('.game-wizard')).toHaveCount(0);
});

test('the wizard goes with exported progress to another browser', async ({ page, browser }) => {
  await seedWizard(page);
  await page.goto('/');
  const downloading = page.waitForEvent('download');
  await page.locator('#games .game .export').click();
  const file = await (await downloading).path();

  const other = await browser.newContext({ locale: 'en-US' });
  const elsewhere = await other.newPage();
  await elsewhere.goto('/#start');
  await expect(elsewhere.locator('#continue')).toHaveText('Start game');
  // With no saved game there is no box: Import stands beside the big button (D293).
  await expect(elsewhere.locator('#games')).toHaveCount(0);
  await expect(elsewhere.locator('.start-actions #import')).toHaveText('Import a game');
  await elsewhere.locator('#import-file').setInputFiles(file as string);
  // The game's name is asked, its wizard's offered (D291).
  await expect(elsewhere.locator('#import-name')).toHaveValue('Marta');
  await elsewhere.locator('#import-done').click();
  await expect(elsewhere.locator('.start-screen h2')).toHaveText('Hello, Marta');
  await expect(elsewhere.locator('#current-game')).toHaveText('You are in the game “Marta”.');
  await expect(elsewhere.locator('#games .game[data-current="true"] .game-name')).toHaveText('Marta');
  await expect(elsewhere.locator('#games #import')).toBeVisible();
  await other.close();
});

test("the creator shows each gender's four looks as their portraits, eight in all (D194)", async ({ page }) => {
  await page.goto('/#wizard');
  const shown: string[] = [];
  for (const gender of ['girl', 'boy'] as const) {
    await page.locator(`#wizard-gender [data-value="${gender}"]`).click();
    const portraits = page.locator('#wizard-looks .radio img.portrait');
    await expect(portraits).toHaveCount(4);
    for (const portrait of await portraits.all()) {
      await expect.poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(512);
      shown.push((await portrait.getAttribute('data-portrait')) ?? '');
    }
  }
  expect(new Set(shown).size).toBe(8);
  await page.locator('#wizard-looks .radio').nth(1).click();
  await expect(page.locator('#wizard-preview')).toHaveAttribute('data-portrait', shown[5] ?? '');
});
