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
    await expect(scene(page)).toHaveAttribute('data-actors', 'dask:7,2,left');
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.wait(3)');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-actors', 'dask:6,2,left', {
      timeout: 10_000,
    });
    await expect(scene(page)).toHaveAttribute('data-actors', 'dask:4,2,left', {
      timeout: 10_000,
    });
  });

  test('walking straight in gets the wizard caught', async ({ page }) => {
    const said = await run(page, 'wizard.move_up(2)');
    expect(said).toBe('The teacher saw you! Try again, and watch which way they look.');
    await expect(page.locator('.goal[data-mark="failed"]')).toHaveCount(1);
  });

  test('waiting while the teacher looks this way, then crossing, wins', async ({ page }) => {
    const said = await run(page, 'while dask.facing == "left":\n    wizard.wait()\nwizard.move_up(2)');
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

/** Chapter 2's levels with a program that wins each, as its solution.py does. */
const CHAPTER_2: [string, string][] = [
  ['the-reading-room', 'steps = 3\nwizard.move_right(steps)\nwizard.move_down(steps)\nwizard.move_right(steps)'],
  ['which-way', 'print(door.locked)\nwizard.move_right(5)\nwizard.move_down(3)\nwizard.move_left(5)'],
  [
    'the-lost-book',
    'book = wizard.find_nearest("book")\nwizard.move_down(2)\nwizard.move_right(2)\nwizard.pick_up()\n' +
      'wizard.move_left(2)\nwizard.move_up(2)\nwizard.move_right(4)\nwizard.give(book)',
  ],
  [
    'the-archive',
    'wizard.move_right()\narchive_door.open()\nwizard.move_right(4)\nwizard.pick_up()\n' +
      'wizard.move_right()\nvault_door.open()\nwizard.move_right(2)',
  ],
  ['the-high-shelf', 'wizard.move_right(4)\nwizard.cast("fendra")\nwizard.pick_up()\nwizard.move_right(2)'],
  [
    'eldras-book',
    'book = wizard.find_nearest("book")\nwizard.move_right(2)\nwizard.pick_up()\nwizard.move_right()\n' +
      'door.open()\nwizard.move_right(3)\nwizard.cast("fendra")\nwizard.pick_up()\nwizard.move_right(2)\n' +
      'wizard.give(book)',
  ],
];

test.describe('chapter 2', () => {
  for (const [id, code] of CHAPTER_2) {
    test(`${id} is won by its solution`, async ({ page }) => {
      await page.goto(`/#level/${id}`);
      await page.locator('#start').click();
      await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
      await page.locator('#speed').selectOption('4');
      expect(await run(page, code)).toMatch(/^You did it/);
    });
  }

  test('a level says what it prints, and Eldra thanks the wizard on the win card', async ({ page }) => {
    await page.goto('/#level/the-lost-book');
    await expect(page.locator('#card-intro')).toContainText('Eldra');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
    await run(
      page,
      'book = wizard.find_nearest("book")\nprint(book.position)\nwizard.move_down(2)\nwizard.move_right(2)\n' +
        'wizard.pick_up()\nwizard.move_left(2)\nwizard.move_up(2)\nwizard.move_right(4)\nwizard.give(book)',
    );
    await expect(page.locator('.printed')).toHaveText('Position(x=3, y=3)');
    await expect(page.locator('#card-outro')).toContainText('My book!');
  });

  test('giving with no one beside the wizard says so', async ({ page }) => {
    await page.goto('/#level/the-lost-book');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.move_down(2)\nwizard.move_right(2)\nwizard.pick_up()\nwizard.give(old_book)');
    await expect(page.locator('.outcome-text')).toContainText('There is no one beside me to give it to.');
  });
});

test.describe('the high shelf (D46, D47, D49)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#level/the-high-shelf');
    await expect(page.locator('#card-carrying')).toHaveText('You carry the wand.');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  });

  test('the wizard holds the wand from the start', async ({ page }) => {
    await expect(scene(page)).toHaveAttribute('data-carried', 'wand');
  });

  test('fendra from below brings the book down, through the shelves', async ({ page }) => {
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.move_right(4)\nwizard.cast("fendra")\nwizard.pick_up()');
    await expect(scene(page)).toHaveAttribute('data-carried', 'rare_book,wand');
  });

  test('fendra out of line with the book finds nothing near', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.cast("fendra")');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute(
      'data-thought',
      'There is nothing near enough for the spell to bring.',
      { timeout: 15_000 },
    );
  });
});

/** Chapter 3's levels with a program that wins each, in every way. */
const CHAPTER_3: [string, string][] = [
  ['the-watchtower', 'print(dask.facing)\nprint(dask.can_see(wizard))\nwizard.move_right(6)'],
  ['the-watch', 'if dask.facing == "left":\n    wizard.wait()\nwizard.move_up(2)'],
  [
    'left-or-right',
    'if left_door.locked:\n    wizard.move_right(2)\n    right_door.open()\n    wizard.move_down(2)\n' +
      '    wizard.move_left(2)\nelse:\n    wizard.move_left(2)\n    left_door.open()\n    wizard.move_down(2)\n' +
      '    wizard.move_right(2)\nwizard.move_down()',
  ],
  ['the-long-stairs', 'for step in range(8):\n    wizard.move_up()\n    wizard.move_right()'],
];

test.describe('chapter 3', () => {
  for (const [id, code] of CHAPTER_3) {
    test(`${id} is won by its solution`, async ({ page }) => {
      await page.goto(`/#level/${id}`);
      await page.locator('#start').click();
      await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
      await page.locator('#speed').selectOption('4');
      // The editor closes no bracket of its own here: the code is typed as it is.
      expect(await run(page, code)).toMatch(/^You did it/);
    });
  }
});

test.describe('a level played two ways (D51)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#level/the-watch');
    await expect(page.locator('#card-ways li')).toHaveText(['Dask looks away', 'Dask looks this way']);
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
  });

  test('a program that does not ask wins one way and is caught in the other, which the card names', async ({
    page,
  }) => {
    await expect(page.locator('#way')).toBeHidden();
    await run(page, 'wizard.move_up(2)');
    await expect(page.locator('.outcome-text')).toContainText('In the way “Dask looks this way”: The teacher saw you!');
    await expect(page.locator('#way')).toBeVisible();
    await expect(page.locator('#way')).toHaveValue('watching');
    await page.locator('#way').selectOption('away');
    await expect(page.locator('.outcome-text')).toContainText('In the way “Dask looks away”', { timeout: 30_000 });
    await expect(page.locator('.outcome-text')).toContainText('Not every way yet');
    await expect(page.locator('.win-card')).toHaveCount(0);
  });

  test('with if, the same program wins every way', async ({ page }) => {
    await run(page, 'if dask.facing == "left":\n    wizard.wait()\nwizard.move_up(2)');
    await expect(page.locator('.outcome-text')).toHaveText('You did it, apprentice! In every way!');
    await expect(page.locator('.win-card')).toBeVisible();
  });
});
