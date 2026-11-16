// A chapter played from its first stop to its last, as the child plays it, in Spanish,
// for the owner to read: every story step, every lesson page with its code run, and for
// each level the start card, the start, the won card, the route tick by tick in its first
// way, every other way at its end, and the map's plan where the map is carried. The
// pictures go to e2e/shots/walkthrough-<chapter>/, which tools/walkthrough.py makes a
// document of.
// Only `npm run walkthrough -- <chapter>` runs it (KYDUX_WALKTHROUGH).

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

const chapter = process.env.KYDUX_WALKTHROUGH ?? '';
const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const OUT = fileURLToPath(new URL(`./shots/walkthrough-${chapter}/`, import.meta.url));
const pad = (n: number) => String(n).padStart(2, '0');

test.use({ viewport: { width: 1280, height: 800 }, locale: 'es-ES', deviceScaleFactor: 1 });
test.setTimeout(30 * 60_000);
test.skip(chapter === '', 'only npm run walkthrough -- <chapter> plays it');

/** A step played out: the scene done, or as it is if the step has no act. */
async function settled(page: Page, ms = 30_000): Promise<void> {
  await page.locator('#scene[data-state="done"]').waitFor({ timeout: ms }).catch(() => {});
  await page.waitForTimeout(ciTimes(400));
}

async function story(page: Page, id: string): Promise<void> {
  await page.goto(`/#story/${id}`);
  await page.locator('#scene').waitFor({ timeout: ciTimes(90_000) });
  await settled(page, 90_000);
  let step = 1;
  await page.screenshot({ path: `${OUT}story-${id}-${pad(step)}.png` });
  while ((await page.locator('#story-next').count()) > 0) {
    const before = await page.locator('#story-step').textContent();
    await page.locator('#story-next').click();
    await page.waitForFunction(
      (shown) => document.querySelector('#story-step')?.textContent !== shown,
      before,
      { timeout: ciTimes(30_000) },
    );
    await settled(page);
    step += 1;
    await page.screenshot({ path: `${OUT}story-${id}-${pad(step)}.png` });
  }
}

/** A lesson's page, its code run; a plan the code opens is shot and closed. */
async function lessonPage(page: Page, id: string, number: number): Promise<void> {
  await page.waitForTimeout(300);
  const run = page.locator('.lesson-run-button');
  if ((await run.count()) > 0) {
    await run.click();
    await page.locator('.lesson-run[data-state="done"]').waitFor({ timeout: ciTimes(120_000) });
    const plan = page.locator('#plan');
    if ((await plan.count()) > 0) {
      await plan.locator('#plan-canvas').waitFor();
      await page.waitForFunction(() => document.querySelector<HTMLElement>('#plan')?.dataset.drawn, null, {
        timeout: ciTimes(30_000),
      });
      await page.screenshot({ path: `${OUT}lesson-${id}-${pad(number)}-plano.png` });
      await page.locator('#plan-close').click();
    }
  }
  await page.screenshot({ path: `${OUT}lesson-${id}-${pad(number)}.png` });
}

async function lesson(page: Page, id: string): Promise<void> {
  await page.goto(`/#lesson/${id}`);
  await page.locator('.lesson-page').waitFor({ timeout: ciTimes(60_000) });
  let number = 1;
  await lessonPage(page, id, number);
  while ((await page.locator('#lesson-next').count()) > 0) {
    await page.locator('#lesson-next').click();
    number += 1;
    await lessonPage(page, id, number);
  }
}

/** The ticks of a route the document shows: all of a short one, ten of a long one. */
function ticksToShow(last: number): number[] {
  if (last <= 10) return Array.from({ length: last + 1 }, (_, tick) => tick);
  const ticks = new Set([0, last]);
  for (let part = 1; part < 10; part += 1) ticks.add(Math.round((part * last) / 10));
  return [...ticks].sort((a, b) => a - b);
}

/** Shows a route's last tick: moving the timeline closes the won card over the scene. */
async function atEnd(page: Page): Promise<void> {
  const timeline = page.locator('#timeline');
  const last = await timeline.getAttribute('max');
  await timeline.fill(String(last));
  await page
    .waitForFunction((t) => document.querySelector('#scene')?.getAttribute('data-tick') === t, last, {
      timeout: ciTimes(10_000),
    })
    .catch(() => {});
  await page.locator('.win-card').waitFor({ state: 'detached', timeout: ciTimes(2_000) }).catch(() => {});
  await page.waitForTimeout(ciTimes(500));
}

async function route(page: Page, id: string, way: string): Promise<void> {
  const timeline = page.locator('#timeline');
  const last = Number(await timeline.getAttribute('max'));
  for (const tick of ticksToShow(last)) {
    await timeline.fill(String(tick));
    await page
      .waitForFunction((t) => document.querySelector('#scene')?.getAttribute('data-tick') === String(t), tick, {
        timeout: ciTimes(10_000),
      })
      .catch(() => {});
    await page.waitForTimeout(350);
    // No picture is taken through a door's fade: the door as it is at the tick.
    await page
      .waitForFunction(
        () => {
          const scene = document.querySelector<HTMLElement>('#scene');
          return !scene?.dataset.fading && !scene?.dataset.opening;
        },
        null,
        { timeout: ciTimes(10_000) },
      )
      .catch(() => {});
    await page.locator('.scene-frame').screenshot({ path: `${OUT}level-${id}-${way}-tick-${pad(tick)}.png` });
  }
}

async function typed(page: Page, code: string): Promise<void> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  await page.locator('#run').click();
}

async function level(page: Page, id: string): Promise<void> {
  const spec = JSON.parse(readFileSync(`${CONTENT}levels/${id}/level.json`, 'utf8'));
  const solution = readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8');
  const ways: string[] = (spec.ways ?? []).map((way: { id: string }) => way.id);
  // The child never sees a level's ways (D204): only ?debug draws their select. A level
  // with ways is opened so, with the tester's panel and buttons kept out of the pictures.
  await page.goto(ways.length > 0 ? `/?debug#level/${id}` : `/#level/${id}`);
  if (ways.length > 0) {
    await page.addStyleTag({ content: '.debug-box, .debug-legend, #debug-solution, .way { display: none !important; }' });
  }
  await page.locator('#start').waitFor({ timeout: ciTimes(90_000) });
  await page.waitForTimeout(ciTimes(400));
  await page.screenshot({ path: `${OUT}level-${id}-00-tarjeta.png` });
  await page.locator('#start').click();
  await page.locator('#guide-skip').click({ timeout: ciTimes(2_000) }).catch(() => {});
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('4');
  await page.waitForTimeout(ciTimes(800));
  await page.screenshot({ path: `${OUT}level-${id}-01-inicio.png` });
  await typed(page, solution);
  await page.locator('.outcome').waitFor({ timeout: ciTimes(90_000) });
  // The win card's stars are drawn in one after another: the picture waits for the last.
  await page.waitForTimeout(ciTimes(1_500));
  for (const [index, way] of (ways.length > 0 ? ways : ['unica']).entries()) {
    // The first way's picture is the won card. Choosing another way plays it from its
    // start and opens the card again at its end, over the scene: its picture is the scene
    // at its last tick, with its goals met and no card over it.
    if (way !== 'unica' && (await page.locator('#way').inputValue()) !== way) {
      await page.locator('#way').selectOption(way, { force: true });
      await page.locator('#scene[data-state="playing"]').waitFor({ timeout: ciTimes(2_000) }).catch(() => {});
      await page.locator('#scene[data-state="done"]').waitFor({ timeout: ciTimes(90_000) });
      await page.locator('.win-card').waitFor({ timeout: ciTimes(8_000) }).catch(() => {});
      await atEnd(page);
    }
    await page.screenshot({ path: `${OUT}level-${id}-${way}-ganado.png` });
    // The route tick by tick of the first way only; every other way shows its end (the
    // owner, 2026-11-08), so that the document stays short.
    if (index === 0) await route(page, id, way);
  }
  // The map opens wherever it is carried.
  if ((spec.carrying ?? []).includes('map')) {
    await typed(page, `wizard.cast("orvim")\n${solution}`);
    await page.locator('#plan').waitFor({ timeout: ciTimes(60_000) });
    await page.waitForFunction(() => document.querySelector<HTMLElement>('#plan')?.dataset.drawn, null, {
      timeout: ciTimes(30_000),
    });
    await page.screenshot({ path: `${OUT}level-${id}-plano.png` });
    await page.keyboard.press('Escape');
    await page.locator('.outcome').waitFor({ timeout: ciTimes(90_000) });
  }
}

test('the chapter from its first stop to its last', async ({ page }) => {
  // A run's pictures only: a picture of an earlier run, of a tick this one does not
  // take, would be put in the document as if it were of this one.
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const about = JSON.parse(readFileSync(`${CONTENT}chapters/${chapter}/chapter.json`, 'utf8'));
  await seedWizard(page, MARTA);
  const stops: string[] = [];
  for (const item of about.items as string[]) {
    const [kind, id = ''] = item.split(':');
    if (kind === 'story') await story(page, id);
    else if (kind === 'lesson') await lesson(page, id);
    else await level(page, id);
    stops.push(item);
    writeFileSync(`${OUT}stops.json`, JSON.stringify(stops));
  }
});
