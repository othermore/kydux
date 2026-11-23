import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { TIPS_OFF } from './helpers';
import { ciTimes } from './support';

// The published game (D328, D329): the build served as plain files, with no header of
// the game's own, under the published host's name. The browser is told that the name
// is this machine and that its plain HTTP is a secure context, as the real host's HTTPS
// is. Nothing reaches Google or GoatCounter: every request to them is answered here and
// kept, and the test reads what the game sent.

const HOST = 'kydux.kidux.org';
const PORT = 4175;
const ORIGIN = `http://${HOST}:${PORT}`;
const DIST = fileURLToPath(new URL('../dist', import.meta.url));

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.zip': 'application/zip',
};

function words(lang: 'en' | 'es'): Record<string, Record<string, string>> {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../../i18n/${lang}.json`, import.meta.url)), 'utf8'));
}

const EN = words('en');
const ES = words('es');

/** A server of plain files, as a host of static pages is: a type, a 404, no more. */
function plainServer(): Server {
  return createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url ?? '/', ORIGIN).pathname);
    const file = join(DIST, normalize(path === '/' ? '/index.html' : path));
    if (!file.startsWith(DIST) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'max-age=600',
    });
    createReadStream(file).pipe(response);
  });
}

/** What the game sent outside, by where it went. */
interface Sent {
  tag: string[];
  google: string[];
  goat: URL[];
}

/** Answers every request to the counting services here, and keeps it. */
async function catchCounting(context: BrowserContext): Promise<Sent> {
  const sent: Sent = { tag: [], google: [], goat: [] };
  await context.route(/^https:\/\/[^/]*googletagmanager\.com\//, (route) => {
    sent.tag.push(route.request().url());
    return route.fulfill({ contentType: 'text/javascript', body: '/* Google\'s tag, not loaded in this test. */' });
  });
  await context.route(/^https:\/\/[^/]*(google-analytics\.com|analytics\.google\.com)\//, (route) => {
    sent.google.push(route.request().url());
    return route.fulfill({ status: 204, body: '' });
  });
  await context.route(/^https:\/\/kidux\.goatcounter\.com\//, (route) => {
    sent.goat.push(new URL(route.request().url()));
    return route.fulfill({
      contentType: 'image/gif',
      body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
    });
  });
  return sent;
}

/** The entries of Google's queue, as arrays. */
function queued(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>)));
}

/** The events of a name in Google's queue, with what each tells. */
async function events(page: Page, name: string): Promise<Record<string, unknown>[]> {
  return (await queued(page))
    .filter((entry) => entry[0] === 'event' && entry[1] === name)
    .map((entry) => entry[2] as Record<string, unknown>);
}

const goatPaths = (sent: Sent, event = false) =>
  sent.goat.filter((url) => (url.searchParams.get('e') === 'true') === event).map((url) => url.searchParams.get('p'));

/** The cookies accepted before the page loads, as a visitor who said yes has them. */
async function acceptedBefore(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => localStorage.setItem('kydux.cookies', 'yes'));
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// The browser's own start: the published name is this machine, and its plain HTTP a
// secure context. Chromium itself is started, headless: its headless shell, which the
// other specs run in, does not take the second switch. Another host's pages are opened
// as they always are.
test.use({
  channel: 'chromium',
  launchOptions: {
    args: [`--host-resolver-rules=MAP ${HOST} 127.0.0.1`, `--unsafely-treat-insecure-origin-as-secure=${ORIGIN}`],
  },
});

test.describe('on the published host, served as plain files', () => {
  test.use({
    locale: 'en-US',
    baseURL: `${ORIGIN}/`,
    storageState: { cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: TIPS_OFF, value: '1' }] }] },
  });

  let server: Server;
  test.beforeAll(async () => {
    server = plainServer();
    await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  });
  test.afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('the page isolates itself, and the notice comes before the game', async ({ page, context }) => {
    const sent = await catchCounting(context);
    await page.goto('/');
    await expect(page.locator('#cookie-notice')).toBeVisible();
    // The service worker gave the page the headers the host does not send (D329).
    expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(true);
    await expect(page).toHaveTitle(EN.cookies?.page_title ?? '');
    await expect(page.locator('#cookies-title')).toHaveText(EN.cookies?.title ?? '');
    // Nothing of the game is on the page, and Google has not been asked for anything.
    await expect(page.locator('#app > *')).toHaveCount(1);
    await expect(page.locator('.about-screen')).toHaveCount(0);
    expect(sent.tag).toEqual([]);
    expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
    await expect.poll(() => goatPaths(sent)).toEqual(['/kydux/cookies']);

    // The notice is read in the other language too.
    await page.locator('.cookie-languages [data-language="es"]').click();
    await expect(page.locator('#cookies-title')).toHaveText(ES.cookies?.title ?? '');
    await page.locator('.cookie-languages [data-language="en"]').click();

    // The notice is one line and two buttons.
    await expect(page.locator('.cookie-words p:not(.cookie-buttons)')).toHaveCount(0);
    await expect(page.locator('#cookies-accept')).toHaveText(EN.cookies?.accept ?? '');
    await expect(page.locator('#cookies-refuse')).toHaveText(EN.cookies?.refuse ?? '');

    // Refuse brings the whole of why, and asks whether the reader is sure.
    await page.locator('#cookies-refuse').click();
    await expect(page.locator('#cookies-title')).toHaveText(EN.cookies?.why_title ?? '');
    await expect(page.locator('.cookie-words')).toContainText(EN.cookies?.text ?? '');
    await expect(page.locator('.cookie-words')).toContainText(EN.cookies?.detail ?? '');
    await expect(page.locator('#cookies-sure')).toHaveText(EN.cookies?.sure ?? '');
    await expect(page.locator('#cookies-accept')).toHaveText(EN.cookies?.accept_them ?? '');
    await expect(page.locator('#cookies-accept')).toBeFocused();
    await expect(page.locator('#cookies-refuse')).toHaveText(EN.cookies?.refuse_sure ?? '');
    await expect.poll(() => goatPaths(sent, true)).toEqual(['/kydux/cookies/why']);

    // The second press is the no: the game opens, and Google is never asked.
    await page.locator('#cookies-refuse').click();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
    await expect(page.locator('.about-screen')).toBeVisible();
    await expect.poll(() => goatPaths(sent, true)).toEqual(['/kydux/cookies/why', '/kydux/cookies/refused']);
    await expect.poll(() => goatPaths(sent)).toEqual(['/kydux/cookies', '/kydux/about']);
    expect(await page.evaluate(() => localStorage.getItem('kydux.cookies'))).toMatch(/^no@\d+$/);

    // The no is kept for now: the game opens at once the next time, and counts without
    // cookies.
    await page.reload();
    await expect(page.locator('.about-screen')).toBeVisible();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
    await page.locator('#settings-link').click();
    await expect(page.locator('.settings-screen')).toBeVisible();
    await expect.poll(() => goatPaths(sent).at(-1)).toBe('/kydux/settings');
    expect(sent.tag).toEqual([]);
    expect(sent.google).toEqual([]);
    expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
    expect(await context.cookies()).toEqual([]);

    // The settings say so, and hold the button that accepts them.
    await expect(page.locator('#settings-cookies p')).toHaveText(EN.cookies?.settings_refused ?? '');
    await expect(page.locator('#cookies-withdraw')).toHaveCount(0);
    await page.locator('#settings-cookies #cookies-accept').click();
    await expect(page.locator('#cookies-withdraw')).toBeVisible();
    await expect.poll(() => sent.tag).toHaveLength(1);
    expect(await page.evaluate(() => localStorage.getItem('kydux.cookies'))).toBe('yes');
  });

  test('once accepted, the game opens and counts each screen as a page', async ({ page, context }) => {
    const sent = await catchCounting(context);
    await page.goto('/');
    await page.locator('#cookies-accept').click();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
    // A child who has never played is shown the welcome page.
    await expect(page.locator('.about-screen')).toBeVisible();
    await expect.poll(() => sent.tag).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-LHD6DKXB9P']);
    const queue = await queued(page);
    expect(queue[0]).toEqual([
      'consent',
      'default',
      { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' },
    ]);
    expect(queue).toContainEqual(['config', 'G-LHD6DKXB9P', { send_page_view: false }]);
    expect(queue).toContainEqual(['set', { page_location: `https://${HOST}/about`, page_title: 'about' }]);
    expect(await events(page, 'page_view')).toEqual([
      { page_location: `https://${HOST}/about`, page_title: 'about', game_language: 'en' },
    ]);
    await expect.poll(() => goatPaths(sent)).toEqual(['/kydux/cookies', '/kydux/about']);

    await page.locator('#settings-link').click();
    await expect(page.locator('.settings-screen')).toBeVisible();
    expect((await events(page, 'page_view')).map((view) => view.page_location)).toEqual([
      `https://${HOST}/about`,
      `https://${HOST}/settings`,
    ]);
    await expect.poll(() => goatPaths(sent).at(-1)).toBe('/kydux/settings');

    // The yes is kept: the game opens at once the next time.
    await page.reload();
    await expect(page.locator('.settings-screen')).toBeVisible();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
  });

  test('a level runs Python there, and a win is told with its seconds, runs and stars', async ({ page, context }) => {
    const sent = await catchCounting(context);
    await acceptedBefore(context);
    await page.goto('/#level/the-long-corridor');
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    expect(await page.evaluate(() => globalThis.crossOriginIsolated)).toBe(true);
    await expect(page.locator('#status')).toHaveText(/^Python 3\.14\.\d+ ready$/);
    await page.locator('#speed').selectOption('4');
    await page.locator('.cm-content').click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.insertText('wizard.move_right(8)');
    await page.locator('#run').click();
    await expect(page.locator('.win-card')).toBeVisible({ timeout: ciTimes(30_000) });

    expect((await events(page, 'page_view')).map((view) => view.page_location)).toEqual([
      `https://${HOST}/level/the-long-corridor`,
    ]);
    const [won, ...more] = await events(page, 'level_won');
    expect(more).toEqual([]);
    expect(won).toMatchObject({ level: 'the-long-corridor', runs: 1, hints: 0, game_language: 'en' });
    expect(won?.stars).toBeGreaterThanOrEqual(1);
    expect(typeof won?.seconds).toBe('number');
    await expect.poll(() => goatPaths(sent, true)).toEqual(['/kydux/won/the-long-corridor']);
    expect(goatPaths(sent)).toEqual(['/kydux/level/the-long-corridor']);

    // Leaving the level won tells nothing more of it.
    await page.locator('#home').click();
    await expect(page.locator('.start-screen')).toBeVisible();
    expect(await events(page, 'level_left')).toEqual([]);
  });

  test('a level left without a win is told as left', async ({ page, context }) => {
    await catchCounting(context);
    await acceptedBefore(context);
    await page.goto('/#level/the-long-corridor');
    await expect(page.locator('#run')).toBeEnabled({ timeout: ciTimes(90_000) });
    await page.locator('#home').click();
    await expect(page.locator('.start-screen')).toBeVisible();
    const left = await events(page, 'level_left');
    expect(left).toHaveLength(1);
    expect(left[0]).toMatchObject({ level: 'the-long-corridor', runs: 0, game_language: 'en' });
  });

  test('a no is asked again after a day and a half, and a yes never', async ({ page }) => {
    const HOUR = 3600 * 1000;
    const kept = (answer: string) => page.evaluate((value) => localStorage.setItem('kydux.cookies', value), answer);
    await page.goto('/');
    await expect(page.locator('#cookie-notice')).toBeVisible();
    await kept(`no@${Date.now() - 35 * HOUR}`);
    await page.reload();
    await expect(page.locator('.about-screen')).toBeVisible();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
    await kept(`no@${Date.now() - 37 * HOUR}`);
    await page.reload();
    await expect(page.locator('#cookie-notice')).toBeVisible();
    await expect(page.locator('.about-screen')).toHaveCount(0);
    // A yes given long ago still holds: nothing about it says when.
    await kept('yes');
    await page.reload();
    await expect(page.locator('.about-screen')).toBeVisible();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
  });

  test('the settings take the yes back, and the counting cookies with it', async ({ page, context }) => {
    const sent = await catchCounting(context);
    await context.addCookies([{ name: '_ga', value: 'GA1.1.1.1', domain: '.kidux.org', path: '/' }]);
    await page.goto('/#settings');
    await page.locator('#cookies-accept').click();
    await expect(page.locator('#settings-cookies h3')).toHaveText(EN.cookies?.settings_title ?? '');
    await expect(page.locator('#settings-cookies p')).toHaveText(EN.cookies?.settings_accepted ?? '');
    expect(await page.evaluate(() => localStorage.getItem('kydux.cookies'))).toBe('yes');
    await expect.poll(() => sent.tag).toHaveLength(1);
    await page.locator('#cookies-withdraw').click();
    // The page starts again, on the settings and without Google.
    await expect(page.locator('#settings-cookies p')).toHaveText(EN.cookies?.settings_refused ?? '');
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('kydux.cookies'))).toMatch(/^no@\d+$/);
    expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
    expect(sent.tag).toHaveLength(1);
    expect((await context.cookies()).filter((cookie) => cookie.name.startsWith('_ga'))).toEqual([]);
  });
});

test.describe('on any other host', () => {
  test.use({ locale: 'en-US' });

  test('no notice, no setting about cookies, and nothing sent outside', async ({ page }) => {
    const outside: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).hostname !== 'localhost') outside.push(request.url());
    });
    await page.goto('/');
    await expect(page.locator('.about-screen')).toBeVisible();
    await expect(page.locator('#cookie-notice')).toHaveCount(0);
    await page.locator('#settings-link').click();
    await expect(page.locator('.settings-screen')).toBeVisible();
    await expect(page.locator('#settings-cookies')).toHaveCount(0);
    expect(await page.evaluate(() => window.dataLayer)).toBeUndefined();
    expect(outside.filter((url) => !url.startsWith('data:') && !url.startsWith('blob:'))).toEqual([]);
  });
});
