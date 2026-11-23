import { type Browser, expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard, skipGuide, storyNext, storySaid } from './helpers';
import { ciTimes } from './support';

/** A page whose progress document already holds a wizard (D36). */
async function withWizard(browser: Browser, locale: string, gender: 'girl' | 'boy'): Promise<Page> {
  const context = await browser.newContext({ locale });
  await seedWizard(context, { ...MARTA, gender });
  return context.newPage();
}

/** The gate won, its win card open with the friend's words. */
async function winTheGate(page: Page): Promise<void> {
  await skipGuide(page);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('.cm-content').click();
  await page.keyboard.insertText('wizard.move_right()');
  await page.locator('#run').click();
  await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });
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

test('a story greets the wizard by name, and the friend is of the other gender (D77)', async ({ browser }) => {
  for (const [locale, gender, words] of [
    ['es-ES', 'girl', '¡Encantada de conocerte! Yo soy Marta.'],
    ['es-ES', 'girl', 'Soy Teku, un alumno de primer año'],
    ['es-ES', 'boy', 'Soy Nuri, una alumna de primer año'],
    ['en-US', 'girl', 'I am Marta.'],
  ] as const) {
    const page = await withWizard(browser, locale, gender);
    await page.goto('/#story/at-the-gate');
    // The friend's greeting, reached again with Back; then the wizard's answer, by name.
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
  await expect(storySaid(page)).toContainText('I am Kydux.');
});

/** When the bump's sound (data-sound, the last sound played) and the thought first come,
 * on the page's clock (D237). */
async function watchBump(page: Page): Promise<void> {
  await page.evaluate(() => {
    const node = document.querySelector('#scene') as HTMLElement;
    const seen: Record<string, number> = {};
    (window as unknown as { bumpSeen: Record<string, number> }).bumpSeen = seen;
    new MutationObserver(() => {
      if (seen.bump === undefined && node.dataset.sound === 'bump') seen.bump = performance.now();
      if (seen.thought === undefined && node.dataset.thought) seen.thought = performance.now();
    }).observe(node, { attributes: true, attributeFilter: ['data-sound', 'data-thought'] });
  });
}

const bumpSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { bumpSeen: Record<string, number> }).bumpSeen);

async function openTheLongCorridor(page: Page): Promise<void> {
  await seedWizard(page, MARTA);
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
}

test.describe('a thought about a bump (D237)', () => {
  test.use({ locale: 'es-ES' });

  test("comes after the bump into a friend, beside the head of a wizard on the ground, clear of the friend's (D245)", async ({
    page,
  }) => {
    await openTheLongCorridor(page);
    await page.keyboard.insertText('wizard.move_up()');
    await watchBump(page);
    await page.locator('#run').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-thought', /./, { timeout: ciTimes(30_000) });
    const { bump, thought } = await bumpSeen(page);
    expect((thought as number) - (bump as number)).toBeGreaterThan(350);
    expect((thought as number) - (bump as number)).toBeLessThan(1500);
    // The friend stands right over the wizard: a cloud over the head would cover theirs.
    await expect(page.locator('#scene')).toHaveAttribute('data-words-place', /^(left|right)$/);
    await expect(page.locator('#scene')).toHaveAttribute('data-words-over', /^\d+\.\d\d$/);
    await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/words/friend-bump-thought.png' });
  });

  test('is not shown when the slider is moved across the bump within its half second', async ({ page }) => {
    await openTheLongCorridor(page);
    await page.keyboard.insertText('wizard.move_up()\nwizard.move_right(4)');
    await page.locator('#run').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-sound', 'bump', { timeout: ciTimes(30_000) });
    await page.locator('#timeline').fill('0');
    await page.waitForTimeout(1200);
    await expect(page.locator('#scene')).not.toHaveAttribute('data-thought', /./);
  });
});

test("a friend's portrait wears the colours the friend wears in the scene (D283)", async ({ browser }) => {
  // Marta in teal has Teku in his second set, navy; in sky, in his first, orange (D90).
  for (const [look, portrait] of [
    ['teal', 'teku-b'],
    ['sky', 'teku'],
  ] as const) {
    const context = await browser.newContext({ locale: 'es-ES' });
    await seedWizard(context, { ...MARTA, look });
    const page = await context.newPage();
    await page.goto('/#story/at-the-gate');
    await storyNext(page, 3);
    await expect(page.locator('#scene')).toHaveAttribute('data-friend-figure', portrait === 'teku' ? 'teku-a' : 'teku-b');
    await expect(page.locator('#story-speaker img')).toHaveAttribute('data-portrait', portrait);
    await context.close();
  }
});
