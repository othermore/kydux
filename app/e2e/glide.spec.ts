// A flight glides (D259): a figure in the air crosses its cells at one speed, with no
// rest between them, and the camera that follows it adds no shake of its own. Measured
// frame by frame as the page draws: each flying figure's feet in the scene's pixels and
// on the canvas, the camera counted (data-flyers-at), from the click on Run to the end.

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

/** The level opened at speed 1, its start card closed. */
async function open(page: Page, id: string): Promise<void> {
  await page.goto(`/#level/${id}`);
  await page.locator('#start').click();
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await page.locator('#speed').selectOption('1');
}

/** The code typed and run; every frame drawn from the click to the playback's end. */
async function record(page: Page, code: string): Promise<Frame[]> {
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
  return frames;
}

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
 * it back on the screen against the way it flew, and how far its speed in the scene
 * strayed from its middle value, as a share of it (the frames of a turn left out). */
function measure(places: Place[]): {
  frames: number;
  stands: number;
  backs: number;
  stray: number;
  speed: number;
  frame: number;
} {
  const first = places[0];
  const last = places[places.length - 1];
  if (!first || !last) return { frames: 0, stands: 0, backs: 0, stray: 0, speed: 0, frame: 0 };
  const moved = (a: Place, b: Place) => Math.hypot(b.x - a.x, b.y - a.y);
  // From the last frame on its first cell to the first frame on its last cell.
  let from = 0;
  while (from + 1 < places.length && moved(first, places[from + 1] as Place) < 1e-6) from += 1;
  let to = places.length - 1;
  while (to - 1 > from && moved(places[to - 1] as Place, last) < 1e-6) to -= 1;
  const flight = places.slice(from, to + 1);
  let stands = 0;
  let backs = 0;
  const speeds: number[] = [];
  for (let index = 1; index < flight.length; index += 1) {
    const a = flight[index - 1] as Place;
    const b = flight[index] as Place;
    const step = moved(a, b);
    if (step < 1e-6) stands += 1;
    // Back on the screen: against the way it moved in the scene this frame.
    const along = (b.sx - a.sx) * Math.sign(b.x - a.x) + (b.sy - a.sy) * Math.sign(b.y - a.y);
    if (step >= 1e-6 && along < -0.01) backs += 1;
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
  return { frames: flight.length, stands, backs, stray, speed: middle * 1000, frame: gaps[Math.floor(gaps.length / 2)] ?? 0 };
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
});
