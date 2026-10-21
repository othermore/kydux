import { expect, test, type Page } from '@playwright/test';

/** Replaces the editor's text, as typing it would, without the editor's auto-closing. */
async function setCode(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
}

async function waitReady(page: Page, timeout = 90_000): Promise<void> {
  await expect(page.locator('#cast')).toBeEnabled({ timeout });
}

async function cast(page: Page): Promise<void> {
  await page.locator('#cast').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
}

const scene = (page: Page) => page.locator('#scene');
const outcome = (page: Page) => page.locator('.outcome-text');

test.describe('in English', () => {
  test.use({ locale: 'en-US' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitReady(page);
    await page.locator('#speed').selectOption('4');
  });

  test('the page opens on the corridor, isolated, with Python ready', async ({ page }) => {
    await expect(page).toHaveURL(/#level\/01-the-corridor$/);
    await expect(page).toHaveTitle('Kydux — The corridor');
    expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(true);
    await expect(page.locator('#status')).toHaveText(/^Python 3\.14\.\d+ ready$/);
    await expect(scene(page)).toHaveAttribute('data-wizard', '1,1');
    await expect(page.locator('.cm-content')).toContainText('# Walk to the door.');
    await expect(page.locator('.goal')).toHaveText('Reach the door at the end of the corridor.');
  });

  test('the starting code takes one step, and the goal is not met', async ({ page }) => {
    await cast(page);
    await expect(scene(page)).toHaveAttribute('data-wizard', '2,1');
    await expect(scene(page)).toHaveAttribute('data-tick', '1');
    await expect(outcome(page)).toHaveText('Not yet: 0 of 1 goals met. Try again.');
    await expect(page.locator('.goal')).toHaveAttribute('data-mark', 'open');
  });

  test('six steps reach the door, the goal ticked as the wizard arrives', async ({ page }) => {
    await setCode(page, 'wizard.move_right(6)');
    await page.locator('#cast').click();
    await expect(page.locator('.cm-kydux-running-line')).toHaveCount(1);
    await expect(page.locator('.goal')).toHaveAttribute('data-mark', 'met', { timeout: 10_000 });
    await expect(outcome(page)).toHaveText('You did it!');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,1');
    await expect(scene(page)).toHaveAttribute('data-state', 'done');
    await expect(page.locator('.cm-kydux-running-line')).toHaveCount(0);
  });

  test("an error is said in the child's words, its line marked in the editor", async ({ page }) => {
    await setCode(page, 'wizrd.move_right(6)');
    await cast(page);
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
    await cast(page);
    await expect(outcome(page)).toHaveText(
      'The wizard is tired: the spell ran more than 100 steps. Is there a loop that never ends?',
    );
    await expect(scene(page)).toHaveAttribute('data-tick', '100');
  });

  test('a loop with no spell in it is stopped, and Cast works again', async ({ page }) => {
    await setCode(page, 'while True:\n    pass');
    const started = Date.now();
    await cast(page);
    expect(Date.now() - started).toBeLessThan(10_000);
    await expect(outcome(page)).toHaveText(
      'The spell was stopped: it was running for more than 5 seconds.',
    );
    await waitReady(page, 30_000);
    await setCode(page, 'wizard.move_right(6)');
    await cast(page);
    await expect(outcome(page)).toHaveText('You did it!');
  });

  test('Restart puts the wizard back at the start', async ({ page }) => {
    await setCode(page, 'wizard.move_right(6)');
    await cast(page);
    await page.locator('#restart').click();
    await expect(scene(page)).toHaveAttribute('data-wizard', '1,1');
    await expect(page.locator('.outcome')).toBeHidden();
    await expect(page.locator('.goal')).toHaveAttribute('data-mark', 'open');
  });

  test('Ctrl-Enter casts from the editor', async ({ page }) => {
    await setCode(page, 'wizard.move_right(6)');
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(outcome(page)).toHaveText('You did it!', { timeout: 30_000 });
  });
});

test('in Spanish, and switching to English keeps the code typed', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/');
  await waitReady(page);
  await expect(page.locator('.level-title')).toHaveText('El pasillo');
  await expect(page.locator('.goal')).toHaveText('Llega a la puerta del final del pasillo.');
  await expect(page.locator('.cm-content')).toContainText('# Camina hasta la puerta.');
  await expect(page.locator('#cast')).toHaveText('Lanzar');

  await page.locator('#language').selectOption('en');
  await expect(page.locator('.level-title')).toHaveText('The corridor');
  await expect(page.locator('.cm-content')).toContainText('# Walk to the door.');
  await expect(page.locator('#cast')).toHaveText('Cast');
  await expect(page).toHaveTitle('Kydux — The corridor');

  await setCode(page, 'wizard.move_right(2)');
  await page.locator('#cast').click();
  await expect(outcome(page)).toHaveText('Not yet: 0 of 1 goals met. Try again.', {
    timeout: 30_000,
  });
  await page.locator('#language').selectOption('es');
  await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(2)');
  await expect(outcome(page)).toHaveText(
    'Todavía no: 0 de 1 objetivos cumplidos. Inténtalo otra vez.',
  );
  await context.close();
});

test("the built game does not ship a level's solution or wrong answers", async ({ request }) => {
  // The preview server answers an unknown path with the page itself, so what
  // matters is that no Python comes back, not the status.
  const level = await request.get('/content/levels/01-the-corridor/level.json');
  expect(await level.json()).toMatchObject({ id: '01-the-corridor' });
  for (const path of ['solution.py', 'wrong/too_short.py']) {
    const answer = await request.get(`/content/levels/01-the-corridor/${path}`);
    expect(await answer.text()).not.toContain('wizard');
  }
});
