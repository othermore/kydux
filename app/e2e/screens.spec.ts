import { expect, type Page, test } from '@playwright/test';
import { seedWizard, skipGuide } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'es-ES' });
test.beforeEach(async ({ page }) => seedWizard(page));

type Box = { x: number; y: number; width: number; height: number };

async function box(page: Page, selector: string): Promise<Box> {
  const found = await page.locator(selector).first().boundingBox();
  if (!found) throw new Error(`${selector} is not shown`);
  return found;
}

function inside(inner: Box, outer: Box): boolean {
  return (
    inner.x >= outer.x - 1 &&
    inner.y >= outer.y - 1 &&
    inner.x + inner.width <= outer.x + outer.width + 1 &&
    inner.y + inner.height <= outer.y + outer.height + 1
  );
}

// The screens the game is made for (D38): a tablet held sideways, a laptop, a
// large monitor. The longest title and the level with most goals are used.
for (const [width, height] of [
  [1024, 700],
  [1280, 720],
  [1920, 1080],
] as const) {
  test(`at ${width}×${height}, the level screen shows all it needs without scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/#level/the-hidden-key');
    const view: Box = { x: 0, y: 0, width, height };
    // The start card lies over the whole window, inside it, and does not scroll (D228).
    expect(inside(await box(page, '.start-card'), view)).toBe(true);
    expect(await page.locator('.start-card').evaluate((card) => card.scrollHeight - card.clientHeight)).toBeLessThanOrEqual(0);
    await page.locator('#start').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    for (const selector of ['.scene-frame', '.cm-editor', '#run', '.goals', '#speed', '#level-settings']) {
      expect(inside(await box(page, selector), view), `${selector} in view`).toBe(true);
    }
    // At least eight lines of code fit in the editor.
    const lineHeight = await page
      .locator('.cm-line')
      .first()
      .evaluate((line) => parseFloat(getComputedStyle(line).lineHeight));
    expect((await box(page, '.cm-editor')).height / lineHeight).toBeGreaterThanOrEqual(8);
    // The notebook opens over the scene, inside its frame.
    await page.locator('#notebook-open').click();
    expect(inside(await box(page, '#notebook'), await box(page, '.scene-frame'))).toBe(true);
  });
}

test('the heading keeps its parts apart with the longest title, at 1024', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.goto('/#level/past-the-teacher');
  await page.locator('#start').click();
  const parts = await Promise.all(['.level-title', '#about', '#level-map', '#level-settings'].map((s) => box(page, s)));
  for (let i = 0; i < parts.length; i += 1) {
    for (let j = i + 1; j < parts.length; j += 1) {
      const [a, b] = [parts[i] as Box, parts[j] as Box];
      const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
      expect(apart).toBe(true);
    }
  }
});

test('the heading in two lines held close, the longest title in Spanish at 1024 (D360)', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'es-ES', viewport: { width: 1024, height: 700 } });
  const page = await context.newPage();
  await seedWizard(page);
  await page.goto('/#level/eldras-room');
  await page.locator('#start').click();
  await expect(page.locator('#level-number')).toHaveText('Cap. 2 · Práctica 8');
  const label = await box(page, '#level-number');
  const lesson = await box(page, '#level-lesson');
  const map = await box(page, '#level-map');
  const gear = await box(page, '#level-settings');
  const title = await box(page, '.level-title');
  const about = await box(page, '#about');
  const stage = await box(page, '.stage');
  const middle = (b: Box) => b.y + b.height / 2;
  // The first line: the label, the lesson, the map, and the gear at the line's right end.
  for (const one of [lesson, map, gear]) expect(Math.abs(middle(one) - middle(label))).toBeLessThan(6);
  expect(gear.x + gear.width).toBeGreaterThan(stage.x + stage.width - 4);
  // The second line, close under the first: the title and its ?, on one line.
  expect(Math.abs(middle(about) - middle(title))).toBeLessThan(6);
  expect(title.y).toBeGreaterThan(label.y + label.height - 4);
  expect(title.y - (label.y + label.height)).toBeLessThan(14);
  expect(title.height).toBeLessThan(32);
  await context.close();
});

test('on a phone, the panes stack and nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('#split')).toBeHidden();
  const [scene, editor] = [await box(page, '.scene-frame'), await box(page, '.cm-editor')];
  expect(editor.y).toBeGreaterThan(scene.y + scene.height - 1);
});

test('the goals fold away from the scene, and open again', async ({ page }) => {
  await page.goto('/#level/the-long-corridor');
  await page.locator('#start').click();
  const toggle = page.locator('#goals-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(page.locator('#goals-list')).toBeHidden();
  await toggle.click();
  await expect(page.locator('#goals-list')).toBeVisible();
});

test.describe("the goals box's two shapes, taken once the start is drawn (D227)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  /** The box's shape, whether it is folded, and what each shape covered. */
  const seen = (page: Page) =>
    page.locator('.goals').evaluate((node) => ({
      shape: node.dataset.shape,
      folded: node.dataset.folded,
      list: node.dataset.listCovers,
      strip: node.dataset.stripCovers,
    }));

  test('the list where it covers nothing, still open after four seconds', async ({ page }) => {
    await page.goto('/#level/the-long-corridor');
    await page.locator('#start').click();
    await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
    await page.waitForTimeout(4000);
    expect(await seen(page)).toEqual({ shape: 'list', folded: 'false', list: '0', strip: '0' });
    await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/goals/list-the-long-corridor.png' });
  });

  for (const id of ['the-rings', 'the-race']) {
    test(`${id}: the strip, over no ring and no figure, still open after four seconds`, async ({ page }) => {
      await page.goto(`/#level/${id}`);
      await page.locator('#start').click();
      await expect(page.locator('.goals')).toHaveAttribute('data-revealed', 'true');
      await page.waitForTimeout(4000);
      const box = await seen(page);
      expect(box.shape).toBe('strip');
      expect(box.folded).toBe('false');
      expect(box.strip).toBe('0');
      expect(Number(box.list)).toBeGreaterThan(0);
      await page.locator('.scene-frame').screenshot({ path: `e2e/shots/goals/strip-${id}.png` });
    });
  }

  test('where both cover something, open two seconds after the start card closes, folded within four; its heading opens it again', async ({
    page,
  }) => {
    await page.goto('/#level/the-sealed-door');
    await page.locator('#start').click();
    const goals = page.locator('.goals');
    await expect(goals).toHaveAttribute('data-revealed', 'true');
    await page.waitForTimeout(2000);
    await expect(goals).toHaveAttribute('data-folded', 'false');
    await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/goals/open-the-sealed-door.png' });
    await expect(goals).toHaveAttribute('data-folded', 'true', { timeout: 2500 });
    expect(await seen(page)).toMatchObject({ shape: 'list' });
    await page.locator('.scene-frame').screenshot({ path: 'e2e/shots/goals/folded-the-sealed-door.png' });
    await page.locator('#goals-toggle').click();
    await expect(goals).toHaveAttribute('data-folded', 'false');
    await page.waitForTimeout(4000);
    await expect(goals).toHaveAttribute('data-folded', 'false');
  });

  test('a heading clicked twice inside the three seconds keeps the page from folding the box', async ({ page }) => {
    await page.goto('/#level/the-sealed-door');
    await page.locator('#start').click();
    const goals = page.locator('.goals');
    await expect(goals).toHaveAttribute('data-revealed', 'true');
    await page.locator('#goals-toggle').click();
    await page.locator('#goals-toggle').click();
    await page.waitForTimeout(4000);
    await expect(goals).toHaveAttribute('data-folded', 'false');
  });
});

test.describe('the keys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#level/the-long-corridor');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(6)');
  });

  test('Tab moves a line in by four spaces, Shift+Tab out again', async ({ page }) => {
    await page.keyboard.press('Home');
    await page.keyboard.press('Tab');
    await expect(page.locator('.cm-content')).toHaveText('    wizard.move_right(6)');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(6)');
  });

  test('Ctrl+Enter in the editor runs the code', async ({ page }) => {
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', /playing|done/, { timeout: ciTimes(30_000) });
  });

  test('Alt+R runs the code from anywhere on the screen, and types nothing', async ({ page }) => {
    await page.locator('.level-title').click();
    await page.keyboard.press('Alt+KeyR');
    await expect(page.locator('#scene')).toHaveAttribute('data-state', /playing|done/, { timeout: ciTimes(30_000) });
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(6)');
  });

  test('Alt+N opens and closes the notebook, even from the editor', async ({ page }) => {
    await page.keyboard.press('Alt+KeyN');
    await expect(page.locator('#notebook')).toBeVisible();
    await page.keyboard.press('Alt+KeyN');
    await expect(page.locator('#notebook')).toBeHidden();
    await expect(page.locator('.cm-content')).toHaveText('wizard.move_right(6)');
  });

  test('the settings list the keys', async ({ page }) => {
    await page.goto('/#settings');
    await expect(page.locator('#settings-keys h3')).toHaveText('Teclas');
    await expect(page.locator('#settings-keys dt')).toHaveCount(6);
    await expect(page.locator('#settings-keys')).toContainText('Ctrl+Intro o Alt+R');
  });
});

/** A level opened with Python ready, its start card closed and the speed at 4. */
async function openReady(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('4');
}

/** The program as it comes run, and its answer waited for. */
async function runAndAnswer(page: Page): Promise<void> {
  await page.locator('#run').click();
  await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(30_000) });
}

/** How many lines of code the editor shows. */
function editorLines(page: Page): Promise<number> {
  return page.evaluate(() => {
    const scroller = document.querySelector('.cm-scroller') as HTMLElement;
    const line = parseFloat(getComputedStyle(document.querySelector('.cm-line') as HTMLElement).lineHeight);
    return scroller.getBoundingClientRect().height / line;
  });
}

/** Whether the newest hint's top lies at or under its list's top and its first line over
 * the list's foot. */
function newestHintSeen(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const newest = [...document.querySelectorAll('.hint')].at(-1);
    const list = document.querySelector('.hints-list');
    if (!newest || !list) return false;
    const hint = newest.getBoundingClientRect();
    const box = list.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(newest).lineHeight);
    return hint.top >= box.top - 1 && hint.top + line <= box.bottom + 1;
  });
}

/** Whether the line an answer names lies inside what the editor shows. */
function errorLineSeen(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const line = document.querySelector('.cm-kydux-error-line')?.getBoundingClientRect();
    const shown = document.querySelector('.cm-scroller')?.getBoundingClientRect();
    return Boolean(line && shown && line.top >= shown.top - 1 && line.bottom <= shown.bottom + 1);
  });
}

/** What D363 holds of the editor's column: five lines of code or more, the answer whole
 * inside the window, neither the page nor the column scrolling, the newest hint from its
 * first line, and the line the answer names in the editor's sight. */
async function codeInSight(page: Page, width: number, height: number): Promise<void> {
  expect(await editorLines(page)).toBeGreaterThanOrEqual(5);
  expect(inside(await box(page, '.outcome'), { x: 0, y: 0, width, height })).toBe(true);
  expect(await page.locator('.outcome').evaluate((card) => card.scrollHeight - card.clientHeight)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(height);
  expect(await page.locator('.workbench').evaluate((column) => column.scrollHeight - column.clientHeight)).toBe(0);
  if ((await page.locator('.hint').count()) > 0) expect(await newestHintSeen(page)).toBe(true);
  await expect.poll(() => errorLineSeen(page)).toBe(true);
}

test.describe('the code stays in sight under the hints and the answer (D363)', () => {
  for (const [width, height] of [
    [1024, 700],
    [1280, 720],
    [900, 600],
  ] as const) {
    test(`at ${width}×${height}, in the-check, an answer and three hints`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openReady(page, 'the-check');
      await runAndAnswer(page);
      await expect(page.locator('.outcome')).toContainText('(línea 8)');
      await codeInSight(page, width, height);
      const list = page.locator('.hints-list');
      for (let n = 1; n <= 3; n += 1) {
        await page.locator('#hint').click();
        await expect(page.locator('.hint')).toHaveCount(n);
        await codeInSight(page, width, height);
        if (n === 1 && width === 1280) {
          await expect(list).not.toHaveClass(/more-above|more-below/);
          await expect(list).not.toHaveAttribute('tabindex');
        }
      }
      await page.screenshot({ path: `e2e/shots/workbench-${width}x${height}.png` });
      if (width === 1024) {
        // Hints lie above the newest: the list's top fades, and the keys reach it.
        await expect(list).toHaveClass(/more-above/);
        await expect(list).toHaveAttribute('tabindex', '0');
        await list.evaluate((node) => {
          node.scrollTop = 0;
        });
        await expect(list).toHaveClass(/more-below/);
        await expect(list).not.toHaveClass(/more-above/);
      }

      // Opened again, the level shows its three hints kept, unfolded, the newest in sight.
      await page.reload();
      await page.locator('#start').click();
      await expect(page.locator('.hint')).toHaveCount(3);
      await expect(page.locator('.hints')).not.toHaveClass(/folded/);
      expect(await editorLines(page)).toBeGreaterThanOrEqual(5);
      await expect.poll(() => newestHintSeen(page)).toBe(true);
    });
  }

  test('with the code at its largest letter, 24 px, at 1024×700', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await page.goto('/#settings');
    await page.locator('#settings-font-size').selectOption('24');
    await openReady(page, 'the-check');
    await runAndAnswer(page);
    for (let n = 0; n <= 3; n += 1) {
      if (n > 0) {
        await page.locator('#hint').click();
        await expect(page.locator('.hint')).toHaveCount(n);
      }
      expect(await editorLines(page)).toBeGreaterThanOrEqual(5);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(700);
      expect(inside(await box(page, '.outcome'), { x: 0, y: 0, width: 1024, height: 700 })).toBe(true);
    }
  });

  test('the hints and the answer fold to one line each, and what is new unfolds', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await openReady(page, 'the-check');
    await runAndAnswer(page);
    await page.locator('#hint').click();
    await page.locator('#hint').click();
    const hints = page.locator('.hints');
    const card = page.locator('.outcome');
    const hintsFold = page.locator('#hints-fold');
    const cardFold = page.locator('#outcome-fold');
    await expect(hintsFold).toHaveAttribute('aria-expanded', 'true');
    await expect(hintsFold).toHaveAttribute('title', 'Plegar las pistas');
    await expect(cardFold).toHaveAttribute('aria-expanded', 'true');
    await expect(cardFold).toHaveAttribute('title', 'Plegar la respuesta');

    // The hints folded: one line that says how many are taken, and more room for the code.
    await hintsFold.click();
    await expect(hints).toHaveClass(/folded/);
    expect((await box(page, '.hints')).height).toBeLessThan(50);
    await expect(hints).toHaveText('Pistas: 2 de 3', { useInnerText: true });
    await expect(page.locator('.hint:visible')).toHaveCount(0);
    await expect(hintsFold).toHaveAttribute('aria-expanded', 'false');
    await expect(hintsFold).toHaveAttribute('title', 'Desplegar las pistas');
    expect(await editorLines(page)).toBeGreaterThanOrEqual(9);
    await expect.poll(() => errorLineSeen(page)).toBe(true);

    // The answer folded: its first words on one line, cut, and the code has the column.
    const answer = await page.locator('.outcome-text').textContent();
    await cardFold.click();
    await expect(card).toHaveClass(/folded/);
    expect((await box(page, '.outcome')).height).toBeLessThan(56);
    const words = page.locator('.outcome-text');
    expect(await words.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeGreaterThan(0);
    await expect(words).toHaveText(answer ?? '');
    expect(await editorLines(page)).toBeGreaterThanOrEqual(13);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(700);
    await expect.poll(() => errorLineSeen(page)).toBe(true);
    await page.screenshot({ path: 'e2e/shots/workbench-folded-1024x700.png' });

    // A hint taken unfolds the hints, which stand on it; the answer stays folded.
    await page.locator('#hint').click();
    await expect(hints).not.toHaveClass(/folded/);
    await expect(page.locator('.hint:visible')).toHaveCount(3);
    await expect.poll(() => newestHintSeen(page)).toBe(true);
    await expect(card).toHaveClass(/folded/);

    // A click on the folded answer's words unfolds it, whole inside the window.
    await words.click();
    await expect(card).not.toHaveClass(/folded/);
    expect(inside(await box(page, '.outcome'), { x: 0, y: 0, width: 1024, height: 700 })).toBe(true);

    // A run's answer comes unfolded; the hints stay as they are. A click on the folded
    // hints' line unfolds them.
    await hintsFold.click();
    await cardFold.click();
    await expect(card).toHaveClass(/folded/);
    await page.locator('#run').click();
    await expect(card).not.toHaveClass(/folded/, { timeout: ciTimes(30_000) });
    await expect(card).toBeVisible();
    await expect(hints).toHaveClass(/folded/);
    await page.locator('.hints-folded').click();
    await expect(hints).not.toHaveClass(/folded/);

    // The answer drawn again in another language keeps its fold.
    await cardFold.click();
    await page.locator('#language').selectOption('en');
    await expect(page.locator('#run')).toContainText('Run');
    await expect(card).toHaveClass(/folded/);
    await expect(cardFold).toHaveAttribute('title', 'Unfold the answer');
  });

  test('on the narrow page, both boxes fold and unfold by their buttons', async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto('/#level/the-gate');
    await skipGuide(page);
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#speed').selectOption('4');
    await runAndAnswer(page);
    await expect(page.locator('.outcome')).not.toHaveAttribute('data-kind', 'won');
    await page.locator('#hint').click();
    for (const [fold, folded] of [
      ['#hints-fold', '.hints'],
      ['#outcome-fold', '.outcome'],
    ] as const) {
      await page.locator(fold).click();
      await expect(page.locator(folded)).toHaveClass(/folded/);
      await page.locator(fold).click();
      await expect(page.locator(folded)).not.toHaveClass(/folded/);
    }
  });
});

/** The editor's selection, read from CodeMirror's view (EditorView.findFromDOM's way). */
function selection(page: Page): Promise<[number, number] | null> {
  return page.evaluate(() => {
    const content = document.querySelector('.cm-content') as
      | (Element & { cmTile?: { root?: { view?: { state: { selection: { main: { anchor: number; head: number } } } } } } })
      | null;
    const main = content?.cmTile?.root?.view?.state.selection.main;
    return main ? [main.anchor, main.head] : null;
  });
}

test.describe('the line that runs stays in sight (D366)', () => {
  test('at 1024×700 under three hints, the editor follows the line that runs, the cursor where it was', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await openReady(page, 'the-check');
    await runAndAnswer(page);
    for (let n = 1; n <= 3; n += 1) await page.locator('#hint').click();
    await expect(page.locator('.hint')).toHaveCount(3);
    // The editor at its top, showing fewer than the program's eight lines.
    await page.locator('.cm-scroller').evaluate((node) => {
      node.scrollTop = 0;
    });
    expect(await editorLines(page)).toBeLessThan(8);
    await page.locator('.cm-line').nth(1).click();
    const before = await selection(page);
    expect(before).not.toBeNull();
    await page.locator('#speed').selectOption('2');
    await page.locator('#run').click();
    // A frame in which the eighth line runs, whole in the editor's sight, the editor
    // scrolled down to it.
    await page.waitForFunction(
      () => {
        const running = document.querySelector('.cm-kydux-running-line');
        const scroller = document.querySelector('.cm-scroller') as HTMLElement;
        if (!running?.textContent?.includes('untie')) return false;
        const line = running.getBoundingClientRect();
        const shown = scroller.getBoundingClientRect();
        return line.top >= shown.top - 1 && line.bottom <= shown.bottom + 1 && scroller.scrollTop > 0;
      },
      null,
      { polling: 'raf', timeout: ciTimes(30_000) },
    );
    expect(await selection(page)).toEqual(before);
  });

  test('at 1280×800 with the eight lines in sight, the editor does not move', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openReady(page, 'the-check');
    await page.locator('#speed').selectOption('2');
    await page.locator('#run').click();
    const top = await page.waitForFunction(
      () => {
        const running = document.querySelector('.cm-kydux-running-line');
        return running?.textContent?.includes('untie') ? { top: document.querySelector('.cm-scroller')?.scrollTop } : null;
      },
      null,
      { polling: 'raf', timeout: ciTimes(30_000) },
    );
    expect(await top.jsonValue()).toEqual({ top: 0 });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(30_000) });
    expect(await page.locator('.cm-scroller').evaluate((node) => node.scrollTop)).toBe(0);
  });
});
