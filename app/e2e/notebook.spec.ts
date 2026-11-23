import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { skipGuide } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
}

test('the notebook lists what the level teaches, and a click puts an example in the editor', async ({
  page,
}) => {
  await open(page, 'the-long-corridor');
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook).toBeVisible();
  await expect(notebook.locator('h2')).toHaveText("The wizard's notebook");
  await expect(notebook.locator('[data-example="wizard.move_right(3)"]')).toBeVisible();
  await expect(notebook.locator('[data-example="wizard.pick_up()"]')).toHaveCount(0);
  await expect(notebook).toContainText('Walks right, one tile per step.');

  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await notebook.locator('[data-example="wizard.move_right(3)"]').click();
  await expect(page.locator('.cm-content')).toContainText('wizard.move_right(3)');
  await page.locator('#notebook-close').click();
  await expect(notebook).toBeHidden();
});

test('the notebook of the hidden key has the door and the key', async ({ page }) => {
  await open(page, 'the-hidden-key');
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook.locator('[data-example="door.open()"]')).toBeVisible();
  await expect(notebook.locator('[data-example="key.reveal()"]')).toBeVisible();
  await expect(notebook.locator('[data-example="wizard.pick_up()"]')).toBeVisible();
});

test('after a name and a dot, the editor offers what the level teaches of it', async ({ page }) => {
  await open(page, 'the-hidden-key');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');
  await page.keyboard.type('door.');
  const offered = page.locator('.cm-tooltip-autocomplete');
  await expect(offered).toBeVisible();
  await expect(offered).toContainText('open');
  await expect(offered).toContainText('locked');
  await expect(offered).not.toContainText('move_right');
  await page.keyboard.type('op');
  // Enter takes the offer chosen, once the list has caught up with what was typed.
  await expect(offered.locator('li[aria-selected="true"]')).toContainText('open');
  await page.keyboard.press('Enter');
  await expect(page.locator('.cm-content')).toHaveText('door.open');
});

test('the notebook in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, 'past-the-teacher');
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook h2')).toHaveText('El cuaderno del mago');
  await expect(page.locator('#notebook')).toContainText('Se queda quieto mientras el mundo sigue');
  await expect(page.locator('#notebook [data-example="dask.facing"]')).toBeVisible();
  await context.close();
});

test('a level\'s notebook has what the course has taught so far, for what is in the level (D40)', async ({
  page,
}) => {
  await page.goto('/#level/past-the-teacher');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  // Taught before, and the wizard is here: shown, though this level does not need it.
  await expect(notebook.locator('[data-example="wizard.move_right(3)"]')).toHaveCount(1);
  await expect(notebook.locator('[data-example="wizard.pick_up()"]')).toHaveCount(1);
  // Taught here.
  await expect(notebook.locator('[data-example="dask.facing"]')).toHaveCount(1);
  await expect(notebook.locator('[data-example="wizard.wait(2)"]')).toHaveCount(1);
  // The door of the level before is not in this one.
  await expect(notebook.locator('[data-example="door.open()"]')).toHaveCount(0);
});

test('a level\'s notebook has nothing the course has not taught yet', async ({ page }) => {
  await page.goto('/#level/the-hidden-key');
  await page.locator('#start').click();
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook.locator('[data-example="door.open()"]')).toHaveCount(1);
  await expect(notebook.locator('[data-example="wizard.wait(2)"]')).toHaveCount(0);
  await expect(notebook.locator('[data-example="dask.facing"]')).toHaveCount(0);
});

test('the notebook\'s tab of spells has the spells and the words given so far (D80)', async ({ page }) => {
  // Before any spell or word: no such tab.
  await open(page, 'the-long-corridor');
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook-tab-spells')).toHaveCount(0);

  // The password's level gives its word, and the comment says it too.
  await open(page, 'the-password');
  await expect(page.locator('.cm-content')).toContainText('The password is ambrel.');
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook).toHaveAttribute('data-tab', 'actions');
  await page.locator('#notebook-tab-spells').click();
  await expect(notebook).toHaveAttribute('data-tab', 'spells');
  await expect(notebook.locator('.notebook-magic em')).toHaveText(['ambrel']);
  await expect(notebook).toContainText("ambrel: the school's word, which opens its gates.");

  // The way in: the spell learned, the word remembered; a click puts either in the editor.
  await open(page, 'the-way-in');
  await page.locator('#notebook-open').click();
  await page.locator('#notebook-tab-spells').click();
  await expect(notebook.locator('.notebook-magic em')).toHaveText(['zelim', 'ambrel']);
  await page.screenshot({ path: fileURLToPath(new URL('./shots/painted/08-notebook-spells.png', import.meta.url)) });
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+End');
  await notebook.locator('[data-example=\'wizard.cast("zelim")\']').click();
  await expect(page.locator('.cm-content')).toContainText('wizard.cast("zelim")');
  await notebook.locator('[data-example=\'wizard.say("ambrel")\']').click();
  await expect(page.locator('.cm-content')).toContainText('wizard.say("ambrel")');
});

test('the spells and words in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await open(page, 'the-way-in');
  await page.locator('#notebook-open').click();
  await expect(page.locator('#notebook-tab-spells')).toHaveText('Hechizos y palabras');
  await page.locator('#notebook-tab-spells').click();
  await expect(page.locator('#notebook')).toContainText('zelim: rompe el sello de una puerta que tienes al lado.');
  await context.close();
});

test.describe("the notebook's page of Python (D256)", () => {
  const blocks = (page: Page) => page.locator('#notebook .notebook-syntax > li');
  const shown = (page: Page) =>
    blocks(page).evaluateAll((items) =>
      items.map((item) => [...item.querySelectorAll<HTMLElement>('.syntax-entry')].map((entry) => entry.dataset.concept)),
    );

  test("the course's first level has no bar of tabs", async ({ page }) => {
    await page.goto('/#level/the-gate');
    await skipGuide(page);
    await page.locator('#start').click();
    await page.locator('#notebook-open').click();
    await expect(page.locator('#notebook .notebook-tabs')).toHaveCount(0);
  });

  test('a comment and a string taught give no tab Python (the password)', async ({ page }) => {
    await open(page, 'the-password');
    await page.locator('#notebook-open').click();
    await expect(page.locator('#notebook .notebook-tab')).toHaveCount(2);
    await expect(page.locator('#notebook-tab-python')).toHaveCount(0);
  });

  test('The lost book: Python second with the variable and the sums, an example read and not put in the editor', async ({
    page,
  }) => {
    await open(page, 'the-lost-book');
    const before = await page.locator('.cm-content').textContent();
    await page.locator('#notebook-open').click();
    await expect(page.locator('#notebook .notebook-tab')).toHaveCount(3);
    await expect(page.locator('#notebook .notebook-tab').nth(1)).toHaveAttribute('id', 'notebook-tab-python');
    await expect(page.locator('#notebook-tab-python')).toHaveText('Python');
    await page.locator('#notebook-tab-python').click();
    await expect(page.locator('#notebook')).toHaveAttribute('data-tab', 'python');
    expect(await shown(page)).toEqual([['variables'], ['arithmetic']]);
    const sums = page.locator('#notebook [data-concept="arithmetic"]');
    await expect(sums.locator('.syntax-word')).toHaveText('+  -');
    await expect(sums.locator('.description')).not.toBeEmpty();
    expect((await sums.locator('pre.syntax-example').textContent())?.split('\n')).toEqual([
      'total = 4 + 3',
      'rest = total - 2',
    ]);
    await expect(sums.locator('button')).toHaveCount(0);
    await sums.locator('pre.syntax-example').click();
    await expect(page.locator('.cm-content')).toHaveText(before ?? '');
  });

  test('By the statues: the comparison is `==` alone, and `if` stands alone in its block', async ({ page }) => {
    await open(page, 'by-the-statues');
    await page.locator('#notebook-open').click();
    await page.locator('#notebook-tab-python').click();
    expect(await shown(page)).toEqual([['variables'], ['arithmetic'], ['equal'], ['not'], ['if']]);
    await expect(page.locator('#notebook [data-concept="equal"] .syntax-word')).toHaveText('==');
    await expect(page.locator('#notebook .side-by-side')).toHaveCount(0);
  });

  test("chapter 4's last level has every block, the pairs side by side, and the spells and words third", async ({
    page,
  }) => {
    // The smallest screen the game is made for (D38).
    await page.setViewportSize({ width: 1024, height: 700 });
    await open(page, 'the-rematch');
    await page.locator('#notebook-open').click();
    await expect(page.locator('#notebook .notebook-tab')).toHaveCount(3);
    await expect(page.locator('#notebook .notebook-tab').nth(2)).toHaveAttribute('id', 'notebook-tab-spells');
    await page.locator('#notebook-tab-python').click();
    expect(await shown(page)).toEqual([
      ['variables'],
      ['arithmetic'],
      ['less_greater'],
      ['not'],
      ['if', 'else'],
      ['for_range', 'for_each'],
      ['while'],
      ['lists'],
      ['def', 'def_arguments'],
    ]);
    // The comparisons are one entry, with the three signs, and a list's says `len` too.
    await expect(page.locator('#notebook [data-concept="less_greater"] .syntax-word')).toHaveText('==  <  >');
    await expect(page.locator('#notebook [data-concept="lists"] .syntax-word')).toHaveText('[ ]  len()');
    // A pair stands side by side: the second entry to the right of the first, at its height.
    for (const [left, right] of [
      ['if', 'else'],
      ['for_range', 'for_each'],
      ['def', 'def_arguments'],
    ]) {
      const first = (await page.locator(`#notebook [data-concept="${left}"]`).boundingBox())!;
      const second = (await page.locator(`#notebook [data-concept="${right}"]`).boundingBox())!;
      expect(second.x).toBeGreaterThan(first.x + first.width - 1);
      expect(Math.abs(second.y - first.y)).toBeLessThan(2);
    }
    // No example is wider than its box, at the narrowest the game is played.
    const wide = await page
      .locator('#notebook pre.syntax-example')
      .evaluateAll((boxes) => boxes.filter((box) => box.scrollWidth > box.clientWidth + 1).length);
    expect(wide).toBe(0);
  });
});

test("the forgotten room's notebook has the familiar's pick_up, which it inherits (D278)", async ({ page }) => {
  await open(page, 'the-forgotten-room');
  await page.locator('#notebook-open').click();
  const notebook = page.locator('#notebook');
  await expect(notebook.locator('[data-example="pimu.pick_up()"]')).toBeVisible();
  await expect(notebook).toContainText('Your familiar picks up what lies on its cell and carries it.');
});
