import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { skipGuide, levelText } from './helpers';

test.use({ locale: 'en-US' });

const SHOTS = fileURLToPath(new URL('./shots/levels/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });

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

test.describe('the hidden key', () => {
  test.beforeEach(({ page }) => open(page, 'the-hidden-key'));

  test('shows its goals, the bonus among them', async ({ page }) => {
    await expect(page.locator('.level-title')).toHaveText(levelText('the-hidden-key', 'en').title);
    await expect(page.locator('.goal')).toHaveCount(4);
    await expect(page.locator('.goal[data-bonus="true"]')).toContainText('Bonus:');
  });

  test('what the code prints shows in the card', async ({ page }) => {
    await run(page, 'wizard.move_down(2)\nwizard.move_left(8)\nwizard.pick_up()\nprint(wizard.items)');
    await expect(page.locator('.printed')).toHaveText('[<key key carried>, <wand wand carried>]');
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
    await page.keyboard.insertText('wizard.move_left(4)\nwizard.move_up(2)\ndoor.open()');
    await page.locator('#run').click();
    // The shake is short: looked for often, before the thought, which stays.
    await expect
      .poll(() => scene(page).getAttribute('data-shaking'), { intervals: [50], timeout: 15_000 })
      .toBe('true');
    await expect(scene(page)).toHaveAttribute(
      'data-thought',
      'I cannot open the door: it is locked, and I have no key for it.',
    );
    await expect(page.locator('.outcome-text')).toContainText(
      'On line 3: I cannot open the door: it is locked',
      { timeout: 30_000 },
    );
  });

  test('a locked door stays shut without its key', async ({ page }) => {
    const said = await run(page, 'wizard.move_left(4)\nwizard.move_up(2)\ndoor.open()\nwizard.move_up(3)');
    expect(said).toBe(
      'Not yet: 0 of 3 goals met. Try again.\nOn line 3: I cannot open the door: it is locked, and I have no key for it.',
    );
    await expect(scene(page)).toHaveAttribute('data-doors', '');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,9');
  });

  test('the key opens it, and the goals tick in order with the bonus', async ({ page }) => {
    const said = await run(page, readFileSync(`${CONTENT}levels/the-hidden-key/solution.py`, 'utf8'));
    expect(said).toBe('You did it, Kydux!');
    await expect(scene(page)).toHaveAttribute('data-carried', 'key,wand');
    await expect(scene(page)).toHaveAttribute('data-doors', 'door');
    await expect(scene(page)).toHaveAttribute('data-wizard', '7,6');
    await expect(page.locator('.goal[data-mark="met"]')).toHaveCount(4);
  });
});

test.describe('past the teacher', () => {
  test.beforeEach(({ page }) => open(page, 'past-the-teacher'));

  test('the teacher walks the corridor', async ({ page }) => {
    await expect(scene(page)).toHaveAttribute('data-actors', /^dask:7,5,left;/);
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.wait(3)');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-actors', /^dask:6,5,left;/, {
      timeout: 10_000,
    });
    await expect(scene(page)).toHaveAttribute('data-actors', /^dask:4,5,left;/, {
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
    expect(said).toBe('You did it, Kydux!');
    await expect(scene(page)).toHaveAttribute('data-wizard', '2,4');
  });
});

test('the hidden key in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, 'the-hidden-key');
  await expect(page.locator('.level-title')).toHaveText(levelText('the-hidden-key', 'es').title);
  await expect(page.locator('.goal[data-bonus="true"]')).toContainText('Extra:');
  const said = await run(page, 'wizard.mvoe_right(4)');
  expect(said).toBe(
    'wizard no conoce ninguna acción llamada mvoe_right. ¿Querías decir move_right? (línea 1)',
  );
  await context.close();
});

/** A chapter's levels, each with its solution.py, read from the content. */
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const levelsOf = (chapter: string): [string, string][] =>
  (JSON.parse(readFileSync(`${CONTENT}chapters/${chapter}/chapter.json`, 'utf8')).items as string[])
    .filter((item) => item.startsWith('level:'))
    .map((item) => item.slice('level:'.length))
    .map((id) => [id, readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8')]);
const CHAPTER_1 = levelsOf('01-arrival');

test.describe('chapter 1', () => {
  for (const [id, code] of CHAPTER_1) {
    test(`${id} is won by its solution`, async ({ page }) => {
      await page.goto(`/#level/${id}`);
      await page.locator('#start').click();
      if (id === 'the-gate') await skipGuide(page);
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

  test('the wand is carried from the level before, and the gate behind is open', async ({ page }) => {
    await expect(scene(page)).toHaveAttribute('data-carried', 'wand');
    await expect(scene(page)).toHaveAttribute('data-doors', 'gate');
  });

  test('the spell cast away from the door opens nothing; beside it, the door opens', async ({ page }) => {
    // The mark and the sealed doors' runes are drawn by the page (D79): this gate's,
    // and the castle door's, which waits for the next level.
    await expect(scene(page)).toHaveAttribute('data-marks', '8,9');
    await expect(scene(page)).toHaveAttribute('data-glowing', 'castle_door,seal_gate');
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.cast("zelim")');
    await expect(scene(page)).toHaveAttribute('data-doors', 'gate');
    await expect(scene(page)).toHaveAttribute('data-glowing', 'castle_door,seal_gate');
    await run(page, 'wizard.move_left(2)\nwizard.move_up(3)\nwizard.cast("zelim")');
    await expect(scene(page)).toHaveAttribute('data-doors', 'gate,seal_gate');
    await expect(scene(page)).toHaveAttribute('data-glowing', 'castle_door');
  });

  test('a spell the level does not have is named in the wizard\'s thought', async ({ page }) => {
    await run(page, 'wizard.cast("abra")');
    await expect(page.locator('.outcome-text')).toContainText('I do not know a spell called “abra”.');
  });

  test('the door opened by hand wants its spell', async ({ page }) => {
    await run(page, 'wizard.move_left(2)\nwizard.move_up(3)\nseal_gate.open()');
    await expect(page.locator('.outcome-text')).toContainText(
      'I cannot open the door by hand: it is sealed, and needs a spell.',
    );
  });
});

const CHAPTER_2 = levelsOf('02-the-library');

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

  test('the book is drawn in its cell by the pile, and Wenna speaks of Eldra on the win card', async ({
    page,
  }) => {
    await page.goto('/#level/the-lost-book');
    await expect(page.locator('#card-intro')).toContainText('Eldra');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    // Laid by the pile of books, the book is drawn in its cell's middle (D109).
    await expect(scene(page)).toHaveAttribute('data-drawn', /old_book:1\.50,13\.50/);
    await page.locator('#speed').selectOption('4');
    await run(page, readFileSync(`${CONTENT}levels/the-lost-book/solution.py`, 'utf8'));
    await expect(page.locator('#card-outro')).toContainText('Wenna');
    await expect(page.locator('#card-outro')).toContainText('Eldra');
  });

  test('the book in hand is asked for with find_item, unseen until it is given (D123)', async ({ page }) => {
    await page.goto('/#level/the-book-returned');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await expect(scene(page)).toHaveAttribute('data-carried', 'book,wand');
    await expect(scene(page)).not.toHaveAttribute('data-drawn', /book:/);
    await page.locator('#speed').selectOption('4');
    expect(await run(page, readFileSync(`${CONTENT}levels/the-book-returned/solution.py`, 'utf8'))).toMatch(
      /^You did it/,
    );
    await expect(scene(page)).toHaveAttribute('data-carried', 'wand');
  });

  test('giving with no one beside the wizard says so', async ({ page }) => {
    await page.goto('/#level/the-book-returned');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
    await run(page, 'book = wizard.find_item("book")\nwizard.give(book)');
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

  test('fendra from below brings the book it is told down, glowing, through the shelves', async ({ page }) => {
    await page.locator('#speed').selectOption('4');
    await run(page, 'book = wizard.find_nearest("book")\nwizard.move_right(5)\nwizard.cast("fendra", book)\nwizard.pick_up()');
    await expect(scene(page)).toHaveAttribute('data-carried', 'rare_book,wand');
  });

  test('the light reaches the book, the book flies to the hands, the hands take it, then it goes to Eldra (D127)', async ({
    page,
  }) => {
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText(
      'book = wizard.find_nearest("book")\nwizard.move_right(5)\nwizard.cast("fendra", book)\nwizard.pick_up()\nwizard.give(book)',
    );
    await page.locator('#run').click();
    // Where the book is drawn, in cells, and whether the wizard carries it.
    const book = () =>
      scene(page).evaluate((node) => {
        const drawn = /rare_book:([\d.]+),([\d.]+)/.exec(node.getAttribute('data-drawn') ?? '');
        const carried = (node.getAttribute('data-carried') ?? '').split(',').includes('rare_book');
        return { at: drawn ? [Number(drawn[1]), Number(drawn[2])] : null, carried };
      });
    // Half a tick into the cast (tick 6), the light is on its way and the book on its
    // shelf: the tick's start waited for frame by frame, as an expect's polls come late.
    await page.waitForFunction(() => document.querySelector('#scene')?.getAttribute('data-tick') === '6', null, {
      timeout: 60_000,
      polling: 'raf',
    });
    await page.waitForTimeout(170);
    const waiting = await book();
    expect(waiting.carried).toBe(false);
    expect(waiting.at?.[1]).toBeLessThan(4);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s25-cast-light.png` });
    // Before the cast's tick ends the book is at the wizard's hands, at 7,6, not yet carried.
    await page.waitForFunction(() => {
      const node = document.querySelector('#scene');
      const drawn = /rare_book:([\d.]+),([\d.]+)/.exec(node?.getAttribute('data-drawn') ?? '');
      const carried = (node?.getAttribute('data-carried') ?? '').split(',').includes('rare_book');
      return node?.getAttribute('data-tick') === '6' && drawn !== null && Number(drawn[2]) > 6 && !carried;
    });
    const held = await book();
    expect(held.at?.[0]).toBeGreaterThan(7);
    expect(held.at?.[0]).toBeLessThan(8);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s25-cast-hands.png` });
    // Once picked up (tick 7) it is carried and no longer drawn, until the give.
    await page.waitForFunction(
      () => {
        const node = document.querySelector('#scene');
        const carried = (node?.getAttribute('data-carried') ?? '').split(',').includes('rare_book');
        return carried && !(node?.getAttribute('data-drawn') ?? '').includes('rare_book');
      },
      null,
      { polling: 'raf' },
    );
    // The give (tick 8) starts from the hands, after the pick-up.
    await expect(scene(page)).toHaveAttribute('data-tick', '8');
    await page.waitForTimeout(150);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}s25-give.png` });
    await expect.poll(book).toEqual({ at: null, carried: false });
  });

  test('beneath the book, the hands cannot reach it: it is too high', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(5)\nwizard.pick_up()');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute(
      'data-thought',
      'I can see the book up there, but it is too high to reach by hand.',
      { timeout: 30_000 },
    );
  });

  test('fendra out of line with the book cannot reach it', async ({ page }) => {
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('book = wizard.find_nearest("book")\nwizard.cast("fendra", book)');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-thought', 'The spell cannot reach the book from here.', {
      timeout: 15_000,
    });
  });

  test('fendra with no thing named says how it is cast', async ({ page }) => {
    const said = await run(page, 'wizard.cast("fendra")');
    expect(said).toContain('wizard.cast("fendra", book)');
  });

  test('reveal outlines the book among the others on the shelf', async ({ page }) => {
    await page.locator('#speed').selectOption('1');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('book = wizard.find_nearest("book")\nbook.reveal()\nwizard.wait(4)');
    await page.locator('#run').click();
    await expect(scene(page)).toHaveAttribute('data-revealed', 'rare_book', { timeout: 30_000 });
    await page.waitForTimeout(400);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}revealed-book.png` });
  });
});

const CHAPTER_3 = levelsOf('03-passages');

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
    await run(page, 'wizard.move_down(2)');
    await expect(page.locator('.outcome-text')).toContainText('In the way “Dask looks this way”: The teacher saw you!');
    await expect(page.locator('#way')).toBeVisible();
    await expect(page.locator('#way')).toHaveValue('watching');
    await page.locator('#way').selectOption('away');
    await expect(page.locator('.outcome-text')).toContainText('In the way “Dask looks away”', { timeout: 30_000 });
    await expect(page.locator('.outcome-text')).toContainText('Not every way yet');
    await expect(page.locator('.win-card')).toHaveCount(0);
  });

  test('with if, the same program wins every way', async ({ page }) => {
    await run(page, 'if dask.facing == "left":\n    wizard.wait()\nwizard.move_down(2)');
    await expect(page.locator('.outcome-text')).toHaveText('You did it, Kydux! In every way!');
    await expect(page.locator('.win-card')).toBeVisible();
  });
});

test.describe('the dark and the stairs (D52, D53)', () => {
  test('a dark room is covered until kirra lights it', async ({ page }) => {
    await page.goto('/#level/the-dark-room');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await expect(scene(page)).toHaveAttribute('data-dark', 'true');
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.cast("kirra")');
    await expect(scene(page)).toHaveAttribute('data-dark', 'false');
  });

  test('a stair comes and goes, and a step onto it while it is away bumps', async ({ page }) => {
    await page.goto('/#level/the-moving-stairs');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await expect(scene(page)).toHaveAttribute('data-stairs', 'stair:in');
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.move_up(2)\nwizard.move_right()\nwizard.wait()\nprint(stair.in_place)\nwizard.move_right()');
    await expect(page.locator('.printed')).toHaveText('False');
    await expect(scene(page)).toHaveAttribute('data-wizard', '3,2');
  });

  test('osto beside the stair holds it', async ({ page }) => {
    await page.goto('/#level/the-moving-stairs');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
    await page.locator('#speed').selectOption('4');
    await run(page, 'wizard.move_up(2)\nwizard.move_right()\nwizard.cast("osto")\nwizard.wait(3)\nprint(stair.in_place)');
    await expect(page.locator('.printed')).toHaveText('True');
  });
});
