import { expect, type Page, test } from '@playwright/test';
import { doLessonTest, nextLessonPage, skipGuide } from './helpers';
import { ciTimes } from './support';

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
  await nextLessonPage(page);
  await expect(page.locator('.lesson-page code')).toContainText('wizard.move_right()');
  await nextLessonPage(page);
  await expect(page.locator('#lesson-page')).toHaveText('Page 3 of 3');
  // Its code in an editor, without the word that marks it, to run on the page (D142).
  await expect(page.locator('.lesson-run .cm-content')).toContainText('wizard.move_right()');
  await expect(page.locator('.lesson-page')).not.toContainText('python try');

  await nextLessonPage(page);
  await expect(page).toHaveURL(/#level\/the-gate$/);
  // The screen's guide first, the first time, then the card (D258).
  await skipGuide(page);
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
      while ((await page.locator('#lesson-next').count()) > 0) await nextLessonPage(page);
    };
    // True or false comes before If: its example is shown, and its button goes on to
    // the next lesson.
    await page.goto('/#lesson/true-or-false');
    await toLastPage();
    await expect(page.locator('.lesson-run')).toHaveCount(1);
    await expect(page.locator('#lesson-try')).toHaveText(goOn);
    await expect(page.getByRole('button', { name: tryIt })).toHaveCount(0);
    await nextLessonPage(page);
    await expect(page).toHaveURL(/#lesson\/if$/);
    // Finding things comes before The fallen book: one Try button, on its last page, the
    // fifth.
    await page.goto('/#lesson/finding-things');
    await expect(page.locator('.lesson-page')).toBeVisible();
    for (let turn = 0; turn < 4; turn += 1) {
      await expect(page.getByRole('button', { name: tryIt })).toHaveCount(0);
      await nextLessonPage(page);
    }
    await expect(page.locator('#lesson-next')).toHaveCount(0);
    await expect(page.getByRole('button', { name: tryIt })).toHaveCount(1);
    await expect(page.locator('#lesson-try')).toHaveText(tryIt);
    await nextLessonPage(page);
    await expect(page).toHaveURL(/#level\/the-fallen-book$/);
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
    await nextLessonPage(page);
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

test('things-to-carry has one page and no block, and goes on to the-wand (D174)', async ({ page }) => {
  await page.goto('/#lesson/things-to-carry');
  await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 1');
  await expect(page.locator('.lesson-run')).toHaveCount(0);
  await expect(page.locator('#lesson-try')).toHaveText('Go on');
  await page.locator('#lesson-try').click();
  await expect(page).toHaveURL(/#level\/the-wand$/);
});

for (const [lesson, level] of [
  ['words', 'the-password'],
  ['your-first-spell', 'the-sealed-door'],
  ['the-portal', 'the-night-walk'],
] as const) {
  test(`${lesson} has two pages and no block, and goes on to ${level} (D174)`, async ({ page }) => {
    await page.goto(`/#lesson/${lesson}`);
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 2');
    await nextLessonPage(page);
    await expect(page.locator('#lesson-page')).toHaveText('Page 2 of 2');
    await expect(page.locator('.lesson-run')).toHaveCount(0);
    await expect(page.locator('#lesson-try')).toHaveText('Go on');
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(new RegExp(`#level/${level}$`));
  });
}

test.describe('a page taller than the window', () => {
  // A low window, which the page with the most to read does not fit in.
  test.use({ viewport: { width: 1280, height: 600 } });

  test('is read from its top, its button holding the focus below', async ({ page }) => {
    await page.goto('/#lesson/if');
    await nextLessonPage(page);
    await nextLessonPage(page);
    await expect(page.locator('#lesson-page')).toHaveText('Page 3 of 3');
    // The page does not fit: its title is in the window, and its button under it.
    expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(true);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator('.lesson-page h2')).toBeInViewport();
    await expect(page.locator('#lesson-try')).toBeFocused();
    await expect(page.locator('#lesson-try')).not.toBeInViewport();
    // And the page before it, come back to, starts at its top as well.
    await page.locator('#lesson-back').click();
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
});

test('a lesson read shows as done on the map, and opens its level', async ({ page }) => {
  await page.goto('/#lesson/what-a-program-is');
  for (let turn = 0; turn < 2; turn += 1) await nextLessonPage(page);
  // Read once its last page's test is done (D354).
  await doLessonTest(page);
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
  // The teacher's portrait, the friend as the wizard's gender makes them (D194).
  await expect(page.locator('#lesson-teacher img.portrait')).toHaveAttribute('data-portrait', 'nuri');
  await expect(page.locator('#lesson-teacher img.portrait')).toBeVisible();
  await expect
    .poll(() => page.locator('#lesson-teacher img.portrait').evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBe(512);
  await page.goto('/#lesson/a-name-for-a-value');
  await expect(page.locator('#lesson-teacher figcaption')).toHaveText('Wenna');
  await page.goto('/#story/at-the-gate');
  await expect(page.locator('.story-screen #scene canvas')).toBeVisible();
  await expect(page.locator('.lesson-screen')).toHaveCount(0);
  await expect(page.locator('#lesson-teacher')).toHaveCount(0);
});

test.describe('a page runs its code (D142)', () => {
  test('a block prints on the page, in the level after the lesson, and can be changed', async ({ page }) => {
    // Where I am's third page: the wizard's cell, in the dark tunnel.
    await page.goto('/#lesson/where-i-am');
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 4');
    await nextLessonPage(page);
    await nextLessonPage(page);
    await expect(page.locator('#lesson-page')).toHaveText('Page 3 of 4');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('(14, 2)', { timeout: ciTimes(90_000) });
    await expect(page.locator('.lesson-said')).toBeHidden();
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('print(wizard.facing)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('down', { timeout: ciTimes(30_000) });
    // A mistake is told in the child's words.
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('print(dak.facing)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-said')).toContainText('dak', { timeout: ciTimes(30_000) });
    await expect(page.locator('.lesson-printed')).toBeHidden();
  });

  test("true-or-false's first page prints Dask's facing, and its next ones compare", async ({ page }) => {
    await page.goto('/#lesson/true-or-false');
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 5');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('up', { timeout: ciTimes(90_000) });
    await nextLessonPage(page);
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('True\nFalse', { timeout: ciTimes(30_000) });
    await nextLessonPage(page);
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('False\nTrue', { timeout: ciTimes(30_000) });
    await nextLessonPage(page);
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('False', { timeout: ciTimes(30_000) });
  });

  test('the block of if prints both lines while Dask looks up, and the cell alone once its condition says down (D174)', async ({
    page,
  }) => {
    await page.goto('/#lesson/if');
    await nextLessonPage(page);
    await expect(page.locator('#lesson-page')).toHaveText('Page 2 of 3');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('Looking up\nPosition: (11, 6)', { timeout: ciTimes(90_000) });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('if dask.facing == "down":\n    print("Looking up")\nprint("Position:", wizard.position)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('Position: (11, 6)', { timeout: ciTimes(30_000) });
  });

  for (const [locale, last, pageLabel] of [
    ['en-US', 'This line is outside the if', 'Page 3 of 3'],
    ['es-ES', 'Esta línea está fuera del if', 'Página 3 de 3'],
  ] as const) {
    test.describe(`the keys that move a line in, on if's third page (D250, ${locale})`, () => {
      test.use({ locale });

      test('Tab moves the last line in, the delete key brings it out, and Enter after the colon starts the line moved in', async ({
        page,
      }) => {
        await page.goto('/#lesson/if');
        await nextLessonPage(page);
        await nextLessonPage(page);
        await expect(page.locator('#lesson-page')).toHaveText(pageLabel);
        await expect(page.locator('#lesson-next')).toHaveCount(0);
        const lines = page.locator('.lesson-run .cm-line');
        const printed = page.locator('.lesson-printed');
        const run = page.locator('.lesson-run button');
        // As written: the line outside is printed, the one inside is not.
        await run.click();
        await expect(printed).toHaveText(last, { timeout: ciTimes(90_000) });
        // Tab at the start of the last line: it starts with four spaces, and nothing is
        // printed.
        await lines.nth(2).click();
        await page.keyboard.press('Home');
        await page.keyboard.press('Tab');
        expect(await lines.nth(2).textContent()).toBe(`    print("${last}")`);
        await page.screenshot({ path: `e2e/shots/lesson/if-tab-${locale}.png` });
        await run.click();
        await expect(page.locator('.lesson-run')).toHaveAttribute('data-state', 'done', { timeout: ciTimes(30_000) });
        // Nothing printed, and the page says so.
        await expect(printed).toBeHidden();
        await expect(page.locator('.lesson-said')).toBeVisible();
        // The delete key there: the line has none, and is printed again.
        await lines.nth(2).click();
        await page.keyboard.press('Home');
        await page.keyboard.press('Backspace');
        expect(await lines.nth(2).textContent()).toBe(`print("${last}")`);
        await run.click();
        await expect(printed).toHaveText(last, { timeout: ciTimes(30_000) });
        // Enter at the end of the first line: the new line starts four spaces in.
        await lines.nth(0).click();
        await page.keyboard.press('End');
        await page.keyboard.press('Enter');
        expect(await lines.nth(1).textContent()).toBe('    ');
      });
    });
  }

  test('less-or-greater compares, tells left from right, and takes the smaller from the greater (D212)', async ({
    page,
  }) => {
    await page.goto('/#lesson/less-or-greater');
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 3');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('True\nFalse\nTrue\nFalse', { timeout: ciTimes(90_000) });
    await nextLessonPage(page);
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('True', { timeout: ciTimes(30_000) });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('my_x = 9\nbroom_x = 12\nprint(broom_x < my_x)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('False', { timeout: ciTimes(30_000) });
    await nextLessonPage(page);
    // The game's own words for a negative move, as the child reads them.
    await expect(page.locator('.lesson-page')).toContainText(
      'the game does not accept it and tells you that move_left is not used like that.',
    );
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('left 3', { timeout: ciTimes(30_000) });
    for (const [broom, printed] of [
      ['12', 'right 3'],
      ['9', 'right 0'],
    ] as const) {
      await page.locator('.lesson-run .cm-content').click();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.insertText(
        `my_x = 9\nbroom_x = ${broom}\nif broom_x < my_x:\n    print("left", my_x - broom_x)\nelse:\n    print("right", broom_x - my_x)`,
      );
      await page.locator('.lesson-run button').click();
      await expect(page.locator('.lesson-printed')).toHaveText(printed, { timeout: ciTimes(30_000) });
    }
  });

  test("the two coordinates print the cell's two numbers (D174)", async ({ page }) => {
    await page.goto('/#lesson/the-two-coordinates');
    for (let turn = 0; turn < 2; turn += 1) await nextLessonPage(page);
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-printed')).toHaveText('5\n7', { timeout: ciTimes(90_000) });
  });

  test('a program typed that walks says its steps, never a cell, always from the start (D180)', async ({
    page,
  }) => {
    // No block walks (D174), but the child may type one that does, in If's block.
    await page.goto('/#lesson/if');
    await nextLessonPage(page);
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down(2)');
    await page.locator('.lesson-run button').click();
    const said = page.locator('.lesson-said');
    await expect(said).toHaveText('The wizard has moved 2 steps down.', { timeout: ciTimes(90_000) });
    // Again from the start: the same two steps, not four.
    await page.locator('.lesson-run button').click();
    await expect(said).toHaveText('The wizard has moved 2 steps down.', { timeout: ciTimes(30_000) });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down(2)\nwizard.move_left()');
    await page.locator('.lesson-run button').click();
    await expect(said).toHaveText('The wizard has moved 2 steps down and 1 to the left.', { timeout: ciTimes(30_000) });
    await expect(said).not.toContainText('(');
    // Into Dask's sight, he sees the wizard: the page says it.
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(3)');
    await page.locator('.lesson-run button').click();
    await expect(page.locator('.lesson-said')).toContainText('teacher', { timeout: ciTimes(30_000) });
  });

  test('a program typed that casts the map opens the plan, closed with its button', async ({ page }) => {
    await page.goto('/#lesson/if');
    await nextLessonPage(page);
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.cast("orvim")');
    await page.locator('.lesson-run button').click();
    const plan = page.locator('#plan');
    await expect(plan).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(plan).toHaveAttribute('data-figures', /wizard:11,6/);
    await expect(plan).toHaveAttribute('data-drawn', 'true', { timeout: ciTimes(30_000) });
    await page.locator('#plan-close').click();
    await expect(plan).toHaveCount(0);
  });

  test('a walk is said in Spanish too, and a walk back says it came back (D180)', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await page.goto('/#lesson/if');
    await nextLessonPage(page);
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down(2)');
    await page.locator('.lesson-run button').click();
    const said = page.locator('.lesson-said');
    await expect(said).toHaveText('El mago se ha movido 2 pasos hacia abajo.', { timeout: ciTimes(90_000) });
    await page.locator('.lesson-run .cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_down()\nwizard.move_up()');
    await page.locator('.lesson-run button').click();
    await expect(said).toHaveText('El mago ha vuelto a donde empezó.', { timeout: ciTimes(30_000) });
    await context.close();
  });

  test('its button says Run in Spanish too', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'es-ES' });
    const page = await context.newPage();
    await page.goto('/#lesson/where-i-am');
    await expect(page.locator('.lesson-page')).toBeVisible();
    // Its block is on its third page.
    await nextLessonPage(page);
    await nextLessonPage(page);
    await expect(page.locator('.lesson-run button')).toHaveText('Ejecutar');
    await context.close();
  });
});

test.describe("a lesson's page is passed by trying it (D354)", () => {
  /** The page's block: its code replaced and run. */
  async function runCode(page: Page, code?: string): Promise<void> {
    const block = page.locator('.lesson-run').first();
    if (code !== undefined) {
      await block.locator('.cm-content').click();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.insertText(code);
    }
    await block.locator('.lesson-run-button').click();
    await expect(block).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
  }
  const asked = (page: Page) => page.locator('.lesson-asked');

  for (const [locale, notRun, notStarted, notChanged] of [
    [
      'en-US',
      "You have not tried this page's code yet. Press Run and see what happens.",
      'You have not yet tried what this lesson tells you to try. Press Run to begin.',
      'You have not yet tried what this lesson tells you to try. Change the code as the page says and run it again.',
    ],
    [
      'es-ES',
      'Todavía no has probado el código de esta página. Pulsa Ejecutar y mira qué pasa.',
      'Todavía no has hecho la prueba que te dice esta lección. Pulsa Ejecutar para empezar.',
      'Todavía no has hecho la prueba que te dice esta lección. Cambia el código como dice la página y ejecútalo otra vez.',
    ],
  ] as const) {
    test(`a page to run and a page to change wait for their test, and say what is missing (${locale})`, async ({
      browser,
    }) => {
      const context = await browser.newContext({ locale });
      const page = await context.newPage();
      await page.goto('/#lesson/a-name-for-a-value');
      await expect(page.locator('.lesson-page')).toBeVisible();
      // Page 1, a block to run: the button stays, never disabled, and says why.
      await expect(page.locator('#lesson-next')).toBeEnabled();
      await page.locator('#lesson-next').click();
      await expect(asked(page)).toHaveText(notRun);
      await expect(page.locator('#lesson-page')).toContainText('1');
      await runCode(page);
      await expect(asked(page)).toBeHidden();
      await page.locator('#lesson-next').click();
      // Page 2, a change to run: nothing run, then run as given, then changed.
      await expect(page.locator('.lesson-run')).toHaveAttribute('data-test', 'change');
      await page.locator('#lesson-next').click();
      await expect(asked(page)).toHaveText(notStarted);
      await runCode(page);
      await page.locator('#lesson-next').click();
      await expect(asked(page)).toHaveText(notChanged);
      // Back always works.
      await page.locator('#lesson-back').click();
      await expect(page.locator('.lesson-run')).toHaveAttribute('data-test', 'try');
      await page.locator('#lesson-next').click();
      await runCode(page, 'edad = 10\nnombre = "Teku"\nprint(edad)\nprint(nombre)');
      await page.locator('#lesson-next').click();
      await expect(page.locator('.lesson-run')).toHaveAttribute('data-test', 'try');
      await context.close();
    });
  }

  test('a page to rename waits until the variable is renamed in a run with no error', async ({ page }) => {
    await page.goto('/#lesson/finding-things');
    await expect(page.locator('.lesson-page')).toBeVisible();
    for (let turn = 0; turn < 4; turn += 1) await page.locator('#lesson-next').click();
    await expect(page.locator('.lesson-run')).toHaveAttribute('data-test', 'rename');
    await runCode(page);
    await expect(page.locator('.lesson-printed')).toHaveText('<book at 3, 15>');
    await page.locator('#lesson-try').click();
    await expect(asked(page)).toHaveText(
      "You have not yet tried what this lesson tells you to try. Change the variable's name on every line and run.",
    );
    await runCode(page, 'found = wizard.find_nearest("book")\nprint(found)');
    await expect(page.locator('.lesson-printed')).toHaveText('<book at 3, 15>');
    await page.locator('#lesson-try').click();
    await expect(page).toHaveURL(/#level\/the-fallen-book$/);
  });

  for (const order of ['rename first', 'error first'] as const) {
    test(`the page that asks for the error goes on after the rename and the error (${order})`, async ({ page }) => {
      await page.goto('/#lesson/a-name-for-a-value');
      await expect(page.locator('.lesson-page')).toBeVisible();
      for (let turn = 0; turn < 3; turn += 1) await nextLessonPage(page);
      await expect(page.locator('.lesson-run')).toHaveAttribute('data-test', 'rename_error');
      // The given variable is `sweets` in English: a name of one's own, then one line left.
      const renamed = 'treats = 12\nprint(treats)';
      const half = 'treats = 12\nprint(sweets)';
      if (order === 'rename first') {
        await runCode(page, renamed);
        await page.locator('#lesson-next').click();
        await expect(asked(page)).toContainText('Change the name on one line only and run');
        await runCode(page, half);
      } else {
        await runCode(page, half);
        await expect(page.locator('.lesson-said')).toContainText('There is nothing called sweets here.');
        await page.locator('#lesson-next').click();
        await expect(asked(page)).toContainText("Change the variable's name on every line and run.");
        await runCode(page, renamed);
      }
      await page.locator('#lesson-next').click();
      await expect(page.locator('#lesson-page')).toHaveText('Page 5 of 5');
    });
  }

  test('a lesson read once asks nothing, nor one read again from a level', async ({ page }) => {
    await page.goto('/#lesson/a-name-for-a-value');
    await expect(page.locator('.lesson-page')).toBeVisible();
    for (let turn = 0; turn < 5; turn += 1) await nextLessonPage(page);
    await expect(page).toHaveURL(/#level\/the-reading-room$/);
    // Read: every page goes on with nothing tried.
    await page.goto('/#start');
    await page.goto('/#lesson/a-name-for-a-value');
    await expect(page.locator('#lesson-page')).toHaveText('Page 1 of 5');
    for (let turn = 0; turn < 4; turn += 1) await page.locator('#lesson-next').click();
    await expect(page.locator('#lesson-page')).toHaveText('Page 5 of 5');
    // Never read, opened again from its level: nothing asked.
    await page.goto('/#start');
    await page.goto('/#lesson/finding-things/from/the-fallen-book');
    await expect(page.locator('.lesson-page h1')).toHaveText('Finding things');
    for (let turn = 0; turn < 4; turn += 1) await page.locator('#lesson-next').click();
    await expect(page.locator('#lesson-page')).toHaveText('Page 5 of 5');
    await expect(asked(page)).toBeHidden();
  });

  test("the tester's mode passes every page", async ({ page }) => {
    await page.goto('/?debug#lesson/a-name-for-a-value');
    await expect(page.locator('.lesson-page')).toBeVisible();
    for (let turn = 0; turn < 4; turn += 1) await page.locator('#lesson-next').click();
    await expect(page.locator('#lesson-page')).toHaveText('Page 5 of 5');
  });
});
