// A flight glides (D259): a figure in the air crosses its cells at one speed, with no
// rest between them, at every speed of the playback, and the camera that follows it adds
// no shake of its own. Measured frame by frame as the page draws: each flying figure's
// feet in the scene's pixels and on the canvas, the camera counted (data-flyers-at), from
// the click on Run to the end.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

const CONTENT = fileURLToPath(new URL('../../content/', import.meta.url));
const solution = (id: string) => readFileSync(`${CONTENT}levels/${id}/solution.py`, 'utf8');

/** A frame drawn: its time, and the flying figures' places then, as the scene says them. */
interface Frame {
  t: number;
  at: string | null;
}

/** A figure's place at a frame: its feet in the scene, and on the canvas. */
interface Place {
  t: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
}

/** A cell's side in the scene's pixels. */
const CELL = 48;

/** The level opened at a speed, 1 unless given, its start card closed. */
async function open(page: Page, id: string, speed = '1'): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption(speed);
}

/** The code typed and run; every frame drawn from the click to the playback's end, to be
 * awaited once the test has done what it does while the program plays. */
async function recording(page: Page, code: string): Promise<{ frames: Promise<Frame[]> }> {
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(code);
  const frames = page.evaluate(
    () =>
      new Promise<Frame[]>((resolve) => {
        const scene = document.querySelector<HTMLElement>('#scene');
        const seen: Frame[] = [];
        const began = performance.now();
        let played = false;
        let after = 0;
        const loop = (t: number) => {
          const state = scene?.dataset.state ?? '';
          seen.push({ t, at: scene?.dataset.flyersAt ?? null });
          if (state === 'playing') played = true;
          if (played && state === 'done') after += 1;
          if (after > 30 || t - began > 120_000) resolve(seen);
          else requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      }),
  );
  await page.locator('#run').click();
  return { frames };
}

/** The code typed and run; every frame drawn from the click to the playback's end. */
const record = async (page: Page, code: string): Promise<Frame[]> => (await recording(page, code)).frames;

/** A figure's places, frame by frame, while it is in the air. */
function placesOf(frames: Frame[], id: string): Place[] {
  const places: Place[] = [];
  for (const { t, at } of frames) {
    const entry = at?.split(';').find((one) => one.startsWith(`${id}:`));
    if (!entry) continue;
    const [x, y, sx, sy] = entry.slice(id.length + 1).split(',').map(Number) as [number, number, number, number];
    places.push({ t, x, y, sx, sy });
  }
  return places;
}

/** What the frames say of a figure's flight from its first cell left to its last reached:
 * how many frames it took, how many left it where the frame before had it, how many took
 * it back on the screen against the way it flew, how many took it back in the scene
 * against the frame before's step (`returns`: none in a flight with no turn about), and
 * how far its speed in the scene strayed from its middle value, as a share of it (the
 * frames of a turn left out). */
function measure(places: Place[]): {
  frames: number;
  stands: number;
  backs: number;
  returns: number;
  stray: number;
  speed: number;
  frame: number;
} {
  const first = places[0];
  const last = places[places.length - 1];
  if (!first || !last) return { frames: 0, stands: 0, backs: 0, returns: 0, stray: 0, speed: 0, frame: 0 };
  const moved = (a: Place, b: Place) => Math.hypot(b.x - a.x, b.y - a.y);
  // From the last frame on its first cell to the first frame on its last cell.
  let from = 0;
  while (from + 1 < places.length && moved(first, places[from + 1] as Place) < 1e-6) from += 1;
  let to = places.length - 1;
  while (to - 1 > from && moved(places[to - 1] as Place, last) < 1e-6) to -= 1;
  const flight = places.slice(from, to + 1);
  let stands = 0;
  let backs = 0;
  let returns = 0;
  const speeds: number[] = [];
  for (let index = 1; index < flight.length; index += 1) {
    const a = flight[index - 1] as Place;
    const b = flight[index] as Place;
    const step = moved(a, b);
    if (step < 1e-6) stands += 1;
    // Back on the screen: against the way it moved in the scene this frame.
    const along = (b.sx - a.sx) * Math.sign(b.x - a.x) + (b.sy - a.sy) * Math.sign(b.y - a.y);
    if (step >= 1e-6 && along < -0.01) backs += 1;
    // Back in the scene: against the step of the frame before.
    const before = flight[index - 2];
    if (before && (b.x - a.x) * (a.x - before.x) + (b.y - a.y) * (a.y - before.y) < -1e-6) returns += 1;
    // A frame that turns a corner is shorter in a straight line; it is left out.
    const turned = Math.sign(b.x - a.x) !== 0 && Math.sign(b.y - a.y) !== 0;
    if (!turned && b.t > a.t) speeds.push(step / (b.t - a.t));
  }
  const gaps = flight.slice(1).map((place, index) => place.t - (flight[index] as Place).t).sort((a, b) => a - b);
  const sorted = [...speeds].sort((a, b) => a - b);
  const middle = sorted[Math.floor(sorted.length / 2)] ?? 0;
  // Inner speeds only: the first and the last frame of the flight are parts of a frame.
  const inner = speeds.slice(1, -1);
  const stray = middle > 0 && inner.length > 0 ? Math.max(...inner.map((v) => Math.abs(v - middle) / middle)) : 0;
  // The speed in the scene's pixels a second, and the frames' middle gap in milliseconds.
  return { frames: flight.length, stands, backs, returns, stray, speed: middle * 1000, frame: gaps[Math.floor(gaps.length / 2)] ?? 0 };
}

test.describe('a flight glides at one speed (D259)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const [id, title] of [
    ['the-first-flight', 'the first flight crosses the water'],
    ['the-rings', 'the rings are flown round the trees and over the pond'],
  ] as const) {
    test(`${title} with no frame standing and none going back on the screen`, async ({ page }) => {
      test.setTimeout(ciTimes(240_000));
      await open(page, id);
      const flight = measure(placesOf(await record(page, solution(id)), 'wizard'));
      console.log(`${id}: ${JSON.stringify(flight)}`);
      expect(flight.frames).toBeGreaterThan(10);
      expect(flight.stands).toBe(0);
      expect(flight.backs).toBe(0);
      expect(flight.returns).toBe(0);
    });
  }

  // At four times the speed a flown tick lasts 33 ms and its timer is often later than
  // that: the ticks follow sooner, and the broom is not put back to fly a cell again.
  for (const id of ['the-rings', 'the-race'] as const) {
    test(`at four times the speed, ${id}: the broom flies its way once, no frame standing and none going back`, async ({
      page,
    }) => {
      test.setTimeout(ciTimes(240_000));
      await open(page, id, '4');
      const flight = measure(placesOf(await record(page, solution(id)), 'wizard'));
      console.log(`${id}, speed 4: ${JSON.stringify(flight)}`);
      expect(flight.frames).toBeGreaterThan(10);
      expect(flight.stands).toBe(0);
      expect(flight.returns).toBe(0);
    });
  }

  test('in the race both brooms glide, with no frame standing, and the wizard none going back on the screen', async ({
    page,
  }) => {
    test.setTimeout(ciTimes(240_000));
    await open(page, 'the-race');
    const frames = await record(page, solution('the-race'));
    const flights = ['wizard', 'zarek'].map((id) => [id, measure(placesOf(frames, id))] as const);
    for (const [id, flight] of flights) console.log(`the-race, ${id}: ${JSON.stringify(flight)}`);
    for (const [id, flight] of flights) {
      expect(flight.frames).toBeGreaterThan(10);
      expect(flight.stands).toBe(0);
      // The camera follows the wizard: Zarek's place on the screen is the camera's too,
      // which catches up with the wizard as he lands.
      if (id === 'wizard') expect(flight.backs).toBe(0);
    }
  });

  test('the page held up for a second in a flight: the broom goes on from where it was, never at the end of its way', async ({
    page,
  }) => {
    test.setTimeout(ciTimes(240_000));
    await open(page, 'the-rings');
    const { frames } = await recording(page, solution('the-rings'));
    await page.waitForTimeout(2000);
    // Timers and frames are late together: the ticks' clock starts again after it.
    await page.evaluate(() => {
      const until = performance.now() + 1000;
      while (performance.now() < until);
    });
    const places = placesOf(await frames, 'wizard');
    const steps = places.slice(1).map((place, index) => {
      const before = places[index] as Place;
      return { ms: place.t - before.t, px: Math.hypot(place.x - before.x, place.y - before.y) };
    });
    const held = Math.max(...steps.map((step) => step.ms));
    const longest = Math.max(...steps.map((step) => step.px));
    console.log(`the-rings, held for ${held.toFixed(0)} ms: longest step in a frame ${longest.toFixed(1)} px`);
    expect(held).toBeGreaterThan(900);
    // A second at its speed is seven cells and a half; two cells are 96 pixels.
    expect(longest).toBeLessThanOrEqual(2 * CELL + 1);
    expect(measure(places).returns).toBe(0);
  });

  test('the camera brought back in a flight goes with the broom from there, with no frame going back on the screen', async ({
    page,
  }) => {
    test.setTimeout(ciTimes(240_000));
    await open(page, 'the-rings');
    const { frames } = await recording(page, solution('the-rings'));
    await page.waitForTimeout(1500);
    // The scene dragged aside, then Find my wizard while the broom flies on.
    const box = await page.locator('#scene canvas').boundingBox();
    if (!box) throw new Error('the scene has no canvas');
    await page.mouse.move(box.x + 300, box.y + 300);
    await page.mouse.down();
    await page.mouse.move(box.x + 360, box.y + 330, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator('#scene')).toHaveAttribute('data-following', 'false');
    await page.locator('#find-wizard').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-following', 'true');
    const back = await page.evaluate(() => performance.now());
    // The frames from the camera's return to the end, measured as a flight of its own.
    const flight = measure(placesOf(await frames, 'wizard').filter((place) => place.t > back + 50));
    console.log(`the-rings, camera back: ${JSON.stringify(flight)}`);
    expect(flight.frames).toBeGreaterThan(10);
    expect(flight.backs).toBe(0);
  });
});
