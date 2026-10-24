// Screenshots of the art demo (tools/art/demo.py), with the app's Playwright:
// each scene at a moment of its story, opened from the disk.
//
//     node tools/art/demo_shots.mjs
//
// Writes art/raw/demo/shots/<name>.png, the canvas alone.

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(repo, 'app', 'package.json'));
const { chromium } = require('@playwright/test');

const demo = join(repo, 'art', 'raw', 'demo');
const shots = join(demo, 'shots');
mkdirSync(shots, { recursive: true });

/** name: the page's query. */
const SHOTS = {
  'gate-pieces-start': 'scene=the-gate&variant=pieces&t=1.5',
  'gate-pieces-ambrel': 'scene=the-gate&variant=pieces&t=3.2',
  'gate-pieces-corridor': 'scene=the-gate&variant=pieces&t=9.2',
  'gate-pieces-seal': 'scene=the-gate&variant=pieces&t=10.3',
  'gate-pieces-pixellab': 'scene=the-gate&variant=pieces&wizard=pixellab&t=3.2',
  'gate-painted-ambrel': 'scene=the-gate&variant=painted&t=3.2',
  'gate-painted-corridor': 'scene=the-gate&variant=painted&t=9.2',
  'gate-painted-grid': 'scene=the-gate&variant=painted&grid=1&t=0.1',
  'gate-pieces-grid': 'scene=the-gate&variant=pieces&grid=1&t=0.1',
  'library-behind-shelf': 'scene=the-library&t=1.4',
  'library-give': 'scene=the-library&t=5.2',
  'night-wait': 'scene=the-night-passages&t=1.5',
  'night-stair': 'scene=the-night-passages&t=6.5',
  'night-lit': 'scene=the-night-passages&t=12',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
for (const [name, query] of Object.entries(SHOTS)) {
  await page.goto(`${pathToFileURL(join(demo, 'index.html')).href}?${query}`);
  await page.waitForSelector('body[data-ready="true"]');
  await page.waitForTimeout(300);
  await page.locator('#view').screenshot({ path: join(shots, `${name}.png`) });
  console.log(name);
}
await browser.close();
