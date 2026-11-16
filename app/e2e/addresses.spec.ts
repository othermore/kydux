// The addresses the page asks for (D230): every file under /content/ with the world's
// stamp, which the friends' server keeps for good, and Python's own files from the
// folder of Pyodide's version. The page goes through the start, the map, a story, a
// lesson and a level of a painted scene, with the music playing.

import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';
import { ciTimes } from './support';

test.use({ locale: 'en-US' });

const PYODIDE = (JSON.parse(readFileSync('node_modules/pyodide/package.json', 'utf8')) as { version: string }).version;

test("every file of the content is asked for with the world's stamp, and Python's from its version's folder", async ({
  page,
  context,
}) => {
  test.setTimeout(ciTimes(180_000));
  const asked: URL[] = [];
  context.on('request', (request) => asked.push(new URL(request.url())));
  await seedWizard(page, MARTA);
  const { stamp } = (await (await page.request.get('/world-stamp.json')).json()) as { stamp: string };
  expect(stamp).toMatch(/^[0-9a-f]{12}$/);

  await page.goto('/#start');
  await expect(page.locator('#continue')).toBeVisible();
  await page.locator('h1, header').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-music', 'playing', { timeout: ciTimes(10_000) });
  await page.evaluate(() => {
    location.hash = '#map';
  });
  await expect(page.locator('.map-screen')).toBeVisible();
  await page.evaluate(() => {
    location.hash = '#story/the-flying-lesson';
  });
  await expect(page.locator('#story-voice')).toBeVisible();
  await page.evaluate(() => {
    location.hash = '#lesson/lists';
  });
  await expect(page.locator('.lesson-page')).toBeVisible();
  await page.evaluate(() => {
    location.hash = '#level/the-rings';
  });
  await expect(page.locator('.start-card')).toBeVisible({ timeout: ciTimes(30_000) });
  await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
  await expect(page.locator('html')).toHaveAttribute('data-music', 'playing');

  const content = asked.filter((url) => url.pathname.startsWith('/content/'));
  const kinds = new Set(content.map((url) => url.pathname.split('/')[2]));
  for (const kind of ['course.json', 'stories', 'lessons', 'levels', 'art', 'music']) expect(kinds).toContain(kind);
  expect(content.filter((url) => url.searchParams.get('v') !== stamp).map((url) => url.pathname)).toEqual([]);

  const python = asked.filter((url) => url.pathname.startsWith('/pyodide/'));
  expect(python.length).toBeGreaterThan(0);
  expect(python.filter((url) => !url.pathname.startsWith(`/pyodide/${PYODIDE}/`)).map((url) => url.pathname)).toEqual([]);
});
