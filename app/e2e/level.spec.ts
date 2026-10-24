import { expect, test, type Page } from '@playwright/test';

/** Replaces the editor's text, as typing it would, without the editor's auto-closing. */
async function setCode(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
}

async function waitReady(page: Page, timeout = 90_000): Promise<void> {
  await expect(page.locator('#run')).toBeEnabled({ timeout });
}

async function run(page: Page): Promise<void> {
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
}

const scene = (page: Page) => page.locator('#scene');
const outcome = (page: Page) => page.locator('.outcome-text');

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/#level/the-long-corridor');
    await waitReady(page);
    await page.locator('#speed').selectOption('4');
  });

  test('the page opens on the long path, isolated, with Python ready', async ({ page }) => {
    await expect(page).toHaveURL(/#level\/the-long-corridor$/);
    await expect(page).toHaveTitle('Kydux — The long path');
    expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(true);
    await expect(page.locator('#status')).toHaveText(/^Python 3\.14\.\d+ ready$/);
    await expect(scene(page)).toHaveAttribute('data-wizard', '8,10');
    await expect(page.locator('.cm-content')).toContainText('# Tell the action how many steps to take.');
    await expect(page.locator('.goal').first()).toHaveText('Reach the foot of the steps.');
  });

  test('one step left, and the goal is not met', async ({ page }) => {
    await setCode(page, 'wizard.move_left()');
    await run(page);
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,10');
    await expect(scene(page)).toHaveAttribute('data-tick', '1');
    await expect(outcome(page)).toHaveText('Not yet: 0 of 1 goals met. Try again.');
    await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'open');
  });

  test('six steps reach the foot of the steps, the goal ticked as the wizard arrives', async ({ page }) => {
    await setCode(page, 'wizard.move_left(6)');
    await page.locator('#run').click();
    await expect(page.locator('.cm-kydux-running-line')).toHaveCount(1);
    await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'met', { timeout: 10_000 });
    await expect(outcome(page)).toHaveText('You did it, apprentice!');
    await expect(scene(page)).toHaveAttribute('data-wizard', '2,10');
    await expect(scene(page)).toHaveAttribute('data-state', 'done');
    await expect(page.locator('.cm-kydux-running-line')).toHaveCount(0);
  });

  test("an error is said in the child's words, its line marked in the editor", async ({ page }) => {
    await setCode(page, 'wizrd.move_left(6)');
    await run(page);
    await expect(outcome(page)).toHaveText(
      'There is nothing called wizrd here. Did you mean wizard? (line 1)',
    );
    await expect(outcome(page).locator('code')).toHaveText(['wizrd', 'wizard']);
    await expect(page.locator('.cm-kydux-error-line')).toHaveCount(1);
    await page.locator('.cm-content').press('End');
    await page.keyboard.type(' ');
    await expect(page.locator('.cm-kydux-error-line')).toHaveCount(0);
  });

  test('a loop that never ends tires the wizard out', async ({ page }) => {
    await setCode(page, 'while True:\n    wizard.say("hi")');
    await run(page);
    await expect(outcome(page)).toHaveText(
      'Your program has taken more than 100 steps and the wizard is tired. Is there a loop that never ends?',
    );
    await expect(scene(page)).toHaveAttribute('data-tick', '100');
  });

  test('a loop with no action in it is stopped, and Run works again', async ({ page }) => {
    await setCode(page, 'while True:\n    pass');
    const started = Date.now();
    await run(page);
    expect(Date.now() - started).toBeLessThan(10_000);
    await expect(outcome(page)).toHaveText(
      'Your program was stopped: it ran for more than 5 seconds without doing anything.',
    );
    await waitReady(page, 30_000);
    await setCode(page, 'wizard.move_left(6)');
    await run(page);
    await expect(outcome(page)).toHaveText('You did it, apprentice!');
  });

  test('Restart puts the wizard back at the start', async ({ page }) => {
    await setCode(page, 'wizard.move_left(6)');
    await run(page);
    await page.locator('#restart').click();
    await expect(scene(page)).toHaveAttribute('data-wizard', '8,10');
    await expect(page.locator('.outcome')).toBeHidden();
    await expect(page.locator('.goal').first()).toHaveAttribute('data-mark', 'open');
  });

  test('Ctrl-Enter runs the program from the editor', async ({ page }) => {
    await setCode(page, 'wizard.move_left(6)');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(outcome(page)).toHaveText('You did it, apprentice!', { timeout: 30_000 });
  });
});

test('in Spanish, and switching to English keeps the code typed', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#level/the-long-corridor');
  await waitReady(page);
  await expect(page.locator('.level-title')).toHaveText('El camino largo');
  await expect(page.locator('.goal').first()).toHaveText('Llega al pie de los escalones.');
  await expect(page.locator('.cm-content')).toContainText('# Dile a la acción cuántos pasos debe dar.');
  await expect(page.locator('#run')).toHaveText('Ejecutar');

  await page.locator('#language').selectOption('en');
  await expect(page.locator('.level-title')).toHaveText('The long path');
  await expect(page.locator('.cm-content')).toContainText('# Tell the action how many steps to take.');
  await expect(page.locator('#run')).toHaveText('Run');
  await expect(page).toHaveTitle('Kydux — The long path');

  await setCode(page, 'wizard.move_left(2)');
  await page.locator('#run').click();
  await expect(outcome(page)).toHaveText('Not yet: 0 of 1 goals met. Try again.', {
    timeout: 30_000,
  });
  await page.locator('#language').selectOption('es');
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_left(2)');
  await expect(outcome(page)).toHaveText(
    'Todavía no: 0 de 1 objetivos cumplidos. Inténtalo otra vez.',
  );
  await context.close();
});

test("the built game does not ship a level's solution or wrong answers", async ({ request }) => {
  // The preview server answers an unknown path with the page itself, so what
  // matters is that no Python comes back, not the status.
  const level = await request.get('/content/levels/the-long-corridor/level.json');
  expect(await level.json()).toMatchObject({ id: 'the-long-corridor' });
  for (const path of ['solution.py', 'wrong/too_short.py']) {
    const answer = await request.get(`/content/levels/the-long-corridor/${path}`);
    expect(await answer.text()).not.toContain('wizard');
  }
});
