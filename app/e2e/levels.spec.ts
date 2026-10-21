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
  test.beforeEach(({ page }) => open(page, 'the-locked-door'));

  test('shows its goals, the bonus among them', async ({ page }) => {
    await expect(page.locator('.level-title')).toHaveText('The locked door');
    await expect(page.locator('.goal')).toHaveCount(4);
    await expect(page.locator('.goal[data-bonus="true"]')).toContainText('Bonus:');
  });

  test('what the code prints shows in the card', async ({ page }) => {
    await run(page, 'wizard.move_right(4)\nwizard.pick_up()\nprint(wizard.items)');
    await expect(page.locator('.printed')).toHaveText('[<key key carried>]');
  });

  test('a door too far away is not tried: the wizard thinks why, and nothing shakes', async ({
    page,
  }) => {
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('door.open()');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-thought', 'I cannot reach the door from here.');
    await expect(scene(page)).not.toHaveAttribute('data-shaking', /.*/);
    await expect(page.locator('.outcome-text')).toHaveText(
      'Not yet: 0 of 3 goals met. Try again.\nOn line 1: I cannot reach the door from here.',
      { timeout: 30_000 },
    );
  });

  test('a locked door is tried: it shakes, and the card says why', async ({ page }) => {
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(6)\ndoor.open()');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute(
      'data-thought',
      'I cannot open the door: it is locked, and I have no key for it.',
      { timeout: 15_000 },
    );
    await expect(scene(page)).toHaveAttribute('data-shaking', 'true');
    await expect(page.locator('.outcome-text')).toContainText(
      'On line 2: I cannot open the door: it is locked',
      { timeout: 30_000 },
    );
  });

  test('a locked door stays shut without its key', async ({ page }) => {
    const said = await run(page, 'wizard.move_right(6)\ndoor.open()\nwizard.move_down(2)');
    expect(said).toBe(
      'Not yet: 0 of 3 goals met. Try again.\nOn line 2: I cannot open the door: it is locked, and I have no key for it.',
    );
    await expect(scene(page)).toHaveAttribute('data-doors', '');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,1');
  });

  test('the key opens it, and the goals tick in order with the bonus', async ({ page }) => {
    const said = await run(
      page,
      'wizard.move_right(4)\nwizard.pick_up()\nwizard.move_right(2)\ndoor.open()\nwizard.move_down(2)',
    );
    expect(said).toBe('You did it, apprentice!');
    await expect(scene(page)).toHaveAttribute('data-carried', 'key');
    await expect(scene(page)).toHaveAttribute('data-doors', 'door');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,3');
    await expect(page.locator('.goal[data-mark="met"]')).toHaveCount(4);
  });
});

test.describe('past the teacher', () => {
  test.beforeEach(({ page }) => open(page, 'past-the-teacher'));

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
    expect(said).toBe('You did it, apprentice!');
    await expect(scene(page)).toHaveAttribute('data-wizard', '2,1');
  });
});

test('the locked door in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, 'the-locked-door');
  await expect(page.locator('.level-title')).toHaveText('La puerta cerrada');
  await expect(page.locator('.goal[data-bonus="true"]')).toContainText('Extra:');
  const said = await run(page, 'wizard.mvoe_right(4)');
  expect(said).toBe(
    'wizard no conoce ninguna acción llamada mvoe_right. ¿Querías decir move_right? (línea 1)',
  );
  await context.close();
});

/** Chapter 1's levels with a program that wins each, as its solution.py does. */
const CHAPTER_1: [string, string][] = [
  ['the-gate', 'wizard.move_right()'],
  ['the-corridor', 'wizard.move_right()\nwizard.move_right()\nwizard.move_down()\nwizard.move_down()'],
  ['the-long-corridor', 'wizard.move_right(6)'],
  ['the-stairs', 'wizard.move_up(2)\nwizard.move_right(3)\nwizard.move_up(2)\nwizard.move_right(2)'],
  ['the-password', 'wizard.move_right(2)\nwizard.say("ambrel")\nwizard.move_right(2)'],
  ['the-pedestal', 'wizard.move_right(3)\nwizard.pick_up()\nwizard.move_right(3)'],
  ['the-sealed-door', 'wizard.move_right()\nwizard.pick_up()\nwizard.move_right(2)\nwizard.cast("zelim")\nwizard.move_right(3)'],
  [
    'the-way-in',
    'wizard.move_right()\nwizard.say("ambrel")\nwizard.move_right(3)\nwizard.pick_up()\nwizard.move_right(3)\n' +
      'wizard.cast("zelim")\nwizard.move_down(2)\nwizard.move_left(4)\nwizard.cast("zelim")\nwizard.move_left(3)',
  ],
];

test.describe('chapter 1', () => {
  for (const [id, code] of CHAPTER_1) {
    test(`${id} is won by its solution`, async ({ page }) => {
      await page.goto(`/#level/${id}`);
      await page.locator('#start').click();
      await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
      await page.locator('#speed').selectOption('4');
      expect(await run(page, code)).toMatch(/^You did it/);
    });
  }
});

test.describe('the sealed door (D42, D43)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#level/the-sealed-door');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  });

  test('without the wand, the wizard does not know how to cast', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(3)\nwizard.cast("zelim")');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-thought', 'I do not know this action yet.', {
      timeout: 15_000,
    });
    await expect(page.locator('.outcome-text')).toContainText('On line 2: I do not know this action yet.', {
      timeout: 30_000,
    });
  });

  test('the spell cast away from the door opens nothing; beside it, the door opens', async ({ page }) => {
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.move_right()\nwizard.pick_up()\nwizard.cast("zelim")');
    await expect(scene(page)).toHaveAttribute('data-doors', '');
    await run(page, 'wizard.move_right()\nwizard.pick_up()\nwizard.move_right(2)\nwizard.cast("zelim")');
    await expect(scene(page)).toHaveAttribute('data-doors', 'door');
  });

  test('a spell the level does not have is named in the wizard\'s thought', async ({ page }) => {
    await run(page, 'wizard.move_right()\nwizard.pick_up()\nwizard.cast("abra")');
    await expect(page.locator('.outcome-text')).toContainText('I do not know a spell called “abra”.');
  });

  test('the door opened by hand wants its spell', async ({ page }) => {
    await run(page, 'wizard.move_right(3)\ndoor.open()');
    await expect(page.locator('.outcome-text')).toContainText(
      'I cannot open the door by hand: it is sealed, and needs a spell.',
    );
  });
});
