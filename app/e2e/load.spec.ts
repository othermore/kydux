// The load, measured (sprint 44, 2.9): how many trips each screen costs, their bytes,
// and the time to the screen shown and to Python's files fetched, with an empty cache
// and a full one, on a fast network and a slow one, against a built game served as
// deploy/nginx-kydux.conf serves it (HTTP/2; /assets/, the content asked for with the
// world's stamp and Python's files in their version's folder kept for good; every other
// file asked again on each load with an answer of 304 when it has not changed; gzip).
// Run on demand, from app/, against a folder holding a build (`npm run build` makes
// dist/):
//
//   KYDUX_LOAD=dist npx playwright test e2e/load.spec.ts
//
// It adds each measure, as it is made, to e2e/shots/load/<name>.jsonl, <name> the
// folder's last part, or KYDUX_LOAD_NAME. docs/dev/dev-environment.md says how to run it.

import { createHash, createPublicKey } from 'node:crypto';
import { appendFileSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createSecureServer, type Http2ServerRequest, type Http2ServerResponse } from 'node:http2';
import { homedir } from 'node:os';
import { basename, extname, join, normalize, resolve } from 'node:path';
import { Transform } from 'node:stream';
import { createGzip } from 'node:zlib';
import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { MARTA, seedWizard } from './helpers';

const ROOT = process.env.KYDUX_LOAD ? resolve(process.env.KYDUX_LOAD) : '';
const NAME = process.env.KYDUX_LOAD_NAME ?? basename(ROOT);
const OUT = 'e2e/shots/load/';
const PORT = Number(process.env.KYDUX_LOAD_PORT ?? 4180);
const TLS = join(homedir(), '.config', 'kydux', 'tls');

test.skip(!ROOT, 'run on demand: KYDUX_LOAD=<a folder with a build>');
/** The certificate's key, trusted by the browser: a browser keeps nothing in its cache
 * from a server whose certificate it refuses, so the cache is only measured so. */
const SPKI = existsSync(join(TLS, 'server.crt'))
  ? createHash('sha256')
      .update(createPublicKey(readFileSync(join(TLS, 'server.crt'))).export({ type: 'spki', format: 'der' }))
      .digest('base64')
  : '';
test.use({
  baseURL: `https://localhost:${PORT}/`,
  storageState: undefined,
  launchOptions: { args: [`--ignore-certificate-errors-spki-list=${SPKI}`] },
});

/** What the server answered since the last reset: requests, 304s, bytes sent; and
 * whether it answers as over a slow network. */
const served = { requests: 0, notModified: 0, bytes: 0, slow: false };
/** A slow network, made by the server itself so that the worker's files are slowed as
 * the page's are: 400 ms a trip, and 1 Mbit/s shared by every answer. */
const SLOW_TRIP_MS = 400;
const SLOW_BYTES_A_SECOND = 125_000;
let sendingUntil = 0;
/** When a chunk of `bytes` may be sent on the slow network, its turn on the line. */
function slowTurn(bytes: number): number {
  const now = Date.now();
  sendingUntil = Math.max(sendingUntil, now) + (bytes / SLOW_BYTES_A_SECOND) * 1000;
  return sendingUntil - now;
}
const later = (ms: number) => new Promise((done) => setTimeout(done, ms));

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.zip': 'application/zip',
  '.whl': 'application/zip',
  '.tar': 'application/x-tar',
  '.data': 'application/octet-stream',
};
/** What nginx gzips, from 1024 bytes up. */
const GZIPPED = new Set(['application/javascript', 'text/css', 'application/json', 'application/wasm', 'image/svg+xml']);

/** nginx's answer to one request: the file, its headers, a 304 to a request whose
 * file has not changed, gzip where it gzips. */
/** Whether the server's file keeps the address for good (D230): the build's code, a
 * file of the content asked for with a stamp of twelve hexadecimal digits, and Python's
 * files in the folder of Pyodide's version. */
function kept(url: URL): boolean {
  if (url.pathname.startsWith('/assets/')) return true;
  if (url.pathname.startsWith('/content/')) return /^[0-9a-f]{12}$/.test(url.searchParams.get('v') ?? '');
  return /^\/pyodide\/[0-9][^/]*\//.test(url.pathname);
}

async function answer(request: Http2ServerRequest, response: Http2ServerResponse): Promise<void> {
  if (served.slow) await later(SLOW_TRIP_MS);
  const url = new URL(request.url, 'https://localhost');
  let path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!path.startsWith(ROOT)) path = join(ROOT, 'index.html');
  // As the server's file: a file of the content or of Python's that is not there is a
  // 404, and any other address that is no file is the page.
  const missing = !existsSync(path) || statSync(path).isDirectory();
  if (missing && /^\/(content|pyodide)\//.test(url.pathname)) {
    served.requests += 1;
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end();
    return;
  }
  if (missing) path = join(ROOT, 'index.html');
  const stat = statSync(path);
  const type = TYPES[extname(path)] ?? 'application/octet-stream';
  const tag = `"${stat.mtimeMs.toString(16)}-${stat.size.toString(16)}"`;
  const headers: Record<string, string> = {
    'content-type': type,
    etag: tag,
    'last-modified': stat.mtime.toUTCString(),
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-embedder-policy': 'require-corp',
  };
  if (kept(url)) {
    headers['cache-control'] = 'max-age=315360000';
    headers.expires = 'Thu, 31 Dec 2037 23:55:55 GMT';
  } else {
    headers['cache-control'] = 'no-cache';
    headers.expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
  }
  served.requests += 1;
  if (request.headers['if-none-match'] === tag) {
    served.notModified += 1;
    response.writeHead(304, headers);
    response.end();
    return;
  }
  const gzip = GZIPPED.has(type) && stat.size >= 1024 && /gzip/.test(String(request.headers['accept-encoding'] ?? ''));
  if (gzip) headers['content-encoding'] = 'gzip';
  else headers['content-length'] = String(stat.size);
  response.writeHead(200, headers);
  const counted = new Transform({
    transform(chunk, _encoding, done) {
      served.bytes += chunk.length;
      if (served.slow) setTimeout(() => done(null, chunk), slowTurn(chunk.length));
      else done(null, chunk);
    },
  });
  const stream = createReadStream(path);
  (gzip ? stream.pipe(createGzip()) : stream).pipe(counted).pipe(response);
}

/** The screens measured: the start, and a story, a lesson and a level of each chapter,
 * each with what says it is shown; KYDUX_LOAD_SCREENS names some of them, for a build
 * of a time when the others were not there. */
const ALL_SCREENS: { name: string; hash: string; shown: string; level?: boolean }[] = [
  { name: 'start', hash: '#start', shown: '#continue' },
  { name: 'story 1', hash: '#story/at-the-gate', shown: '#story-next' },
  { name: 'lesson 1', hash: '#lesson/what-a-program-is', shown: '.lesson-page' },
  { name: 'level 1', hash: '#level/the-long-corridor', shown: '.cm-editor', level: true },
  { name: 'story 2', hash: '#story/the-entrance', shown: '#story-next' },
  { name: 'lesson 2', hash: '#lesson/the-right-place', shown: '.lesson-page' },
  { name: 'level 2', hash: '#level/the-moving-key', shown: '.cm-editor', level: true },
  { name: 'story 3', hash: '#story/beyond-the-doors', shown: '#story-next' },
  { name: 'lesson 3', hash: '#lesson/the-cells', shown: '.lesson-page' },
  { name: 'level 3', hash: '#level/the-wrong-door', shown: '.cm-editor', level: true },
  { name: 'story 4', hash: '#story/the-flying-lesson', shown: '#story-next' },
  { name: 'lesson 4', hash: '#lesson/the-broom', shown: '.lesson-page' },
  { name: 'level 4', hash: '#level/the-race', shown: '.cm-editor', level: true },
];
const WANTED = process.env.KYDUX_LOAD_SCREENS?.split(',').map((name) => name.trim());
const SCREENS = WANTED ? ALL_SCREENS.filter((screen) => WANTED.includes(screen.name)) : ALL_SCREENS;


interface Measured {
  screen: string;
  cache: 'empty' | 'full';
  network: 'fast' | 'slow';
  /** Every file the page used, and those it took from its cache without asking. */
  files: number;
  fromCache: number;
  /** The trips to the server: the requests it answered, those with a 304, and the
   * bytes it sent. */
  requests: number;
  revalidated: number;
  bytes: number;
  shownMs: number;
  pythonFilesMs: number | null;
  pythonReadyMs: number | null;
  /** The longest chain of requests, each started after the one before it ended. */
  chain: number;
  /** For the music's measure: the page's processor time, all its threads and its main
   * one, in milliseconds. */
  processMs?: number;
  mainMs?: number;
}

/** One load of a screen: its requests and its times. */
async function measure(page: Page, screen: (typeof SCREENS)[number], cache: Measured['cache'], network: Measured['network']): Promise<Measured> {
  const files: { url: string; start: number; end: number }[] = [];
  const started = new Map<string, number>();
  const origin = Date.now();
  page.on('request', (request) => started.set(request.url() + request.method(), Date.now() - origin));
  page.on('requestfinished', (request) => {
    files.push({ url: request.url(), start: started.get(request.url() + request.method()) ?? 0, end: Date.now() - origin });
  });
  served.requests = 0;
  served.notModified = 0;
  served.bytes = 0;
  served.slow = network === 'slow';
  await page.goto(`/${screen.hash}`);
  await expect(page.locator(screen.shown).first()).toBeVisible({ timeout: 300_000 });
  const shownMs = Date.now() - origin;
  let pythonReadyMs: number | null = null;
  if (screen.level) {
    await expect(page.locator('#status')).toHaveAttribute('data-status', 'ready', { timeout: 600_000 });
    pythonReadyMs = Date.now() - origin;
  }
  // Python's files go on loading in their worker behind the screen: waited for too.
  const quiet = Date.now();
  let count = -1;
  while (count !== files.length || Date.now() - quiet < 2000) {
    count = files.length;
    await page.waitForTimeout(network === 'slow' ? 3000 : 1000);
    if (Date.now() - origin > 900_000) break;
  }
  served.slow = false;
  const python = files.filter((one) => one.url.includes('/pyodide/') || one.url.endsWith('world.zip'));
  // The longest run of files each asked for once the one before it had come.
  const sorted = [...files].sort((a, b) => a.start - b.start);
  const depth: number[] = [];
  sorted.forEach((one, index) => {
    const before = sorted.slice(0, index).map((other, at) => (other.end <= one.start ? (depth[at] ?? 0) : 0));
    depth[index] = 1 + Math.max(0, ...before);
  });
  return {
    screen: screen.name,
    cache,
    network,
    files: files.length,
    fromCache: Math.max(0, files.length - served.requests),
    requests: served.requests,
    revalidated: served.notModified,
    bytes: served.bytes,
    shownMs,
    pythonFilesMs: python.length ? Math.max(...python.map((one) => one.end)) : null,
    pythonReadyMs,
    chain: Math.max(0, ...depth),
  };
}

let server: ReturnType<typeof createSecureServer> | null = null;
/** A measure kept at once, so that a test that fails loses none of the others. */
function keep(measured: Measured): void {
  mkdirSync(OUT, { recursive: true });
  appendFileSync(`${OUT}${NAME}.jsonl`, `${JSON.stringify(measured)}\n`);
}

test.beforeAll(async () => {
  server = createSecureServer(
    { key: readFileSync(join(TLS, 'server.key')), cert: readFileSync(join(TLS, 'server.crt')), allowHTTP1: true },
    (request, response) => void answer(request, response),
  );
  await new Promise<void>((done) => server?.listen(PORT, done));
});

test.afterAll(async () => {
  await new Promise<void>((done) => server?.close(() => done()));
});

async function freshContext(browser: import('@playwright/test').Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: `https://localhost:${PORT}/`, ignoreHTTPSErrors: true, locale: 'es-ES' });
  return context;
}

for (const network of ['fast', 'slow'] as const) {
  for (const screen of SCREENS) {
    // The slow network with an empty cache is long: the start and the levels only.
    const empties = network === 'fast' || screen.name === 'start' || screen.level === true;
    test(`${screen.name}, ${network}`, async ({ browser }) => {
      test.setTimeout(1_500_000);
      if (empties) {
        const context = await freshContext(browser);
        const page = await context.newPage();
        await seedWizard(page, MARTA);
        keep(await measure(page, screen, 'empty', network));
        await context.close();
      }
      // A full cache: the same screen loaded once, then again.
      const context = await freshContext(browser);
      const first = await context.newPage();
      await seedWizard(first, MARTA);
      await first.goto(`/${screen.hash}`);
      await expect(first.locator(screen.shown).first()).toBeVisible({ timeout: 600_000 });
      await first.waitForLoadState('networkidle', { timeout: 600_000 }).catch(() => {});
      // Python's files, fetched by its worker behind the screen, kept in the cache too.
      await first.waitForTimeout(5000);
      await first.close();
      const page = await context.newPage();
      keep(await measure(page, screen, 'full', network));
      await context.close();
    });
  }
}

test("the processor's time on the map, ten seconds with its theme playing and ten with none", async ({ browser }) => {
  test.setTimeout(300_000);
  const context = await freshContext(browser);
  const page = await context.newPage();
  await seedWizard(page, MARTA);
  const session = await context.newCDPSession(page);
  await session.send('Performance.enable');
  const busy = async () => {
    const { metrics } = await session.send('Performance.getMetrics');
    const of = (name: string) => metrics.find((metric) => metric.name === name)?.value ?? 0;
    return { process: of('ProcessTime'), main: of('TaskDuration') };
  };
  const tenSeconds = async (what: string, settle = 2000) => {
    await page.goto('/#map');
    await expect(page.locator('.map-screen')).toBeVisible({ timeout: 120_000 });
    // A key pressed: a browser plays sound only after one.
    await page.keyboard.press('Shift');
    await page.waitForTimeout(settle);
    const music = (await page.locator('html').getAttribute('data-music')) ?? 'none';
    const before = await busy();
    await page.waitForTimeout(10_000);
    const after = await busy();
    keep({
      screen: `map, 10 s, ${what}, music ${music}`,
      cache: 'full',
      network: 'fast',
      files: 0,
      fromCache: 0,
      requests: 0,
      revalidated: 0,
      bytes: 0,
      shownMs: 0,
      pythonFilesMs: null,
      pythonReadyMs: null,
      chain: 0,
      processMs: Math.round((after.process - before.process) * 1000),
      mainMs: Math.round((after.main - before.main) * 1000),
    });
  };
  await tenSeconds('as it is');
  // The music turned off in the settings, where there are some.
  await page.goto('/#settings');
  const slider = page.locator('#settings-music');
  if ((await slider.count()) > 0) {
    await slider.fill('0');
    // The music fades out, and only then is its way to the speakers taken off.
    await tenSeconds('turned off', 10_000);
  }
  await context.close();
});
