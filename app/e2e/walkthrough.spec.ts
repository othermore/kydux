// A chapter played from its first stop to its last, as the child plays it, in Spanish,
// for the owner to read: every story step, every lesson page with its code run, and for
// each level the start card, the start, the route tick by tick in every way and the won
// card, and the map's plan where the map is carried. The pictures go to
// e2e/shots/walkthrough-<chapter>/, which tools/walkthrough.py makes a document of.
// Only `npm run walkthrough -- <chapter>` runs it (KYDUX_WALKTHROUGH).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';

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
  await page.waitForTimeout(400);
}

async function story(page: Page, id: string): Promise<void> {
  await page.goto(`/#story/${id}`);
  await page.locator('#scene').waitFor({ timeout: 90_000 });
  await settled(page, 90_000);
  let step = 1;
  await page.screenshot({ path: `${OUT}story-${id}-${pad(step)}.png` });
  while ((await page.locator('#story-next').count()) > 0) {
    const before = await page.locator('#story-step').textContent();
    await page.locator('#story-next').click();
    await page.waitForFunction(
      (shown) => document.querySelector('#story-step')?.textContent !== shown,
      before,
      { timeout: 30_000 },
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
    await page.locator('.lesson-run[data-state="done"]').waitFor({ timeout: 120_000 });
    const plan = page.locator('#plan');
    if ((await plan.count()) > 0) {
      await plan.locator('#plan-canvas').waitFor();
      await page.waitForFunction(() => document.querySelector<HTMLElement>('#plan')?.dataset.drawn, null, {
        timeout: 30_000,
      });
      await page.screenshot({ path: `${OUT}lesson-${id}-${pad(number)}-plano.png` });
      await page.locator('#plan-close').click();
    }
  }
  await page.screenshot({ path: `${OUT}lesson-${id}-${pad(number)}.png` });
}

async function lesson(page: Page, id: string): Promise<void> {
  await page.goto(`/#lesson/${id}`);
  await page.locator('.lesson-page').waitFor({ timeout: 60_000 });
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

async function route(page: Page, id: string, way: string): Promise<void> {
  const timeline = page.locator('#timeline');
  const last = Number(await timeline.getAttribute('max'));
  for (const tick of ticksToShow(last)) {
    await timeline.fill(String(tick));
    await page
      .waitForFunction((t) => document.querySelector('#scene')?.getAttribute('data-tick') === String(t), tick, {
        timeout: 10_000,
      })
      .catch(() => {});
    await page.waitForTimeout(350);
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
  await page.goto(`/#level/${id}`);
  await page.locator('#start').waitFor({ timeout: 90_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}level-${id}-00-tarjeta.png` });
  await page.locator('#start').click();
  await page.locator('#guide-skip').click({ timeout: 2_000 }).catch(() => {});
  await expect(page.locator('#run')).toBeEnabled({ timeout: 90_000 });
  await page.locator('#speed').selectOption('4');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}level-${id}-01-inicio.png` });
  await typed(page, solution);
  await page.locator('.outcome').waitFor({ timeout: 90_000 });
  await page.waitForTimeout(500);
  for (const way of ways.length > 0 ? ways : ['unica']) {
    if (way !== 'unica') {
      await page.locator('#way').selectOption(way, { force: true });
      await expect(page.locator('.outcome-text')).toContainText('Lo has conseguido', { timeout: 90_000 }).catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${OUT}level-${id}-${way}-ganado.png` });
    await route(page, id, way);
  }
  // The map opens wherever it is carried.
  if ((spec.carrying ?? []).includes('map')) {
    await typed(page, `wizard.cast("orvim")\n${solution}`);
    await page.locator('#plan').waitFor({ timeout: 60_000 });
    await page.waitForFunction(() => document.querySelector<HTMLElement>('#plan')?.dataset.drawn, null, {
      timeout: 30_000,
    });
    await page.screenshot({ path: `${OUT}level-${id}-plano.png` });
    await page.keyboard.press('Escape');
    await page.locator('.outcome').waitFor({ timeout: 90_000 });
  }
}

test('the chapter from its first stop to its last', async ({ page }) => {
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
