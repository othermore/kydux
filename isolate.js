// The service worker that isolates the page on a server that sends no headers
// (docs/dev/architecture.md, D329; registered by src/isolation.ts). It answers every
// request of the game's own origin with what the server gave and three headers more:
// the two that isolate the page, so that SharedArrayBuffer exists and a runaway program
// can be stopped (D11), and the Content-Security-Policy (D14, D19). The published
// game's page gets the policy that lets in the counting of visits (D328); everything
// else, the worker that runs the child's Python among it, and every page on another
// host, gets the policy of the game's own origin alone. It keeps nothing: with no
// network, a request fails as it would without it.

const OWN =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
const PUBLISHED =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://*.googletagmanager.com; worker-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com https://kidux.goatcounter.com; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
/** The hosts the game is published on (src/analytics/site.ts). */
const PUBLISHED_HOSTS = ['kydux.kidux.org'];
/** The answers that carry no body. */
const BODILESS = [101, 204, 205, 304];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (new URL(request.url).origin !== self.location.origin) return;
  // A request that may only be answered from the cache is the browser's own.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  const page = request.mode === 'navigate' && PUBLISHED_HOSTS.includes(self.location.hostname);
  event.respondWith(
    fetch(request).then((response) => {
      // An answer the worker cannot read, a redirect of the page's address, goes as it is.
      if (response.status === 0) return response;
      const headers = new Headers(response.headers);
      headers.set('Cross-Origin-Opener-Policy', 'same-origin');
      headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
      headers.set('Content-Security-Policy', page ? PUBLISHED : OWN);
      return new Response(BODILESS.includes(response.status) ? null : response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }),
  );
});
