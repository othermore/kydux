// Chapter 5 as the child plays it: every level won by its solution, in Spanish for a
// girl and in English for a boy, with the default familiar; a white crow named Nabi
// carried from the second level to the last, its name in the texts, its class in the
// starting code and its sheet on the scene (D265, D266); a kind no first-year has gives a
// spark and Orla's words (D261); a colour not the kind's own and the grey hare come pale,
// a white fox whole (D263); the book tries the line (D267); the slate as given stops with
// the explanation of a missing self (D271); the birth rehearsed, a wrong program left in
// footprints with nothing born, the birth kept, the level a practice after it and a second
// familiar halted (D268); Orla's two orders walked and the class kept (D267); a go_to
// straight to the room bumps (D270); the pieces fetched in every arrangement, and the
// numbers written out losing one (D51); each story told to its end, the first on three
// scenes, the last over the still; the map's stops in order; the debug view's small cells,
// its room, and the solution written with the game's own familiar.
// Screenshots of every stop go to e2e/shots/chapter-5/, which git ignores, for the owner.

import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { gotoTesting, MARTA, type SeededWizard, seedWizard, storyNext } from './helpers';
import { ciTimes } from './support';

const SHOTS = fileURLToPath(new URL('./shots/chapter-5/', import.meta.url));
mkdirSync(SHOTS, { recursive: true });
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const PABLO: SeededWizard = { name: 'Pablo', gender: 'boy', look: 'amber' };

const ITEMS: string[] = JSON.parse(readFileSync(`${CONTENT}chapters/05-the-familiar/chapter.json`, 'utf8')).items;
const LEVELS = ITEMS.filter((item) => item.startsWith('level:')).map((item) => item.slice('level:'.length));
const STORIES = ITEMS.filter((item) => item.startsWith('story:')).map((item) => item.slice('story:'.length));
const solution = (id: string) => readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8');
const wrong = (id: string, name: string) => readFileSync(`${CONTENT}levels/${id}/wrong/${name}.py`, 'utf8');
const waysOf = (id: string): string[] =>
  (JSON.parse(readFileSync(`${CONTENT}levels/${id}/level.json`, 'utf8')).ways ?? []).map((way: { id: string }) => way.id);

/** A solution written with Nabi, a white crow, in place of the default Pimu, a red fox;
 * the room-mate's copy of a white crow is black (D266). */
const asNabi = (code: string) =>
  code
    .replaceAll('Fox("Kesi", "white")', 'Crow("Kesi", "black")')
    .replaceAll('Fox', 'Crow')
    .replaceAll('"Pimu"', '"Nabi"')
    .replaceAll('pimu', 'nabi')
    .replaceAll('"red"', '"white"');

test.use({ viewport: { width: 1280, height: 800 } });

const scene = (page: Page) => page.locator('#scene');

/** A level opened and ready to run, at a speed. */
async function open(page: Page, id: string, speed = '4'): Promise<void> {
  // A level with ways is opened under ?debug, whose select alone shows them (D204).
  if (waysOf(id).length > 0) await gotoTesting(page, `#level/${id}`);
  else await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption(speed);
}

/** The child's code typed and run. */
async function start(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
}

/** The child's code typed and run; the card's words once it ends. */
async function run(page: Page, code: string): Promise<string> {
  await start(page, code);
  await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
  return page.locator('.outcome-text').innerText();
}

/** The familiar the game keeps (D265), as the page saved it. */
async function kept(page: Page): Promise<{ draft?: Record<string, string>; living?: Record<string, string> } | null> {
  return page.evaluate(() => {
    const current = localStorage.getItem('kydux.current');
    const game = current ? localStorage.getItem(`kydux.game.${current}`) : null;
    return game ? ((JSON.parse(game) as { familiar?: object }).familiar ?? null) : null;
  }) as Promise<{ draft?: Record<string, string>; living?: Record<string, string> } | null>;
}

/** The editor's text. */
const editorText = (page: Page) => page.locator('.cm-content').innerText();

/** Waits, frame by frame, until the scene's trials match: one that does not hold is seen
 * for little more than a second at speed 4 (D276). */
async function trialsMatch(page: Page, pattern: RegExp): Promise<void> {
  await page.waitForFunction(
    (source) => new RegExp(source).test(document.querySelector('#scene')?.getAttribute('data-trials') ?? ''),
    pattern.source,
    { polling: 'raf', timeout: ciTimes(90_000) },
  );
}

/** Every value the scene's trials take from now on, with when it took it, in
 * milliseconds of the page's clock (D276). */
async function watchTrials(page: Page): Promise<void> {
  await scene(page).evaluate((node) => {
    const seen: [number, string][] = [[performance.now(), node.getAttribute('data-trials') ?? '']];
    (window as unknown as { trialsSeen: [number, string][] }).trialsSeen = seen;
    new MutationObserver(() => seen.push([performance.now(), node.getAttribute('data-trials') ?? ''])).observe(node, {
      attributes: true,
      attributeFilter: ['data-trials'],
    });
  });
}

const trialsSeen = (page: Page) =>
  page.evaluate(() => (window as unknown as { trialsSeen: [number, string][] }).trialsSeen);

/** How long, in milliseconds, a trial was seen in what watchTrials recorded: from the first
 * value that names it as `look` says (`pale`, `good`) to the first after that does not
 * name it; null where it is still seen. */
function seenFor(seen: [number, string][], id: string, look = ''): number | null {
  const first = seen.findIndex(([, trials]) => trials.split(';').some((one) => one.startsWith(`${id}:${look}`)));
  if (first < 0) return null;
  const gone = seen.slice(first).find(([, trials]) => !trials.split(';').some((one) => one.startsWith(`${id}:`)));
  return gone ? gone[0] - (seen[first] as [number, string])[0] : null;
}

for (const [wizard, locale, won] of [
  [MARTA, 'es-ES', /^¡Lo has conseguido/],
  [PABLO, 'en-US', /^You did it/],
] as const) {
  test.describe(`chapter 5 for ${wizard.name}`, () => {
    test.use({ locale });
    test.beforeEach(({ page }) => seedWizard(page, wizard));

    for (const id of LEVELS) {
      test(`${id} is won by its solution, in every way`, async ({ page }) => {
        await open(page, id);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-start.png` });
        expect(await run(page, solution(id))).toMatch(won);
        await page.screenshot({ path: `${SHOTS}${wizard.name}-${id}-won.png` });
        for (const way of waysOf(id)) {
          await page.locator('#way').selectOption(way, { force: true });
          await expect(page.locator('.outcome-text')).toHaveText(won, { timeout: ciTimes(30_000) });
        }
      });
    }
  });
}

test.describe('the familiar kept from level to level (D265, D266)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('a white crow named Nabi is described, born, taught and sent, its name and class carried on', async ({ page }) => {
    test.setTimeout(ciTimes(600_000));
    const won = /^¡Lo has conseguido/;
    await open(page, 'the-name-and-the-colour');
    expect(await run(page, asNabi(solution('the-name-and-the-colour')))).toMatch(won);
    await expect(scene(page)).toHaveAttribute('data-trials', /:good:Crow:white:familiar-crow-white/);
    expect((await kept(page))?.draft).toEqual({ kind: 'Crow', name: 'Nabi', color: 'white' });

    // The next level starts from the draft: its class and its name.
    await page.goto('/#level/one-line-in-the-book');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    expect(await editorText(page)).toContain('class Crow(Familiar):');
    expect(await editorText(page)).toContain('Haz a Nabi');
    await page.locator('#speed').selectOption('4');
    expect(await run(page, asNabi(solution('one-line-in-the-book')))).toMatch(won);
    await expect(scene(page)).toHaveAttribute('data-book-band', 'line:Crow("Nabi", "white")');

    // The slate copies the crow; the room-mate's is black.
    await page.goto('/#level/the-slate');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    expect(await editorText(page)).toContain('kesi = Crow("Kesi", "black")');
    await page.locator('#speed').selectOption('4');
    expect(await run(page, asNabi(solution('the-slate')))).toMatch(won);

    // Born.
    await open(page, 'out-of-the-circle');
    expect(await run(page, asNabi(solution('out-of-the-circle')))).toMatch(won);
    await expect(scene(page)).toHaveAttribute('data-creatures', /familiar_1:living:Crow:white:familiar-crow-white/);
    expect((await kept(page))?.living).toMatchObject({ kind: 'Crow', name: 'Nabi', color: 'white' });
    await page.screenshot({ path: `${SHOTS}nabi-born.png` });

    // Taught go_to: the class kept with it.
    await page.goto('/#level/orlas-orders');
    await expect(page.locator('#card-intro')).toBeVisible({ timeout: ciTimes(90_000) });
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    expect(await editorText(page)).toContain('class Crow(Familiar):');
    await expect(scene(page)).toHaveAttribute('data-creatures', /familiar:living:Crow:white:familiar-crow-white/);
    await page.locator('#speed').selectOption('4');
    expect(await run(page, asNabi(solution('orlas-orders')))).toMatch(won);
    expect((await kept(page))?.living?.learned).toContain('def go_to(self, x, y):');

    // Sent through the passage, by its name.
    await page.goto('/#level/the-small-passage');
    await expect(page.locator('#card-intro')).toContainText('Manda a Nabi', { timeout: ciTimes(90_000) });
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#speed').selectOption('4');
    expect(await run(page, asNabi(solution('the-small-passage')))).toMatch(won);

    await open(page, 'the-forgotten-room');
    expect(await run(page, asNabi(solution('the-forgotten-room')))).toMatch(won);
    await expect(scene(page)).toHaveAttribute('data-carried', /thread_1/);
    await page.screenshot({ path: `${SHOTS}nabi-the-forgotten-room.png` });
  });
});

test.describe('the trials (D261, D263)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('a dragon is no first-year kind: a spark, and Orla says so', async ({ page }) => {
    await open(page, 'the-circle');
    expect(await run(page, wrong('the-circle', 'a_dragon'))).not.toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-told', /orla:spark/);
  });

  test('a blue fox and the grey hare come pale, a white fox whole', async ({ page }) => {
    await open(page, 'the-name-and-the-colour');
    // A pale trial does not hold, and is seen for its seconds only (D276).
    await start(page, wrong('the-name-and-the-colour', 'a_blue_fox'));
    await trialsMatch(page, /familiar_1:pale:Fox:/);
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(scene(page)).toHaveAttribute('data-told', /orla:pale_colour/);
    await start(page, wrong('the-name-and-the-colour', 'a_grey_hare'));
    await trialsMatch(page, /familiar_1:pale:Hare:/);
    await page.locator('#scene').screenshot({ path: `${SHOTS}trial-pale.png` });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(scene(page)).toHaveAttribute('data-told', /orla:pale_grey/);
    const white = solution('the-name-and-the-colour').replace('"red"', '"white"');
    expect(await run(page, white)).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-trials', /:good:Fox:white:familiar-fox-white/);
    await page.locator('#scene').screenshot({ path: `${SHOTS}trial-white.png` });
  });

  test('a pale trial beside a white one, on the slate', async ({ page }) => {
    await open(page, 'the-slate');
    const both = solution('the-slate').replace('Fox("Pimu", "red")', 'Fox("Pimu", "white")').replace('Fox("Kesi", "white")', 'Fox("Kesi", "blue")');
    await start(page, both);
    await trialsMatch(page, /:good:Fox:white:.*:pale:Fox:/);
    await page.locator('#scene').screenshot({ path: `${SHOTS}trial-pale-beside-white.png` });
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    // The white one holds; the pale one has faded (D276).
    await expect(scene(page)).toHaveAttribute('data-trials', /:good:Fox:white:/);
    await expect(scene(page)).not.toHaveAttribute('data-trials', /:pale:Fox:/, { timeout: ciTimes(10_000) });
  });

  test('the book tries the line that conjures the trial', async ({ page }) => {
    await open(page, 'one-line-in-the-book');
    await run(page, solution('one-line-in-the-book'));
    await expect(scene(page)).toHaveAttribute('data-book-band', 'line:Fox("Pimu", "red")');
    await expect(page.locator('.book-band')).toBeVisible();
  });

  test("the slate as given stops at __init__, with the explanation of a missing self (D271)", async ({ page }) => {
    await page.goto('/#level/the-slate');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#run').click();
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(page.locator('.outcome-text')).toContainText('Cuando nace un objeto');
    await expect(page.locator('.outcome-text')).toContainText('self');
  });
});

test.describe('the trials that hold and those that fade (D276)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("the circle's hare with no colour fades after the card, and the child's fox while Orla speaks", async ({ page }) => {
    test.setTimeout(ciTimes(180_000));
    await page.goto('/#level/the-circle');
    // Behind the card, the friend's trial alone, a drawing with no colour.
    await expect(scene(page)).toHaveAttribute('data-trials', /^friend_familiar:pale:Hare:[^;]*$/, { timeout: ciTimes(90_000) });
    await expect(page.locator('#start')).toBeVisible();
    // While the card is open, its seconds wait.
    await page.waitForTimeout(6_000);
    await expect(scene(page)).toHaveAttribute('data-trials', /friend_familiar:pale:Hare:/);
    await watchTrials(page);
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await expect(scene(page)).not.toHaveAttribute('data-trials', /friend_familiar/, { timeout: ciTimes(12_000) });
    const hare = seenFor(await trialsSeen(page), 'friend_familiar');
    // Some four seconds and its fade, at the normal speed, counted from the card's close.
    expect(hare).not.toBeNull();
    expect(hare as number).toBeGreaterThan(4_000);
    expect(hare as number).toBeLessThan(ciTimes(8_000));

    // The solution at the normal speed: the fox comes, Orla speaks, the fox fades.
    await watchTrials(page);
    expect(await run(page, solution('the-circle'))).toMatch(/^¡Lo has conseguido/);
    const seen = await trialsSeen(page);
    expect(seen.some(([, trials]) => /familiar_1:pale:Fox:/.test(trials))).toBe(true);
    expect(seenFor(seen, 'familiar_1', 'pale')).not.toBeNull();
    // The friend's hare is not back with the run.
    expect(seen.some(([, trials]) => trials.includes('friend_familiar'))).toBe(false);
    await expect(scene(page)).toHaveAttribute('data-told', /orla:won/);

    // A second run: the hare is not back either.
    await watchTrials(page);
    await page.locator('#speed').selectOption('4');
    await run(page, solution('the-circle'));
    expect((await trialsSeen(page)).some(([, trials]) => trials.includes('friend_familiar'))).toBe(false);
  });

  test('the grey hare and a fox with a name and a colour stand; a fox with only a name fades', async ({ page }) => {
    test.setTimeout(ciTimes(180_000));
    await open(page, 'the-name-and-the-colour');
    // The friend's hare is grey and named: it stands.
    await page.waitForTimeout(3_000);
    await expect(scene(page)).toHaveAttribute('data-trials', /friend_familiar:good:Hare:grey:/);
    await expect(scene(page)).not.toHaveAttribute('data-trials-fading', /./);
    expect(await run(page, solution('the-name-and-the-colour'))).toMatch(/^¡Lo has conseguido/);
    // Three seconds at speed 4 are twelve at the normal speed: both stand.
    await page.waitForTimeout(3_000);
    await expect(scene(page)).toHaveAttribute('data-trials', /friend_familiar:good:Hare:grey:.*familiar_1:good:Fox:red:/);
    // Only a name: no colour, and it fades.
    await watchTrials(page);
    await start(page, solution('the-name-and-the-colour').replace('pimu.color = "red"\n', ''));
    await trialsMatch(page, /familiar_1:pale:Fox:/);
    await expect(scene(page)).toHaveAttribute('data-trials-fading', 'familiar_1');
    await expect(page.locator('.outcome')).toBeVisible({ timeout: ciTimes(90_000) });
    await expect(scene(page)).not.toHaveAttribute('data-trials', /familiar_1/, { timeout: ciTimes(10_000) });
    await expect(scene(page)).toHaveAttribute('data-trials', /friend_familiar:good:Hare:grey:/);
    const fox = seenFor(await trialsSeen(page), 'familiar_1', 'pale');
    // Four seconds and one of fading, a quarter of that at speed 4.
    expect(fox).not.toBeNull();
    expect(fox as number).toBeGreaterThan(1_000);
    expect(fox as number).toBeLessThan(ciTimes(3_000));
  });
});

test.describe('the birth (D268)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("the goals box leaves the moon's plate in sight, a thing of the level though painted (D227)", async ({ page }) => {
    await open(page, 'out-of-the-circle');
    // The strip, or the list folded three seconds after it is seen, never a list left open.
    await expect
      .poll(async () => {
        const goals = page.locator('.goals');
        const shape = await goals.getAttribute('data-shape');
        return shape === 'strip' || (await goals.getAttribute('data-folded')) === 'true';
      }, { timeout: ciTimes(15_000) })
      .toBe(true);
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}out-of-the-circle-goals.png` });
  });

  test('a wrong program is held at the edge in footprints; the solution is born, once', async ({ page }) => {
    await open(page, 'out-of-the-circle');
    expect(await run(page, wrong('out-of-the-circle', 'a_cell_short'))).not.toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-footprints', /^[1-9]/);
    await expect(scene(page)).toHaveAttribute('data-told', /orla:not_yet/);
    await page.locator('#scene').screenshot({ path: `${SHOTS}footprints.png` });
    expect((await kept(page))?.living).toBeUndefined();

    expect(await run(page, solution('out-of-the-circle'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-told', /orla:go/);
    await expect(scene(page)).toHaveAttribute('data-book-band', 'written:Fox("Pimu", "red")');
    expect((await kept(page))?.living).toMatchObject({ kind: 'Fox', name: 'Pimu', color: 'red' });

    // Played again, the level is practice, and a second familiar is halted.
    await page.reload();
    await expect(page.locator('#card-practice')).toBeVisible({ timeout: ciTimes(90_000) });
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#speed').selectOption('4');
    await run(page, solution('out-of-the-circle').replaceAll('Pimu', 'Lumo').replaceAll('pimu', 'lumo'));
    await expect(scene(page)).toHaveAttribute('data-told', /orla:halt/);
    expect((await kept(page))?.living).toMatchObject({ name: 'Pimu' });
  });
});

test.describe('the living familiar (D267, D269, D270)', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test("Orla's two orders are walked with the child's go_to", async ({ page }) => {
    await open(page, 'orlas-orders');
    expect(await run(page, solution('orlas-orders'))).toMatch(/^¡Lo has conseguido/);
    await expect(scene(page)).toHaveAttribute('data-told', /orla:order_star.*orla:order_wizard/);
    await expect(scene(page)).toHaveAttribute('data-lit', /sun/);
    // The class kept with go_to, in a game whose familiar lives: Nabi's test above.
  });

  test('a go_to straight to the room walks the corridor and bumps', async ({ page }) => {
    await open(page, 'the-small-passage');
    expect(await run(page, wrong('the-small-passage', 'straight_to_the_room'))).not.toMatch(/^¡Lo has conseguido/);
    expect(await run(page, solution('the-small-passage'))).toMatch(/^¡Lo has conseguido/);
    await page.locator('#scene').screenshot({ path: `${SHOTS}the-small-passage-under-the-covers.png` });
  });

  test('the pieces written out as numbers lose an arrangement (D51)', async ({ page }) => {
    await open(page, 'the-forgotten-room');
    await run(page, wrong('the-forgotten-room', 'the_pieces_as_numbers'));
    await page.locator('#way').selectOption('b', { force: true });
    await expect(page.locator('.outcome-text')).not.toHaveText(/^¡Lo has conseguido/, { timeout: ciTimes(30_000) });
  });
});

test.describe('the stories', () => {
  test.use({ locale: 'es-ES' });

  for (const id of STORIES) {
    test(`${id} is told to its end`, async ({ page }) => {
      await seedWizard(page, MARTA);
      await page.goto(`/#story/${id}`);
      await expect(scene(page)).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
      await page.screenshot({ path: `${SHOTS}story-${id}-1.png` });
      const parts = new Set([await scene(page).getAttribute('data-story-part')]);
      let step = 1;
      while ((await page.locator('#story-next').count()) > 0) {
        await storyNext(page);
        step += 1;
        await expect(scene(page)).toHaveAttribute('data-state', 'done', { timeout: ciTimes(90_000) });
        parts.add(await scene(page).getAttribute('data-story-part'));
        await page.screenshot({ path: `${SHOTS}story-${id}-${step}.png` });
      }
      await expect(page.locator('#story-go-on')).toBeVisible();
      // The tower is told in the dormitory, at the entrance and in the hall.
      if (id === 'the-tower') expect(parts.size).toBe(3);
      // The year ends over the castle's still.
      if (id === 'the-end-of-the-year') await expect(page.locator('.story-frame')).toHaveAttribute('data-still', 'on');
    });
  }
});

test.describe('the debug view of chapter 5', () => {
  test.use({ locale: 'es-ES' });
  test.beforeEach(({ page }) => seedWizard(page, MARTA));

  test('with ?debug, the passage is marked as small and the room is framed', async ({ page }) => {
    await page.goto('/?debug#level/the-forgotten-room');
    await page.locator('#start').click();
    await expect(scene(page)).toHaveAttribute('data-debug', 'true', { timeout: ciTimes(90_000) });
    await page.locator('#debug-cells').click();
    await expect(page.locator('.debug-legend')).toContainText('Pequeño: solo lo pisa un familiar');
    await expect(page.locator('.debug-legend')).toContainText('Zona: en el cuarto');
    await page.screenshot({ path: `${SHOTS}debug-the-tower-passage.png` });
  });

  test("with ?debug, the solution is written with the game's own familiar (D265)", async ({ page }) => {
    await open(page, 'the-name-and-the-colour');
    await run(page, asNabi(solution('the-name-and-the-colour')));
    await page.goto('/?debug#level/the-slate');
    await page.locator('#start').click();
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#debug-solution').click();
    await expect(page.locator('.cm-content')).toContainText('nabi = Crow("Nabi", "white")');
    await expect(page.locator('.cm-content')).toContainText('kesi = Crow("Kesi", "black")');
  });
});

for (const [scenery, level] of [
  ['the-tower-hall', 'the-circle'],
  ['the-tower-passage', 'the-small-passage'],
] as const) {
  test(`${scenery} zoomed out`, async ({ page }) => {
    await seedWizard(page, MARTA);
    await page.goto(`/#level/${level}`);
    await page.locator('#start').click();
    await expect(scene(page)).toHaveAttribute('data-state', /./, { timeout: ciTimes(90_000) });
    while ((await page.locator('#zoom-out').count()) > 0 && (await page.locator('#zoom-out').isEnabled())) {
      await page.locator('#zoom-out').click();
    }
    await page.waitForTimeout(ciTimes(400));
    await page.locator('.scene-frame').screenshot({ path: `${SHOTS}${scenery}-zoomed-out.png` });
  });
}

test('the map shows chapter 5 in its order', async ({ page }) => {
  await seedWizard(page, MARTA);
  await page.goto('/?debug#map');
  const stops = page.locator('.map-chapter').nth(4).locator('.stop');
  await expect(stops).toHaveCount(ITEMS.length);
  for (const [index, item] of ITEMS.entries()) {
    await expect(stops.nth(index)).toHaveAttribute('data-item', item);
  }
  await page.locator('.map-chapter').nth(4).screenshot({ path: `${SHOTS}map.png` });
});
