import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir, hostname } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

// The stamp of the world the page is built with, which pack-world.mjs wrote
// before Vite starts (predev, prebuild): the page fetches world.zip by it and
// refuses a running world whose stamp is another (runtime.ts).
function worldStamp(): string {
  try {
    const path = fileURLToPath(new URL('public/world-stamp.json', import.meta.url));
    return (JSON.parse(readFileSync(path, 'utf8')) as { stamp?: string }).stamp ?? 'none';
  } catch {
    return 'none';
  }
}

// Pyodide's version, the folder its files are served from (D230): copy-pyodide.mjs
// copies them into public/pyodide/<version>/.
function pyodideVersion(): string {
  try {
    const path = fileURLToPath(new URL('node_modules/pyodide/package.json', import.meta.url));
    return (JSON.parse(readFileSync(path, 'utf8')) as { version?: string }).version ?? 'none';
  } catch {
    return 'none';
  }
}

// The page's build, said in its footer: the short git hash and the day, in the
// form `date -I` gives, at build or dev start; `local` where git is not at hand.
function buildName(): string {
  try {
    const hash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
    const now = new Date();
    const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('-');
    return `${hash} ${day}`;
  } catch {
    return 'local';
  }
}

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
// /__debug/solution/<level>: a build serves the file pack-world.mjs wrote there,
// and the development server reads it from content/ as it is now.
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
  define: {
    __WORLD_STAMP__: JSON.stringify(worldStamp()),
    __PYODIDE_VERSION__: JSON.stringify(pyodideVersion()),
    __BUILD__: JSON.stringify(buildName()),
  },
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
