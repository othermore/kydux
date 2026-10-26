import { existsSync, readFileSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// HTTPS with the certificate ci/dev-cert.sh makes, when it exists: from another
// computer only HTTPS is a secure context, and only a secure context gets the
// isolation the interrupt needs. KYDUX_HTTP=1 serves plain HTTP regardless.
const tlsDir = process.env.KYDUX_TLS_DIR ?? join(homedir(), '.config', 'kydux', 'tls');
const https =
  process.env.KYDUX_HTTP !== '1' && existsSync(join(tlsDir, 'server.crt'))
    ? {
        cert: readFileSync(join(tlsDir, 'server.crt')),
        key: readFileSync(join(tlsDir, 'server.key')),
      }
    : undefined;

// The game is served cross-origin isolated wherever it runs, so that
// SharedArrayBuffer exists and a runaway program can be interrupted (D11),
// and with a Content-Security-Policy that keeps the page, and the child's code
// with it, to the game's own origin (D14, D19). The launcher sends the same.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

const isolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Content-Security-Policy': contentSecurityPolicy,
};

// The tester's button that writes a level's solution (src/ui/level.ts) asks
// /__debug/solution/<level> of the development server, which reads it from
// content/. Only `npm run dev` has it: the solutions never go into a build.
function debugSolutions(): Plugin {
  return {
    name: 'kydux-debug-solutions',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__debug/solution/', (request, response) => {
        const id = (request.url ?? '').replace(/^\//, '').split('?')[0] ?? '';
        const path = join(repoRoot, 'content', 'levels', id, 'solution.py');
        if (!/^[a-z0-9-]+$/.test(id) || !existsSync(path)) {
          response.statusCode = 404;
          response.end();
          return;
        }
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.end(readFileSync(path, 'utf8'));
      });
    },
  };
}

export default defineConfig({
  plugins: [debugSolutions()],
  server: {
    host: true,
    port: 5173,
    // Vite takes requests by an address or localhost, and by these names too,
    // so that another computer can open the game, and its hot reload, by this
    // machine's name: https://hija.local:5173.
    allowedHosts: [hostname(), `${hostname()}.local`],
    strictPort: true,
    https,
    headers: isolation,
    fs: { allow: [repoRoot] },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    https,
    headers: isolation,
  },
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Phaser is one library of about 1.4 MB that cannot be split; it is loaded
    // on its own, after the page, so the warning would only ever be about it.
    chunkSizeWarningLimit: 1600,
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
