import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('a lesson turns its pages, theory first, and Try it opens the level, its editor its own', async ({
  page,
}) => {
  await page.goto('/#lesson/what-a-program-is');
  await expect(page.locator('.lesson-page h1')).toHaveText('What a program is');
  await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 3');
  await expect(page.locator('#lesson-back')).toBeDisabled();
  // The idea comes before any code (D41).
  await expect(page.locator('.lesson-page')).toContainText('A list of instructions is a program.');
  await expect(page.locator('.lesson-page code')).toHaveCount(0);
  await page.locator('#lesson-next').click();
  await expect(page.locator('.lesson-page code')).toContainText('wizard.move_right()');
  await page.locator('#lesson-next').click();
  await expect(page.locator('#lesson-page')).toHaveText('Page 3 of 3');
  // Its code in an editor, without the word that marks it, to run on the page (D142).
  await expect(page.locator('.lesson-run .cm-content')).toContainText('wizard.move_right()');
  await expect(page.locator('.lesson-page')).not.toContainText('python try');

  await page.locator('#lesson-try').click();
  await expect(page).toHaveURL(/#level\/the-gate$/);
  await page.locator('#start').click();
  // The gate starts with no program: the example stays in the lesson (D63).
  await expect(page.locator('.cm-content')).toHaveText('');
});

for (const [locale, tryIt, goOn] of [
  ['en-US', 'Try it', 'Go on'],
  ['es-ES', 'Probar', 'Seguir'],
] as const) {
  test(`only a lesson before a level says ${tryIt}: one before another lesson goes on to it (${locale})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    // The lesson drawn before its pages are counted, so that a slow load is not
    // taken for its last page.
    const toLastPage = async () => {
      await expect(page.locator('.lesson-page')).toBeVisible();
      while ((await page.locator('#lesson-next').count()) > 0) await page.locator('#lesson-next').click();
    };
    // True or false comes before If: its example is shown, and its button goes on to
    // the next lesson.
    await page.goto('/#lesson/true-or-false');
    await toLastPage();
    await expect(page.locator('.lesson-run')).toHaveCount(1);
    await expect(page.locator('#lesson-try')).toHaveText(goOn);
    await expect(page.getByRole('button', { name: tryIt })).toHaveCount(0);
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(/#lesson\/if$/);
    // What things know comes before The lost book: one Try button, on its last page, the
    // eighth.
    await page.goto('/#lesson/what-things-know');
    await expect(page.locator('.lesson-page')).toBeVisible();
    for (let turn = 0; turn < 7; turn += 1) {
      await expect(page.getByRole('button', { name: tryIt })).toHaveCount(0);
      await page.locator('#lesson-next').click();
    }
    await expect(page.locator('#lesson-next')).toHaveCount(0);
    await expect(page.getByRole('button', { name: tryIt })).toHaveCount(1);
    await expect(page.locator('#lesson-try')).toHaveText(tryIt);
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(/#level\/the-lost-book$/);
    await context.close();
  });
}

for (const [locale, title, pageTwo, tryIt, goOn] of [
  ['en-US', 'The right place', 'Page 2 of 2', 'Try it', 'Go on'],
  ['es-ES', 'Cada cosa en su sitio', 'Página 2 de 2', 'Probar', 'Seguir'],
] as const) {
  test(`a lesson with nothing worth trying has two pages and no block, and goes on to its level (D173, ${locale})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.goto('/#lesson/the-right-place');
    await expect(page.locator('.lesson-page h1')).toHaveText(title);
    await page.locator('#lesson-next').click();
    await expect(page.locator('#lesson-page')).toHaveText(pageTwo);
    await expect(page.locator('#lesson-next')).toHaveCount(0);
    await expect(page.locator('.lesson-run')).toHaveCount(0);
    await expect(page.getByRole('button', { name: tryIt })).toHaveCount(0);
    await expect(page.locator('#lesson-try')).toHaveText(goOn);
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(/#level\/your-bed$/);
    await context.close();
  });
}

for (const [lesson, level] of [
  ['words', 'the-password'],
  ['things-to-carry', 'the-wand'],
  ['your-first-spell', 'the-sealed-door'],
  ['the-portal', 'the-night-walk'],
] as const) {
  test(`${lesson} has two pages and no block, and goes on to ${level} (D174)`, async ({ page }) => {
    await page.goto(`/#lesson/${lesson}`);
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 2');
    await page.locator('#lesson-next').click();
    await expect(page.locator('#lesson-page')).toHaveText('Page 2 of 2');
    await expect(page.locator('.lesson-run')).toHaveCount(0);
    await expect(page.locator('#lesson-try')).toHaveText('Go on');
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(new RegExp(`#level/${level}$`));
  });
}

test('a lesson read shows as done on the map, and opens its level', async ({ page }) => {
  await page.goto('/#lesson/what-a-program-is');
  for (let turn = 0; turn < 2; turn += 1) await page.locator('#lesson-next').click();
  await page.locator('#lesson-map').click();
  const stops = page.locator('.stop');
  await expect(stops.nth(2)).toHaveAttribute('data-item', 'lesson:what-a-program-is');
  await expect(stops.nth(2)).toHaveAttribute('data-state', 'done');
  await expect(stops.nth(3)).toHaveAttribute('data-state', 'open');
  await expect(stops.nth(3)).toContainText('The gate');
});

test('a lesson in Spanish', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES' });
  const page = await context.newPage();
  await page.goto('/#lesson/words');
  await expect(page.locator('.lesson-page h1')).toHaveText('Palabras');
  await expect(page.locator('#lesson-next')).toHaveText('Página siguiente');
  await context.close();
});

test('a lesson shows who teaches it; a story is told on its scene instead (D67, D74)', async ({ page }) => {
  await page.goto('/#lesson/what-a-program-is');
  await expect(page.locator('.lesson-screen')).toHaveClass(/taught/);
  await expect(page.locator('#lesson-teacher figcaption')).toHaveText('Nuri');
  await expect(page.locator('#lesson-teacher canvas')).toBeVisible();
  await page.goto('/#lesson/what-things-know');
  await expect(page.locator('#lesson-teacher figcaption')).toHaveText('Wenna');
  await page.goto('/#story/at-the-gate');
  await expect(page.locator('.story-screen #scene canvas')).toBeVisible();
  await expect(page.locator('.lesson-screen')).toHaveCount(0);
  await expect(page.locator('#lesson-teacher')).toHaveCount(0);
});

test.describe('a page runs its code (D142)', () => {
  test('a block prints on the page, in the level after the lesson, and can be changed', async ({ page }) => {
    // Where I am's first page: the wizard's cell, in the dark tunnel.
    await page.goto('/#lesson/where-i-am');
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 2');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('(14, 2)', { timeout: 90_000 });
    await expect(page.locator('.lesson-said')).toBeHidden();
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('print(wizard.facing)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('down', { timeout: 30_000 });
    // A mistake is told in the child's words.
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('print(dak.facing)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-said')).toContainText('dak', { timeout: 30_000 });
    await expect(page.locator('.lesson-printed')).toBeHidden();
  });

  test("true-or-false's first page prints Dask's facing, and its next ones compare", async ({ page }) => {
    await page.goto('/#lesson/true-or-false');
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 5');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('up', { timeout: 90_000 });
    await page.locator('#lesson-next').click();
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('True\nFalse', { timeout: 30_000 });
    await page.locator('#lesson-next').click();
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('False\nTrue', { timeout: 30_000 });
    await page.locator('#lesson-next').click();
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('False', { timeout: 30_000 });
  });

  test('the block of if prints both lines while Dask looks up, and the cell alone once its condition says down (D174)', async ({
    page,
  }) => {
    await page.goto('/#lesson/if');
    await page.locator('#lesson-next').click();
    await expect(page.locator('#lesson-page')).toHaveText('Page 2 of 2');
    await expect(page.locator('#lesson-next')).toHaveCount(0);
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('Looking up\nPosition: (11, 6)', { timeout: 90_000 });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('if dask.facing == "down":\n    print("Looking up")\nprint("Position:", wizard.position)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('Position: (11, 6)', { timeout: 30_000 });
  });

  test("the two coordinates print the cell's two numbers (D174)", async ({ page }) => {
    await page.goto('/#lesson/the-two-coordinates');
    for (let turn = 0; turn < 2; turn += 1) await page.locator('#lesson-next').click();
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('5\n7', { timeout: 90_000 });
  });

  test('a program typed that walks says its steps, never a cell, always from the start (D180)', async ({
    page,
  }) => {
    // No block walks (D174), but the child may type one that does, in If's block.
    await page.goto('/#lesson/if');
    await page.locator('#lesson-next').click();
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down(2)');
    await page.locator('.lesson-run button').click();
    const said = page.locator('.lesson-said');
    await expect(said).toHaveText('The wizard has moved 2 steps down.', { timeout: 90_000 });
    // Again from the start: the same two steps, not four.
    await page.locator('.lesson-run button').click();
    await expect(said).toHaveText('The wizard has moved 2 steps down.', { timeout: 30_000 });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down(2)\nwizard.move_left()');
    await page.locator('.lesson-run button').click();
    await expect(said).toHaveText('The wizard has moved 2 steps down and 1 to the left.', { timeout: 30_000 });
    await expect(said).not.toContainText('(');
    // Into Dask's sight, he sees the wizard: the page says it.
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(3)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-said')).toContainText('teacher', { timeout: 30_000 });
  });

  test('a program typed that casts the map opens the plan, closed with its button', async ({ page }) => {
    await page.goto('/#lesson/if');
    await page.locator('#lesson-next').click();
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.cast("orvim")');
    await page.locator('.lesson-run button').click();
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: 90_000 });
    await expect(plan).toHaveAttribute('data-figures', /wizard:11,6/);
    await expect(plan).toHaveAttribute('data-drawn', 'true', { timeout: 30_000 });
    await page.locator('#plan-close').click();
    await expect(plan).toHaveCount(0);
  });

  test('a walk is said in Spanish too, and a walk back says it came back (D180)', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await page.goto('/#lesson/if');
    await page.locator('#lesson-next').click();
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down(2)');
    await page.locator('.lesson-run button').click();
    const said = page.locator('.lesson-said');
    await expect(said).toHaveText('El mago se ha movido 2 pasos hacia abajo.', { timeout: 90_000 });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down()\nwizard.move_up()');
    await page.locator('.lesson-run button').click();
    await expect(said).toHaveText('El mago ha vuelto a donde empezó.', { timeout: 30_000 });
    await context.close();
  });

  test('its button says Run in Spanish too', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await page.goto('/#lesson/where-i-am');
    await expect(page.locator('.lesson-page')).toBeVisible();
    await expect(page.locator('.lesson-run button')).toHaveText('Ejecutar');
    await context.close();
  });
});
