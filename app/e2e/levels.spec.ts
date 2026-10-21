import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
}

async function run(page: Page, code: string): Promise<string> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: 30_000 });
  return page.locator('.outcome-text').innerText();
}

const scene = (page: Page) => page.locator('#scene');

test.describe('the locked door', () => {
  test.beforeEach(({ page }) => open(page, '02-the-locked-door'));

  test('shows its goals, the bonus among them', async ({ page }) => {
    await expect(page.locator('.level-title')).toHaveText('The locked door');
    await expect(page.locator('.goal')).toHaveCount(4);
    await expect(page.locator('.goal[data-bonus="true"]')).toContainText('Bonus:');
  });

  test('what the code prints shows in the card', async ({ page }) => {
    await run(page, 'wizard.move_right(4)\nwizard.pick_up()\nprint(wizard.items)');
    await expect(page.locator('.printed')).toHaveText('[<key key carried>]');
  });

  test('a locked door stays shut without its key', async ({ page }) => {
    const said = await run(page, 'wizard.move_right(6)\ndoor.open()\nwizard.move_down(2)');
    expect(said).toBe('Not yet: 0 of 3 goals met. Try again.');
    await expect(scene(page)).toHaveAttribute('data-doors', '');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,1');
  });

  test('the key opens it, and the goals tick in order with the bonus', async ({ page }) => {
    const said = await run(
      page,
      'wizard.move_right(4)\nwizard.pick_up()\nwizard.move_right(2)\ndoor.open()\nwizard.move_down(2)',
    );
    expect(said).toBe('You did it!');
    await expect(scene(page)).toHaveAttribute('data-carried', 'key');
    await expect(scene(page)).toHaveAttribute('data-doors', 'door');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,3');
    await expect(page.locator('.goal[data-mark="met"]')).toHaveCount(4);
  });
});

test.describe('past the teacher', () => {
  test.beforeEach(({ page }) => open(page, '03-past-the-teacher'));

  test('the teacher walks the corridor', async ({ page }) => {
    await expect(scene(page)).toHaveAttribute('data-actors', 'teacher:7,2,left');
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.wait(3)');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-actors', 'teacher:6,2,left', {
      timeout: 10_000,
    });
    await expect(scene(page)).toHaveAttribute('data-actors', 'teacher:4,2,left', {
      timeout: 10_000,
    });
  });

  test('walking straight in gets the wizard caught', async ({ page }) => {
    const said = await run(page, 'wizard.move_up(2)');
    expect(said).toBe('The teacher saw you! Try again, and watch which way they look.');
    await expect(page.locator('.goal[data-mark="failed"]')).toHaveCount(1);
  });

  test('waiting while the teacher looks this way, then crossing, wins', async ({ page }) => {
    const said = await run(page, 'while teacher.facing == "left":\n    wizard.wait()\nwizard.move_up(2)');
    expect(said).toBe('You did it!');
    await expect(scene(page)).toHaveAttribute('data-wizard', '2,1');
  });
});

test('the locked door in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, '02-the-locked-door');
  await expect(page.locator('.level-title')).toHaveText('La puerta cerrada');
  await expect(page.locator('.goal[data-bonus="true"]')).toContainText('Extra:');
  const said = await run(page, 'wizard.mvoe_right(4)');
  expect(said).toBe(
    'wizard no conoce ninguna acción llamada mvoe_right. ¿Querías decir move_right? (línea 1)',
  );
  await context.close();
});
